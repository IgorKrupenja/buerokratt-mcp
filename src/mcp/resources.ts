/**
 * MCP Resource Handlers
 *
 * Handles resource-related requests (listing and reading rules)
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { getMergedRules, getAvailableModules } from '../rules/manager.ts';

/**
 * Set up resource handlers for the MCP server
 */
export async function setupResources(server: McpServer): Promise<void> {
  // Register a resource template for module rules
  server.registerResource(
    'module-rules',
    new ResourceTemplate('rules://{module}', {
      list: async () => {
        const modules = await getAvailableModules();
        return {
          resources: modules.map((module) => ({
            uri: `rules://${module}`,
            name: `${module}-rules`,
            description: `Rules for ${module}`,
            mimeType: 'text/markdown',
          })),
        };
      },
    }),
    {
      description: 'Cursor rules for Bürokratt modules',
      mimeType: 'text/markdown',
    },
    async (uri, variables) => {
      const moduleName = typeof variables.module === 'string' ? variables.module : variables.module?.[0];
      if (!moduleName) {
        throw new Error('Module name is required');
      }

      const rules = await getMergedRules(moduleName);

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

  // Register global rules resource
  server.registerResource(
    'global-rules',
    'rules://global',
    {
      description: 'Global rules that apply to all modules',
      mimeType: 'text/markdown',
    },
    async (uri) => {
      const rules = await getMergedRules('global');

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
