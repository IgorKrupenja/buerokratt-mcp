/**
 * MCP Prompt Handlers
 *
 * Handles prompt-related requests (formatted prompts for AI assistants)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { getMergedRules } from '../rules/manager.ts';

/**
 * Set up prompt handlers for the MCP server
 */
export function setupPrompts(server: McpServer): void {
  // todo check if actually used
  // Prompt: Get development rules as a system prompt
  // Works with any AI editor: Cursor, VS Code, JetBrains, etc.
  server.registerPrompt(
    'development-rules',
    {
      description: 'Get development rules as a system prompt for a specific module (works with any AI editor)',
      argsSchema: {
        module: z.string().describe('Module name'),
      },
    },
    async (args) => {
      const rules = await getMergedRules(args.module);

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `Here are the development rules for ${args.module}:\n\n${rules}`,
            },
          },
        ],
      };
    },
  );
}
