import { describe, expect, it } from 'vitest';

import { fromSnakeToTitleCase, truncateText } from './string';

describe('fromSnakeToTitleCase', () => {
  it('converts simple snake_case to Title Case', () => {
    expect(fromSnakeToTitleCase('hello_world')).toBe('Hello World');
  });

  it('uppercase known acronyms', () => {
    expect(fromSnakeToTitleCase('aws_api_setup')).toBe('AWS API Setup');
  });

  it('uppercase HTML/CSS/JS acronyms', () => {
    expect(fromSnakeToTitleCase('html_css_js')).toBe('HTML CSS JS');
  });

  it('handles single word', () => {
    expect(fromSnakeToTitleCase('hello')).toBe('Hello');
  });

  it('handles empty string', () => {
    expect(fromSnakeToTitleCase('')).toBe('');
  });

  it('handles mixed acronyms and normal words', () => {
    expect(fromSnakeToTitleCase('my_gpu_config')).toBe('My GPU Config');
  });

  it('handles string that is already title case with underscores', () => {
    expect(fromSnakeToTitleCase('rest_api')).toBe('REST API');
  });

  it('handles consecutive underscores gracefully', () => {
    const result = fromSnakeToTitleCase('a__b');
    expect(result).toContain('A');
    expect(result).toContain('B');
  });

  it('uppercase UI/UX', () => {
    expect(fromSnakeToTitleCase('ui_ux_design')).toBe('UI UX Design');
  });

  it('uppercase design patterns', () => {
    expect(fromSnakeToTitleCase('solid_dry_kiss')).toBe('SOLID DRY KISS');
  });
});

describe('truncateText', () => {
  it('returns text unchanged if shorter than maxLength', () => {
    expect(truncateText('hello', 10)).toBe('hello');
  });

  it('returns text unchanged if exactly maxLength', () => {
    expect(truncateText('hello', 5)).toBe('hello');
  });

  it('truncates and adds ellipsis when longer', () => {
    expect(truncateText('hello world', 6)).toBe('hello\u2026');
  });

  it('handles maxLength of 1', () => {
    expect(truncateText('hello', 1)).toBe('\u2026');
  });

  it('handles empty string', () => {
    expect(truncateText('', 5)).toBe('');
  });

  it('handles maxLength equal to text length', () => {
    expect(truncateText('abc', 3)).toBe('abc');
  });
});
