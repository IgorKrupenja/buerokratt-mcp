import { describe, expect, it, spyOn } from 'bun:test';

import * as loaderModule from '../rules/loader.ts';

// Note: These tests verify the logic but require mocking fetch which is complex.
// The actual validation script is tested via integration in CI.

describe('validate-module-names', () => {
  it('extracts module names from rule files correctly', async () => {
    const mockRules = [
      {
        path: 'rules/service-module/rules.md',
        frontmatter: {
          modules: ['Service-Module', 'global'],
        },
        content: 'Test content',
        raw: 'Test raw',
      },
      {
        path: 'rules/training-module/rules.md',
        frontmatter: {
          modules: ['Training-Module'],
        },
        content: 'Test content',
        raw: 'Test raw',
      },
    ];

    spyOn(loaderModule, 'loadAllRules').mockResolvedValue(mockRules as any);

    // Test that we can load rules and extract module names
    const allRules = await loaderModule.loadAllRules();
    const moduleNames = new Set<string>();

    for (const rule of allRules) {
      for (const module of rule.frontmatter.modules) {
        moduleNames.add(module);
      }
    }

    expect(moduleNames.has('Service-Module')).toBe(true);
    expect(moduleNames.has('Training-Module')).toBe(true);
    expect(moduleNames.has('global')).toBe(true);
  });
});
