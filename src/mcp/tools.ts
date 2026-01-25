/**
 * MCP Tool Handlers
 *
 * Handles tool-related requests (querying and searching rules)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { resolveRequestScopes, ruleAppliesToScopes } from '@/rules/filter.ts';
import { loadRulesManifest } from '@/rules/manifest.ts';
import { loadAllRules } from '@/rules/loader.ts';
import { getAvailableScopeIds, getMergedRules } from '@/rules/manager.ts';
import type { RuleScope } from '@/rules/types.ts';

/**
 * Set up tool handlers for the MCP server
 */
export function setupTools(server: McpServer): void {
  // Tool: Get rules for a specific scope/id
  server.registerTool(
    'get_rules',
    {
      description: 'Get cursor rules for a specific scope and id',
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
      const list = ids.map((id) => `- ${id}`).join('\n');
      return {
        content: [
          {
            type: 'text' as const,
            text: `Available ${args.scope} ids:\n\n${list}`,
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
        scope: z.enum(['project', 'group', 'tech', 'language']).optional().describe('Optional: limit search to a scope'),
        id: z.string().optional().describe('Optional: scope identifier'),
      }),
    },
    async (args) => {
      if ((args.scope && !args.id) || (!args.scope && args.id)) {
        throw new Error('Both scope and id must be provided together.');
      }

      const [allRules, manifest] = await Promise.all([loadAllRules(), loadRulesManifest()]);
      const keyword = args.keyword.toLowerCase();
      const results: string[] = [];
      const resolvedScopes = args.scope && args.id ? resolveRequestScopes({ scope: args.scope, id: args.id }, manifest) : null;

      for (const rule of allRules) {
        // Filter by scope if specified
        if (resolvedScopes && !ruleAppliesToScopes(rule, resolvedScopes)) {
          continue;
        }

        // Search in content
        if (
          rule.content.toLowerCase().includes(keyword) ||
          rule.frontmatter.description?.toLowerCase().includes(keyword)
        ) {
          const appliesTo = rule.frontmatter.appliesTo;
          const appliesParts = [
            appliesTo.projects?.length ? `projects: ${appliesTo.projects.join(', ')}` : null,
            appliesTo.groups?.length ? `groups: ${appliesTo.groups.join(', ')}` : null,
            appliesTo.techs?.length ? `techs: ${appliesTo.techs.join(', ')}` : null,
            appliesTo.languages?.length ? `languages: ${appliesTo.languages.join(', ')}` : null,
          ]
            .filter(Boolean)
            .join(' | ');
          results.push(`**${rule.path}** (${appliesParts})\n${rule.content.substring(0, 200)}...`);
        }
      }

      if (results.length === 0) {
        const scopeText = args.scope && args.id ? ` in ${args.scope} "${args.id}"` : '';
        return {
          content: [
            {
              type: 'text' as const,
              text: `No rules found containing "${args.keyword}"${scopeText}.`,
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
