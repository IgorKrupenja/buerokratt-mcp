/**
 * Type Definitions for Rules
 *
 * TypeScript types for rule files, frontmatter, and rule sets
 */

/**
 * Frontmatter metadata for rule files
 */
export interface RuleAppliesTo {
  projects?: string[];
  groups?: string[];
  techs?: string[];
  languages?: string[];
}

export interface RuleFrontmatter {
  appliesTo: RuleAppliesTo;
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

export interface ManifestLanguage {
  description?: string;
}

export interface ManifestTech {
  description?: string;
  dependsOn?: string[];
}

export interface ManifestGroup {
  description?: string;
}

export interface ManifestProject {
  description?: string;
  groups?: string[];
  techs?: string[];
  languages?: string[];
}

export interface RulesManifest {
  version?: number;
  languages?: Record<string, ManifestLanguage>;
  techs?: Record<string, ManifestTech>;
  groups?: Record<string, ManifestGroup>;
  projects?: Record<string, ManifestProject>;
}

/**
 * Validation result for rule files
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}
