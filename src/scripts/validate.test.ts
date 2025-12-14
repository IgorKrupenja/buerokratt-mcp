import { describe, expect, test } from 'bun:test';

import { validateFrontmatter, validateMarkdown } from './validate.ts';

describe('validate utilities', () => {
  describe('validateFrontmatter', () => {
    test('validates correct frontmatter', () => {
      const frontmatter = {
        modules: ['service-module', 'global'],
        tags: ['backend'],
        description: 'Test rule',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('rejects missing modules field', () => {
      const frontmatter = {
        tags: ['backend'],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing 'modules' field in test.md");
    });

    test('rejects non-array modules field', () => {
      const frontmatter = {
        modules: 'service-module',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'modules' field must be an array in test.md");
    });

    test('rejects empty modules array', () => {
      const frontmatter = {
        modules: [],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'modules' array cannot be empty in test.md");
    });

    test('warns about non-array tags', () => {
      const frontmatter = {
        modules: ['service-module'],
        tags: 'backend',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("'tags' field should be an array in test.md");
    });

    test('accepts valid tags array', () => {
      const frontmatter = {
        modules: ['service-module'],
        tags: ['backend', 'api'],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeUndefined();
    });
  });

  describe('validateMarkdown', () => {
    test('validates empty content as warning', async () => {
      const result = await validateMarkdown('', 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Empty content'))).toBe(true);
    });

    test('validates content with only whitespace as warning', async () => {
      const result = await validateMarkdown('   \n\t  ', 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some((w) => w.includes('Empty content'))).toBe(true);
    });

    test('validates valid markdown content', async () => {
      const content = `## Heading

This is valid markdown content.

- List item 1
- List item 2
`;

      const result = await validateMarkdown(content, 'test.md');

      // Should be valid (may have warnings from markdownlint, but no errors)
      expect(result.valid).toBe(true);
    });

    test('handles markdownlint validation', async () => {
      // Content that might trigger markdownlint warnings
      const content = `# Heading

Content here.
`;

      const result = await validateMarkdown(content, 'test.md');

      // Should not throw, may have warnings
      expect(result.valid).toBe(true);
    });
  });
});
