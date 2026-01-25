/**
 * MCP Tool Handlers
 *
 * Handles tool-related requests (querying and searching rules)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { getAvailableScopeIds } from '@/utils/manifest.ts';
import { getMergedRules, searchRulesByKeyword } from '@/utils/rules.ts';
import type { RuleScope } from '@/utils/types.ts';

/**
 * Set up tool handlers for the MCP server
 */
export function setupTools(server: McpServer): void {
  // Tool: Get rules for a specific scope/id
  server.registerTool(
    'get_rules',
    {
      description: 'Get rules for a specific scope and id',
      inputSchema: z.object({
        scope: z.enum(['project', 'group', 'tech', 'language']).describe('Scope type'),
        id: z.string().describe('Scope identifier'),
      }),
    },
    async (args) => {
      const rules = await getMergedRules({ scope: args.scope, id: args.id });
      return {
        content: [
          {
            type: 'text' as const,
            text: rules,
          },
        ],
      };
    },
  );

  // todo needed?
  // Tool: List available ids for a scope
  server.registerTool(
    'list_scope_ids',
    {
      description: 'List all available identifiers for a scope',
      inputSchema: z.object({
        scope: z.enum(['project', 'group', 'tech', 'language']).describe('Scope type'),
      }),
    },
    async (args) => {
      const ids = await getAvailableScopeIds(args.scope as RuleScope);

      return {
        content: [
          {
            type: 'text' as const,
            text: `Available ${args.scope} ids:\n\n${ids.map((id) => `- ${id}`).join('\n')}`,
          },
        ],
      };
    },
  );

  // Tool: Search rules by keyword
  server.registerTool(
    'search_rules',
    {
      description: 'Search for rules containing a specific keyword across all scopes',
      inputSchema: z.object({
        keyword: z.string().describe('Keyword to search for'),
        scope: z
          .enum(['project', 'group', 'tech', 'language'])
          .optional()
          .describe('Optional: limit search to a scope'),
        id: z.string().optional().describe('Optional: scope identifier'),
      }),
    },
    async (args) => {
      if ((args.scope && !args.id) || (!args.scope && args.id)) {
        throw new Error('Both scope and id must be provided together.');
      }

      const text = await searchRulesByKeyword({
        keyword: args.keyword,
        scope: args.scope,
        id: args.id,
      });
      return {
        content: [
          {
            type: 'text' as const,
            text,
          },
        ],
      };
    },
  );
}
