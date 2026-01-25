/**
 * Rule Manager
 *
 * Manages rule loading and retrieval
 */

import { getRulesForRequest, mergeRules } from './filter.ts';
import { loadAllRules } from './loader.ts';
import { loadRulesManifest } from './manifest.ts';
import type { RuleRequest, RuleScope, RuleSet } from './types.ts';

/**
 * Get merged rules as markdown for a specific request
 */
export async function getMergedRules(request: RuleRequest): Promise<string> {
  const ruleSet = await getRulesFor(request);
  return mergeRules(ruleSet);
}

/**
 * Get rules for a specific request
 */
export async function getRulesFor(request: RuleRequest): Promise<RuleSet> {
  const [allRules, manifest] = await Promise.all([loadAllRules(), loadRulesManifest()]);
  return getRulesForRequest(allRules, manifest, request);
}

/**
 * Get available IDs for a scope
 */
export async function getAvailableScopeIds(scope: RuleScope): Promise<string[]> {
  const manifest = await loadRulesManifest();

  switch (scope) {
    case 'project':
      return Object.keys(manifest.projects ?? {}).sort();
    case 'group':
      return Object.keys(manifest.groups ?? {}).sort();
    case 'tech':
      return Object.keys(manifest.techs ?? {}).sort();
    case 'language':
      return Object.keys(manifest.languages ?? {}).sort();
    default:
      return [];
  }
}
