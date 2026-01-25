/**
 * Rule Manager
 *
 * Manages rule loading and retrieval
 */

import { getRulesForRequest, mergeRules } from './filter.ts';
import { loadRulesManifest } from './manifest.ts';
import { loadAllRules } from './rules.ts';
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
  // NOTE: We load all rules per request to support hot reload. Refactor to scoped loading if this becomes a bottleneck.
  // Can be tested with this command: pnpm run measure-load-time
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
