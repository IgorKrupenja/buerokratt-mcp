/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

import { findFilesByType } from './files.ts';
import type {
  RuleAppliesTo,
  RuleFile,
  RuleFrontmatter,
  RuleRequest,
  RuleScope,
  RuleSet,
  RulesManifest,
} from './types.ts';

import type { ResolvedScopes } from '@/utils/filter.ts';
import { loadManifest, resolveRequestScopes } from '@/utils/manifest.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES_DIR = join(__dirname, '../../rules');

/**
 * Get merged rules as markdown for a specific request
 */
export async function getMergedRules(request: RuleRequest): Promise<string> {
  // NOTE: We load all rules per request to support hot reload. Refactor to scoped loading if this becomes a bottleneck.
  // Can be tested with this command: pnpm run measure-load-time
  const [allRules, manifest] = await Promise.all([loadAllRules(), loadManifest()]);
  const ruleSet = getRulesForRequest(allRules, manifest, request);
  return mergeRules(ruleSet);
}

/**
 * Load all rule files from the rules directory
 * Should only normally be used by things like CI check scripts.
 */
export async function loadAllRules(): Promise<RuleFile[]> {
  try {
    // Find all markdown files in the rules directory
    const markdownFiles = await findFilesByType(RULES_DIR, 'markdown');

    // Load and parse each file
    const ruleFiles = await Promise.all(
      markdownFiles.map(async (filePath) => {
        const raw = await readFile(filePath, 'utf-8');
        const parsed = matter(raw);

        if (!parsed.data.appliesTo || typeof parsed.data.appliesTo !== 'object') {
          throw new Error(`Invalid frontmatter in ${filePath}: missing or invalid 'appliesTo' field`);
        }

        const frontmatter: RuleFrontmatter = {
          appliesTo: parsed.data.appliesTo,
          tags: parsed.data.tags,
          description: parsed.data.description,
        };

        return {
          path: filePath,
          frontmatter,
          content: parsed.content,
          raw,
        } satisfies RuleFile;
      }),
    );

    return ruleFiles;
  } catch (error) {
    throw new Error(`Failed to load rules: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function getRulesForRequest(allRules: RuleFile[], manifest: RulesManifest, request: RuleRequest): RuleSet {
  const scopes = resolveRequestScopes(request, manifest);
  const matchingRules = allRules.filter((rule) => ruleAppliesToScopes(rule, scopes));

  return {
    request,
    rules: sortRulesByAlwaysGroups(matchingRules, manifest),
  };
}

export function ruleAppliesToScopes(rule: RuleFile, scopes: ResolvedScopes): boolean {
  const appliesTo: RuleAppliesTo = rule.frontmatter.appliesTo;

  return (
    hasIntersection(appliesTo.projects, scopes.projects) ||
    hasIntersection(appliesTo.groups, scopes.groups) ||
    hasIntersection(appliesTo.techs, scopes.techs) ||
    hasIntersection(appliesTo.languages, scopes.languages)
  );
}

function hasIntersection(values: string[] | undefined, scopeSet: Set<string>): boolean {
  if (!values || values.length === 0) {
    return false;
  }

  return values.some((value) => scopeSet.has(value));
}

// TODO ???? ==============================================================================================================

function sortRulesByAlwaysGroups(rules: RuleFile[], manifest: RulesManifest): RuleFile[] {
  const alwaysGroups = new Set(manifest.defaults?.alwaysGroups ?? []);
  if (alwaysGroups.size === 0) {
    return rules;
  }

  return [...rules].sort((a, b) => {
    const aAlways = (a.frontmatter.appliesTo.groups ?? []).some((group) => alwaysGroups.has(group));
    const bAlways = (b.frontmatter.appliesTo.groups ?? []).some((group) => alwaysGroups.has(group));

    if (aAlways === bAlways) {
      return a.path.localeCompare(b.path);
    }

    return aAlways ? -1 : 1;
  });
}

/**
 * Merge rules into a single markdown string
 */
export function mergeRules(ruleSet: RuleSet): string {
  if (ruleSet.rules.length === 0) {
    return `# Rules (${ruleSet.request.scope}:${ruleSet.request.id})\n\n_No rules found._`;
  }

  const parts: string[] = [`# Rules (${ruleSet.request.scope}:${ruleSet.request.id})\n\n`];

  ruleSet.rules.forEach((rule, index) => {
    if (index > 0) {
      parts.push('\n\n---\n\n');
    }
    parts.push(rule.content.trim());
  });

  return parts.join('').trim();
}

export function buildRuleResources(scope: RuleScope, ids: string[]) {
  return ids.map((id) => ({
    uri: `rules://${scope}/${id}`,
    name: `${scope}-${id}`,
    description: `Rules for ${scope} ${id}`,
    mimeType: 'text/markdown',
  }));
}
