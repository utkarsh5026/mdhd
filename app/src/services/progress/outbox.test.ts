import { beforeEach, describe, expect, it } from 'vitest';

import type { ProgressEntry } from './api';
import { mergeProgressEntries, progressOutbox } from './outbox';

const entry = (overrides: Partial<ProgressEntry> = {}): ProgressEntry => ({
  file_id: 'file-1',
  section_index: 0,
  scroll_pct: 0,
  seconds_delta: 0,
  ...overrides,
});

describe('mergeProgressEntries', () => {
  it('sums reading seconds for the same file', () => {
    const merged = mergeProgressEntries(
      [entry({ seconds_delta: 30 })],
      [entry({ seconds_delta: 45 })]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].seconds_delta).toBe(75);
  });

  it('takes the newest position', () => {
    const merged = mergeProgressEntries(
      [entry({ section_index: 2, scroll_pct: 0.4 })],
      [entry({ section_index: 5, scroll_pct: 0.1 })]
    );

    expect(merged[0].section_index).toBe(5);
    expect(merged[0].scroll_pct).toBe(0.1);
  });

  it('keeps completion once earned', () => {
    const merged = mergeProgressEntries([entry({ completed: true })], [entry()]);

    expect(merged[0].completed).toBe(true);
  });

  it('keeps files apart', () => {
    const merged = mergeProgressEntries(
      [entry({ file_id: 'a', seconds_delta: 10 })],
      [entry({ file_id: 'b', seconds_delta: 20 })]
    );

    expect(merged.map((e) => [e.file_id, e.seconds_delta])).toEqual([
      ['a', 10],
      ['b', 20],
    ]);
  });

  it('does not mutate its inputs', () => {
    const existing = [entry({ seconds_delta: 10 })];
    mergeProgressEntries(existing, [entry({ seconds_delta: 5 })]);

    expect(existing[0].seconds_delta).toBe(10);
  });
});

describe('progressOutbox', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('accumulates entries across offline flushes and survives a reload', () => {
    progressOutbox.add([entry({ seconds_delta: 15 })]);
    progressOutbox.add([entry({ seconds_delta: 15, section_index: 3 })]);

    const queued = progressOutbox.read();
    expect(queued).toHaveLength(1);
    expect(queued[0].seconds_delta).toBe(30);
    expect(queued[0].section_index).toBe(3);
  });

  it('empties on clear', () => {
    progressOutbox.add([entry({ seconds_delta: 15 })]);
    progressOutbox.clear();

    expect(progressOutbox.read()).toEqual([]);
  });

  it('reads an empty queue when storage holds garbage', () => {
    localStorage.setItem('mdhd-progress-outbox', 'not json');

    expect(progressOutbox.read()).toEqual([]);
  });

  it('drops entries that are not progress records', () => {
    localStorage.setItem('mdhd-progress-outbox', JSON.stringify([{ nope: true }, entry()]));

    expect(progressOutbox.read()).toEqual([entry()]);
  });

  it('ignores an empty batch', () => {
    progressOutbox.add([]);

    expect(localStorage.getItem('mdhd-progress-outbox')).toBeNull();
  });
});
