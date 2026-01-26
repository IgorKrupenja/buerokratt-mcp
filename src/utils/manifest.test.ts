import { afterEach, describe, expect, it, vi } from 'vitest';

import type { RulesManifest } from './types.ts';

describe('loadManifest', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unmock('node:fs/promises');
  });

  it('returns normalized manifest data', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi
        .fn()
        .mockResolvedValue(
          [
            'version: 1',
            'languages:',
            '  typescript:',
            '    description: TS',
            'techs:',
            '  react:',
            '    dependsOn:',
            '      - typescript',
            'groups:',
            '  global:',
            '    description: Always',
            'projects:',
            '  buerokratt/Service-Module:',
            '    groups:',
            '      - global',
            'defaults:',
            '  globalGroup: global',
          ].join('\n'),
        ),
    }));

    const { loadManifest } = await import('./manifest.ts');
    const manifest = await loadManifest();

    expect(manifest.version).toBe(1);
    expect(manifest.languages?.typescript?.description).toBe('TS');
    expect(manifest.techs?.react?.dependsOn).toEqual(['typescript']);
    expect(manifest.groups?.global?.description).toBe('Always');
    expect(manifest.projects?.['buerokratt/Service-Module']?.groups).toEqual(['global']);
    expect(manifest.defaults?.globalGroup).toBe('global');
  });

  it('returns empty manifest on ENOENT', async () => {
    const error = new Error('Missing');
    (error as { code?: string }).code = 'ENOENT';

    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn().mockRejectedValue(error),
    }));

    const { loadManifest } = await import('./manifest.ts');
    const manifest = await loadManifest();

    expect(manifest).toEqual({});
  });

  it('returns empty manifest on non-object YAML', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('just-a-string'),
    }));

    const { loadManifest } = await import('./manifest.ts');
    const manifest = await loadManifest();

    expect(manifest).toEqual({});
  });
});

describe('getAvailableScopeIds', () => {
  it('returns sorted project ids', async () => {
    vi.doMock('node:fs/promises', () => ({
      readFile: vi
        .fn()
        .mockResolvedValue(
          [
            'projects:',
            '  buerokratt/Service-Module: {}',
            '  buerokratt/Buerokratt-Chatbot: {}',
            '  buerokratt/Analytics-Module: {}',
          ].join('\n'),
        ),
    }));

    const { getAvailableScopeIds } = await import('./manifest.ts');
    const result = await getAvailableScopeIds('project');

    expect(result).toEqual([
      'buerokratt/Analytics-Module',
      'buerokratt/Buerokratt-Chatbot',
      'buerokratt/Service-Module',
    ]);
  });
});

describe('resolveRequestScopes', () => {
  const envKey = 'USE_GLOBAL_RULES';
  const originalEnvValue = process.env[envKey];

  afterEach(() => {
    if (originalEnvValue === undefined) {
      delete process.env[envKey];
    } else {
      process.env[envKey] = originalEnvValue;
    }
  });

  it('resolves project memberships and dependencies', async () => {
    vi.unmock('node:fs/promises');
    const { resolveRequestScopes } = await import('./manifest.ts');

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
        globalGroup: 'global',
      },
    };

    const scopes = resolveRequestScopes({ scope: 'project', id: 'buerokratt/Service-Module' }, manifest);

    expect(scopes.projects.has('buerokratt/Service-Module')).toBe(true);
    expect(scopes.groups.has('global')).toBe(true);
    expect(scopes.techs.has('react')).toBe(true);
    expect(scopes.languages.has('typescript')).toBe(true);
  });

  it('skips globalGroup when USE_GLOBAL_RULES=false', async () => {
    process.env.USE_GLOBAL_RULES = 'false';
    const { resolveRequestScopes } = await import('./manifest.ts');

    const manifest: RulesManifest = {
      groups: { global: {} },
      defaults: {
        globalGroup: 'global',
      },
    };

    const scopes = resolveRequestScopes({ scope: 'group', id: 'custom' }, manifest);

    expect(scopes.groups.has('custom')).toBe(true);
    expect(scopes.groups.has('global')).toBe(false);
  });

  it('uses manifest globalGroup when USE_GLOBAL_RULES=true', async () => {
    process.env.USE_GLOBAL_RULES = 'true';
    const { resolveRequestScopes } = await import('./manifest.ts');

    const manifest: RulesManifest = {
      groups: { global: {} },
      defaults: {
        globalGroup: 'global',
      },
    };

    const scopes = resolveRequestScopes({ scope: 'group', id: 'custom' }, manifest);

    expect(scopes.groups.has('custom')).toBe(true);
    expect(scopes.groups.has('global')).toBe(true);
  });
});
