import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocumentLinkProvider } from '../index';
import MarkdownRender from './markdown-render';

describe('MarkdownRender heading anchors', () => {
  it('gives headings ids that survive sanitization', () => {
    const { container } = render(<MarkdownRender markdown={'## Getting Started\n\ntext'} />);

    expect(container.querySelector('h2')?.id).toBe('getting-started');
  });

  it('deduplicates repeated headings within one render', () => {
    const { container } = render(<MarkdownRender markdown={'## Setup\n\na\n\n## Setup\n\nb'} />);

    const ids = Array.from(container.querySelectorAll('h2')).map((h) => h.id);
    expect(ids).toEqual(['setup', 'setup-1']);
  });

  it('keeps in-page fragment links clickable', () => {
    const { container } = render(<MarkdownRender markdown={'[jump](#getting-started)'} />);

    expect(container.querySelector('a[href="#getting-started"]')).not.toBeNull();
  });
});

describe('MarkdownRender document links', () => {
  it('renders a relative link as an anchor when a host provides wiring', () => {
    const { container } = render(
      <DocumentLinkProvider value={{ basePath: '/docs/a.md', openDocument: () => {} }}>
        <MarkdownRender markdown={'[setup](./setup.md)'} />
      </DocumentLinkProvider>
    );

    const link = container.querySelector('a');
    expect(link).not.toBeNull();
    expect(link?.textContent).toBe('setup');
  });

  it('calls openDocument with the raw href instead of navigating', () => {
    const opened: string[] = [];
    const { container } = render(
      <DocumentLinkProvider
        value={{ basePath: '/docs/guide/a.md', openDocument: (href) => opened.push(href) }}
      >
        <MarkdownRender markdown={'[api](../api.md#usage)'} />
      </DocumentLinkProvider>
    );

    container.querySelector('a')?.click();
    expect(opened).toEqual(['../api.md#usage']);
  });

  it('degrades to plain text when no host wiring is present', () => {
    const { container } = render(<MarkdownRender markdown={'[setup](./setup.md)'} />);

    expect(container.querySelector('a')).toBeNull();
    expect(container.textContent).toContain('setup');
  });

  it('still opens external links in a new tab', () => {
    const { container } = render(<MarkdownRender markdown={'[x](https://example.com)'} />);

    const link = container.querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://example.com');
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('strips unsafe schemes', () => {
    const { container } = render(<MarkdownRender markdown={'[x](javascript:alert(1))'} />);

    expect(container.querySelector('a')?.hasAttribute('href')).toBe(false);
  });
});
