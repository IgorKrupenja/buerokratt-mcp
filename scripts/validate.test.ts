import { beforeEach, describe, expect, it, spyOn } from 'bun:test';

import { validateFrontmatter, validateMarkdown, validateModuleNames } from './validate.ts';
import type { RuleFile } from '../src/rules/types.ts';

describe('validate utilities', () => {
  describe('validateFrontmatter', () => {
    it('validates correct frontmatter', () => {
      const frontmatter = {
        modules: ['Service-Module', 'global'],
        tags: ['backend'],
        description: 'Test rule',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('rejects missing modules field', () => {
      const frontmatter = {
        tags: ['backend'],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing 'modules' field in test.md");
    });

    it('rejects non-array modules field', () => {
      const frontmatter = {
        modules: 'Service-Module',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'modules' field must be an array in test.md");
    });

    it('rejects empty modules array', () => {
      const frontmatter = {
        modules: [],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'modules' array cannot be empty in test.md");
    });

    it('warns about non-array tags', () => {
      const frontmatter = {
        modules: ['Service-Module'],
        tags: 'backend',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("'tags' field should be an array in test.md");
    });

    it('accepts valid tags array', () => {
      const frontmatter = {
        modules: ['Service-Module'],
        tags: ['backend', 'api'],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('validateMarkdown', () => {
    it('validates empty content as warning', async () => {
      const result = await validateMarkdown('', 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Empty content'))).toBe(true);
    });

    it('validates content with only whitespace as warning', async () => {
      const result = await validateMarkdown('   \n\t  ', 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Empty content'))).toBe(true);
    });

    it('validates valid markdown content', async () => {
      const content = `## Heading

This is valid markdown content.

- List item 1
- List item 2
`;

      const result = await validateMarkdown(content, 'test.md');

      // Should be valid (may have warnings from markdownlint, but no errors)
      expect(result.valid).toBe(true);
    });

    it('handles markdownlint validation', async () => {
      // Content that might trigger markdownlint warnings
      const content = `# Heading

Content here.
`;

      const result = await validateMarkdown(content, 'test.md');

      // Should not throw, may have warnings
      expect(result.valid).toBe(true);
    });
  });

  describe('validateModuleNames', () => {
    const mockFetch = spyOn(global, 'fetch');

    beforeEach(() => {
      mockFetch.mockClear();
      // Clear GITHUB_TOKEN env var for tests
      delete process.env.GITHUB_TOKEN;
    });

    function createMockRuleFile(modules: string[]): RuleFile {
      return {
        path: `rules/test-${modules[0]}/rules.md`,
        frontmatter: {
          modules,
        },
        content: 'Test content',
        raw: 'Test raw',
      };
    }

    it('validates module names successfully when they match GitHub repositories', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['Service-Module']), createMockRuleFile(['Training-Module'])];

      // Mock successful GitHub API response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () =>
          Promise.resolve([
            { name: 'Service-Module', full_name: 'buerokratt/Service-Module' },
            { name: 'Training-Module', full_name: 'buerokratt/Training-Module' },
            { name: 'Analytics-Module', full_name: 'buerokratt/Analytics-Module' },
          ]),
      } as Response);

      const result = await validateModuleNames(mockRules);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('reports errors when module names do not match GitHub repositories', async () => {
      const mockRules: RuleFile[] = [
        createMockRuleFile(['Service-Module']),
        createMockRuleFile(['NonExistent-Module']),
      ];

      // Mock successful GitHub API response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () =>
          Promise.resolve([
            { name: 'Service-Module', full_name: 'buerokratt/Service-Module' },
            { name: 'Training-Module', full_name: 'buerokratt/Training-Module' },
          ]),
      } as Response);

      const result = await validateModuleNames(mockRules);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBe(1);
      expect(result.errors?.[0]).toContain('NonExistent-Module');
      expect(result.errors?.[0]).toContain('does not match any repository');
    });

    it('skips special modules (global, shared-backend, shared-frontend)', async () => {
      const mockRules: RuleFile[] = [
        createMockRuleFile(['Service-Module']),
        createMockRuleFile(['global']),
        createMockRuleFile(['shared-backend']),
        createMockRuleFile(['shared-frontend']),
      ];

      // Mock successful GitHub API response
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve([{ name: 'Service-Module', full_name: 'buerokratt/Service-Module' }]),
      } as Response);

      const result = await validateModuleNames(mockRules);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      // Should only validate Service-Module, not the special modules
    });

    it('returns valid when no repository module names are found', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['global']), createMockRuleFile(['shared-backend'])];

      const result = await validateModuleNames(mockRules);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      // Should not call GitHub API when only special modules are present
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('handles GitHub API 404 error gracefully with warning', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['Service-Module'])];

      // Mock 404 response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      } as Response);

      const result = await validateModuleNames(mockRules);

      // Should warn but not fail (network issues shouldn't block local development)
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Could not validate module names'))).toBe(true);
    });

    it('handles GitHub API rate limit error gracefully with warning', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['Service-Module'])];

      const headers = new Headers();
      headers.set('x-ratelimit-remaining', '0');

      // Mock 403 rate limit response
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers,
      } as Response);

      const result = await validateModuleNames(mockRules);

      // Should warn but not fail
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Could not validate module names'))).toBe(true);
    });

    it('handles network errors gracefully with warning', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['Service-Module'])];

      // Mock network error
      mockFetch.mockRejectedValue(new Error('Network error: fetch failed'));

      const result = await validateModuleNames(mockRules);

      // Should warn but not fail
      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Could not validate module names'))).toBe(true);
    });

    it('handles pagination correctly', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['Service-Module'])];

      // Mock first page with 100 items (full page)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => {
          // Return 100 items to trigger pagination
          return Promise.resolve(
            Array.from({ length: 100 }, (_, i) => ({
              name: `Repo-${i}`,
              full_name: `buerokratt/Repo-${i}`,
            })),
          );
        },
      } as Response);

      // Mock second page with fewer items (last page)
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () =>
          Promise.resolve([
            { name: 'Service-Module', full_name: 'buerokratt/Service-Module' },
            { name: 'Training-Module', full_name: 'buerokratt/Training-Module' },
          ]),
      } as Response);

      const result = await validateModuleNames(mockRules);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
      // Should have called fetch twice (pagination)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('uses GITHUB_TOKEN when provided', async () => {
      const mockRules: RuleFile[] = [createMockRuleFile(['Service-Module'])];

      process.env.GITHUB_TOKEN = 'test-token';

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => Promise.resolve([{ name: 'Service-Module', full_name: 'buerokratt/Service-Module' }]),
      } as Response);

      await validateModuleNames(mockRules);

      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs).toBeDefined();
      const options = callArgs?.[1] as { headers?: Record<string, string> };
      expect(options?.headers).toBeDefined();
      const headers = options?.headers as Record<string, string>;
      expect(headers?.Authorization).toBe('token test-token');

      delete process.env.GITHUB_TOKEN;
    });
  });
});
