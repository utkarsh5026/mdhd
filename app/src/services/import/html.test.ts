import { describe, expect, it } from 'vitest';

import { DOC_TITLE_CLASS, htmlToMarkdown } from './html';

describe('htmlToMarkdown', () => {
  it('converts headings to ATX style', () => {
    expect(htmlToMarkdown('<h1>Title</h1><h2>Sub</h2>')).toBe('# Title\n\n## Sub');
  });

  it('converts emphasis with the project delimiters', () => {
    expect(htmlToMarkdown('<p><strong>bold</strong> and <em>italic</em></p>')).toBe(
      '**bold** and *italic*'
    );
  });

  it('uses dashes for bullet lists', () => {
    expect(htmlToMarkdown('<ul><li>one</li><li>two</li></ul>')).toBe('-   one\n-   two');
  });

  it('converts tables via the GFM plugin', () => {
    const html =
      '<table><thead><tr><th>A</th><th>B</th></tr></thead>' +
      '<tbody><tr><td>1</td><td>2</td></tr></tbody></table>';

    expect(htmlToMarkdown(html)).toContain('| A | B |');
    expect(htmlToMarkdown(html)).toContain('| 1 | 2 |');
  });

  it('converts strikethrough via the GFM plugin', () => {
    expect(htmlToMarkdown('<p><del>gone</del></p>')).toBe('~~gone~~');
  });

  it('unwraps underline, which markdown cannot express', () => {
    expect(htmlToMarkdown('<p><u>underlined</u></p>')).toBe('underlined');
  });

  it('unwraps highlight, keeping the text', () => {
    expect(htmlToMarkdown('<p>a <mark>highlighted</mark> word</p>')).toBe('a highlighted word');
  });

  it('drops style and script blocks rather than emitting their source', () => {
    const html = '<style>p { color: red }</style><script>alert(1)</script><p>Body</p>';
    expect(htmlToMarkdown(html)).toBe('Body');
  });

  it('unwraps Google Docs redirect links back to the real destination', () => {
    const html =
      '<p><a href="https://www.google.com/url?q=https://example.com/docs&amp;sa=D">link</a></p>';
    expect(htmlToMarkdown(html)).toBe('[link](https://example.com/docs)');
  });

  it('leaves ordinary links alone', () => {
    expect(htmlToMarkdown('<p><a href="https://example.com">link</a></p>')).toBe(
      '[link](https://example.com)'
    );
  });

  it('removes the empty bookmark anchors Google Docs inserts before headings', () => {
    expect(htmlToMarkdown('<h2><a id="h.abc123"></a>Heading</h2>')).toBe('## Heading');
  });

  it('keeps images that have a source', () => {
    expect(htmlToMarkdown('<p><img src="data:image/png;base64,AAAA" alt="chart"></p>')).toBe(
      '![chart](data:image/png;base64,AAAA)'
    );
  });

  it('replaces a source-less image with a readable placeholder', () => {
    expect(htmlToMarkdown('<p><img src="" alt="Q3 chart"></p>')).toBe(
      '*[image omitted: Q3 chart]*'
    );
  });

  it('falls back to a generic placeholder when a source-less image has no alt text', () => {
    expect(htmlToMarkdown('<p><img src=""></p>')).toBe('*[image omitted]*');
  });

  it('converts blockquotes', () => {
    expect(htmlToMarkdown('<blockquote><p>quoted</p></blockquote>')).toBe('> quoted');
  });
});

describe('htmlToMarkdown tables', () => {
  it('promotes the first row when a table has no header row', () => {
    const html = '<table><tr><td>A</td><td>B</td></tr><tr><td>1</td><td>2</td></tr></table>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('| A | B |');
    expect(markdown).toContain('| 1 | 2 |');
    expect(markdown).not.toContain('<table');
  });

  it('unwraps the paragraphs Word puts inside every cell', () => {
    const html = '<table><tr><td><p>A</p></td><td><p>B</p></td></tr></table>';
    expect(htmlToMarkdown(html)).toContain('| A | B |');
  });

  it('joins a multi-paragraph cell with a line break rather than dropping one', () => {
    const html = '<table><tr><th>H</th></tr><tr><td><p>first</p><p>second</p></td></tr></table>';
    const markdown = htmlToMarkdown(html);

    expect(markdown).toContain('first');
    expect(markdown).toContain('second');
    expect(markdown).not.toContain('<table');
  });

  it('leaves an existing header row alone', () => {
    const html =
      '<table><thead><tr><th>H1</th><th>H2</th></tr></thead>' +
      '<tbody><tr><td>a</td><td>b</td></tr></tbody></table>';

    expect(htmlToMarkdown(html)).toContain('| H1 | H2 |');
  });
});

describe('htmlToMarkdown heading levels', () => {
  const title = `<h1 class="${DOC_TITLE_CLASS}">Doc Title</h1>`;

  it('demotes sibling H1 sections below a document title', () => {
    const markdown = htmlToMarkdown(`${title}<h1>Section</h1><h2>Subsection</h2>`);

    expect(markdown).toContain('# Doc Title');
    expect(markdown).toContain('## Section');
    expect(markdown).toContain('### Subsection');
  });

  it('leaves levels untouched when the title has no competing H1', () => {
    const markdown = htmlToMarkdown(`${title}<h2>Section</h2>`);

    expect(markdown).toContain('# Doc Title');
    expect(markdown).toContain('## Section');
  });

  it('leaves levels untouched when there is no document title at all', () => {
    const markdown = htmlToMarkdown('<h1>Section A</h1><h1>Section B</h1>');

    expect(markdown).toContain('# Section A');
    expect(markdown).toContain('# Section B');
    expect(markdown).not.toContain('## ');
  });

  it('does not push a heading past H6', () => {
    const markdown = htmlToMarkdown(`${title}<h1>Section</h1><h6>Deepest</h6>`);

    expect(markdown).toContain('###### Deepest');
  });
});
