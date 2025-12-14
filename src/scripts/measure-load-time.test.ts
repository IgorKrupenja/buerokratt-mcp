import { describe, expect, test } from 'bun:test';

import { formatTime } from './measure-load-time.ts';

describe('measure-load-time utilities', () => {
  describe('formatTime', () => {
    test('formats microseconds correctly', () => {
      expect(formatTime(0.001)).toBe('1.00 μs');
      expect(formatTime(0.5)).toBe('500.00 μs');
      expect(formatTime(0.999)).toBe('999.00 μs');
    });

    test('formats milliseconds correctly', () => {
      expect(formatTime(1)).toBe('1.00 ms');
      expect(formatTime(100)).toBe('100.00 ms');
      expect(formatTime(999)).toBe('999.00 ms');
    });

    test('formats seconds correctly', () => {
      expect(formatTime(1000)).toBe('1.00 s');
      expect(formatTime(2500)).toBe('2.50 s');
      expect(formatTime(10000)).toBe('10.00 s');
    });

    test('handles zero', () => {
      expect(formatTime(0)).toBe('0.00 μs');
    });

    test('handles very small values', () => {
      expect(formatTime(0.0001)).toBe('0.10 μs');
    });
  });
});
