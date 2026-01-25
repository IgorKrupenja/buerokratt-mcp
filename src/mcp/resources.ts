/**
 * MCP Resource Handlers
 *
 * Handles resource-related requests (listing and reading rules)
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getAvailableAssets, loadAsset } from '../utils/assets.ts';

import { getMergedRules, getRuleScopeEntries, isRuleScope } from '@/utils/rules.ts';

/**
 * Set up resource handlers for the MCP server
 */
export function setupResources(server: McpServer): void {
  server.registerResource(
    'assets',
    new ResourceTemplate('assets://{name}', {
      list: async () => {
        const resources = await getAvailableAssets();

        return {
          resources: Object.entries(resources).map(([name, { mimeType }]) => ({
            uri: `assets://${name}`,
            name,
            description: `Bundled asset ${name}`,
            mimeType,
          })),
        };
      },
    }),
    {
      description: 'Bundled helper assets',
    },
    async (uri, variables) => {
      // MCP variables may be string or string[] depending on URI parsing.
      const name = typeof variables.name === 'string' ? variables.name : variables.name?.[0];
      if (!name) {
        throw new Error('Asset name is required');
      }

      const asset = await loadAsset(name);

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: asset.mimeType,
            text: asset.content,
          },
        ],
      };
    },
  );

  // Register a resource template for scope-based rules
  server.registerResource(
    'rules',
    new ResourceTemplate('rules://{scope}/{id}', {
      list: async () => {
        const scopeEntries = await getRuleScopeEntries();

        return {
          resources: scopeEntries.flatMap(([scope, ids]) => {
            return ids.map((id) => ({
              uri: `rules://${scope}/${id}`,
              name: `${scope}-${id}`,
              description: `Rules for ${scope} ${id}`,
              mimeType: 'text/markdown',
            }));
          }),
        };
      },
    }),
    {
      description: 'Rules for projects, groups, techs, and languages',
      mimeType: 'text/markdown',
    },
    async (uri, variables) => {
      // MCP variables may be string or string[] depending on URI parsing.
      const scope = typeof variables.scope === 'string' ? variables.scope : variables.scope?.[0];
      const id = typeof variables.id === 'string' ? variables.id : variables.id?.[0];
      if (!scope || !id) {
        throw new Error('Scope and id are required');
      }
      if (!isRuleScope(scope)) {
        throw new Error(`Invalid scope: ${scope}`);
      }

      const rules = await getMergedRules({ scope, id });

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
