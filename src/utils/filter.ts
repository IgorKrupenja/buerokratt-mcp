/**
 * Rule Filtering
 *
 * Resolves rule sets for projects, groups, techs, and languages.
 */

export interface ResolvedScopes {
  projects: Set<string>;
  groups: Set<string>;
  techs: Set<string>;
  languages: Set<string>;
}
