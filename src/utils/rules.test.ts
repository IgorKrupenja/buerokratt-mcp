import { describe, expect, it } from 'vitest';

import { resolveRequestScopes } from './manifest.ts';
import {
  getMergedRules,
  getRulesForRequest,
  loadAllRules,
  ruleAppliesToScopes,
  searchRulesByKeyword,
} from './rules.ts';
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
  projects: { 'buerokratt/Service-Module': {} },
  groups: { global: {} },
  techs: { react: {} },
  languages: { typescript: {} },
  defaults: { globalGroup: 'global' },
};

describe('loadAllRules', () => {
  it('loads all rule files from rules directory', async () => {
    const result = await loadAllRules();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((rule) => Object.keys(rule.frontmatter.appliesTo).length > 0)).toBe(true);
    expect(result.every((rule) => rule.path.endsWith('.md'))).toBe(true);
  });

  it('parses all loaded rule files correctly', async () => {
    const result = await loadAllRules();

    for (const rule of result) {
      expect(rule.path).toBeTruthy();
      expect(rule.frontmatter.appliesTo).toBeTruthy();
      expect(typeof rule.content).toBe('string');
      expect(rule.raw).toBeTruthy();
    }
  });
});

describe('searchRulesByKeyword', () => {
  it('returns message when nothing matches', async () => {
    const result = await searchRulesByKeyword({ keyword: 'keyword-that-does-not-exist' });
    expect(result).toContain('No rules found');
  });

  it('includes scoped results when scope and id provided', async () => {
    const result = await searchRulesByKeyword({
      keyword: 'rules',
      scope: 'project',
      id: 'buerokratt/Service-Module',
    });

    expect(result).toContain('Found');
    expect(result).toContain('buerokratt/Service-Module');
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
  it('returns rules for a specific request', () => {
    const mockRules: RuleFile[] = [
      createRuleFile('rules/common.md', { groups: ['global'] }, 'Global rule'),
      createRuleFile('rules/service.md', { projects: ['buerokratt/Service-Module'] }, 'Service rule'),
    ];

    const result = getRulesForRequest(mockRules, manifest, { scope: 'project', id: 'buerokratt/Service-Module' });

    expect(result).toHaveLength(2);
    expect(result[0]?.content).toBe('Global rule');
    expect(result[1]?.content).toBe('Service rule');
  });
});

describe('getMergedRules', () => {
  it('returns merged markdown for a request', async () => {
    const result = await getMergedRules({ scope: 'project', id: 'buerokratt/Service-Module' });

    expect(result).toContain('# Rules (project:buerokratt/Service-Module)');
    expect(result).not.toContain('_No rules found._');
  });
});
