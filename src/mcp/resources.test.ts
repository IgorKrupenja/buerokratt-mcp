import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupResources } from './resources.ts';
import { findAssetFiles, getAvailableAssets } from '../utils/assets.ts';
import * as managerModule from '../utils/manager.ts';

describe('setupResources', () => {
  let server: McpServer;
  let registeredResources: Map<string, unknown[]>;
  let getMergedRulesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    server = new McpServer(
      {
        name: 'test-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          resources: {},
        },
      },
    );

    registeredResources = new Map();
    const originalRegisterResource = server.registerResource.bind(server);
    server.registerResource = (name: string, ...args: unknown[]) => {
      registeredResources.set(name, args);
      // Call original with proper typing
      return (originalRegisterResource as any)(name, ...args);
    };

    getMergedRulesSpy = vi.spyOn(managerModule, 'getMergedRules');
  });

  it('registers scope-rules resource', () => {
    setupResources(server);

    expect(registeredResources.has('scope-rules')).toBe(true);
    const resourceConfig = registeredResources.get('scope-rules');
    expect(resourceConfig).toBeDefined();
  });

  it('registers asset-files resource', () => {
    setupResources(server);

    expect(registeredResources.has('asset-files')).toBe(true);
    const resourceConfig = registeredResources.get('asset-files');
    expect(resourceConfig).toBeDefined();
  });

  it('asset-files resource read handler returns asset content', async () => {
    setupResources(server);

    const resourceConfig = registeredResources.get('asset-files');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { name: string },
    ) => Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://assets/projects/buerokratt/sync-upstream.sh');
    const result = await readHandler(uri, { name: 'projects/buerokratt/sync-upstream.sh' });

    expect(result.contents).toBeDefined();
    expect(result.contents.length).toBe(1);
    const content = result.contents[0]!;
    expect(content.uri).toBe(uri.toString());
    expect(content.mimeType).toBe('text/x-shellscript');
    expect(content.text).toMatch(/^#!\/(usr\/bin\/env bash|bin\/bash)/);
  });

  it('scope-rules resource is registered with correct structure', () => {
    setupResources(server);

    const resourceConfig = registeredResources.get('scope-rules');
    expect(resourceConfig).toBeDefined();
    expect(resourceConfig?.length).toBeGreaterThan(0);

    // Verify it's a ResourceTemplate (first arg)
    const template = resourceConfig?.[0];
    expect(template).toBeDefined();

    // Verify metadata (second arg)
    const metadata = resourceConfig?.[1] as { description?: string; mimeType?: string } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.description).toBe('Rules for projects, groups, techs, and languages');
    expect(metadata?.mimeType).toBe('text/markdown');

    // Verify read handler exists (third arg)
    const readHandler = resourceConfig?.[2];
    expect(typeof readHandler).toBe('function');
  });

  it('scope-rules resource read handler returns merged rules for scope', async () => {
    getMergedRulesSpy.mockResolvedValue('# Test Rules\n\nContent here');

    setupResources(server);

    const resourceConfig = registeredResources.get('scope-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { scope: string; id: string },
    ) => Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://project/buerokratt/Service-Module');
    const result = await readHandler(uri, { scope: 'project', id: 'buerokratt/Service-Module' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith({ scope: 'project', id: 'buerokratt/Service-Module' });
    expect(result.contents).toBeDefined();
    expect(result.contents.length).toBe(1);
    const content = result.contents[0]!;
    expect(content.uri).toBe(uri.toString());
    expect(content.mimeType).toBe('text/markdown');
    expect(content.text).toBe('# Test Rules\n\nContent here');

    getMergedRulesSpy.mockRestore();
  });

  it('scope-rules resource read handler handles string variables', async () => {
    getMergedRulesSpy.mockResolvedValue('Rules content');

    setupResources(server);

    const resourceConfig = registeredResources.get('scope-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { scope: string; id: string },
    ) => Promise<{ contents: Array<{ text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://group/global');
    const result = await readHandler(uri, { scope: 'group', id: 'global' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith({ scope: 'group', id: 'global' });
    const content = result.contents[0]!;
    expect(content.text).toBe('Rules content');

    getMergedRulesSpy.mockRestore();
  });

  it('scope-rules resource read handler handles array variables', async () => {
    getMergedRulesSpy.mockResolvedValue('Rules content');

    setupResources(server);

    const resourceConfig = registeredResources.get('scope-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { scope: string | string[]; id: string | string[] },
    ) => Promise<{ contents: Array<{ text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://language/typescript');
    const result = await readHandler(uri, { scope: ['language'], id: ['typescript'] });

    expect(getMergedRulesSpy).toHaveBeenCalledWith({ scope: 'language', id: 'typescript' });
    const content = result.contents[0]!;
    expect(content.text).toBe('Rules content');

    getMergedRulesSpy.mockRestore();
  });

  it('scope-rules resource read handler throws error when scope or id is missing', async () => {
    setupResources(server);

    const resourceConfig = registeredResources.get('scope-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (uri: URL, variables: Record<string, unknown>) => Promise<unknown>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://project/buerokratt/Service-Module');

    await expect(readHandler(uri, {})).rejects.toThrow('Scope and id are required');
  });
});

describe('asset resource helpers', () => {
  it('finds files with known mime types', async () => {
    const tempDir = `/tmp/test-assets-${Date.now()}`;
    await mkdir(join(tempDir, 'subdir'), { recursive: true });
    await writeFile(join(tempDir, 'file.sql'), 'select 1;');
    await writeFile(join(tempDir, 'file.unknownext'), 'data');
    await writeFile(join(tempDir, 'subdir', 'file.json'), '{"ok":true}');

    try {
      const result = await findAssetFiles(tempDir);
      expect(result.some((file) => file.endsWith('file.sql'))).toBe(true);
      expect(result.some((file) => file.endsWith('file.json'))).toBe(true);
      expect(result.some((file) => file.endsWith('file.unknownext'))).toBe(true);
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('builds asset resources map with relative paths', async () => {
    const tempDir = `/tmp/test-assets-${Date.now()}`;
    await mkdir(join(tempDir, 'nested'), { recursive: true });
    await writeFile(join(tempDir, 'nested', 'script.sh'), '#!/usr/bin/env bash\necho ok\n');

    try {
      const resources = await getAvailableAssets(tempDir);
      expect(resources['nested/script.sh']).toBeDefined();
      expect(resources['nested/script.sh']?.mimeType).toBe('application/x-sh');
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });
});
