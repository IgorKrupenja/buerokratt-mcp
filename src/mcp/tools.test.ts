import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';

import { setupTools } from './tools.ts';
import * as loaderModule from '../rules/loader.ts';
import * as managerModule from '../rules/manager.ts';

describe('setupTools', () => {
  let server: McpServer;
  let registeredTools: Map<string, any>;
  let getAvailableModulesSpy: ReturnType<typeof spyOn>;
  let getMergedRulesSpy: ReturnType<typeof spyOn>;
  let loadAllRulesSpy: ReturnType<typeof spyOn>;

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

    getAvailableModulesSpy = spyOn(managerModule, 'getAvailableModules');
    getMergedRulesSpy = spyOn(managerModule, 'getMergedRules');
    loadAllRulesSpy = spyOn(loaderModule, 'loadAllRules');
  });

  it('registers get_rules tool', () => {
    setupTools(server);

    expect(registeredTools.has('get_rules')).toBe(true);
    const toolConfig = registeredTools.get('get_rules');
    expect(toolConfig).toBeDefined();
    expect(toolConfig[0].description).toBe('Get cursor rules for a specific module');
  });

  it('get_rules tool handler returns merged rules', async () => {
    getMergedRulesSpy.mockResolvedValue('# Test Rules\n\nContent here');

    setupTools(server);

    const toolConfig = registeredTools.get('get_rules');
    const handler = toolConfig[1]; // Handler is the second argument

    const result = await handler({ module: 'service-module' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith('service-module');
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('# Test Rules\n\nContent here');

    getMergedRulesSpy.mockRestore();
  });

  it('registers list_modules tool', () => {
    setupTools(server);

    expect(registeredTools.has('list_modules')).toBe(true);
    const toolConfig = registeredTools.get('list_modules');
    expect(toolConfig).toBeDefined();
    expect(toolConfig[0].description).toBe('List all available modules that have rules');
  });

  it('list_modules tool handler returns formatted module list', async () => {
    getAvailableModulesSpy.mockResolvedValue(['service-module', 'global', 'shared-backend']);

    setupTools(server);

    const toolConfig = registeredTools.get('list_modules');
    const handler = toolConfig[1];

    const result = await handler({});

    expect(getAvailableModulesSpy).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Available modules:');
    expect(result.content[0].text).toContain('- service-module');
    expect(result.content[0].text).toContain('- global');
    expect(result.content[0].text).toContain('- shared-backend');

    getAvailableModulesSpy.mockRestore();
  });

  it('registers search_rules tool', () => {
    setupTools(server);

    expect(registeredTools.has('search_rules')).toBe(true);
    const toolConfig = registeredTools.get('search_rules');
    expect(toolConfig).toBeDefined();
    expect(toolConfig[0].description).toBe('Search for rules containing a specific keyword across all modules');
  });

  it('search_rules tool handler finds matching rules', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { modules: ['service-module'], description: 'Test rule' },
        content: 'This is a test rule about SQL queries',
      },
      {
        path: 'rules/test2.md',
        frontmatter: { modules: ['global'] },
        content: 'This is about something else',
      },
    ]);

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL' });

    expect(loadAllRulesSpy).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Found 1 rule(s)');
    expect(result.content[0].text).toContain('test1.md');
    expect(result.content[0].text).toContain('SQL queries');

    loadAllRulesSpy.mockRestore();
  });

  it('search_rules tool handler filters by module when specified', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { modules: ['service-module'] },
        content: 'This is a test rule about SQL',
      },
      {
        path: 'rules/test2.md',
        frontmatter: { modules: ['global'] },
        content: 'This is about SQL too',
      },
      {
        path: 'rules/test3.md',
        frontmatter: { modules: ['other-module'] },
        content: 'This is about SQL as well',
      },
    ]);

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL', module: 'service-module' });

    // The filter logic includes 'global' rules even when filtering by a specific module
    // So we should get both service-module and global rules
    expect(result.content[0].text).toContain('Found 2 rule(s)');
    expect(result.content[0].text).toContain('test1.md');
    expect(result.content[0].text).toContain('test2.md');
    expect(result.content[0].text).not.toContain('test3.md');

    loadAllRulesSpy.mockRestore();
  });

  it('search_rules tool handler returns no results message when nothing found', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { modules: ['service-module'] },
        content: 'This is a test rule',
      },
    ]);

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'nonexistent' });

    expect(result.content[0].text).toContain('No rules found');
    expect(result.content[0].text).toContain('nonexistent');

    loadAllRulesSpy.mockRestore();
  });

  it('search_rules tool handler searches in description', async () => {
    loadAllRulesSpy.mockResolvedValue([
      {
        path: 'rules/test1.md',
        frontmatter: { modules: ['service-module'], description: 'This is about SQL queries' },
        content: 'Some content here',
      },
    ]);

    setupTools(server);

    const toolConfig = registeredTools.get('search_rules');
    const handler = toolConfig[1];

    const result = await handler({ keyword: 'SQL' });

    expect(result.content[0].text).toContain('Found 1 rule(s)');
    expect(result.content[0].text).toContain('test1.md');

    loadAllRulesSpy.mockRestore();
  });
});
