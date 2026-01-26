import { describe, expect, it } from 'vitest';

import { getAvailableAssets, loadAsset } from './assets.ts';

describe('getAvailableAssets', () => {
  it('includes known asset entries with mime type', async () => {
    const assets = await getAvailableAssets();

    expect(assets['projects/buerokratt/sync-upstream.sh']).toBeDefined();
    expect(assets['projects/buerokratt/sync-upstream.sh']?.mimeType).toBe('application/x-sh');
  });
});

describe('loadAsset', () => {
  it('loads asset content and mime type', async () => {
    const asset = await loadAsset('projects/buerokratt/sync-upstream.sh');

    expect(asset.mimeType).toBe('application/x-sh');
    expect(asset.content).toMatch(/^#!\/(usr\/bin\/env bash|bin\/bash)/);
  });
});
