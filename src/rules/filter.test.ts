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
      createRuleFile('rules/service-module/rules.md', ['Service-Module'], 'Service rule'),
      createRuleFile('rules/training-module/rules.md', ['Training-Module'], 'Training rule'),
      createRuleFile('rules/shared/rules.md', ['Service-Module', 'Training-Module'], 'Shared rule'),
    ];

    const result = filterRulesByModule(rules, 'Service-Module');

    expect(result).toHaveLength(2);
    expect(result[0]?.content).toBe('Service rule');
    expect(result[1]?.content).toBe('Shared rule');
  });

  it('returns empty array when no rules match', () => {
    const rules: RuleFile[] = [createRuleFile('rules/service-module/rules.md', ['Service-Module'], 'Service rule')];

    const result = filterRulesByModule(rules, 'nonexistent-module');

    expect(result).toHaveLength(0);
  });

  it('handles rules with multiple modules', () => {
    const rules: RuleFile[] = [
      createRuleFile('rules/shared/rules.md', ['Service-Module', 'Training-Module'], 'Shared rule'),
    ];

    const result1 = filterRulesByModule(rules, 'Service-Module');
    const result2 = filterRulesByModule(rules, 'Training-Module');

    expect(result1).toHaveLength(1);
    expect(result2).toHaveLength(1);
  });
});

describe('getRulesForModule', () => {
  it('filters rules for a specific module', () => {
    const allRules: RuleFile[] = [
      createRuleFile('rules/service-module/rules.md', ['Service-Module'], 'Service rule'),
      createRuleFile('rules/training-module/rules.md', ['Training-Module'], 'Training rule'),
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
    ];

    const result = getRulesForModule(allRules, 'Service-Module');

    expect(result.module).toBe('Service-Module');
    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]?.content).toBe('Service rule');
    expect(result.globalRules).toHaveLength(1);
    expect(result.globalRules[0]?.content).toBe('Global rule');
  });

  it('includes global rules for any module', () => {
    const allRules: RuleFile[] = [
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
      createRuleFile('rules/training-module/rules.md', ['Training-Module'], 'Training rule'),
    ];

    const result = getRulesForModule(allRules, 'Training-Module');

    expect(result.globalRules).toHaveLength(1);
    expect(result.rules).toHaveLength(1);
  });

  it('returns empty arrays when no rules match', () => {
    const allRules: RuleFile[] = [createRuleFile('rules/service-module/rules.md', ['Service-Module'], 'Service rule')];

    const result = getRulesForModule(allRules, 'nonexistent-module');

    expect(result.rules).toHaveLength(0);
    expect(result.globalRules).toHaveLength(0);
  });

  it('does not duplicate global rules when requesting global module', () => {
    const allRules: RuleFile[] = [
      createRuleFile('rules/global/common.md', ['global'], 'Global rule'),
      createRuleFile('rules/global/another.md', ['global'], 'Another global rule'),
    ];

    const result = getRulesForModule(allRules, 'global');

    expect(result.module).toBe('global');
    expect(result.globalRules).toHaveLength(2);
    expect(result.rules).toHaveLength(0); // Should be empty to avoid duplication
  });
});

describe('mergeRules', () => {
  it('merges global and module rules', () => {
    const ruleSet = {
      module: 'Service-Module',
      globalRules: [createRuleFile('rules/global/common.md', ['global'], 'Global content')],
      rules: [createRuleFile('rules/service-module/rules.md', ['Service-Module'], 'Service content')],
    };

    const result = mergeRules(ruleSet);

    expect(result).toContain('# Global Rules');
    expect(result).toContain('Global content');
    expect(result).toContain('---');
    expect(result).toContain('# Service-Module Rules');
    expect(result).toContain('Service content');
  });

  it('merges only global rules when no module rules', () => {
    const ruleSet = {
      module: 'Service-Module',
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
      module: 'Service-Module',
      globalRules: [],
      rules: [createRuleFile('rules/service-module/rules.md', ['Service-Module'], 'Service content')],
    };

    const result = mergeRules(ruleSet);

    expect(result).not.toContain('# Global Rules');
    expect(result).toContain('# Service-Module Rules');
    expect(result).toContain('Service content');
  });

  it('returns empty string when no rules', () => {
    const ruleSet = {
      module: 'Service-Module',
      globalRules: [],
      rules: [],
    };

    const result = mergeRules(ruleSet);

    expect(result).toBe('');
  });

  it('does not duplicate global rules when module is global', () => {
    const ruleSet = {
      module: 'global',
      globalRules: [createRuleFile('rules/global/common.md', ['global'], 'Global content')],
      rules: [], // Should be empty for global module
    };

    const result = mergeRules(ruleSet);

    // Should only appear once
    const globalCount = (result.match(/Global content/g) || []).length;
    expect(globalCount).toBe(1);
    expect(result).toContain('# Global Rules');
    expect(result).not.toContain('## global Rules');
  });
});
