/**
 * Rule Loader
 *
 * Loads and parses rule files from the rules directory
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import matter from 'gray-matter';

import { findFilesByKind } from './file-finder.ts';
import type { RuleFile, RuleFrontmatter, RuleRequest, RuleScope, RuleSet } from './types.ts';

import { getRulesForRequest, mergeRules } from '@/utils/filter.ts';
import { loadRulesManifest } from '@/utils/manifest.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES_DIR = join(__dirname, '../../rules');

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
 * Load all rule files from the rules directory
 * Should only normally be used by things like CI check scripts.
 */
export async function loadAllRules(): Promise<RuleFile[]> {
  try {
    // Find all markdown files in the rules directory
    const markdownFiles = await findFilesByKind(RULES_DIR, 'markdown');

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

export function buildRuleResources(scope: RuleScope, ids: string[]) {
  return ids.map((id) => ({
    uri: `rules://${scope}/${id}`,
    name: `${scope}-${id}`,
    description: `Rules for ${scope} ${id}`,
    mimeType: 'text/markdown',
  }));
}
