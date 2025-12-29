import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupResources } from './resources.ts';
import * as managerModule from '../rules/manager.ts';

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

  it('registers module-rules resource', () => {
    setupResources(server);

    expect(registeredResources.has('module-rules')).toBe(true);
    const resourceConfig = registeredResources.get('module-rules');
    expect(resourceConfig).toBeDefined();
  });

  it('module-rules resource is registered with correct structure', () => {
    setupResources(server);

    const resourceConfig = registeredResources.get('module-rules');
    expect(resourceConfig).toBeDefined();
    expect(resourceConfig?.length).toBeGreaterThan(0);

    // Verify it's a ResourceTemplate (first arg)
    const template = resourceConfig?.[0];
    expect(template).toBeDefined();

    // Verify metadata (second arg)
    const metadata = resourceConfig?.[1] as { description?: string; mimeType?: string } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.description).toBe('Cursor rules for Bürokratt modules');
    expect(metadata?.mimeType).toBe('text/markdown');

    // Verify read handler exists (third arg)
    const readHandler = resourceConfig?.[2];
    expect(typeof readHandler).toBe('function');
  });

  it('module-rules resource read handler returns merged rules for module', async () => {
    getMergedRulesSpy.mockResolvedValue('# Test Rules\n\nContent here');

    setupResources(server);

    const resourceConfig = registeredResources.get('module-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { module: string },
    ) => Promise<{ contents: Array<{ uri: string; mimeType: string; text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://Service-Module');
    const result = await readHandler(uri, { module: 'Service-Module' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith('Service-Module');
    expect(result.contents).toBeDefined();
    expect(result.contents.length).toBe(1);
    const content = result.contents[0]!;
    expect(content.uri).toBe(uri.toString());
    expect(content.mimeType).toBe('text/markdown');
    expect(content.text).toBe('# Test Rules\n\nContent here');

    getMergedRulesSpy.mockRestore();
  });

  it('module-rules resource read handler handles string module variable', async () => {
    getMergedRulesSpy.mockResolvedValue('Rules content');

    setupResources(server);

    const resourceConfig = registeredResources.get('module-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { module: string },
    ) => Promise<{ contents: Array<{ text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://test-module');
    const result = await readHandler(uri, { module: 'test-module' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith('test-module');
    const content = result.contents[0]!;
    expect(content.text).toBe('Rules content');

    getMergedRulesSpy.mockRestore();
  });

  it('module-rules resource read handler handles array module variable', async () => {
    getMergedRulesSpy.mockResolvedValue('Rules content');

    setupResources(server);

    const resourceConfig = registeredResources.get('module-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (
      uri: URL,
      variables: { module: string | string[] },
    ) => Promise<{ contents: Array<{ text: string }> }>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://test-module');
    const result = await readHandler(uri, { module: ['test-module'] });

    expect(getMergedRulesSpy).toHaveBeenCalledWith('test-module');
    const content = result.contents[0]!;
    expect(content.text).toBe('Rules content');

    getMergedRulesSpy.mockRestore();
  });

  it('module-rules resource read handler throws error when module is missing', async () => {
    setupResources(server);

    const resourceConfig = registeredResources.get('module-rules');
    expect(resourceConfig).toBeDefined();
    const readHandler = resourceConfig?.[2] as (uri: URL, variables: Record<string, unknown>) => Promise<unknown>;
    expect(typeof readHandler).toBe('function');

    const uri = new URL('rules://test-module');

    await expect(readHandler(uri, {})).rejects.toThrow('Module name is required');
  });

  it('registers global-rules resource', () => {
    setupResources(server);

    expect(registeredResources.has('global-rules')).toBe(true);
    const resourceConfig = registeredResources.get('global-rules');
    expect(resourceConfig).toBeDefined();
  });

  it('global-rules resource is registered with correct structure', () => {
    setupResources(server);

    const resourceConfig = registeredResources.get('global-rules');
    expect(resourceConfig).toBeDefined();
    expect(resourceConfig?.length).toBeGreaterThan(0);

    // Verify URI (first arg)
    const uri = resourceConfig?.[0];
    expect(uri).toBe('rules://global');

    // Verify metadata (second arg)
    const metadata = resourceConfig?.[1] as { description?: string; mimeType?: string } | undefined;
    expect(metadata).toBeDefined();
    expect(metadata?.description).toBe('Global rules that apply to all modules');
    expect(metadata?.mimeType).toBe('text/markdown');

    // Verify read handler exists (third arg)
    const readHandler = resourceConfig?.[2];
    expect(typeof readHandler).toBe('function');
  });
});
