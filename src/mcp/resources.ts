/**
 * MCP Resource Handlers
 *
 * Handles resource-related requests (listing and reading rules)
 */

import { readFile } from 'node:fs/promises';

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getAvailableAssets } from '../utils/assets.ts';
import type { RuleScope } from '../utils/types.ts';

import { getAvailableScopeIds } from '@/utils/manifest.ts';
import { buildRuleResources, getMergedRules } from '@/utils/rules.ts';

/**
 * Set up resource handlers for the MCP server
 */
export function setupResources(server: McpServer): void {
  // Register resource template for bundled assets
  server.registerResource(
    'assets',
    // todo, assets NOT rules! - also fix sync script example
    new ResourceTemplate('rules://assets/{name}', {
      list: async () => {
        const resources = await getAvailableAssets();
        return {
          resources: Object.entries(resources).map(([name, { mimeType }]) => ({
            uri: `rules://assets/${name}`,
            name,
            description: `Bundled asset ${name}`,
            mimeType,
          })),
        };
      },
    }),
    {
      description: 'Bundled helper assets',
      mimeType: 'application/octet-stream',
    },
    async (uri, variables) => {
      // MCP variables may be string or string[] depending on URI parsing.
      const name = typeof variables.name === 'string' ? variables.name : variables.name?.[0];
      if (!name) {
        throw new Error('Asset name is required');
      }

      const scriptResources = await getAvailableAssets();
      const scriptResource = scriptResources[name];
      if (!scriptResource) {
        throw new Error(`Unknown asset: ${name}`);
      }

      const scriptContent = await readFile(scriptResource.path, 'utf-8');

      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: scriptResource.mimeType,
            text: scriptContent,
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
        // todo likely to helper util - but check if need method at all
        const scopes: RuleScope[] = ['project', 'group', 'tech', 'language'];
        const scopeEntries = await Promise.all(
          scopes.map(async (scope) => [scope, await getAvailableScopeIds(scope)] as const),
        );
        const resources = scopeEntries.flatMap(([scope, ids]) => buildRuleResources(scope, ids));

        return {
          resources,
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
