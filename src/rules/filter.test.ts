import { describe, expect, it } from 'bun:test';

import { filterRulesByModule, getRulesForModule, mergeRules } from './filter.ts';
import type { RuleFile } from './types.ts';

function createRuleFile(path: string, modules: string[], content: string, tags?: string[]): RuleFile {
  return {
    path,
    frontmatter: {
      modules,
      tags,
    },
    content,
    raw: `---\nmodules: ${JSON.stringify(modules)}\n---\n${content}`,
  };
}

describe('filterRulesByModule', () => {
  it('filters rules by module name', () => {
    const rules: RuleFile[] = [
      createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service rule'),
      createRuleFile('rules/training-module/rules.md', ['training-module'], 'Training rule'),
      createRuleFile('rules/shared/rules.md', ['service-module', 'training-module'], 'Shared rule'),
    ];

    const result = filterRulesByModule(rules, 'service-module');

    expect(result).toHaveLength(2);
    expect(result[0]?.content).toBe('Service rule');
    expect(result[1]?.content).toBe('Shared rule');
  });

  it('returns empty array when no rules match', () => {
    const rules: RuleFile[] = [createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service rule')];

    const result = filterRulesByModule(rules, 'nonexistent-module');

    expect(result).toHaveLength(0);
  });

  it('handles rules with multiple modules', () => {
    const rules: RuleFile[] = [
      createRuleFile('rules/shared/rules.md', ['service-module', 'training-module'], 'Shared rule'),
    ];

    const result1 = filterRulesByModule(rules, 'service-module');
    const result2 = filterRulesByModule(rules, 'training-module');

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
  });
});

describe('getRulesForModule', () => {
  it('filters rules for a specific module', () => {
    const allRules: RuleFile[] = [
      createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service rule'),
      createRuleFile('rules/training-module/rules.md', ['training-module'], 'Training rule'),
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
    ];

    const result = getRulesForModule(allRules, 'service-module');

    expect(result.module).toBe('service-module');
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]?.content).toBe('Service rule');
    expect(result.globalRules).toHaveLength(1);
    expect(result.globalRules[0]?.content).toBe('Global rule');
  });

  it('includes global rules for any module', () => {
    const allRules: RuleFile[] = [
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
      createRuleFile('rules/training-module/rules.md', ['training-module'], 'Training rule'),
    ];

    const result = getRulesForModule(allRules, 'training-module');

    expect(result.globalRules).toHaveLength(1);
    expect(result.rules).toHaveLength(1);
  });

  it('returns empty arrays when no rules match', () => {
    const allRules: RuleFile[] = [createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service rule')];

    const result = getRulesForModule(allRules, 'nonexistent-module');

    expect(result.rules).toHaveLength(0);
    expect(result.globalRules).toHaveLength(0);
  });
});

describe('mergeRules', () => {
  it('merges global and module rules', () => {
    const ruleSet = {
      module: 'service-module',
      globalRules: [createRuleFile('rules/global/common.md', ['global'], 'Global content')],
      rules: [createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service content')],
    };

    const result = mergeRules(ruleSet);

    expect(result).toContain('# Global Rules');
    expect(result).toContain('Global content');
    expect(result).toContain('---');
    expect(result).toContain('## service-module Rules');
    expect(result).toContain('Service content');
  });

  it('merges only global rules when no module rules', () => {
    const ruleSet = {
      module: 'service-module',
      globalRules: [createRuleFile('rules/global/common.md', ['global'], 'Global content')],
      rules: [],
    };

    const result = mergeRules(ruleSet);

    expect(result).toContain('# Global Rules');
    expect(result).toContain('Global content');
    expect(result).not.toContain('---');
    expect(result).not.toContain('## service-module Rules');
  });

  it('merges only module rules when no global rules', () => {
    const ruleSet = {
      module: 'service-module',
      globalRules: [],
      rules: [createRuleFile('rules/service-module/rules.md', ['service-module'], 'Service content')],
    };

    const result = mergeRules(ruleSet);

    expect(result).not.toContain('# Global Rules');
    expect(result).toContain('## service-module Rules');
    expect(result).toContain('Service content');
  });

  it('returns empty string when no rules', () => {
    const ruleSet = {
      module: 'service-module',
      globalRules: [],
      rules: [],
    };

    const result = mergeRules(ruleSet);

    expect(result).toBe('');
  });
});
