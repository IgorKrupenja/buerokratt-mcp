/**
 * Rule Validator CLI
 *
 * CLI tool to validate rule files (frontmatter and markdown)
 */

import { lint } from 'markdownlint/promise';

import { loadAllRules } from '../rules/loader.ts';
import type { ValidationResult } from '../rules/types.ts';

// Special module names that don't correspond to repositories
const SPECIAL_MODULES = new Set(['global', 'shared-backend', 'shared-frontend']);

interface GitHubRepository {
  name: string;
  full_name: string;
}

const MARKDOWNLINT_CONFIG_PATH = `${import.meta.dir}/../../.markdownlint.json`;
let markdownlintConfig: Record<string, any> | undefined;

async function loadMarkdownlintConfig(): Promise<Record<string, any> | undefined> {
  if (markdownlintConfig !== undefined) {
    return markdownlintConfig;
  }

  try {
    const configFile = Bun.file(MARKDOWNLINT_CONFIG_PATH);
    if (await configFile.exists()) {
      markdownlintConfig = await configFile.json();
      return markdownlintConfig;
    }
  } catch (error) {
    console.warn(
      `Warning: Could not load markdownlint config: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  markdownlintConfig = undefined;
  return undefined;
}

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

/**
 * Validate frontmatter structure (Level 1)
 */
export function validateFrontmatter(frontmatter: any, filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!frontmatter.modules) {
    errors.push(`Missing 'modules' field in ${filePath}`);
    return { valid: false, errors };
  }

  if (!Array.isArray(frontmatter.modules)) {
    errors.push(`'modules' field must be an array in ${filePath}`);
    return { valid: false, errors };
  }

  if (frontmatter.modules.length === 0) {
    errors.push(`'modules' array cannot be empty in ${filePath}`);
    return { valid: false, errors };
  }

  if (frontmatter.tags && !Array.isArray(frontmatter.tags)) {
    warnings.push(`'tags' field should be an array in ${filePath}`);
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Fetch all repositories from the buerokratt GitHub organization
 */
async function fetchGitHubRepositories(org: string, token?: string): Promise<string[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'buerokratt-mcp-validator',
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
 * Validate module names against GitHub repositories
 */
export async function validateModuleNames(
  allRules: Awaited<ReturnType<typeof loadAllRules>>,
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const org = 'buerokratt';
  const githubToken = process.env.GITHUB_TOKEN;

  // Extract module names from rule files
  const moduleNames = new Set<string>();
  for (const rule of allRules) {
    for (const module of rule.frontmatter.modules) {
      moduleNames.add(module);
    }
  }

  const repositoryModuleNames = Array.from(moduleNames).filter((name) => !SPECIAL_MODULES.has(name));

  if (repositoryModuleNames.length === 0) {
    return { valid: true };
  }

  try {
    // Fetch repositories from GitHub
    const repositories = await fetchGitHubRepositories(org, githubToken);

    // Validate module names
    for (const moduleName of repositoryModuleNames) {
      if (!repositories.includes(moduleName)) {
        errors.push(`Module name "${moduleName}" does not match any repository in GitHub organization "${org}"`);
      }
    }
  } catch (error) {
    // If GitHub API fails, warn but don't fail validation (network issues shouldn't block local development)
    warnings.push(
      `Could not validate module names against GitHub: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate markdown content (Level 2)
 *
 * Uses markdownlint to validate markdown syntax and structure.
 */
export async function validateMarkdown(content: string, filePath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (content.trim().length === 0) {
    warnings.push(`Empty content in ${filePath}`);
  }

  try {
    const config = await loadMarkdownlintConfig();
    const results = await lint({
      strings: {
        [filePath]: content,
      },
      config: config || undefined,
    });

    // Convert markdownlint results to our format
    for (const [file, issues] of Object.entries(results)) {
      for (const issue of issues) {
        const ruleName = issue.ruleNames.join('/');
        const detail = issue.errorDetail && typeof issue.errorDetail === 'string' ? ` - ${issue.errorDetail}` : '';
        const context =
          issue.errorContext && typeof issue.errorContext === 'string' ? ` Context: "${issue.errorContext}"` : '';
        const message = `${file}:${issue.lineNumber}: ${ruleName} ${issue.ruleDescription}${detail}${context}`;

        warnings.push(message);
      }
    }
  } catch (error) {
    errors.push(
      `Markdown validation failed for ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Main validation function
 */
async function main() {
  console.log(`${colors.bright}${colors.blue}🔍 Validating Rule Files${colors.reset}\n`);

  try {
    const allRules = await loadAllRules();
    let totalErrors = 0;
    let totalWarnings = 0;
    let validFiles = 0;

    for (const rule of allRules) {
      const relativePath = rule.path.replace(/^.*\/rules\//, 'rules/');
      console.log(`${colors.cyan}Checking ${relativePath}...${colors.reset}`);

      const frontmatterResult = validateFrontmatter(rule.frontmatter, relativePath);

      const markdownResult = await validateMarkdown(rule.content, relativePath);

      const errors = [...(frontmatterResult.errors || []), ...(markdownResult.errors || [])];
      const warnings = [...(frontmatterResult.warnings || []), ...(markdownResult.warnings || [])];

      if (errors.length > 0) {
        totalErrors += errors.length;
        console.log(`${colors.red}  ❌ ${errors.length} error(s)${colors.reset}`);
        for (const error of errors) {
          console.log(`${colors.red}    • ${error}${colors.reset}`);
        }
      }

      if (warnings.length > 0) {
        totalWarnings += warnings.length;
        console.log(`${colors.yellow}  ⚠️  ${warnings.length} warning(s)${colors.reset}`);
        for (const warning of warnings) {
          console.log(`${colors.yellow}    • ${warning}${colors.reset}`);
        }
      }

      if (errors.length === 0 && warnings.length === 0) {
        validFiles++;
        console.log(`${colors.green}  ✅ Valid${colors.reset}`);
      }

      console.log('');
    }

    // Validate module names against GitHub repositories
    console.log(`${colors.cyan}Validating module names against GitHub repositories...${colors.reset}`);
    const moduleNameResult = await validateModuleNames(allRules);

    if (moduleNameResult.errors && moduleNameResult.errors.length > 0) {
      totalErrors += moduleNameResult.errors.length;
      console.log(`${colors.red}  ❌ ${moduleNameResult.errors.length} error(s)${colors.reset}`);
      for (const error of moduleNameResult.errors) {
        console.log(`${colors.red}    • ${error}${colors.reset}`);
      }
    }

    if (moduleNameResult.warnings && moduleNameResult.warnings.length > 0) {
      totalWarnings += moduleNameResult.warnings.length;
      console.log(`${colors.yellow}  ⚠️  ${moduleNameResult.warnings.length} warning(s)${colors.reset}`);
      for (const warning of moduleNameResult.warnings) {
        console.log(`${colors.yellow}    • ${warning}${colors.reset}`);
      }
    }

    if (moduleNameResult.errors?.length === 0 && moduleNameResult.warnings?.length === 0) {
      console.log(`${colors.green}  ✅ All module names are valid${colors.reset}`);
    }
    console.log('');

    // Summary
    console.log(`${colors.bright}${colors.blue}Summary${colors.reset}\n`);
    console.log(`  Total files: ${allRules.length}`);
    console.log(`  ${colors.green}✅ Valid: ${validFiles}${colors.reset}`);
    if (totalWarnings > 0) {
      console.log(`  ${colors.yellow}⚠️  Warnings: ${totalWarnings}${colors.reset}`);
    }
    if (totalErrors > 0) {
      console.log(`  ${colors.red}❌ Errors: ${totalErrors}${colors.reset}`);
    }
    console.log('');

    // Exit with appropriate code
    if (totalErrors > 0) {
      console.log(`${colors.red}${colors.bright}❌ Validation failed with ${totalErrors} error(s)${colors.reset}\n`);
      process.exit(1);
    } else if (totalWarnings > 0) {
      console.log(
        `${colors.yellow}${colors.bright}⚠️  Validation passed with ${totalWarnings} warning(s)${colors.reset}\n`,
      );
      process.exit(0);
    } else {
      console.log(`${colors.green}${colors.bright}✅ All files are valid${colors.reset}\n`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`${colors.red}Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error(`${colors.red}Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    process.exit(1);
  });
}
