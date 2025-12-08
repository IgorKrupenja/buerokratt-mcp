/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import matter from 'gray-matter';

import type { RuleFile, RuleFrontmatter } from './types.ts';

const RULES_DIR = `${import.meta.dir}/../../rules`;

/**
 * Load and parse a single rule file
 */
export async function loadRuleFile(filePath: string): Promise<RuleFile> {
  try {
    // Read file content
    const file = Bun.file(filePath);
    const raw = await file.text();

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
async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    // Use Bun's Glob to find all markdown files recursively
    const glob = new Bun.Glob('**/*.md');
    for await (const file of glob.scan(dir)) {
      files.push(`${dir}/${file}`);
    }
  } catch (error) {
    // If directory doesn't exist or can't be read, return empty array
    if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
      return [];
    }
    throw new Error(
      `Failed to find markdown files in ${dir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return files;
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

/**
 * Filter rules by module name
 */
export function filterRulesByModule(rules: RuleFile[], moduleName: string): RuleFile[] {
  return rules.filter((rule) => rule.frontmatter.modules.includes(moduleName));
}
