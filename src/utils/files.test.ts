import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { findFilesByType } from './files.ts';

describe('findFilesByType', () => {
  it('finds all markdown files in a directory', async () => {
    const tempDir = `/tmp/test-files-${Date.now()}`;
    await mkdir(join(tempDir, 'subdir'), { recursive: true });
    await writeFile(join(tempDir, 'file1.md'), 'Content 1');
    await writeFile(join(tempDir, 'subdir', 'file2.md'), 'Content 2');
    await writeFile(join(tempDir, 'file.txt'), 'Not a markdown file');

    try {
      const result = await findFilesByType(tempDir, 'markdown');

      expect(result.length).toBe(2);
      expect(result.some((f) => f.includes('file1.md'))).toBe(true);
      expect(result.some((f) => f.includes('file2.md'))).toBe(true);
      expect(result.every((f) => f.endsWith('.md'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('finds all non-markdown files in a directory', async () => {
    const tempDir = `/tmp/test-files-non-md-${Date.now()}`;
    await mkdir(join(tempDir, 'subdir'), { recursive: true });
    await writeFile(join(tempDir, 'file1.md'), 'Content 1');
    await writeFile(join(tempDir, 'subdir', 'file2.txt'), 'Content 2');
    await writeFile(join(tempDir, 'file3.json'), '{"ok":true}');

    try {
      const result = await findFilesByType(tempDir, 'non-markdown');

      expect(result.length).toBe(2);
      expect(result.some((f) => f.includes('file2.txt'))).toBe(true);
      expect(result.some((f) => f.includes('file3.json'))).toBe(true);
      expect(result.every((f) => !f.endsWith('.md'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('returns empty array when directory does not exist', async () => {
    const result = await findFilesByType('/nonexistent/directory/path', 'markdown');

    expect(result).toEqual([]);
  });
});
