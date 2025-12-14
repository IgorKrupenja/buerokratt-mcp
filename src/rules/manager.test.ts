import { describe, expect, it, spyOn } from 'bun:test';

import * as loaderModule from './loader.ts';
import { getAvailableModules, getMergedRules, getModuleRules } from './manager.ts';
import type { RuleFile } from './types.ts';

function createRuleFile(path: string, modules: string[], content: string): RuleFile {
  return {
    path,
    frontmatter: {
      modules,
    },
    content,
    raw: `---\nmodules: ${JSON.stringify(modules)}\n---\n${content}`,
  };
}

describe('getModuleRules', () => {
  it('returns rules for a specific module with global rules', async () => {
    const mockRules: RuleFile[] = [
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
      createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service rule'),
      createRuleFile('rules/training-module/rules.md', ['training-module'], 'Training rule'),
    ];

    const spy = spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules);

    const result = await getModuleRules('service-module');

    expect(result.module).toBe('service-module');
    expect(result.globalRules).toHaveLength(1);
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]?.content).toBe('Service rule');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe('getAvailableModules', () => {
  it('returns sorted list of available modules', async () => {
    const mockRules: RuleFile[] = [
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
      createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service rule'),
      createRuleFile('rules/training-module/rules.md', ['training-module'], 'Training rule'),
      createRuleFile('rules/analytics-module/rules.md', ['analytics-module'], 'Analytics rule'),
    ];

    const spy = spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules);

    const result = await getAvailableModules();

    expect(result).toEqual(['analytics-module', 'service-module', 'training-module']);
    expect(result).not.toContain('global');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });

  it('returns empty array when no modules found', async () => {
    const mockRules: RuleFile[] = [createRuleFile('rules/global/common.md', ['global'], 'Global rule')];

    const spy = spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules);

    const result = await getAvailableModules();

    expect(result).toEqual([]);
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});

describe('getMergedRules', () => {
  it('returns merged markdown for a module', async () => {
    const mockRules: RuleFile[] = [
      createRuleFile('rules/global/common.md', ['global'], 'Global content'),
      createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service content'),
    ];

    const spy = spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules);

    const result = await getMergedRules('service-module');

    expect(result).toContain('# Global Rules');
    expect(result).toContain('Global content');
    expect(result).toContain('## service-module Rules');
    expect(result).toContain('Service content');
    expect(spy).toHaveBeenCalled();

    spy.mockRestore();
  });
});
