import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { setupTools } from './tools.ts';
import * as managerModule from '../utils/manager.ts';
import * as manifestModule from '../utils/manifest.ts';
import * as loaderModule from '../utils/rules.ts';

describe('setupTools', () => {
  let server: McpServer;
  let registeredTools: Map<string, any>;
  let getAvailableScopeIdsSpy: ReturnType<typeof vi.spyOn>;
  let getMergedRulesSpy: ReturnType<typeof vi.spyOn>;
  let loadAllRulesSpy: ReturnType<typeof vi.spyOn>;
  let loadManifestSpy: ReturnType<typeof vi.spyOn>;

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

    getAvailableScopeIdsSpy = vi.spyOn(managerModule, 'getAvailableScopeIds');
    getMergedRulesSpy = vi.spyOn(managerModule, 'getMergedRules');
    loadAllRulesSpy = vi.spyOn(loaderModule, 'loadAllRules');
    loadManifestSpy = vi.spyOn(manifestModule, 'loadRulesManifest');
  });

  it('registers get_rules tool', () => {
    setupTools(server);

    expect(registeredTools.has('get_rules')).toBe(true);
    const toolConfig = registeredTools.get('get_rules');
    expect(toolConfig).toBeDefined();
    expect(toolConfig[0].description).toBe('Get cursor rules for a specific scope and id');
  });

  it('get_rules tool handler returns merged rules', async () => {
    getMergedRulesSpy.mockResolvedValue('# Test Rules\n\nContent here');

    setupTools(server);

    const toolConfig = registeredTools.get('get_rules');
    const handler = toolConfig[1]; // Handler is the second argument

    const result = await handler({ scope: 'project', id: 'buerokratt/Service-Module' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith({ scope: 'project', id: 'buerokratt/Service-Module' });
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('# Test Rules\n\nContent here');

    getMergedRulesSpy.mockRestore();
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
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { appliesTo: { projects: ['buerokratt/Service-Module'] }, description: 'Test rule' },
        content: 'This is a test rule about SQL queries',
      },
      {
        path: 'rules/test2.md',
        frontmatter: { appliesTo: { groups: ['global'] } },
        content: 'This is about something else',
      },
    ]);
    loadManifestSpy.mockResolvedValue({ defaults: { alwaysGroups: ['global'] }, groups: { global: {} } });

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL' });

    expect(loadAllRulesSpy).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Found 1 rule(s)');
    expect(result.content[0].text).toContain('test1.md');
    expect(result.content[0].text).toContain('SQL queries');

    loadAllRulesSpy.mockRestore();
    loadManifestSpy.mockRestore();
  });

  it('search_rules tool handler filters by scope when specified', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { appliesTo: { projects: ['buerokratt/Service-Module'] } },
        content: 'This is a test rule about SQL',
      },
      {
        path: 'rules/test2.md',
        frontmatter: { appliesTo: { groups: ['global'] } },
        content: 'This is about SQL too',
      },
      {
        path: 'rules/test3.md',
        frontmatter: { appliesTo: { projects: ['other/project'] } },
        content: 'This is about SQL as well',
      },
    ]);
    loadManifestSpy.mockResolvedValue({
      defaults: { alwaysGroups: ['global'] },
      groups: { global: {} },
      projects: { 'buerokratt/Service-Module': { groups: ['global'] } },
    });

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL', scope: 'project', id: 'buerokratt/Service-Module' });

    // The filter logic includes 'global' rules even when filtering by a specific module
    // So we should get both service-module and global rules
    expect(result.content[0].text).toContain('Found 2 rule(s)');
    expect(result.content[0].text).toContain('test1.md');
    expect(result.content[0].text).toContain('test2.md');
    expect(result.content[0].text).not.toContain('test3.md');

    loadAllRulesSpy.mockRestore();
    loadManifestSpy.mockRestore();
  });

  it('search_rules tool handler returns no results message when nothing found', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { appliesTo: { projects: ['buerokratt/Service-Module'] } },
        content: 'This is a test rule',
      },
    ]);
    loadManifestSpy.mockResolvedValue({});

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'nonexistent' });

    expect(result.content[0].text).toContain('No rules found');
    expect(result.content[0].text).toContain('nonexistent');

    loadAllRulesSpy.mockRestore();
    loadManifestSpy.mockRestore();
  });

  it('search_rules tool handler searches in description', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: {
          appliesTo: { projects: ['buerokratt/Service-Module'] },
          description: 'This is about SQL queries',
        },
        content: 'Some content here',
      },
    ]);
    loadManifestSpy.mockResolvedValue({});

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL' });

    expect(result.content[0].text).toContain('Found 1 rule(s)');
    expect(result.content[0].text).toContain('test1.md');

    loadAllRulesSpy.mockRestore();
    loadManifestSpy.mockRestore();
  });
});
