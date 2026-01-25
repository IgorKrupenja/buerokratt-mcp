/**
 * Performance Measurement Script
 *
 * Measures how long it takes to load rules to help decide if caching is needed
 */

import { getAvailableScopeIds, getMergedRules } from '../src/rules/manager.ts';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

/**
 * Format milliseconds to human-readable time
 */
export function formatTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)} μs`;
  }
  if (ms < 1000) {
    return `${ms.toFixed(2)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Measure performance
 */
async function measurePerformance() {
  console.log(`${colors.bright}${colors.blue}⏱️  Measuring Rule Loading Performance${colors.reset}\n`);

  // Measure project-specific operations
  console.log(`\n${colors.cyan}Measuring project-specific operations...${colors.reset}\n`);

  const projects = await getAvailableScopeIds('project');
  for (const project of projects) {
    const start = performance.now();
    await getMergedRules({ scope: 'project', id: project });
    const end = performance.now();
    const duration = end - start;
    console.log(`  ${project}: ${formatTime(duration)}`);
  }

  // Measure tech-specific operations
  console.log(`\n${colors.cyan}Measuring tech-specific operations...${colors.reset}\n`);

  const techs = await getAvailableScopeIds('tech');
  for (const tech of techs) {
    const start = performance.now();
    await getMergedRules({ scope: 'tech', id: tech });
    const end = performance.now();
    const duration = end - start;
    console.log(`  ${tech}: ${formatTime(duration)}`);
  }

  console.log('');
}

// Run if executed directly
if (import.meta.main) {
  measurePerformance().catch((error) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
