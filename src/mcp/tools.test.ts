import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTools } from './tools.ts';

import * as manifestModule from '@/utils/manifest.ts';
import * as rulesModule from '@/utils/rules.ts';

describe('setupTools', () => {
  let server: McpServer;
  let registeredTools: Map<string, any>;
  let getAvailableScopeIdsSpy: ReturnType<typeof vi.spyOn>;
  let searchRulesSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    server = new McpServer(
      {
        name: 'test-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    registeredTools = new Map();
    const originalRegisterTool = server.registerTool.bind(server);
    server.registerTool = (name: string, ...args: unknown[]) => {
      registeredTools.set(name, args);
      // Call original with proper typing
      return (originalRegisterTool as any)(name, ...args);
    };

    getAvailableScopeIdsSpy = vi.spyOn(manifestModule, 'getAvailableScopeIds');
    searchRulesSpy = vi.spyOn(rulesModule, 'searchRulesByKeyword');
  });

  it('registers list_scope_ids tool', () => {
    setupTools(server);

    expect(registeredTools.has('list_scope_ids')).toBe(true);
    const toolConfig = registeredTools.get('list_scope_ids');
    expect(toolConfig).toBeDefined();
    expect(toolConfig[0].description).toBe('List all available identifiers for a scope');
  });

  it('list_scope_ids tool handler returns formatted scope list', async () => {
    getAvailableScopeIdsSpy.mockResolvedValue(['buerokratt/Service-Module', 'buerokratt/Buerokratt-Chatbot']);

    setupTools(server);

    const toolConfig = registeredTools.get('list_scope_ids');
    const handler = toolConfig[1];

    const result = await handler({ scope: 'project' });

    expect(getAvailableScopeIdsSpy).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Available project ids:');
    expect(result.content[0].text).toContain('- buerokratt/Service-Module');
    expect(result.content[0].text).toContain('- buerokratt/Buerokratt-Chatbot');

    getAvailableScopeIdsSpy.mockRestore();
  });

  it('registers search_rules tool', () => {
    setupTools(server);

    expect(registeredTools.has('search_rules')).toBe(true);
    const toolConfig = registeredTools.get('search_rules');
    expect(toolConfig).toBeDefined();
    expect(toolConfig[0].description).toBe('Search for rules containing a specific keyword across all scopes');
  });

  it('search_rules tool handler finds matching rules', async () => {
    searchRulesSpy.mockResolvedValue('Found 1 rule(s) containing "SQL":\n\n**rules/test1.md**');

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL' });

    expect(searchRulesSpy).toHaveBeenCalledWith({ keyword: 'SQL', scope: undefined, id: undefined });
    expect(result.content[0].text).toContain('Found 1 rule(s)');
    expect(result.content[0].text).toContain('test1.md');

    searchRulesSpy.mockRestore();
  });

  it('search_rules tool handler filters by scope when specified', async () => {
    searchRulesSpy.mockResolvedValue(
      'Found 2 rule(s) containing "SQL":\n\n**rules/test1.md**\n\n---\n\n**rules/test2.md**',
    );

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL', scope: 'project', id: 'buerokratt/Service-Module' });

    expect(result.content[0].text).toContain('Found 2 rule(s)');
    expect(result.content[0].text).toContain('test1.md');
    expect(result.content[0].text).toContain('test2.md');
    expect(searchRulesSpy).toHaveBeenCalledWith({ keyword: 'SQL', scope: 'project', id: 'buerokratt/Service-Module' });

    searchRulesSpy.mockRestore();
  });

  it('search_rules tool handler returns no results message when nothing found', async () => {
    searchRulesSpy.mockResolvedValue('No rules found containing "nonexistent".');

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'nonexistent' });

    expect(result.content[0].text).toContain('No rules found');
    expect(result.content[0].text).toContain('nonexistent');

    searchRulesSpy.mockRestore();
  });

  it('search_rules tool handler searches in description', async () => {
    searchRulesSpy.mockResolvedValue('Found 1 rule(s) containing "SQL":\n\n**rules/test1.md**');

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL' });

    expect(result.content[0].text).toContain('Found 1 rule(s)');
    expect(result.content[0].text).toContain('test1.md');
    expect(searchRulesSpy).toHaveBeenCalledWith({ keyword: 'SQL', scope: undefined, id: undefined });

    searchRulesSpy.mockRestore();
  });
});
