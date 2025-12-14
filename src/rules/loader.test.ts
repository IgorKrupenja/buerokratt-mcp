import { describe, expect, it } from 'bun:test';

import { findMarkdownFiles, loadAllRules, loadRuleFile } from './loader.ts';

describe('loadRuleFile', () => {
  it('loads and parses a valid rule file', async () => {
    const testContent = `---\nmodules:\n  - service-module\ntags:\n  - backend\ndescription: Test rule\n---\n## Test Content\nThis is test content.`;

    // Create a temporary file
    const tempPath = `/tmp/test-rule-${Date.now()}.md`;
    await Bun.write(tempPath, testContent);

    try {
      const result = await loadRuleFile(tempPath);

      expect(result.path).toBe(tempPath);
      expect(result.frontmatter.modules).toEqual(['service-module']);
      expect(result.frontmatter.tags).toEqual(['backend']);
      expect(result.frontmatter.description).toBe('Test rule');
      expect(result.content).toContain('## Test Content');
    } finally {
      // Cleanup
      try {
        await Bun.file(tempPath).unlink();
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('throws error when modules field is missing', async () => {
    const invalidContent = `---\ntags:\n  - backend\n---\n## Test Content`;

    const tempPath = `/tmp/test-rule-invalid-${Date.now()}.md`;
    await Bun.write(tempPath, invalidContent);

    try {
      await expect(loadRuleFile(tempPath)).rejects.toThrow("missing or invalid 'modules' field");
    } finally {
      try {
        await Bun.file(tempPath).unlink();
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('throws error when file does not exist', async () => {
    await expect(loadRuleFile('/nonexistent/path/file.md')).rejects.toThrow();
  });
});

describe('findMarkdownFiles', () => {
  it('finds all markdown files in a directory', async () => {
    const tempDir = `/tmp/test-rules-${Date.now()}`;
    await Bun.write(`${tempDir}/file1.md`, 'Content 1');
    await Bun.write(`${tempDir}/subdir/file2.md`, 'Content 2');
    await Bun.write(`${tempDir}/file.txt`, 'Not a markdown file');

    try {
      const result = await findMarkdownFiles(tempDir);

      expect(result.length).toBe(2);
      expect(result.some((f) => f.includes('file1.md'))).toBe(true);
      expect(result.some((f) => f.includes('file2.md'))).toBe(true);
      expect(result.every((f) => f.endsWith('.md'))).toBe(true);
    } finally {
      // Cleanup
      try {
        await Bun.file(`${tempDir}/file1.md`).unlink();
        await Bun.file(`${tempDir}/subdir/file2.md`).unlink();
        await Bun.file(`${tempDir}/file.txt`).unlink();
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('returns empty array when directory does not exist', async () => {
    const result = await findMarkdownFiles('/nonexistent/directory/path');

    expect(result).toEqual([]);
  });

  it('returns empty array when directory has no markdown files', async () => {
    const tempDir = `/tmp/test-rules-empty-${Date.now()}`;
    await Bun.write(`${tempDir}/file.txt`, 'Not markdown');

    try {
      const result = await findMarkdownFiles(tempDir);

      expect(result).toEqual([]);
    } finally {
      try {
        await Bun.file(`${tempDir}/file.txt`).unlink();
      } catch {
        // Ignore cleanup errors
      }
    }
  });
});

describe('loadAllRules', () => {
  it('loads all rule files from rules directory', async () => {
    const result = await loadAllRules();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((rule) => rule.frontmatter.modules.length > 0)).toBe(true);
    expect(result.every((rule) => rule.path.endsWith('.md'))).toBe(true);
  });

  it('parses all loaded rule files correctly', async () => {
    const result = await loadAllRules();

    for (const rule of result) {
      expect(rule.path).toBeTruthy();
      expect(rule.frontmatter.modules).toBeInstanceOf(Array);
      expect(rule.frontmatter.modules.length).toBeGreaterThan(0);
      expect(rule.content).toBeTruthy();
      expect(rule.raw).toBeTruthy();
    }
  });
});
