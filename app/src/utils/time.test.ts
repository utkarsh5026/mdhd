import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  formatDateKey,
  formatRelativeTime,
  formatTimeAgo,
  formatTimeInMs,
  getMonthName,
  getStartDate,
} from './time';

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Never" for null', () => {
    expect(formatRelativeTime(null)).toBe('Never');
  });

  it('returns "Never" for 0', () => {
    expect(formatRelativeTime(0)).toBe('Never');
  });

  it('returns "Today" for a timestamp from today', () => {
    expect(formatRelativeTime(Date.now())).toBe('Today');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const yesterday = new Date('2026-03-19T12:00:00Z').getTime();
    expect(formatRelativeTime(yesterday)).toBe('Yesterday');
  });

  it('returns "X days ago" for 2-6 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const threeDaysAgo = new Date('2026-03-17T12:00:00Z').getTime();
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns "X weeks ago" for 7-29 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const twoWeeksAgo = new Date('2026-03-06T12:00:00Z').getTime();
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('returns "X months ago" for 30-364 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const twoMonthsAgo = new Date('2026-01-10T12:00:00Z').getTime();
    expect(formatRelativeTime(twoMonthsAgo)).toBe('2 months ago');
  });

  it('returns "X years ago" for 365+ days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const twoYearsAgo = new Date('2024-01-01T12:00:00Z').getTime();
    expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');
  });
});

describe('getMonthName', () => {
  it('returns correct month names for 0-11', () => {
    expect(getMonthName(0)).toBe('January');
    expect(getMonthName(5)).toBe('June');
    expect(getMonthName(11)).toBe('December');
  });
});

describe('getStartDate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('"today" returns midnight of current day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T15:30:00Z'));
    const start = getStartDate('today');
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);
    expect(start.getSeconds()).toBe(0);
  });

  it('"week" returns the Sunday of current week', () => {
    vi.useFakeTimers();
    // March 20 2026 is a Friday (day = 5)
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const start = getStartDate('week');
    expect(start.getDay()).toBe(0); // Sunday
  });

  it('"month" returns the 1st of current month', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const start = getStartDate('month');
    expect(start.getDate()).toBe(1);
    expect(start.getMonth()).toBe(2); // March = 2
  });

  it('"quarter" returns first day of current quarter', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const start = getStartDate('quarter');
    expect(start.getMonth()).toBe(0); // Q1 starts January
    expect(start.getDate()).toBe(1);
  });

  it('"year" returns Jan 1 of current year', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-20T12:00:00Z'));
    const start = getStartDate('year');
    expect(start.getMonth()).toBe(0);
    expect(start.getDate()).toBe(1);
    expect(start.getFullYear()).toBe(2026);
  });

  it('"all" returns epoch', () => {
    const start = getStartDate('all');
    expect(start.getTime()).toBe(0);
  });
});

describe('formatTimeAgo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for < 60 seconds', () => {
    expect(formatTimeAgo(Date.now() - 30_000)).toBe('just now');
  });

  it('returns singular "1 minute ago"', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    expect(formatTimeAgo(now - 60_000)).toBe('1 minute ago');
  });

  it('returns plural "5 minutes ago"', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    expect(formatTimeAgo(now - 5 * 60_000)).toBe('5 minutes ago');
  });

  it('returns "1 hour ago"', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    expect(formatTimeAgo(now - 3_600_000)).toBe('1 hour ago');
  });

  it('returns "3 hours ago"', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    expect(formatTimeAgo(now - 3 * 3_600_000)).toBe('3 hours ago');
  });

  it('returns "1 day ago"', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    expect(formatTimeAgo(now - 86_400_000)).toBe('1 day ago');
  });

  it('falls back to locale date string for > 7 days', () => {
    vi.useFakeTimers();
    const now = Date.now();
    vi.setSystemTime(now);
    const result = formatTimeAgo(now - 8 * 86_400_000);
    // Should be a date string, not "X days ago"
    expect(result).not.toContain('days ago');
  });
});

describe('formatDateKey', () => {
  it('formats to YYYY-MM-DD with zero-padded month and day', () => {
    expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('handles December correctly', () => {
    expect(formatDateKey(new Date(2026, 11, 25))).toBe('2026-12-25');
  });

  it('handles double-digit months and days', () => {
    expect(formatDateKey(new Date(2026, 9, 15))).toBe('2026-10-15');
  });
});

describe('formatTimeInMs', () => {
  it('formats seconds only (describe=true)', () => {
    expect(formatTimeInMs(45_000)).toBe('45sec');
  });

  it('formats seconds only (describe=false)', () => {
    expect(formatTimeInMs(45_000, false)).toBe('45s');
  });

  it('formats minutes and seconds (describe=true)', () => {
    expect(formatTimeInMs(320_000)).toBe('05min 20sec');
  });

  it('formats minutes and seconds (describe=false)', () => {
    expect(formatTimeInMs(320_000, false)).toBe('05:20');
  });

  it('formats hours, minutes, seconds (describe=true)', () => {
    expect(formatTimeInMs(5_445_000)).toBe('01h 30min 45sec');
  });

  it('formats hours, minutes, seconds (describe=false)', () => {
    expect(formatTimeInMs(5_445_000, false)).toBe('01:30:45');
  });

  it('handles zero', () => {
    expect(formatTimeInMs(0)).toBe('00sec');
  });

  it('handles exactly 1 hour', () => {
    expect(formatTimeInMs(3_600_000)).toBe('01h 00min 00sec');
  });
});
