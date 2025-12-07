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
  // TODO: Implement rule merging
  // Will combine global rules and module-specific rules
  // Module-specific rules should override global rules when there are conflicts
  return '';
}
