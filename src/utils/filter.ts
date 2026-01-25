/**
 * Rule Filtering
 *
 * Resolves rule sets for projects, groups, techs, and languages.
 */

import type { RuleAppliesTo, RuleFile, RuleRequest, RulesManifest } from './types.ts';

interface ResolvedScopes {
  projects: Set<string>;
  groups: Set<string>;
  techs: Set<string>;
  languages: Set<string>;
}

function addAlwaysGroups(scopes: ResolvedScopes, manifest: RulesManifest): void {
  for (const group of manifest.defaults?.alwaysGroups ?? []) {
    scopes.groups.add(group);
  }
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

export function resolveRequestScopes(request: RuleRequest, manifest: RulesManifest): ResolvedScopes {
  const scopes = {
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

  addAlwaysGroups(scopes, manifest);
  return scopes;
}

function hasIntersection(values: string[] | undefined, scopeSet: Set<string>): boolean {
  if (!values || values.length === 0) {
    return false;
  }

  return values.some((value) => scopeSet.has(value));
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
