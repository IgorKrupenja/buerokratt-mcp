import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { beforeEach, describe, expect, it, spyOn } from 'bun:test';

import { setupPrompts } from './prompts.ts';
import * as managerModule from '../rules/manager.ts';

describe('setupPrompts', () => {
  let server: McpServer;
  let registeredPrompts: Map<string, any>;
  let getMergedRulesSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    server = new McpServer(
      {
        name: 'test-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          prompts: {},
        },
      },
    );

    registeredPrompts = new Map();
    const originalRegisterPrompt = server.registerPrompt.bind(server);
    server.registerPrompt = (name: string, ...args: unknown[]) => {
      registeredPrompts.set(name, args);
      // Call original with proper typing
      return (originalRegisterPrompt as any)(name, ...args);
    };

    getMergedRulesSpy = spyOn(managerModule, 'getMergedRules');
  });

  it('registers development-rules prompt', () => {
    setupPrompts(server);

    expect(registeredPrompts.has('development-rules')).toBe(true);
    const promptConfig = registeredPrompts.get('development-rules');
    expect(promptConfig).toBeDefined();
    expect(promptConfig[0].description).toBe(
      'Get development rules as a system prompt for a specific module (works with any AI editor)',
    );
  });

  it('development-rules prompt handler returns formatted message', async () => {
    getMergedRulesSpy.mockResolvedValue('# Test Rules\n\nContent here');

    setupPrompts(server);

    const promptConfig = registeredPrompts.get('development-rules');
    const handler = promptConfig[1]; // Handler is the second argument

    const result = await handler({ module: 'service-module' });

    expect(getMergedRulesSpy).toHaveBeenCalledWith('service-module');
    expect(result.messages).toBeDefined();
    expect(result.messages.length).toBe(1);
    expect(result.messages[0].role).toBe('user');
    expect(result.messages[0].content.type).toBe('text');
    expect(result.messages[0].content.text).toContain('Here are the development rules for service-module:');
    expect(result.messages[0].content.text).toContain('# Test Rules\n\nContent here');

    getMergedRulesSpy.mockRestore();
  });

  it('development-rules prompt handler includes module name in message', async () => {
    getMergedRulesSpy.mockResolvedValue('Rules content');

    setupPrompts(server);

    const promptConfig = registeredPrompts.get('development-rules');
    const handler = promptConfig[1];

    const result = await handler({ module: 'global' });

    expect(result.messages[0].content.text).toContain('Here are the development rules for global:');

    getMergedRulesSpy.mockRestore();
  });
});
