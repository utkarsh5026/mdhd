import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
