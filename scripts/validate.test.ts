import { describe, expect, it } from 'vitest';

import { validateFrontmatter, validateManifest, validateMarkdown } from './validate.ts';

describe('validate utilities', () => {
  describe('validateFrontmatter', () => {
    it('validates correct frontmatter', () => {
      const frontmatter = {
        appliesTo: {
          projects: ['buerokratt/Service-Module'],
          groups: ['global'],
        },
        tags: ['backend'],
        description: 'Test rule',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('rejects missing appliesTo field', () => {
      const frontmatter = {
        tags: ['backend'],
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing 'appliesTo' field in test.md");
    });

    it('rejects non-object appliesTo field', () => {
      const frontmatter = {
        appliesTo: 'Service-Module',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'appliesTo' field must be an object in test.md");
    });

    it('rejects empty appliesTo scopes', () => {
      const frontmatter = {
        appliesTo: {},
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'appliesTo' must include at least one non-empty scope array in test.md");
    });

    it('warns about non-array tags', () => {
      const frontmatter = {
        appliesTo: { projects: ['buerokratt/Service-Module'] },
        tags: 'backend',
      };

      const result = validateFrontmatter(frontmatter, 'test.md');

      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("'tags' field should be an array in test.md");
    });

    it('accepts valid tags array', () => {
      const frontmatter = {
        appliesTo: { projects: ['buerokratt/Service-Module'] },
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

  describe('validateManifest', () => {
    it('validates a correct manifest', () => {
      const manifest = {
        version: 1,
        projects: {
          'buerokratt/Service-Module': {
            groups: ['global'],
            techs: ['react'],
            languages: ['typescript'],
            description: 'Service rules',
          },
        },
        groups: {
          global: { description: 'Always' },
        },
        techs: {
          react: { dependsOn: ['typescript'], description: 'React rules' },
        },
        languages: {
          typescript: { description: 'TS rules' },
        },
        defaults: {
          alwaysGroup: 'global',
        },
      };

      const result = validateManifest(manifest, 'rules/manifest.yml');

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('rejects non-object manifest', () => {
      const result = validateManifest('not-an-object', 'rules/manifest.yml');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Manifest must be an object in rules/manifest.yml');
    });

    it('rejects invalid version type', () => {
      const result = validateManifest({ version: '1' }, 'rules/manifest.yml');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'version' must be a number in rules/manifest.yml");
    });

    it('rejects invalid project scopes', () => {
      const result = validateManifest(
        {
          projects: {
            'buerokratt/Service-Module': {
              groups: 'global',
            },
          },
        },
        'rules/manifest.yml',
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("'projects.buerokratt/Service-Module.groups' must be a string array in rules/manifest.yml");
    });
  });
});
