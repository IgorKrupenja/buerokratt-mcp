import { describe, expect, it } from 'vitest';

import { estimateTokens, formatSize, getFileStatus, getModuleStatus } from './check-context-size.ts';

describe('check-context-size utilities', () => {
  // Test estimateTokens
  it('estimateTokens calculates tokens correctly', () => {
    // ~4 chars per token
    expect(estimateTokens(400)).toBe(100);
    expect(estimateTokens(1000)).toBe(250);
    expect(estimateTokens(0)).toBe(0);
  });

  // Test formatSize
  it('formatSize formats bytes correctly', () => {
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(512)).toBe('512 B');
    expect(formatSize(1024)).toBe('1.00 KB');
    expect(formatSize(2048)).toBe('2.00 KB');
    expect(formatSize(1024 * 1024)).toBe('1.00 MB');
    expect(formatSize(2.5 * 1024 * 1024)).toBe('2.50 MB');
  });

  // Test getFileStatus
  it('getFileStatus returns correct status for file sizes', () => {
    const safe = getFileStatus(5 * 1024); // 5 KB
    expect(safe.label).toBe('OK');
    expect(safe.emoji).toBe('🟢');

    const warning = getFileStatus(15 * 1024); // 15 KB
    expect(warning.label).toBe('WARNING');
    expect(warning.emoji).toBe('🟡');

    const risk = getFileStatus(25 * 1024); // 25 KB
    expect(risk.label).toBe('RISK');
    expect(risk.emoji).toBe('🔴');
  });

  // Test getModuleStatus
  it('getModuleStatus returns correct status for module sizes', () => {
    const safe = getModuleStatus(30 * 1024); // 30 KB
    expect(safe.label).toBe('OK');
    expect(safe.emoji).toBe('🟢');

    const warning = getModuleStatus(75 * 1024); // 75 KB
    expect(warning.label).toBe('WARNING');
    expect(warning.emoji).toBe('🟡');

    const risk = getModuleStatus(150 * 1024); // 150 KB
    expect(risk.label).toBe('RISK');
    expect(risk.emoji).toBe('🔴');
  });
});
