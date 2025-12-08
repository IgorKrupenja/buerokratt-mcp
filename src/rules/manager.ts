/**
 * Rule Manager
 *
 * Manages rule loading, caching, and retrieval
 */

import { loadAllRules } from './loader.ts';
import { getRulesForModule, mergeRules } from './filter.ts';
import type { RuleFile, ModuleRuleSet } from './types.ts';

let cachedRules: RuleFile[] | null = null;

/**
 * Get merged rules as markdown for a specific module
 */
export async function getMergedRules(moduleName: string): Promise<string> {
  const ruleSet = await getModuleRules(moduleName);
  return mergeRules(ruleSet);
}

/**
 * Get rules for a specific module
 */
export async function getModuleRules(moduleName: string): Promise<ModuleRuleSet> {
  const allRules = await loadRules();
  return getRulesForModule(allRules, moduleName);
}

/**
 * Get all available modules from loaded rules
 */
export async function getAvailableModules(): Promise<string[]> {
  const allRules = await loadRules();
  const modules = new Set<string>();

  for (const rule of allRules) {
    for (const module of rule.frontmatter.modules) {
      if (module !== 'global') {
        modules.add(module);
      }
    }
  }

  return Array.from(modules).sort();
}

/**
 * Load and cache all rules
 */
export async function loadRules(): Promise<RuleFile[]> {
  if (cachedRules === null) {
    cachedRules = await loadAllRules();
  }
  return cachedRules;
}

/**
 * Clear the rule cache (useful for reloading rules)
 */
export function clearCache(): void {
  cachedRules = null;
}
