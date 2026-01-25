import { afterEach, describe, expect, it, vi } from 'vitest';

describe('loadRulesManifest', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('returns normalized manifest data', async () => {
    vi.mock('node:fs/promises', () => ({
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
            '  alwaysGroups:',
            '    - global',
          ].join('\n'),
        ),
    }));

    const { loadManifest: loadRulesManifest } = await import('./manifest.ts');
    const manifest = await loadRulesManifest();

    expect(manifest.version).toBe(1);
    expect(manifest.languages?.typescript?.description).toBe('TS');
    expect(manifest.techs?.react?.dependsOn).toEqual(['typescript']);
    expect(manifest.groups?.global?.description).toBe('Always');
    expect(manifest.projects?.['buerokratt/Service-Module']?.groups).toEqual(['global']);
    expect(manifest.defaults?.alwaysGroups).toEqual(['global']);
  });

  it('returns empty manifest on ENOENT', async () => {
    const error = new Error('Missing');
    (error as { code?: string }).code = 'ENOENT';

    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockRejectedValue(error),
    }));

    const { loadManifest: loadRulesManifest } = await import('./manifest.ts');
    const manifest = await loadRulesManifest();

    expect(manifest).toEqual({});
  });

  it('returns empty manifest on non-object YAML', async () => {
    vi.mock('node:fs/promises', () => ({
      readFile: vi.fn().mockResolvedValue('just-a-string'),
    }));

    const { loadManifest: loadRulesManifest } = await import('./manifest.ts');
    const manifest = await loadRulesManifest();

    expect(manifest).toEqual({});
  });
});
