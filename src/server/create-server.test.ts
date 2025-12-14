import { describe, expect, it, spyOn } from 'bun:test';

import { createServer } from './create-server.ts';
import * as promptsModule from '../mcp/prompts.ts';
import * as resourcesModule from '../mcp/resources.ts';
import * as toolsModule from '../mcp/tools.ts';

describe('createServer', () => {
  it('creates MCP server with correct configuration', () => {
    const server = createServer();

    expect(server).toBeDefined();
    // Verify server has the expected structure
    expect(server.server).toBeDefined();
  });

  it('sets up error handler', () => {
    const consoleErrorSpy = spyOn(console, 'error').mockImplementation(() => {});
    const server = createServer();

    // Trigger error handler
    if (server.server.onerror) {
      server.server.onerror(new Error('Test error'));
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  it('calls setup functions', () => {
    const setupResourcesSpy = spyOn(resourcesModule, 'setupResources');
    const setupToolsSpy = spyOn(toolsModule, 'setupTools');
    const setupPromptsSpy = spyOn(promptsModule, 'setupPrompts');

    createServer();

    expect(setupResourcesSpy).toHaveBeenCalled();
    expect(setupToolsSpy).toHaveBeenCalled();
    expect(setupPromptsSpy).toHaveBeenCalled();

    setupResourcesSpy.mockRestore();
    setupToolsSpy.mockRestore();
    setupPromptsSpy.mockRestore();
  });
});
