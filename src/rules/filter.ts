/**
 * Rule Filtering
 *
 * Filters and merges rules for specific modules
 */

import type { RuleFile, ModuleRuleSet } from './types.ts';
import { filterRulesByModule } from './loader.ts';

/**
 * Get all rules for a specific module (including global rules)
 */
export function getRulesForModule(allRules: RuleFile[], moduleName: string): ModuleRuleSet {
  // Get global rules (rules that apply to all modules)
  const globalRules = allRules.filter((rule) => rule.frontmatter.modules.includes('global'));

  // Get module-specific rules
  const moduleRules = filterRulesByModule(allRules, moduleName);

  return {
    module: moduleName,
    rules: moduleRules,
    globalRules,
  };
}

/**
 * Merge rules into a single markdown string
 */
export function mergeRules(ruleSet: ModuleRuleSet): string {
  const parts: string[] = [];

  // Add global rules first
  if (ruleSet.globalRules.length > 0) {
    // todo check heading level later
    parts.push('## Global Rules\n\n');
    for (const rule of ruleSet.globalRules) {
      parts.push(rule.content);
      parts.push('\n\n');
    }
  }

  // Add module-specific rules
  if (ruleSet.rules.length > 0) {
    if (ruleSet.globalRules.length > 0) {
      parts.push('---\n\n');
    }
    parts.push(`## ${ruleSet.module} Rules\n\n`);
    for (const rule of ruleSet.rules) {
      parts.push(rule.content);
      parts.push('\n\n');
    }
  }

  return parts.join('').trim();
}
