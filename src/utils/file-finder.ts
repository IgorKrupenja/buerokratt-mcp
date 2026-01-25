/**
 * File Finder
 *
 * Recursively finds markdown or non-markdown files.
 */

import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export type FileKind = 'markdown' | 'non-markdown';

export async function findFilesByKind(dir: string, kind: FileKind): Promise<string[]> {
  const files: string[] = [];

  async function scanDir(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.name.startsWith('.')) {
          continue;
        }

        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        const isMarkdown = entry.name.endsWith('.md');
        if (kind === 'markdown' ? isMarkdown : !isMarkdown) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // If directory doesn't exist or can't be read, return empty array
      if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
        return;
      }
      throw error;
    }
  }

  try {
    await scanDir(dir);
  } catch (error) {
    throw new Error(
      `Failed to find ${kind} files in ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return files;
}
