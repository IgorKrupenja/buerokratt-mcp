/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

import { findFilesByKind } from './file-finder.ts';
import type { RuleFile, RuleFrontmatter } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES_DIR = join(__dirname, '../../rules');

/**
 * Recursively find all markdown files in a directory
 */
export async function findMarkdownFiles(dir: string): Promise<string[]> {
  return findFilesByKind(dir, 'markdown');
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
