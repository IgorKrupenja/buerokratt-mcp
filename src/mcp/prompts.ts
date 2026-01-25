/**
 * MCP Prompt Handlers
 *
 * Handles prompt-related requests (formatted prompts for AI assistants)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { getMergedRules } from '@/utils/rules.ts';

// todo do i need this?
/**
 * Set up prompt handlers for the MCP server
 */
export function setupPrompts(server: McpServer): void {
  // Prompt: Get development rules as a system prompt
  // Works with any AI editor: Cursor, VS Code, JetBrains, etc.
  server.registerPrompt(
    'development-rules',
    {
      description: 'Get development rules as a system prompt for a scope and id (works with any AI editor)',
      argsSchema: {
        scope: z.enum(['project', 'group', 'tech', 'language']).describe('Scope type'),
        id: z.string().describe('Scope identifier'),
      },
    },
    async (args) => {
      const rules = await getMergedRules({ scope: args.scope, id: args.id });

      return {
        messages: [
          {
            role: 'user' as const,
            content: {
              type: 'text' as const,
              text: `Here are the development rules for ${args.scope}:${args.id}:\n\n${rules}`,
            },
          },
        ],
      };
    },
  );
}
