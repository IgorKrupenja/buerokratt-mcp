/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import matter from 'gray-matter';
import type { RuleFile, RuleFrontmatter } from './types.ts';

/**
 * Load and parse a single rule file
 */
export async function loadRuleFile(filePath: string): Promise<RuleFile> {
  // TODO: Implement file loading and parsing
  // Will use gray-matter to parse frontmatter
  throw new Error('Not implemented');
}

/**
 * Load all rule files from the rules directory
 */
export async function loadAllRules(): Promise<RuleFile[]> {
  // TODO: Implement directory scanning and loading
  // Will scan rules/ directory and load all .md files
  return [];
}

/**
 * Filter rules by module name
 */
export function filterRulesByModule(rules: RuleFile[], moduleName: string): RuleFile[] {
  // TODO: Implement filtering logic
  // Will return rules that apply to the specified module
  return rules.filter((rule) => rule.frontmatter.modules.includes(moduleName));
}
