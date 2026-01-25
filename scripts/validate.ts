/**
 * Rule Validator CLI
 *
 * CLI tool to validate rule files (frontmatter and markdown)
 */

import { readFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { lint } from 'markdownlint/promise';

import { loadAllRules } from '../src/utils/loader.ts';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MARKDOWNLINT_CONFIG_PATH = join(__dirname, '../.markdownlint.json');
let markdownlintConfig: Record<string, any> | undefined;

async function loadMarkdownlintConfig(): Promise<Record<string, any> | undefined> {
  if (markdownlintConfig !== undefined) {
    return markdownlintConfig;
  }

  try {
    const configContent = await readFile(MARKDOWNLINT_CONFIG_PATH, 'utf-8');
    markdownlintConfig = JSON.parse(configContent);
    return markdownlintConfig;
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

  if (!frontmatter.appliesTo) {
    errors.push(`Missing 'appliesTo' field in ${filePath}`);
    return { valid: false, errors };
  }

  if (typeof frontmatter.appliesTo !== 'object') {
    errors.push(`'appliesTo' field must be an object in ${filePath}`);
    return { valid: false, errors };
  }

  const appliesTo = frontmatter.appliesTo;
  const appliesToKeys = ['projects', 'groups', 'techs', 'languages'] as const;
  const hasAnyValues = appliesToKeys.some((key) => Array.isArray(appliesTo[key]) && appliesTo[key].length > 0);

  if (!hasAnyValues) {
    errors.push(`'appliesTo' must include at least one non-empty scope array in ${filePath}`);
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
