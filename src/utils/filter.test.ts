import { describe, expect, it } from 'vitest';

import { getRulesForRequest, mergeRules, resolveRequestScopes, ruleAppliesToScopes } from './filter.ts';
import type { RuleFile, RulesManifest } from './types.ts';

function createRuleFile(path: string, appliesTo: RuleFile['frontmatter']['appliesTo'], content: string): RuleFile {
  return {
    path,
    frontmatter: {
      appliesTo,
    },
    content,
    raw: `---\nappliesTo: ${JSON.stringify(appliesTo)}\n---\n${content}`,
  };
}

const manifest: RulesManifest = {
  groups: { global: {} },
  techs: { react: { dependsOn: ['typescript'] } },
  languages: { typescript: {} },
  projects: {
    'buerokratt/Service-Module': {
      groups: ['global'],
      techs: ['react'],
      languages: ['typescript'],
    },
  },
  defaults: {
    alwaysGroups: ['global'],
  },
};

describe('resolveRequestScopes', () => {
  it('resolves project memberships and dependencies', () => {
    const scopes = resolveRequestScopes({ scope: 'project', id: 'buerokratt/Service-Module' }, manifest);

    expect(scopes.projects.has('buerokratt/Service-Module')).toBe(true);
    expect(scopes.groups.has('global')).toBe(true);
    expect(scopes.techs.has('react')).toBe(true);
    expect(scopes.languages.has('typescript')).toBe(true);
  });
});

describe('ruleAppliesToScopes', () => {
  it('matches rules across any appliesTo category', () => {
    const scopes = resolveRequestScopes({ scope: 'tech', id: 'react' }, manifest);
    const rule = createRuleFile('rules/test.md', { techs: ['react'] }, 'React rule');

    expect(ruleAppliesToScopes(rule, scopes)).toBe(true);
  });
});

describe('getRulesForRequest', () => {
  it('includes alwaysGroups rules for any request', () => {
    const allRules: RuleFile[] = [
      createRuleFile('rules/common.md', { groups: ['global'] }, 'Global rule'),
      createRuleFile('rules/service.md', { projects: ['buerokratt/Service-Module'] }, 'Service rule'),
    ];

    const result = getRulesForRequest(allRules, manifest, { scope: 'project', id: 'buerokratt/Service-Module' });

    expect(result.rules).toHaveLength(2);
    expect(result.rules[0]?.content).toBe('Global rule');
    expect(result.rules[1]?.content).toBe('Service rule');
  });
});

describe('mergeRules', () => {
  it('merges rules into a single markdown response', () => {
    const ruleSet = {
      request: { scope: 'project' as const, id: 'buerokratt/Service-Module' },
      rules: [
        createRuleFile('rules/common.md', { groups: ['global'] }, 'Global content'),
        createRuleFile('rules/service.md', { projects: ['buerokratt/Service-Module'] }, 'Service content'),
      ],
    };

    const result = mergeRules(ruleSet);

    expect(result).toContain('# Rules (project:buerokratt/Service-Module)');
    expect(result).toContain('Global content');
    expect(result).toContain('Service content');
  });
});
