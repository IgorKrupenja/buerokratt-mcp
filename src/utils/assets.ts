/**
 * Asset Loader
 *
 * Scans rule assets and resolves MIME types.
 */

import { readdir } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import mime from 'mime-types';

import type { RuleScope } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES_DIR = join(__dirname, '../../rules');

export function buildScopeResources(scope: RuleScope, ids: string[]) {
  return ids.map((id) => ({
    uri: `rules://${scope}/${id}`,
    name: `${scope}-${id}`,
    description: `Rules for ${scope} ${id}`,
    mimeType: 'text/markdown',
  }));
}

export async function findAssetFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await findAssetFiles(fullPath)));
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

export async function getAvailableAssets(): Promise<Record<string, { path: string; mimeType: string }>> {
  const files = await findAssetFiles(RULES_DIR);
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
