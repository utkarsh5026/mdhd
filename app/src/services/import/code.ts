/**
 * Source-file import: turns a code file into markdown MDHD can read
 * section by section.
 *
 * A source file dropped into the app becomes one markdown document whose
 * headings are the file's own top-level constructs, each followed by a fenced
 * block tagged with the file's language. Everything downstream — the section
 * reader, the table of contents, search, sync — then works on it exactly as it
 * does on prose, and the fenced blocks render through the normal `CodeRender`
 * path with the user's chosen code theme and font.
 *
 * Where the boundaries fall is decided by `code-rules.ts`, which holds a rule
 * set per language. This module is only the engine: it walks the file, asks
 * that language's rules whether a line opens a construct, and assembles the
 * sections.
 *
 * The split is a heuristic over line shape, not a parse — MDHD supports far
 * more languages than it ships grammars for. So the engine is built around one
 * invariant that holds no matter how badly a rule misfires: every line of the
 * input lands in exactly one section, in order, so concatenating the sections
 * reproduces the original file exactly. A bad guess costs a misplaced heading,
 * never a lost line.
 */

import { languageLabel } from './code-languages';
import { type DeclarationRule, type LanguageRules, rulesFor } from './code-rules';

/** Files shorter than this stay a single section — splitting them adds noise. */
const SPLIT_THRESHOLD_LINES = 60;

/** Sections shorter than this are folded into the section above them. */
const MIN_SECTION_LINES = 12;

/**
 * Ceiling on sections produced from one file. A 4,000-line file with 300 small
 * functions is a table of contents nobody can navigate; past this, boundaries
 * are sampled evenly so the sections stay roughly equal in size.
 */
const MAX_SECTIONS = 60;

/**
 * How many folded-in siblings it takes before a heading admits to them.
 *
 * A section that swallowed one short helper is still fairly described by its
 * own name. One that swallowed several is not — a stylesheet's `@theme inline`
 * standing over nine unrelated scrollbar rules is exactly the kind of confident
 * wrong answer this module is meant to avoid.
 */
const LABEL_ABSORBED_FROM = 2;

/**
 * Statement keywords that can lead a line looking exactly like a declaration —
 * `return parse(input) {`, `await connect(db)`. Checked before any rule runs.
 *
 * Lower-case only and deliberately short: keywords that also open a real
 * construct somewhere (`case class` in Scala, `FROM` in a Dockerfile, `with` as
 * a SQL CTE) must not appear here.
 */
const CONTROL_KEYWORD =
  /^(?:if|for|while|switch|catch|else|try|elif|unless|return|foreach|until|throw|await|yield|assert|new|defer|print|echo|import|from)\b/;

/** Splits a line into its leading whitespace and the rest. */
const LEADING_WHITESPACE = /^[ \t]*/;

/** How many lines must share an indent width before it is believed. */
const INDENT_CONFIDENCE = 3;

/** One contiguous run of the source file, with the heading it will get. */
export interface CodeSection {
  /** Heading text, e.g. `class Parser` or `Imports`. Free of markdown syntax. */
  title: string;
  /** The section's lines, joined with `\n`. Never has a trailing newline. */
  code: string;
  /** 1-based line number of the first line, in the original file. */
  startLine: number;
  /** 1-based line number of the last line, in the original file. */
  endLine: number;
}

/** A detected split point: where a section starts, and what to call it. */
interface Boundary {
  /** Index of the section's first line — its doc block, when it has one. */
  start: number;
  /** Heading derived from the declaration line. */
  title: string;
  /** Whether the construct holds the members that follow it. */
  container: boolean;
}

/** A section before the merge pass, as a half-open range over the lines. */
interface Range {
  title: string;
  container: boolean;
  /** First line, 0-based and inclusive. */
  start: number;
  /** Last line, 0-based and exclusive. */
  end: number;
  /**
   * How many sibling declarations were folded into this range because they were
   * too short to earn a heading. Surfaced in the heading so it never claims to
   * describe more than it does.
   */
  absorbed: number;
}

/**
 * Makes a declaration safe to use as a markdown heading, and caps its length.
 *
 * Only the characters that would change the document's structure are removed:
 * angle brackets, which would be parsed as HTML; backticks, which would open a
 * code span; pipes, which delimit tables; and a trailing run of `#`, which
 * ATX headings read as a closing sequence.
 *
 * Everything else survives, because for a heading drawn from source code the
 * punctuation *is* the name — `#app` and `[tool.poetry]` are not the same
 * selectors as `app` and `tool.poetry`.
 */
function sanitizeTitle(title: string): string {
  const cleaned = title
    .replace(/[<>`|]/g, '')
    .replace(/\s+#+\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.length > 70 ? `${cleaned.slice(0, 69)}…` : cleaned;
}

/**
 * Builds the heading for a matched declaration.
 *
 * Rules that name a construct produce `<kind> <name>` — `class Parser`,
 * `function parse_document` — with the spelling normalized by the rule, so a
 * Python `def` and a Rust `fn` both read as `function`. Rules marked
 * `wholeLine` keep their signature instead, for constructs whose identity is
 * more than a name: `impl Display for Token`, `.card, .card--wide`.
 *
 * @param line - The declaration line, with indentation already removed.
 * @param rule - The rule that matched.
 * @param match - That rule's match, whose `name` group supplies the heading.
 */
function titleForDeclaration(line: string, rule: DeclarationRule, match: RegExpExecArray): string {
  if (rule.wholeLine) {
    const signature = line
      .replace(/\s*\{.*$/, '')
      .replace(/\s*where\b.*$/, '')
      .replace(/[;,]\s*$/, '');
    return sanitizeTitle(signature) || 'Section';
  }

  const name = match.groups?.name;
  if (name) return sanitizeTitle(`${rule.kind} ${name}`);

  return sanitizeTitle(line.replace(/\s*[{(:]\s*$/, '')) || 'Section';
}

/** A line that opens a construct, and the rule that recognized it. */
interface Declaration {
  rule: DeclarationRule;
  match: RegExpExecArray;
}

/**
 * Tests a line against an ordered rule list, first match winning.
 *
 * @param line - The line with its indentation removed.
 * @param rules - Rules applicable at this line's indent level.
 */
function matchDeclaration(line: string, rules: readonly DeclarationRule[]): Declaration | null {
  for (const rule of rules) {
    const match = rule.match.exec(line);
    if (match) return { rule, match };
  }
  return null;
}

/**
 * Infers the file's indentation unit — the string one nesting level costs.
 *
 * Needed because class-based languages keep their real reading units (methods)
 * one level in, and "one level" is a per-file convention: four spaces in most
 * Python and Java, two in most Kotlin and Swift, a tab in plenty of Go and
 * Rust. Guessing wrong in the loose direction would let statements deep inside
 * a method body match a member rule, so the smallest indent that appears on at
 * least {@link INDENT_CONFIDENCE} lines is taken as the unit and nothing wider
 * is ever treated as a member.
 *
 * @param lines - Every line of the file.
 * @returns The indent unit, or `null` when the file is flat.
 */
function detectIndentUnit(lines: string[]): string | null {
  const seen = new Map<string, number>();

  for (const line of lines) {
    if (line.trim() === '') continue;
    const indent = LEADING_WHITESPACE.exec(line)![0];
    if (indent === '') continue;
    seen.set(indent, (seen.get(indent) ?? 0) + 1);
  }

  let unit: string | null = null;
  for (const [indent, count] of seen) {
    if (count < INDENT_CONFIDENCE) continue;
    if (unit === null || indent.length < unit.length) unit = indent;
  }
  return unit;
}

/**
 * Walks up from a declaration over its doc block, so the comment that explains
 * a function opens the function's section.
 *
 * @param lines - Every line of the file.
 * @param declaration - Index of the declaration line.
 * @param floor - Index the walk may not cross, i.e. the end of the previous
 *   section.
 * @param docLine - The language's comment and annotation syntax.
 * @returns The index the section should start at.
 */
function extendOverDocBlock(
  lines: string[],
  declaration: number,
  floor: number,
  docLine: RegExp
): number {
  let start = declaration;
  while (start > floor && docLine.test(lines[start - 1]) && lines[start - 1].trim() !== '') {
    start--;
  }
  return start;
}

/**
 * Names the run of code before the first detected boundary.
 *
 * Usually that run is the imports, or a licence header. But a file can open
 * directly on its one construct — a Java file holding a single class, a Dart
 * widget — and because a boundary can never sit on line 0 (that would leave an
 * empty preamble), such a file's class would otherwise be filed under
 * "Header". So the opening line is tested against the language's own rules
 * first, and the preamble inherits its heading and its container flag.
 *
 * @param lines - The preamble's lines.
 * @param rules - The language's rule set.
 * @param topLevel - Rules that apply at column 0.
 */
function describePreamble(
  lines: string[],
  rules: LanguageRules,
  topLevel: readonly DeclarationRule[]
): Pick<Range, 'title' | 'container'> {
  const opening = lines.find((line) => line.trim() !== '');

  // `package com.example;` and `(ns app.parser` satisfy both a declaration rule
  // and an import rule. At the top of a file the import reading is the true
  // one — what follows is the imports, not the body of a namespace.
  const opensWithDeclaration =
    opening !== undefined &&
    !/^\s/.test(opening) &&
    !CONTROL_KEYWORD.test(opening) &&
    !rules.importLine.test(opening);

  if (opensWithDeclaration) {
    const found = matchDeclaration(opening, topLevel);
    if (found) {
      return {
        title: titleForDeclaration(opening, found.rule, found.match),
        container: found.rule.container === true,
      };
    }
  }

  const code = lines.filter((line) => line.trim() !== '');
  if (code.length === 0) return { title: 'Header', container: false };

  const imports = code.filter((line) => rules.importLine.test(line)).length;
  return { title: imports / code.length >= 0.3 ? 'Imports' : 'Header', container: false };
}

/**
 * Finds every line that opens a top-level construct, or a class member one
 * indent level in for the languages whose rules ask for it.
 *
 * @param lines - Every line of the file.
 * @param rules - The language's rule set.
 * @param topLevel - Rules that apply at column 0.
 */
function findBoundaries(
  lines: string[],
  rules: LanguageRules,
  topLevel: readonly DeclarationRule[]
): Boundary[] {
  const members = rules.declarations.filter((rule) => rule.member);
  const indentUnit = members.length > 0 ? detectIndentUnit(lines) : null;

  const boundaries: Boundary[] = [];
  let floor = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const indent = LEADING_WHITESPACE.exec(line)![0];
    const dedented = line.slice(indent.length);

    if (dedented === '' || CONTROL_KEYWORD.test(dedented)) continue;

    let applicable: readonly DeclarationRule[];
    if (indent === '') {
      applicable = topLevel;
    } else if (indentUnit !== null && indent === indentUnit) {
      applicable = members;
    } else {
      continue;
    }

    const found = matchDeclaration(dedented, applicable);
    if (!found) continue;

    // Clamped rather than skipped: a doc block that reaches all the way back to
    // the previous boundary — or to the top of a file that opens with a licence
    // comment — must not cost the declaration its section.
    const start = Math.max(extendOverDocBlock(lines, i, floor, rules.docLine), floor + 1);

    boundaries.push({
      start,
      title: titleForDeclaration(dedented, found.rule, found.match),
      container: found.rule.container === true,
    });
    floor = i;
  }

  return boundaries;
}

/**
 * Splits source into the sections it will be read in.
 *
 * Guarantees, in order of importance:
 * 1. Every input line appears in exactly one section, in its original order —
 *    joining the sections' `code` with `\n` reproduces the input.
 * 2. At most {@link MAX_SECTIONS} sections come back.
 * 3. Only the first section may be shorter than {@link MIN_SECTION_LINES}.
 *
 * @param source - The file contents, with `\n` line endings.
 * @param language - Language id from `detectCodeLanguage`, selecting the rules
 *   used to find boundaries. Unknown ids get the cautious default rules.
 * @returns One section per top-level construct, or a single section for files
 *   too short — or too unlike their language's rules — to be worth splitting.
 */
export function splitCodeIntoSections(source: string, language: string): CodeSection[] {
  const lines = source.split('\n');

  const wholeFile = (title: string): CodeSection[] => [
    { title, code: source, startLine: 1, endLine: lines.length },
  ];

  if (lines.length <= SPLIT_THRESHOLD_LINES) return wholeFile('Source');

  const rules = rulesFor(language);
  const topLevel = rules.declarations.filter((rule) => !rule.member);
  const boundaries = findBoundaries(lines, rules, topLevel);

  if (boundaries.length === 0) return wholeFile('Source');

  // Too many constructs to navigate: keep an evenly spaced subset rather than
  // dropping the tail, so sections stay comparable in size across the file.
  const stride = Math.ceil(boundaries.length / MAX_SECTIONS);
  const kept = stride > 1 ? boundaries.filter((_, index) => index % stride === 0) : boundaries;

  const ranges: Range[] = [
    {
      ...describePreamble(lines.slice(0, kept[0].start), rules, topLevel),
      start: 0,
      end: kept[0].start,
      absorbed: 0,
    },
    ...kept.map((boundary, index) => ({
      title: boundary.title,
      container: boundary.container,
      start: boundary.start,
      end: kept[index + 1]?.start ?? lines.length,
      absorbed: 0,
    })),
  ];

  const merged = mergeShortRanges(ranges);

  if (merged.length <= 1) return wholeFile('Source');

  return merged.map(({ title, start, end, absorbed }) => ({
    title: absorbed >= LABEL_ABSORBED_FROM ? `${title} + ${absorbed} more` : title,
    code: lines.slice(start, end).join('\n'),
    startLine: start + 1,
    endLine: end,
  }));
}

/**
 * Folds ranges too short to deserve a heading of their own into a neighbour.
 *
 * Direction matters. A short range normally joins the one above it, which keeps
 * stray closing braces and one-line helpers out of the table of contents. A
 * short *container* goes the other way and adopts the range below it: `class
 * Parser {` and its first method belong together, and filing that class under
 * whatever preceded it — usually "Imports" — would be actively misleading.
 *
 * The first range is exempt. It is the file's preamble, and there is nothing
 * above it to join.
 *
 * Folding a sibling upward is counted, because the surviving heading then
 * covers code it does not name — a stylesheet's `@theme inline` quietly
 * swallowing nine scrollbar rules. Adoption by a container is not counted:
 * a class heading is meant to cover its own members.
 *
 * @param ranges - Sections in file order, each covering a half-open line range.
 * @returns The surviving ranges, still contiguous and still covering every line.
 */
function mergeShortRanges(ranges: readonly Range[]): Range[] {
  const merged: Range[] = [];
  const length = (range: Range) => range.end - range.start;

  for (const range of ranges) {
    const previous = merged[merged.length - 1];

    if (previous && previous.container && length(previous) < MIN_SECTION_LINES) {
      previous.end = range.end;
      continue;
    }

    if (previous && !range.container && length(range) < MIN_SECTION_LINES) {
      previous.end = range.end;
      previous.absorbed += 1;
      continue;
    }

    merged.push({ ...range });
  }

  return merged;
}

/**
 * Picks a fence long enough to contain the source.
 *
 * A markdown file full of examples can itself contain ``` runs, which would
 * otherwise close the block early and spill the rest of the file into the
 * document as prose.
 *
 * @param source - The code that has to sit inside the fence.
 * @returns A run of at least three backticks.
 */
function fenceFor(source: string): string {
  const runs = source.match(/`+/g);
  const longest = runs ? Math.max(...runs.map((run) => run.length)) : 0;
  return '`'.repeat(Math.max(3, longest + 1));
}

/**
 * Renders a source file as a markdown document.
 *
 * @param source - The file contents. CRLF and lone CR line endings are
 *   normalized to `\n`; nothing else about the code is altered.
 * @param filename - The source filename, used for the document's title.
 * @param language - Language id from `detectCodeLanguage`, used both as the
 *   fence's info string and to select the splitting rules.
 * @returns Markdown with an H1 for the file, an H2 per top-level construct, and
 *   the code in fenced blocks.
 */
export function codeToMarkdown(source: string, filename: string, language: string): string {
  const normalized = source.replace(/\r\n?/g, '\n').replace(/\n+$/, '');
  const basename = filename.split('/').pop() ?? filename;
  const sections = splitCodeIntoSections(normalized, language);
  const fence = fenceFor(normalized);
  const lineCount = normalized === '' ? 0 : normalized.split('\n').length;

  const parts = [
    `# ${sanitizeTitle(basename)}`,
    '',
    `*${languageLabel(language)} · ${lineCount.toLocaleString()} lines*`,
    '',
  ];

  const split = sections.length > 1;

  for (const section of sections) {
    parts.push(`## ${section.title}`, '');

    if (split) {
      parts.push(`*Lines ${section.startLine}–${section.endLine}*`, '');
    }

    parts.push(`${fence}${language}`, section.code, fence, '');
  }

  return `${parts.join('\n').trimEnd()}\n`;
}
