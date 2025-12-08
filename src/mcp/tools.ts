/**
 * MCP Tool Handlers
 *
 * Handles tool-related requests (querying and searching rules)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { getAvailableModules, getMergedRules, loadRules } from '../rules/manager.ts';

/**
 * Set up tool handlers for the MCP server
 */
export function setupTools(server: McpServer): void {
  // todo check if actually used
  // Tool: Get rules for a specific module
  server.registerTool(
    'get_rules',
    {
      description: 'Get cursor rules for a specific module',
      inputSchema: z.object({
        module: z.string().describe('Module name'),
      }),
    },
    async (args) => {
      const rules = await getMergedRules(args.module);
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

  // Tool: List all available modules
  server.registerTool(
    'list_modules',
    {
      description: 'List all available modules that have rules',
      inputSchema: z.object({}),
    },
    async () => {
      const modules = await getAvailableModules();
      const moduleList = modules.map((m) => `- ${m}`).join('\n');
      return {
        content: [
          {
            type: 'text' as const,
            text: `Available modules:\n\n${moduleList}`,
          },
        ],
      };
    },
  );

  // Tool: Search rules by keyword
  server.registerTool(
    'search_rules',
    {
      description: 'Search for rules containing a specific keyword across all modules',
      inputSchema: z.object({
        keyword: z.string().describe('Keyword to search for'),
        module: z.string().optional().describe('Optional: limit search to a specific module'),
      }),
    },
    async (args) => {
      const allRules = await loadRules();
      const keyword = args.keyword.toLowerCase();
      const results: string[] = [];

      for (const rule of allRules) {
        // Filter by module if specified
        if (
          args.module &&
          !rule.frontmatter.modules.includes(args.module) &&
          !rule.frontmatter.modules.includes('global')
        ) {
          continue;
        }

        // Search in content
        if (
          rule.content.toLowerCase().includes(keyword) ||
          rule.frontmatter.description?.toLowerCase().includes(keyword)
        ) {
          const modules = rule.frontmatter.modules.join(', ');
          results.push(`**${rule.path}** (modules: ${modules})\n${rule.content.substring(0, 200)}...`);
        }
      }

      if (results.length === 0) {
        const moduleText = args.module ? ` in module "${args.module}"` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `No rules found containing "${args.keyword}"${moduleText}.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text' as const,
            text: `Found ${results.length} rule(s) containing "${args.keyword}":\n\n${results.join('\n\n---\n\n')}`,
          },
        ],
      };
    },
  );
}
