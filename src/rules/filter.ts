/**
 * Rule Filtering
 *
 * Filters and merges rules for specific modules
 */

import type { ModuleRuleSet, RuleFile } from './types.ts';

/**
 * Get all rules for a specific module (including global rules)
 */
export function getRulesForModule(allRules: RuleFile[], moduleName: string): ModuleRuleSet {
  // Get global rules (rules that apply to all modules)
  const globalRules = allRules.filter((rule) => rule.frontmatter.modules.includes('global'));

  // Special case: when requesting global rules, only return global rules
  // to avoid duplication (global rules would match both filters)
  if (moduleName === 'global') {
    return {
      module: moduleName,
      rules: [],
      globalRules,
    };
  }

  // Get module-specific rules
  const moduleRules = filterRulesByModule(allRules, moduleName);

  return {
    module: moduleName,
    rules: moduleRules,
    globalRules,
  };
}

/**
 * Filter rules by module name
 */
export function filterRulesByModule(rules: RuleFile[], moduleName: string): RuleFile[] {
  return rules.filter((rule) => rule.frontmatter.modules.includes(moduleName));
}

/**
 * Merge rules into a single markdown string
 */
export function mergeRules(ruleSet: ModuleRuleSet): string {
  const parts: string[] = [];

  // Add global rules first
  if (ruleSet.globalRules.length > 0) {
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
