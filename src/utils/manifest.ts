/**
 * Rules Manifest Loader
 *
 * Loads project/group/tech/language relationships from rules/manifest.yml
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

import type { RuleRequest, RuleScope, RulesManifest } from './types.ts';

import type { ResolvedScopes } from '@/utils/filter.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MANIFEST_PATH = join(__dirname, '../../rules/manifest.yml');

function normalizeManifest(input: unknown): RulesManifest {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const manifest = input as RulesManifest;

  return {
    version: typeof manifest.version === 'number' ? manifest.version : undefined,
    languages: manifest.languages ?? undefined,
    techs: manifest.techs ?? undefined,
    groups: manifest.groups ?? undefined,
    projects: manifest.projects ?? undefined,
    defaults: manifest.defaults ?? undefined,
  };
}

export async function loadManifest(): Promise<RulesManifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    const parsed = parseYaml(raw);
    return normalizeManifest(parsed);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
      return {};
    }
    throw new Error(`Failed to load rules manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get available IDs for a scope
 */
export async function getAvailableScopeIds(scope: RuleScope): Promise<string[]> {
  const manifest = await loadManifest();

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

/*
 * Resolve scopes for a request
 */
export function resolveRequestScopes(request: RuleRequest, manifest: RulesManifest): ResolvedScopes {
  const scopes: ResolvedScopes = {
    projects: new Set<string>(),
    groups: new Set<string>(),
    techs: new Set<string>(),
    languages: new Set<string>(),
  };

  switch (request.scope) {
    case 'project':
      resolveProject(scopes, manifest, request.id);
      break;
    case 'group':
      scopes.groups.add(request.id);
      break;
    case 'tech':
      resolveTech(scopes, manifest, request.id, new Set<string>());
      break;
    case 'language':
      scopes.languages.add(request.id);
      break;
  }

  addAlwaysGroup(scopes, manifest);
  return scopes;
}

function resolveProject(scopes: ResolvedScopes, manifest: RulesManifest, projectId: string): void {
  scopes.projects.add(projectId);

  const project = manifest.projects?.[projectId];
  if (!project) {
    return;
  }

  for (const group of project.groups ?? []) {
    scopes.groups.add(group);
  }

  for (const tech of project.techs ?? []) {
    resolveTech(scopes, manifest, tech, new Set<string>());
  }

  for (const language of project.languages ?? []) {
    scopes.languages.add(language);
  }
}

function resolveTech(scopes: ResolvedScopes, manifest: RulesManifest, techId: string, seen: Set<string>): void {
  if (seen.has(techId)) {
    return;
  }

  seen.add(techId);
  scopes.techs.add(techId);

  const tech = manifest.techs?.[techId];
  if (!tech) {
    return;
  }

  for (const dependency of tech.dependsOn ?? []) {
    if (manifest.techs?.[dependency]) {
      resolveTech(scopes, manifest, dependency, seen);
      continue;
    }

    scopes.languages.add(dependency);
  }
}

function addAlwaysGroup(scopes: ResolvedScopes, manifest: RulesManifest): void {
  const alwaysGroup = manifest.defaults?.alwaysGroup;
  if (alwaysGroup) scopes.groups.add(alwaysGroup);
}
