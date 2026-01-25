/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

import type { RuleFile, RuleFrontmatter } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES_DIR = join(__dirname, '../../rules');

/**
 * Recursively find all markdown files in a directory
 */
export async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function scanDir(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
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
      `Failed to find markdown files in ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return files;
}

/**
 * Load all rule files from the rules directory
 * Should only normally be used by things like CI check scripts.
 */
export async function loadAllRules(): Promise<RuleFile[]> {
  try {
    // Find all markdown files in the rules directory
    const markdownFiles = await findMarkdownFiles(RULES_DIR);

    // Load and parse each file
    const ruleFiles = await Promise.all(
      markdownFiles.map(async (filePath) => {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = matter(raw);

        if (!parsed.data.appliesTo || typeof parsed.data.appliesTo !== 'object') {
          throw new Error(`Invalid frontmatter in ${filePath}: missing or invalid 'appliesTo' field`);
        }

        const frontmatter: RuleFrontmatter = {
          appliesTo: parsed.data.appliesTo,
          tags: parsed.data.tags,
          description: parsed.data.description,
        };

        return {
          path: filePath,
          frontmatter,
          content: parsed.content,
          raw,
        } satisfies RuleFile;
      }),
    );

    return ruleFiles;
  } catch (error) {
    throw new Error(`Failed to load rules: ${error instanceof Error ? error.message : String(error)}`);
  }
}
