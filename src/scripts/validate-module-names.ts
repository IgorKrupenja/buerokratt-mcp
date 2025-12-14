/**
 * Module Name Validator
 *
 * Validates that module names in rule files match actual GitHub repositories
 * in the buerokratt organization.
 */

import { loadAllRules } from '../rules/loader.ts';

// Special module names that don't correspond to repositories
const SPECIAL_MODULES = new Set(['global', 'shared-backend', 'shared-frontend']);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface GitHubRepository {
  name: string;
  full_name: string;
}

/**
 * Fetch all repositories from the buerokratt GitHub organization
 */
async function fetchGitHubRepositories(org: string, token?: string): Promise<string[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'byrokratt-mcp-validator',
  };

  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const repositories: string[] = [];
  let page = 1;
  const perPage = 100;

  try {
    while (true) {
      const url = `https://api.github.com/orgs/${org}/repos?per_page=${perPage}&page=${page}&type=all`;
      const response = await fetch(url, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Organization "${org}" not found on GitHub`);
        }
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
          if (rateLimitRemaining === '0') {
            throw new Error(
              'GitHub API rate limit exceeded. Set GITHUB_TOKEN environment variable to increase rate limits.',
            );
          }
          throw new Error(`GitHub API access forbidden: ${response.statusText}`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data = (await response.json()) as GitHubRepository[];

      if (data.length === 0) {
        break;
      }

      repositories.push(...data.map((repo) => repo.name));
      page++;

      // If we got fewer than perPage results, we've reached the last page
      if (data.length < perPage) {
        break;
      }
    }

    return repositories;
  } catch (error) {
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error(
        `Failed to fetch repositories from GitHub. Check your network connection. Error: ${error.message}`,
      );
    }
    throw error;
  }
}

/**
 * Extract all module names from rule files
 */
async function extractModuleNames(): Promise<Set<string>> {
  const allRules = await loadAllRules();
  const moduleNames = new Set<string>();

  for (const rule of allRules) {
    for (const module of rule.frontmatter.modules) {
      moduleNames.add(module);
    }
  }

  return moduleNames;
}

/**
 * Main validation function
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}🔍 Validating Module Names Against GitHub Repositories${colors.reset}\n`);

  const org = 'buerokratt';
  const githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    console.log(
      `${colors.yellow}⚠️  GITHUB_TOKEN not set. Using unauthenticated requests (rate limit: 60/hour).${colors.reset}`,
    );
    console.log(
      `${colors.dim}   Set GITHUB_TOKEN environment variable for higher rate limits (5000/hour).${colors.reset}\n`,
    );
  }

  try {
    // Extract module names from rule files
    console.log(`${colors.cyan}Loading module names from rule files...${colors.reset}`);
    const moduleNames = await extractModuleNames();
    const repositoryModuleNames = Array.from(moduleNames).filter((name) => !SPECIAL_MODULES.has(name));

    if (repositoryModuleNames.length === 0) {
      console.log(`${colors.green}✅ No repository module names found to validate${colors.reset}\n`);
      return;
    }

    console.log(`${colors.green}Found ${repositoryModuleNames.length} module name(s) to validate:${colors.reset}`);
    for (const name of repositoryModuleNames.sort()) {
      console.log(`${colors.dim}  • ${name}${colors.reset}`);
    }
    console.log('');

    // Fetch repositories from GitHub
    console.log(`${colors.cyan}Fetching repositories from GitHub organization "${org}"...${colors.reset}`);
    const repositories = await fetchGitHubRepositories(org, githubToken);
    console.log(`${colors.green}Found ${repositories.length} repository(ies)${colors.reset}\n`);

    // Validate module names
    const invalidModules: string[] = [];
    const validModules: string[] = [];

    for (const moduleName of repositoryModuleNames) {
      if (repositories.includes(moduleName)) {
        validModules.push(moduleName);
      } else {
        invalidModules.push(moduleName);
      }
    }

    // Report results
    console.log(`${colors.bright}${colors.blue}Validation Results${colors.reset}\n`);

    if (validModules.length > 0) {
      console.log(`${colors.green}✅ Valid module names (${validModules.length}):${colors.reset}`);
      for (const name of validModules.sort()) {
        console.log(`${colors.green}  • ${name}${colors.reset}`);
      }
      console.log('');
    }

    if (invalidModules.length > 0) {
      console.log(`${colors.red}❌ Invalid module names (${invalidModules.length}):${colors.reset}`);
      for (const name of invalidModules.sort()) {
        console.log(`${colors.red}  • ${name}${colors.reset}`);
        console.log(`${colors.dim}    → Repository "${name}" not found in GitHub organization "${org}"${colors.reset}`);
      }
      console.log('');
      console.log(
        `${colors.red}${colors.bright}❌ Validation failed: ${invalidModules.length} module name(s) do not match GitHub repositories${colors.reset}\n`,
      );
      process.exit(1);
    }

    console.log(
      `${colors.green}${colors.bright}✅ All module names are valid and match GitHub repositories${colors.reset}\n`,
    );
    process.exit(0);
  } catch (error) {
    console.error(
      `${colors.red}${colors.bright}❌ Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`,
    );
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error(
      `${colors.red}${colors.bright}❌ Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`,
    );
    process.exit(1);
  });
}
