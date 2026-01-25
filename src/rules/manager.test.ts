import { describe, expect, it, vi } from 'vitest';

import * as loaderModule from './loader.ts';
import * as manifestModule from './manifest.ts';
import { getAvailableScopeIds, getMergedRules, getRulesFor } from './manager.ts';
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
  defaults: { alwaysGroups: ['global'] },
};

describe('getRulesFor', () => {
  it('returns rules for a specific request', async () => {
    const mockRules: RuleFile[] = [
      createRuleFile('rules/common.md', { groups: ['global'] }, 'Global rule'),
      createRuleFile('rules/service.md', { projects: ['buerokratt/Service-Module'] }, 'Service rule'),
    ];

    const rulesSpy = vi.spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules);
    const manifestSpy = vi.spyOn(manifestModule, 'loadRulesManifest').mockResolvedValue(manifest);

    const result = await getRulesFor({ scope: 'project', id: 'buerokratt/Service-Module' });

    expect(result.request.scope).toBe('project');
    expect(result.rules).toHaveLength(2);
    expect(result.rules[0]?.content).toBe('Global rule');
    expect(result.rules[1]?.content).toBe('Service rule');
    expect(rulesSpy).toHaveBeenCalled();
    expect(manifestSpy).toHaveBeenCalled();

    rulesSpy.mockRestore();
    manifestSpy.mockRestore();
  });
});

describe('getAvailableScopeIds', () => {
  it('returns sorted project ids', async () => {
    const manifestSpy = vi.spyOn(manifestModule, 'loadRulesManifest').mockResolvedValue(manifest);

    const result = await getAvailableScopeIds('project');

    expect(result).toEqual(['buerokratt/Service-Module']);
    expect(manifestSpy).toHaveBeenCalled();

    manifestSpy.mockRestore();
  });
});

describe('getMergedRules', () => {
  it('returns merged markdown for a request', async () => {
    const mockRules: RuleFile[] = [
      createRuleFile('rules/common.md', { groups: ['global'] }, 'Global content'),
      createRuleFile('rules/service.md', { projects: ['buerokratt/Service-Module'] }, 'Service content'),
    ];

    const rulesSpy = vi.spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules);
    const manifestSpy = vi.spyOn(manifestModule, 'loadRulesManifest').mockResolvedValue(manifest);

    const result = await getMergedRules({ scope: 'project', id: 'buerokratt/Service-Module' });

    expect(result).toContain('# Rules (project:buerokratt/Service-Module)');
    expect(result).toContain('Global content');
    expect(result).toContain('Service content');
    expect(rulesSpy).toHaveBeenCalled();
    expect(manifestSpy).toHaveBeenCalled();

    rulesSpy.mockRestore();
    manifestSpy.mockRestore();
  });
});
