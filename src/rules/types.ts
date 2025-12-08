/**
 * Type Definitions for Rules
 *
 * TypeScript types for rule files, frontmatter, and rule sets
 */

/**
 * Frontmatter metadata for rule files
 */
export interface RuleFrontmatter {
  modules: string[];
  tags?: string[];
  description?: string;
}

/**
 * Parsed rule file with frontmatter and content
 */
export interface RuleFile {
  path: string;
  frontmatter: RuleFrontmatter;
  content: string;
  raw: string; // Original file content
}

/**
 * Rule set for a specific module
 */
export interface ModuleRuleSet {
  module: string;
  rules: RuleFile[];
  globalRules: RuleFile[];
}

/**
 * Validation result for rule files
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
