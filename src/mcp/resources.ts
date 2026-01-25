/**
 * MCP Resource Handlers
 *
 * Handles resource-related requests (listing and reading rules)
 */

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import mime from 'mime-types';

import { getAvailableScopeIds, getMergedRules } from '../rules/manager.ts';
import type { RuleScope } from '../rules/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const RULES_DIR = join(__dirname, '../../rules');

export async function findScriptFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findScriptFiles(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      const mimeType = mime.lookup(entry.name);
      if (mimeType) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

export async function loadScriptResources(): Promise<Record<string, { path: string; mimeType: string }>> {
  const files = await findScriptFiles(RULES_DIR);
  const resources: Record<string, { path: string; mimeType: string }> = {};

  for (const filePath of files) {
    const resourcePath = relative(RULES_DIR, filePath).split('\\').join('/');
    resources[resourcePath] = {
      path: filePath,
      mimeType: mime.lookup(filePath) || 'application/octet-stream',
    };
  }

  return resources;
}

/**
 * Set up resource handlers for the MCP server
 */
export function setupResources(server: McpServer): void {
  // Register resource template for bundled assets
  server.registerResource(
    'asset-files',
    new ResourceTemplate('rules://assets/{name}', {
      list: async () => {
        const resources = await loadScriptResources();
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
      const name = typeof variables.name === 'string' ? variables.name : variables.name?.[0];
      if (!name) {
        throw new Error('Asset name is required');
      }

      const scriptResources = await loadScriptResources();
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
