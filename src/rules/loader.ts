/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import { promises as fs } from 'fs';
import path from 'path';

import * as glob from 'glob';
import matter from 'gray-matter';

import type { RuleFile, RuleFrontmatter } from './types.ts';

const RULES_DIR = path.join(__dirname, '..', '..', 'rules');

/**
 * Load and parse a single rule file
 */
export async function loadRuleFile(filePath: string): Promise<RuleFile> {
  try {
    // Read file content
    const raw = await fs.readFile(filePath, 'utf8');

    // Parse frontmatter using gray-matter
    const parsed = matter(raw);

    // Validate that frontmatter has required fields
    if (!parsed.data.modules || !Array.isArray(parsed.data.modules)) {
      throw new Error(`Invalid frontmatter in ${filePath}: missing or invalid 'modules' field`);
    }

    // Convert frontmatter to our type
    const frontmatter: RuleFrontmatter = {
      modules: parsed.data.modules,
      tags: parsed.data.tags,
      description: parsed.data.description,
    };

    return {
      path: filePath,
      frontmatter,
      content: parsed.content,
      raw,
    };
  } catch (error) {
    throw new Error(`Failed to load rule file ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Recursively find all markdown files in a directory
 */
export async function findMarkdownFiles(dir: string): Promise<string[]> {
  try {
    // Use the 'glob' package to find all markdown files recursively
    const files = await glob.glob('**/*.md', { cwd: dir, absolute: true });
    return files;
  } catch (error) {
    // The glob package usually returns an empty array if no files are found or the directory doesn't exist
    // It doesn't typically throw ENOENT for non-existent directories.
    // If there's an error, it's likely a real issue, so re-throw.
    throw new Error(
      `Failed to find markdown files in ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * Load all rule files from the rules directory
 */
export async function loadAllRules(): Promise<RuleFile[]> {
  try {
    // Find all markdown files in the rules directory
    const markdownFiles = await findMarkdownFiles(RULES_DIR);

    // Load and parse each file
    const ruleFiles = await Promise.all(markdownFiles.map((filePath) => loadRuleFile(filePath)));

    return ruleFiles;
  } catch (error) {
    throw new Error(`Failed to load rules: ${error instanceof Error ? error.message : String(error)}`);
  }
}
