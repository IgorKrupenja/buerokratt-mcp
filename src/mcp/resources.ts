/**
 * MCP Resource Handlers
 *
 * Handles resource-related requests (listing and reading rules)
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getAvailableScopeIds, getMergedRules } from '../rules/manager.ts';
import type { RuleScope } from '../rules/types.ts';

/**
 * Set up resource handlers for the MCP server
 */
export function setupResources(server: McpServer): void {
  // Register a resource template for scope-based rules
  server.registerResource(
    'scope-rules',
    new ResourceTemplate('rules://{scope}/{id}', {
      list: async () => {
        const [projects, groups, techs, languages] = await Promise.all([
          getAvailableScopeIds('project'),
          getAvailableScopeIds('group'),
          getAvailableScopeIds('tech'),
          getAvailableScopeIds('language'),
        ]);

        const resources = [
          ...projects.map((id) => ({
            uri: `rules://project/${id}`,
            name: `project-${id}`,
            description: `Rules for project ${id}`,
            mimeType: 'text/markdown',
          })),
          ...groups.map((id) => ({
            uri: `rules://group/${id}`,
            name: `group-${id}`,
            description: `Rules for group ${id}`,
            mimeType: 'text/markdown',
          })),
          ...techs.map((id) => ({
            uri: `rules://tech/${id}`,
            name: `tech-${id}`,
            description: `Rules for tech ${id}`,
            mimeType: 'text/markdown',
          })),
          ...languages.map((id) => ({
            uri: `rules://language/${id}`,
            name: `language-${id}`,
            description: `Rules for language ${id}`,
            mimeType: 'text/markdown',
          })),
        ];

        return {
          resources,
        };
      },
    }),
    {
      description: 'Cursor rules for projects, groups, techs, and languages',
      mimeType: 'text/markdown',
    },
    async (uri, variables) => {
      const scope = typeof variables.scope === 'string' ? variables.scope : variables.scope?.[0];
      const id = typeof variables.id === 'string' ? variables.id : variables.id?.[0];
      if (!scope || !id) {
        throw new Error('Scope and id are required');
      }

      const rules = await getMergedRules({ scope: scope as RuleScope, id });

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: 'text/markdown',
            text: rules,
          },
        ],
      };
    },
  );
}
