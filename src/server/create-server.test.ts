import { describe, expect, it, vi } from 'vitest';

import { createServer } from './create-server.ts';

import * as resourcesModule from '@/mcp/resources.ts';
import * as toolsModule from '@/mcp/tools.ts';

describe('createServer', () => {
  it('creates MCP server with correct configuration', () => {
    const server = createServer();

    expect(server).toBeDefined();
    // Verify server has the expected structure
    expect(server.server).toBeDefined();
  });

  it('sets up error handler', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const server = createServer();

    // Trigger error handler
    if (server.server.onerror) {
      server.server.onerror(new Error('Test error'));
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('calls setup functions', () => {
    const setupResourcesSpy = vi.spyOn(resourcesModule, 'setupResources');
    const setupToolsSpy = vi.spyOn(toolsModule, 'setupTools');

    createServer();

    expect(setupResourcesSpy).toHaveBeenCalled();
    expect(setupToolsSpy).toHaveBeenCalled();

    setupResourcesSpy.mockRestore();
    setupToolsSpy.mockRestore();
  });
});
