/**
 * Performance Measurement Script
 *
 * Measures how long it takes to load rules to help decide if caching is needed
 */

import { loadAllRules } from '@/utils/rules.ts';

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

  const iterations = 10;
  const measurements: number[] = [];

  // Warm up (first load might be slower due to file system caching)
  console.log(`${colors.dim}Warming up...${colors.reset}`);
  await loadAllRules();

  // Measure multiple iterations
  console.log(`${colors.cyan}Running ${iterations} iterations...${colors.reset}\n`);

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await loadAllRules();
    const end = performance.now();
    const duration = end - start;
    measurements.push(duration);
    console.log(`  Iteration ${i + 1}: ${formatTime(duration)}`);
  }

  // Calculate statistics
  const sorted = [...measurements].sort((a, b) => a - b);
  const min = sorted[0]!; // Safe: measurements array is never empty
  const max = sorted[sorted.length - 1]!; // Safe: measurements array is never empty
  const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  const median = sorted[Math.floor(sorted.length / 2)]!; // Safe: measurements array is never empty

  console.log(`\n${colors.bright}Statistics:${colors.reset}`);
  console.log(`  Min:     ${formatTime(min)}`);
  console.log(`  Max:     ${formatTime(max)}`);
  console.log(`  Average: ${formatTime(avg)}`);
  console.log(`  Median:  ${formatTime(median)}`);

  console.log('');
}

// Run if executed directly
if (import.meta.main) {
  measurePerformance().catch((error) => {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
