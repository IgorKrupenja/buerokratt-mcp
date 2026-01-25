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

export type RuleScope = 'project' | 'group' | 'tech' | 'language';

export interface RuleRequest {
  scope: RuleScope;
  id: string;
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
export interface RuleSet {
  request: RuleRequest;
  rules: RuleFile[];
}

interface ManifestLanguage {
  description?: string;
}

interface ManifestTech {
  description?: string;
  dependsOn?: string[];
}

interface ManifestGroup {
  description?: string;
}

interface ManifestProject {
  description?: string;
  groups?: string[];
  techs?: string[];
  languages?: string[];
}

interface ManifestDefaults {
  alwaysGroups?: string[];
}

export interface RulesManifest {
  version?: number;
  languages?: Record<string, ManifestLanguage>;
  techs?: Record<string, ManifestTech>;
  groups?: Record<string, ManifestGroup>;
  projects?: Record<string, ManifestProject>;
  defaults?: ManifestDefaults;
}
