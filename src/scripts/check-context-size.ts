/**
 * Context Size Checker
 *
 * CLI tool to check the context size of rule files and modules
 * Helps ensure rules don't exceed safe token limits
 */

import { loadAllRules } from '../rules/loader.ts';
import { getAvailableModules, getMergedRules } from '../rules/manager.ts';

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

// Size thresholds (in bytes)
const FILE_THRESHOLDS = {
  safe: 10 * 1024, // 10 KB
  warning: 20 * 1024, // 20 KB
};

const MODULE_THRESHOLDS = {
  safe: 50 * 1024, // 50 KB
  warning: 100 * 1024, // 100 KB
};

/**
 * Estimate tokens from bytes (rough approximation: ~4 chars per token)
 */
function estimateTokens(bytes: number): number {
  return Math.round(bytes / 4);
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Get status color and emoji for file size
 */
function getFileStatus(size: number): { color: string; emoji: string; label: string } {
  if (size >= FILE_THRESHOLDS.warning) {
    return { color: colors.red, emoji: '🔴', label: 'RISK' };
  }
  if (size >= FILE_THRESHOLDS.safe) {
    return { color: colors.yellow, emoji: '🟡', label: 'WARNING' };
  }
  return { color: colors.green, emoji: '🟢', label: 'OK' };
}

/**
 * Get status color and emoji for module size
 */
function getModuleStatus(size: number): { color: string; emoji: string; label: string } {
  if (size >= MODULE_THRESHOLDS.warning) {
    return { color: colors.red, emoji: '🔴', label: 'RISK' };
  }
  if (size >= MODULE_THRESHOLDS.safe) {
    return { color: colors.yellow, emoji: '🟡', label: 'WARNING' };
  }
  return { color: colors.green, emoji: '🟢', label: 'OK' };
}

/**
 * Check individual file sizes
 */
async function checkFileSizes() {
  console.log(`${colors.bright}${colors.cyan}📄 Individual File Sizes${colors.reset}\n`);

  const allRules = await loadAllRules();
  const files = allRules.map((rule) => ({
    path: rule.path.replace(/^.*\/rules\//, 'rules/'),
    size: new TextEncoder().encode(rule.raw).length,
    modules: rule.frontmatter.modules.join(', '),
  }));

  files.sort((a, b) => b.size - a.size);

  let hasWarnings = false;
  let hasRisks = false;

  for (const file of files) {
    const status = getFileStatus(file.size);
    const tokens = estimateTokens(file.size);

    if (status.label === 'RISK') {
      hasRisks = true;
    } else if (status.label === 'WARNING') {
      hasWarnings = true;
    }

    console.log(
      `${status.color}${status.emoji} ${status.label.padEnd(8)}${colors.reset} ` +
        `${formatSize(file.size).padEnd(10)} (~${tokens.toLocaleString()} tokens) ` +
        `${colors.dim}${file.path}${colors.reset}`,
    );
    console.log(`${colors.dim}    Modules: ${file.modules}${colors.reset}\n`);
  }

  console.log(
    `${colors.dim}Thresholds: ${colors.reset}` +
      `${colors.green}Safe < ${formatSize(FILE_THRESHOLDS.safe)}${colors.reset}, ` +
      `${colors.yellow}Warning < ${formatSize(FILE_THRESHOLDS.warning)}${colors.reset}, ` +
      `${colors.red}Risk >= ${formatSize(FILE_THRESHOLDS.warning)}${colors.reset}\n`,
  );

  return { hasWarnings, hasRisks };
}

/**
 * Check merged module sizes
 */
async function checkModuleSizes(moduleName?: string) {
  console.log(`${colors.bright}${colors.cyan}📦 Merged Module Sizes${colors.reset}\n`);

  const modules = moduleName ? [moduleName] : await getAvailableModules();

  if (modules.length === 0) {
    console.log(`${colors.yellow}No modules found${colors.reset}\n`);
    return { hasWarnings: false, hasRisks: false };
  }

  let hasWarnings = false;
  let hasRisks = false;

  for (const module of modules) {
    try {
      const mergedRules = await getMergedRules(module);
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
          `${colors.bright}${module}${colors.reset}`,
      );
    } catch (error) {
      console.log(
        `${colors.red}❌ ERROR${colors.reset}   ${colors.bright}${module}${colors.reset} ` +
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
  const moduleName = args[0];

  console.log(`${colors.bright}${colors.blue}🔍 MCP Rules Context Size Checker${colors.reset}\n`);

  // Check individual files
  const fileResults = await checkFileSizes();
  console.log('');

  // Check module sizes
  const moduleResults = await checkModuleSizes(moduleName);
  console.log('');

  // Summary
  const hasWarnings = fileResults.hasWarnings || moduleResults.hasWarnings;
  const hasRisks = fileResults.hasRisks || moduleResults.hasRisks;

  if (hasRisks) {
    console.log(`${colors.red}${colors.bright}⚠️  Summary: Some files/modules exceed safe limits!${colors.reset}\n`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(
      `${colors.yellow}${colors.bright}⚠️  Summary: Some files/modules are approaching limits${colors.reset}\n`,
    );
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}✅ Summary: All files/modules are within safe limits${colors.reset}\n`);
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
