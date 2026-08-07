# Import fixtures

Hand-built OOXML packages used by `docx.test.ts`. Both are real `.docx` files —
`unzip -t` passes on them and Word opens them — trimmed to the minimum parts
mammoth reads (`[Content_Types].xml`, `_rels/.rels`, `word/document.xml`,
`word/_rels/document.xml.rels`, and where relevant `styles.xml` /
`numbering.xml` / `media/`).

## `quarterly-report.docx`

Covers the structural features that matter for a Word or Google Docs export:

| Feature                   | In the document                                             |
| ------------------------- | ----------------------------------------------------------- |
| `Title` style             | "Quarterly Report"                                          |
| `Subtitle` style          | "Prepared for the board"                                    |
| `heading 1` / `heading 2` | "Overview" / "Details"                                      |
| Inline runs               | bold, italic, and `w:strike` in one paragraph               |
| Bulleted list             | two `List Paragraph` items with a `numPr` bullet definition |
| `Quote` style             | one paragraph                                               |
| Table                     | 2×2, **no** `tblHeader` — the common headerless Word table  |
| Hyperlink                 | external relationship to `https://example.com/q3`           |

## `with-images.docx`

Two inline `w:drawing` images with `descr` alt text:

- `media/small.png` — a real 1×1 PNG, comfortably inside the inline budget
- `media/big.png` — 2.5 MB, over `MAX_INLINE_IMAGE_BYTES`, so it must become a
  placeholder rather than a data URI

The oversized part is zero-filled. It deflates to a couple of KB in the archive
while still decompressing past the cap, which is why this fixture is ~4 KB on
disk rather than ~2.5 MB.
