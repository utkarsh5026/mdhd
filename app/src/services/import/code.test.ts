import { describe, expect, it } from 'vitest';

import { codeToMarkdown, splitCodeIntoSections } from './code';
import { detectCodeLanguage, languageLabel } from './code-languages';
import { DEFAULT_RULES, LANGUAGES_WITH_RULES, rulesFor } from './code-rules';

/**
 * Repeats `line` enough times to push a construct past the merge threshold —
 * and the fixtures that use it past the threshold below which a file is left
 * as a single section.
 */
const body = (line: string, count = 20) => Array.from({ length: count }, () => line).join('\n');

/** Section titles a file splits into, which is what the rules really decide. */
const titles = (source: string, language: string) =>
  splitCodeIntoSections(source, language).map((section) => section.title);

// ---------------------------------------------------------------------------
// Fixtures — one per language family, each written the way that family is
// actually written, including the indentation its members live at.
// ---------------------------------------------------------------------------

const typescriptFile = [
  "import { useState } from 'react';",
  "import { cn } from '@/lib/utils';",
  '',
  '/** Options accepted by the parser. */',
  'export interface ParserOptions {',
  body('  flag: boolean;'),
  '}',
  '',
  '/**',
  ' * Parses a document.',
  ' */',
  'export function parseDocument(input: string) {',
  body('  console.log(input);'),
  '}',
  '',
  'export const Button = ({ label }: Props) => {',
  body('  return null;'),
  '};',
  '',
  'export class Renderer {',
  body('  render() {}'),
  '}',
].join('\n');

const pythonFile = [
  'import os',
  'from pathlib import Path',
  '',
  '',
  'class Loader:',
  '    """Loads things."""',
  '',
  '    @property',
  '    def source(self):',
  body('        return self._source'),
  '',
  '    def reload(self, path):',
  body('        self._source = path'),
  '',
  '',
  'def load_all(path):',
  body('    print(path)'),
].join('\n');

const rustFile = [
  'use std::fmt;',
  'use std::io;',
  '',
  '/// A parsed token.',
  'pub struct Token {',
  body('    kind: u8,'),
  '}',
  '',
  '#[derive(Debug)]',
  'pub enum Kind {',
  body('    Word,'),
  '}',
  '',
  'impl fmt::Display for Token {',
  body('    let x = 1;'),
  '}',
  '',
  'pub async fn read_input() -> io::Result<()> {',
  body('    Ok(())'),
  '}',
].join('\n');

const goFile = [
  'package parser',
  '',
  'import "fmt"',
  '',
  '// Server serves.',
  'type Server struct {',
  body('\taddr string'),
  '}',
  '',
  'func NewServer(addr string) *Server {',
  body('\treturn nil'),
  '}',
  '',
  'func (s *Server) Start() error {',
  body('\tfmt.Println(s.addr)'),
  '}',
].join('\n');

const javaFile = [
  'package com.example;',
  '',
  'import java.util.List;',
  '',
  '/** Parses documents. */',
  'public class Parser {',
  '    private final String source;',
  '',
  '    public Parser(String source) {',
  body('        this.source = source;'),
  '    }',
  '',
  '    /** Parses everything. */',
  '    public List<String> parseAll(String raw) {',
  body('        return null;'),
  '    }',
  '',
  '    private static int countLines(String text) {',
  body('        return text.length();'),
  '    }',
  '}',
].join('\n');

const swiftFile = [
  'import Foundation',
  '',
  '/// A parsed token.',
  'struct Token {',
  '  let kind: Int',
  '',
  '  func describe() -> String {',
  body('    return "token"'),
  '  }',
  '',
  '  mutating func reset() {',
  body('    self.kind = 0'),
  '  }',
  '}',
  '',
  'extension Token: CustomStringConvertible {',
  body('  let x = 1'),
  '}',
].join('\n');

const rubyFile = [
  "require 'json'",
  '',
  '# Parses documents.',
  'class Parser',
  '  def initialize(source)',
  body('    @source = source'),
  '  end',
  '',
  '  def parse!',
  body('    @source.strip'),
  '  end',
  'end',
  '',
  'def standalone(path)',
  body('  puts path'),
  'end',
].join('\n');

const shellFile = [
  '#!/usr/bin/env bash',
  'set -euo pipefail',
  '',
  'type git >/dev/null || exit 1',
  '',
  '# Prints usage information.',
  'usage() {',
  body('  echo "usage"', 30),
  '}',
  '',
  'function run_migration {',
  body('  echo "migrating"', 30),
  '}',
].join('\n');

const haskellFile = [
  'module Parser where',
  '',
  'import Data.List',
  '',
  '-- | A parsed token.',
  'data Token = Word String | Number Int',
  body('  deriving (Show, Eq)'),
  '',
  'parseAll :: String -> [Token]',
  body('parseAll = undefined'),
  '',
  'render :: Token -> String',
  body('render = undefined'),
].join('\n');

const clojureFile = [
  '(ns app.parser',
  '  (:require [clojure.string :as str]))',
  '',
  ';; Parses a document.',
  '(defn parse-all',
  body('  [input] input'),
  '',
  '(defrecord Token [kind value]',
  body('  Object'),
  '',
  '(defn render',
  body('  [t] t'),
].join('\n');

const sqlFile = [
  '-- Schema for documents.',
  'CREATE TABLE documents (',
  body('  id uuid PRIMARY KEY,', 30),
  ');',
  '',
  'CREATE INDEX idx_documents_owner ON documents (owner_id);',
  '',
  'CREATE OR REPLACE FUNCTION touch_updated_at()',
  body('  RETURNS trigger AS $$', 30),
  ';',
].join('\n');

const cssFile = [
  '@import "reset.css";',
  '',
  '/* Cards */',
  '.card, .card--wide {',
  body('  color: red;'),
  '}',
  '',
  '@media (min-width: 40rem) {',
  body('  color: blue;'),
  '}',
  '',
  '#app {',
  body('  margin: 0;'),
  '}',
].join('\n');

const tomlFile = [
  '# Project config',
  'name = "mdhd"',
  '',
  '[tool.poetry]',
  body('version = "1.0"', 35),
  '',
  '[tool.ruff.lint]',
  body('select = ["E"]', 35),
].join('\n');

// ---------------------------------------------------------------------------

describe('splitCodeIntoSections', () => {
  const fixtures: ReadonlyArray<readonly [string, string]> = [
    ['typescript', typescriptFile],
    ['python', pythonFile],
    ['rust', rustFile],
    ['go', goFile],
    ['java', javaFile],
    ['swift', swiftFile],
    ['ruby', rubyFile],
    ['shell', shellFile],
    ['haskell', haskellFile],
    ['clojure', clojureFile],
    ['sql', sqlFile],
    ['css', cssFile],
    ['toml', tomlFile],
  ];

  /** The invariant everything else depends on: splitting never loses a line. */
  it.each(fixtures)('reproduces the original %s file from its sections', (language, source) => {
    const sections = splitCodeIntoSections(source, language);
    expect(sections.map((section) => section.code).join('\n')).toBe(source);
  });

  it.each(fixtures)('finds more than one section in the %s fixture', (language, source) => {
    expect(splitCodeIntoSections(source, language).length).toBeGreaterThan(1);
  });

  it('keeps short files whole', () => {
    const short = 'const a = 1;\nconst b = 2;\n';
    expect(splitCodeIntoSections(short, 'typescript')).toEqual([
      { title: 'Source', code: short, startLine: 1, endLine: 3 },
    ]);
  });

  it('reproduces a file with no recognizable declarations', () => {
    const prose = body('some arbitrary prose line', 120);
    expect(splitCodeIntoSections(prose, 'text')[0].code).toBe(prose);
  });

  it('reports contiguous, 1-based line ranges', () => {
    const sections = splitCodeIntoSections(typescriptFile, 'typescript');
    const totalLines = typescriptFile.split('\n').length;

    expect(sections[0].startLine).toBe(1);
    expect(sections[sections.length - 1].endLine).toBe(totalLines);

    for (const [index, section] of sections.entries()) {
      expect(section.endLine).toBeGreaterThanOrEqual(section.startLine);
      if (index > 0) expect(section.startLine).toBe(sections[index - 1].endLine + 1);
    }
  });

  it('starts a section at its doc block, not its declaration', () => {
    const parse = splitCodeIntoSections(typescriptFile, 'typescript').find(
      (section) => section.title === 'function parseDocument'
    );

    expect(parse?.code.startsWith('/**\n * Parses a document.')).toBe(true);
  });

  it('caps the number of sections for construct-heavy files', () => {
    const many = Array.from(
      { length: 400 },
      (_, i) => `function fn${i}() {\n  return ${i};\n}\n`
    ).join('\n');

    const sections = splitCodeIntoSections(many, 'javascript');

    expect(sections.length).toBeLessThanOrEqual(61);
    expect(sections.map((section) => section.code).join('\n')).toBe(many);
  });
});

describe('per-language headings', () => {
  it('TypeScript: top-level constructs only, never object members', () => {
    expect(titles(typescriptFile, 'typescript')).toEqual([
      'Imports',
      'interface ParserOptions',
      'function parseDocument',
      'function Button',
      'class Renderer',
    ]);
  });

  it('Python: module functions and the methods inside a class', () => {
    // `class Loader:` plus its docstring is three lines, so it adopts the first
    // method rather than being filed under "Imports".
    expect(titles(pythonFile, 'python')).toEqual([
      'Imports',
      'class Loader',
      'method reload',
      'function load_all',
    ]);
  });

  it('Rust: normalizes fn to function and keeps the whole impl signature', () => {
    expect(titles(rustFile, 'rust')).toEqual([
      'Imports',
      'struct Token',
      'enum Kind',
      'impl fmt::Display for Token',
      'function read_input',
    ]);
  });

  it('Go: names a method after itself, not its receiver', () => {
    expect(titles(goFile, 'go')).toEqual([
      'Imports',
      'type Server',
      'function NewServer',
      'function Start',
    ]);
  });

  it('Java: splits a class into its constructor and methods', () => {
    expect(titles(javaFile, 'java')).toEqual([
      'Imports',
      'class Parser',
      'method parseAll',
      'method countLines',
    ]);
  });

  it('Swift: two-space members, and extensions keep their signature', () => {
    expect(titles(swiftFile, 'swift')).toEqual([
      'Imports',
      'class Token',
      'function reset',
      'extension Token: CustomStringConvertible',
    ]);
  });

  it('Ruby: method names keep their ? and ! suffixes', () => {
    expect(titles(rubyFile, 'ruby')).toEqual([
      'Imports',
      'class Parser',
      'function parse!',
      'function standalone',
    ]);
  });

  it('Shell: both function spellings, and never the `type` builtin', () => {
    expect(titles(shellFile, 'shell')).toEqual([
      'Header',
      'function usage',
      'function run_migration',
    ]);
  });

  it('Haskell: splits on the type signature above each definition', () => {
    expect(titles(haskellFile, 'haskell')).toEqual([
      'Imports',
      'type Token',
      'function parseAll',
      'function render',
    ]);
  });

  it('Clojure: reads the name out of the def form', () => {
    expect(titles(clojureFile, 'clojure')).toEqual([
      'Imports',
      'function parse-all',
      'type Token',
      'function render',
    ]);
  });

  it('SQL: names each created object by kind', () => {
    expect(titles(sqlFile, 'sql')).toEqual([
      'Header',
      'table documents',
      'function touch_updated_at',
    ]);
  });

  it('CSS: uses the whole selector list as the heading', () => {
    expect(titles(cssFile, 'css')).toEqual([
      'Imports',
      '.card, .card--wide',
      '@media (min-width: 40rem)',
      '#app',
    ]);
  });

  it('TOML: splits on section headers', () => {
    expect(titles(tomlFile, 'toml')).toEqual(['Header', '[tool.poetry]', '[tool.ruff.lint]']);
  });
});

describe('false positives the shared-vocabulary approach produced', () => {
  it('does not read `module.exports` as a module declaration', () => {
    const source = [
      body('const helper = 1;', 40),
      'module.exports = {',
      body('  value: 1,', 30),
      '};',
    ].join('\n');

    // No boundary found at all, which is the point: `module.exports` is not a
    // declaration, so the file stays whole rather than sprouting a fake heading.
    expect(titles(source, 'javascript')).toEqual(['Source']);
  });

  it('does not read shell `type` as a type declaration', () => {
    expect(titles(shellFile, 'shell')).not.toContain('type git');
  });

  it('does not read a `return`/`await` statement as a member declaration', () => {
    const source = [
      'class Widget {',
      '  Widget build() {',
      body('    return compute(x);', 30),
      '  }',
      '',
      '  Future<void> load() async {',
      body('    await connect(db);', 30),
      '  }',
      '',
      '  void dispose() {',
      body('    super.dispose();', 30),
      '  }',
      '}',
    ].join('\n');

    expect(titles(source, 'dart')).toEqual(['class Widget', 'method load', 'method dispose']);
  });

  it('keeps Scala `case class` a declaration', () => {
    const source = [
      'package app',
      '',
      'case class Token(kind: String) {',
      body('  val x = 1', 35),
      '}',
      '',
      'object Parser {',
      body('  val y = 2', 35),
      '}',
    ].join('\n');

    expect(titles(source, 'scala')).toEqual(['Imports', 'class Token', 'class Parser']);
  });

  it('does not split inside a function body', () => {
    const source = [
      'function outer() {',
      body('  if (condition) {', 40),
      body('  while (true) {', 40),
      '}',
    ].join('\n');

    expect(splitCodeIntoSections(source, 'javascript')).toHaveLength(1);
  });

  it('says so when a heading ends up covering several folded-in siblings', () => {
    const source = [
      '.big {',
      body('  color: red;', 30),
      '}',
      ...Array.from({ length: 6 }, (_, i) => `.rule-${i} {\n  color: blue;\n}`),
      '.tail {',
      body('  color: green;', 20),
      '}',
    ].join('\n');

    expect(titles(source, 'css')).toEqual(['.big + 6 more', '.tail']);
  });

  it('does not label a section that folded in a single short sibling', () => {
    const source = [
      '.big {',
      body('  color: red;', 35),
      '}',
      '.small {\n  color: blue;\n}',
      '.tail {',
      body('  color: green;', 25),
      '}',
    ].join('\n');

    expect(titles(source, 'css')).toEqual(['.big', '.tail']);
  });

  it('splits multi-line data tables but not single-line constants', () => {
    const source = [
      "const MODE = 'fast';",
      'const RETRIES = 3;',
      'export const THEME_COLORS = {',
      body('  red: "#ff0000",', 35),
      '};',
      '',
      'export const PALETTE = [',
      body('  "#000000",', 35),
      '];',
    ].join('\n');

    expect(titles(source, 'typescript')).toEqual(['Header', 'const THEME_COLORS', 'const PALETTE']);
  });
});

describe('rulesFor', () => {
  it('falls back to the cautious default for unmapped languages', () => {
    expect(rulesFor('brainfuck')).toBe(DEFAULT_RULES);
    expect(rulesFor('text')).toBe(DEFAULT_RULES);
  });

  it('is case-insensitive', () => {
    expect(rulesFor('Rust')).toBe(rulesFor('rust'));
  });

  it('anchors every declaration pattern at the start of a line', () => {
    for (const language of LANGUAGES_WITH_RULES) {
      for (const rule of rulesFor(language).declarations) {
        expect(`${language}: ${rule.match.source}`).toMatch(/: \^/);
      }
    }
  });
});

describe('codeToMarkdown', () => {
  it('titles the document after the file and tags every fence', () => {
    const markdown = codeToMarkdown(typescriptFile, 'src/parser.ts', 'typescript');

    expect(markdown).toMatch(/^# parser\.ts\n/);
    expect(markdown).toContain(`*TypeScript · ${typescriptFile.split('\n').length} lines*`);
    expect(markdown).toContain('## class Renderer');
    expect(markdown).toContain('```typescript');
    expect(markdown.endsWith('```\n')).toBe(true);
  });

  it('lengthens the fence when the source contains one', () => {
    const source = `${body('const readme = 1;')}\nconst doc = \`\`\`\nfenced\n\`\`\`;\n`;
    const markdown = codeToMarkdown(source, 'doc.ts', 'typescript');

    expect(markdown).toContain('````typescript');
    expect(markdown).toContain('```\nfenced\n```');
  });

  it('normalizes CRLF without altering the code', () => {
    const markdown = codeToMarkdown('const a = 1;\r\nconst b = 2;\r\n', 'a.ts', 'typescript');

    expect(markdown).not.toContain('\r');
    expect(markdown).toContain('const a = 1;\nconst b = 2;');
  });

  it('omits line ranges when the file is one section', () => {
    expect(codeToMarkdown('const a = 1;\n', 'a.ts', 'typescript')).not.toContain('*Lines ');
    expect(codeToMarkdown(typescriptFile, 'parser.ts', 'typescript')).toContain('*Lines 1–');
  });

  it('handles an empty file', () => {
    expect(codeToMarkdown('', 'empty.ts', 'typescript')).toContain('*TypeScript · 0 lines*');
  });
});

describe('detectCodeLanguage', () => {
  it.each([
    ['main.rs', 'rust'],
    ['App.tsx', 'tsx'],
    ['script.PY', 'python'],
    ['deps/lib/util.go', 'go'],
    ['config.toml', 'toml'],
    ['Program.cs', 'csharp'],
    ['run.sh', 'shell'],
    ['Dockerfile', 'dockerfile'],
    ['services/Makefile', 'cmake'],
  ])('resolves %s', (filename, expected) => {
    expect(detectCodeLanguage(filename)).toBe(expected);
  });

  it.each(['notes.md', 'page.html', 'report.docx', 'photo.png', 'noextension'])(
    'leaves %s to the other importers',
    (filename) => {
      expect(detectCodeLanguage(filename)).toBeNull();
    }
  );

  it('has splitting rules for the languages it detects most often', () => {
    for (const filename of ['main.rs', 'App.tsx', 'a.py', 'b.go', 'C.java', 'd.rb', 'e.sh']) {
      expect(LANGUAGES_WITH_RULES).toContain(detectCodeLanguage(filename));
    }
  });
});

describe('languageLabel', () => {
  it('uses conventional casing, falling back to a capitalized id', () => {
    expect(languageLabel('csharp')).toBe('C#');
    expect(languageLabel('typescript')).toBe('TypeScript');
    expect(languageLabel('zig')).toBe('Zig');
  });
});
