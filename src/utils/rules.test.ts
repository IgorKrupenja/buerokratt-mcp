import { mkdir, unlink, writeFile } from 'fs/promises';

import { describe, expect, it } from 'vitest';

import { findMarkdownFiles, loadAllRules } from './rules.ts';

describe('findMarkdownFiles', () => {
  it('finds all markdown files in a directory', async () => {
    const tempDir = `/tmp/test-rules-${Date.now()}`;
    await mkdir(tempDir, { recursive: true });
    await mkdir(`${tempDir}/subdir`, { recursive: true });
    await writeFile(`${tempDir}/file1.md`, 'Content 1');
    await writeFile(`${tempDir}/subdir/file2.md`, 'Content 2');
    await writeFile(`${tempDir}/file.txt`, 'Not a markdown file');

    try {
      const result = await findMarkdownFiles(tempDir);

      expect(result.length).toBe(2);
      expect(result.some((f) => f.includes('file1.md'))).toBe(true);
      expect(result.some((f) => f.includes('file2.md'))).toBe(true);
      expect(result.every((f) => f.endsWith('.md'))).toBe(true);
    } finally {
      // Cleanup
      try {
        await unlink(`${tempDir}/file1.md`);
        await unlink(`${tempDir}/subdir/file2.md`);
        await unlink(`${tempDir}/file.txt`);
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
    await mkdir(tempDir, { recursive: true });
    await writeFile(`${tempDir}/file.txt`, 'Not markdown');

    try {
      const result = await findMarkdownFiles(tempDir);

      expect(result).toEqual([]);
    } finally {
      try {
        await unlink(`${tempDir}/file.txt`);
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
    expect(result.every((rule) => Object.keys(rule.frontmatter.appliesTo).length > 0)).toBe(true);
    expect(result.every((rule) => rule.path.endsWith('.md'))).toBe(true);
  });

  it('parses all loaded rule files correctly', async () => {
    const result = await loadAllRules();

    for (const rule of result) {
      expect(rule.path).toBeTruthy();
      expect(rule.frontmatter.appliesTo).toBeTruthy();
      expect(typeof rule.content).toBe('string');
      expect(rule.raw).toBeTruthy();
    }
  });
});
