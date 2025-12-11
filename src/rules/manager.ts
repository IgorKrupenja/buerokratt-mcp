/**
 * Rule Manager
 *
 * Manages rule loading and retrieval
 */

import { getRulesForModule, mergeRules } from './filter.ts';
import { loadAllRules } from './loader.ts';
import type { ModuleRuleSet } from './types.ts';

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
  const allRules = await loadAllRules();
  return getRulesForModule(allRules, moduleName);
}

/**
 * Get all available modules from loaded rules
 */
export async function getAvailableModules(): Promise<string[]> {
  const allRules = await loadAllRules();
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
