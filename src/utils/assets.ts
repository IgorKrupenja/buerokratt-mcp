/**
 * Asset Loader
 *
 * Scans rule assets and resolves MIME types.
 */

import { readFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import mime from 'mime-types';

import { findFilesByType } from './files.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RULES_DIR = join(__dirname, '../../rules');

export async function getAvailableAssets(): Promise<Record<string, { path: string; mimeType: string }>> {
  const files = await findFilesByType(RULES_DIR, 'non-markdown');
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

export async function loadAsset(name: string): Promise<{ content: string; mimeType: string }> {
  const assets = await getAvailableAssets();
  const asset = assets[name];
  if (!asset) {
    throw new Error(`Unknown asset: ${name}`);
  }

  return {
    content: await readFile(asset.path, 'utf-8'),
    mimeType: asset.mimeType,
  };
}
