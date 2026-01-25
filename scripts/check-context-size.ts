/**
 * Context Size Checker
 *
 * CLI tool to check the context size of merged rule sets
 * Helps ensure rules don't exceed safe token limits
 */

import { getAvailableScopeIds, getMergedRules } from '../src/rules/manager.ts';

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

const MODULE_THRESHOLDS = {
  safe: 50 * 1024, // 50 KB
  warning: 100 * 1024, // 100 KB
};

/**
 * Estimate tokens from bytes (rough approximation: ~4 chars per token)
 */
export function estimateTokens(bytes: number): number {
  return Math.round(bytes / 4);
}

/**
 * Format bytes to human-readable size
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Get status color and emoji for module size
 */
export function getModuleStatus(size: number): { color: string; emoji: string; label: string } {
  if (size >= MODULE_THRESHOLDS.warning) {
    return { color: colors.red, emoji: '🔴', label: 'RISK' };
  }
  if (size >= MODULE_THRESHOLDS.safe) {
    return { color: colors.yellow, emoji: '🟡', label: 'WARNING' };
  }
  return { color: colors.green, emoji: '🟢', label: 'OK' };
}

/**
 * Check merged project sizes
 */
async function checkProjectSizes(projectId?: string) {
  console.log(`${colors.bright}${colors.cyan}📦 Merged Project Sizes${colors.reset}\n`);

  const projects = projectId ? [projectId] : await getAvailableScopeIds('project');

  if (projects.length === 0) {
    console.log(`${colors.yellow}No projects found${colors.reset}\n`);
    return { hasWarnings: false, hasRisks: false };
  }

  let hasWarnings = false;
  let hasRisks = false;

  for (const project of projects) {
    try {
      const mergedRules = await getMergedRules({ scope: 'project', id: project });
      const size = new TextEncoder().encode(mergedRules).length;
      const tokens = estimateTokens(size);
      const status = getModuleStatus(size);

      if (status.label === 'RISK') {
        hasRisks = true;
      } else if (status.label === 'WARNING') {
        hasWarnings = true;
      }

      console.log(
        `${status.color}${status.emoji} ${status.label.padEnd(8)}${colors.reset} ` +
          `${formatSize(size).padEnd(10)} (~${tokens.toLocaleString()} tokens) ` +
          `${colors.bright}${project}${colors.reset}`,
      );
    } catch (error) {
      console.log(
        `${colors.red}❌ ERROR${colors.reset}   ${colors.bright}${project}${colors.reset} ` +
          `${colors.red}${error instanceof Error ? error.message : String(error)}${colors.reset}`,
      );
    }
  }

  console.log(
    `\n${colors.dim}Thresholds: ${colors.reset}` +
      `${colors.green}Safe < ${formatSize(MODULE_THRESHOLDS.safe)}${colors.reset}, ` +
      `${colors.yellow}Warning < ${formatSize(MODULE_THRESHOLDS.warning)}${colors.reset}, ` +
      `${colors.red}Risk >= ${formatSize(MODULE_THRESHOLDS.warning)}${colors.reset}\n`,
  );

  return { hasWarnings, hasRisks };
}

/**
 * Check merged tech sizes
 */
async function checkTechSizes(techId?: string) {
  console.log(`${colors.bright}${colors.cyan}🧩 Merged Tech Sizes${colors.reset}\n`);

  const techs = techId ? [techId] : await getAvailableScopeIds('tech');

  if (techs.length === 0) {
    console.log(`${colors.yellow}No techs found${colors.reset}\n`);
    return { hasWarnings: false, hasRisks: false };
  }

  let hasWarnings = false;
  let hasRisks = false;

  for (const tech of techs) {
    try {
      const mergedRules = await getMergedRules({ scope: 'tech', id: tech });
      const size = new TextEncoder().encode(mergedRules).length;
      const tokens = estimateTokens(size);
      const status = getModuleStatus(size);

      if (status.label === 'RISK') {
        hasRisks = true;
      } else if (status.label === 'WARNING') {
        hasWarnings = true;
      }

      console.log(
        `${status.color}${status.emoji} ${status.label.padEnd(8)}${colors.reset} ` +
          `${formatSize(size).padEnd(10)} (~${tokens.toLocaleString()} tokens) ` +
          `${colors.bright}${tech}${colors.reset}`,
      );
    } catch (error) {
      console.log(
        `${colors.red}❌ ERROR${colors.reset}   ${colors.bright}${tech}${colors.reset} ` +
          `${colors.red}${error instanceof Error ? error.message : String(error)}${colors.reset}`,
      );
    }
  }

  console.log(
    `\n${colors.dim}Thresholds: ${colors.reset}` +
      `${colors.green}Safe < ${formatSize(MODULE_THRESHOLDS.safe)}${colors.reset}, ` +
      `${colors.yellow}Warning < ${formatSize(MODULE_THRESHOLDS.warning)}${colors.reset}, ` +
      `${colors.red}Risk >= ${formatSize(MODULE_THRESHOLDS.warning)}${colors.reset}\n`,
  );

  return { hasWarnings, hasRisks };
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const projectId = args[0];
  const techId = args[1];

  console.log(`${colors.bright}${colors.blue}🔍 MCP Rules Context Size Checker${colors.reset}\n`);

  // Check project sizes
  const projectResults = await checkProjectSizes(projectId);
  console.log('');

  // Check tech sizes
  const techResults = await checkTechSizes(techId);
  console.log('');

  // Summary
  const hasWarnings = projectResults.hasWarnings || techResults.hasWarnings;
  const hasRisks = projectResults.hasRisks || techResults.hasRisks;

  if (hasRisks) {
    console.log(`${colors.red}${colors.bright}⚠️  Summary: Some projects/techs exceed safe limits!${colors.reset}\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(
      `${colors.yellow}${colors.bright}⚠️  Summary: Some projects/techs are approaching limits${colors.reset}\n`,
    );
    process.exit(1);
  } else {
    console.log(
      `${colors.green}${colors.bright}✅ Summary: All projects/techs are within safe limits${colors.reset}\n`,
    );
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.main) {
  main().catch((error) => {
    console.error(`${colors.red}Error: ${error instanceof Error ? error.message : String(error)}${colors.reset}`);
    process.exit(1);
  });
}
