/**
 * Rules Manifest Loader
 *
 * Loads project/group/tech/language relationships from rules/manifest.yml
 */

import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse as parseYaml } from 'yaml';

import type { RulesManifest } from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MANIFEST_PATH = join(__dirname, '../../rules/manifest.yml');

function normalizeManifest(input: unknown): RulesManifest {
  if (!input || typeof input !== 'object') {
    return {};
  }

  const manifest = input as RulesManifest;

  return {
    version: typeof manifest.version === 'number' ? manifest.version : undefined,
    languages: manifest.languages ?? undefined,
    techs: manifest.techs ?? undefined,
    groups: manifest.groups ?? undefined,
    projects: manifest.projects ?? undefined,
  };
}

export async function loadRulesManifest(): Promise<RulesManifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, 'utf-8');
    const parsed = parseYaml(raw);
    return normalizeManifest(parsed);
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as any).code === 'ENOENT') {
      return {};
    }
    throw new Error(`Failed to load rules manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}
