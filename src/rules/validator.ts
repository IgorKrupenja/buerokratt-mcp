/**
 * Rule Validator
 *
 * Validates rule files (Level 1: Frontmatter, Level 2: Markdown)
 */

import type { RuleFile, ValidationResult } from './types.ts';
import { moduleExists } from '../config/modules.ts';
import { lint } from 'markdownlint/promise';

/**
 * Validate frontmatter structure (Level 1)
 */
export function validateFrontmatter(frontmatter: any, filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if modules field exists and is an array
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

  // Validate module names exist in registry
  for (const moduleName of frontmatter.modules) {
    if (moduleName !== 'global' && !moduleExists(moduleName)) {
      warnings.push(`Unknown module '${moduleName}' in ${filePath} (not in module registry)`);
    }
  }

  // Validate tags if present
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

  // Basic checks
  if (content.trim().length === 0) {
    warnings.push(`Empty content in ${filePath}`);
  }

  // Use markdownlint to validate markdown syntax
  try {
    const results = await lint({
      strings: {
        [filePath]: content,
      },
    });

    // Convert markdownlint results to our format
    for (const [file, issues] of Object.entries(results)) {
      for (const issue of issues) {
        const ruleName = issue.ruleNames.join('/');
        const detail = issue.errorDetail ? ` - ${issue.errorDetail}` : '';
        const context = issue.errorContext ? ` Context: "${issue.errorContext}"` : '';
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
 * Validate a complete rule file
 */
export async function validateRuleFile(rule: RuleFile): Promise<ValidationResult> {
  const frontmatterResult = validateFrontmatter(rule.frontmatter, rule.path);
  const markdownResult = await validateMarkdown(rule.content, rule.path);

  const errors = [...(frontmatterResult.errors || []), ...(markdownResult.errors || [])];
  const warnings = [...(frontmatterResult.warnings || []), ...(markdownResult.warnings || [])];

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
