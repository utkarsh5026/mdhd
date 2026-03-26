import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatRelativeTime, formatTimeAgo } from './time';

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
    expect(result).not.toContain('days ago');
  });
});
