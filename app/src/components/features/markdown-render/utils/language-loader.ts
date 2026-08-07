import { LanguageSupport, StreamLanguage, type StreamParser } from '@codemirror/language';

import { tryAsync } from '@/utils/error';

type LanguageLoader = () => Promise<LanguageSupport>;

/**
 * Adapts a CodeMirror 5 stream parser from `@codemirror/legacy-modes` into the
 * `LanguageSupport` the editor expects.
 *
 * The dozens of languages people actually read on GitHub — shell, Ruby, Swift,
 * Kotlin, TOML — have no Lezer grammar. Their legacy modes are a few KB each,
 * tokenize well enough for reading, and are dynamically imported one at a time,
 * so an unused language costs nothing.
 *
 * @param load - Resolves the mode's stream parser.
 */
const legacy =
  (load: () => Promise<StreamParser<unknown>>): LanguageLoader =>
  async () =>
    new LanguageSupport(StreamLanguage.define(await load()));

const languageLoaders: Record<string, LanguageLoader> = {
  // JavaScript/TypeScript
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  js: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  jsx: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true })),
  typescript: () =>
    import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  ts: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ typescript: true })),
  tsx: () =>
    import('@codemirror/lang-javascript').then((m) =>
      m.javascript({ jsx: true, typescript: true })
    ),

  // Web
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  scss: () => import('@codemirror/lang-css').then((m) => m.css()),
  sass: () => import('@codemirror/lang-css').then((m) => m.css()),
  less: () => import('@codemirror/lang-css').then((m) => m.css()),

  // Data formats
  json: () => import('@codemirror/lang-json').then((m) => m.json()),
  xml: () => import('@codemirror/lang-xml').then((m) => m.xml()),
  yaml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),
  yml: () => import('@codemirror/lang-yaml').then((m) => m.yaml()),

  // Markdown
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
  md: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),

  // Systems languages
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  py: () => import('@codemirror/lang-python').then((m) => m.python()),
  cpp: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  'c++': () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  c: () => import('@codemirror/lang-cpp').then((m) => m.cpp()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  rust: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  rs: () => import('@codemirror/lang-rust').then((m) => m.rust()),
  go: () => import('@codemirror/lang-go').then((m) => m.go()),
  golang: () => import('@codemirror/lang-go').then((m) => m.go()),
  php: () => import('@codemirror/lang-php').then((m) => m.php()),

  // Database
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  mysql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  postgresql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  postgres: () => import('@codemirror/lang-sql').then((m) => m.sql()),

  // Shells and scripting
  shell: legacy(() => import('@codemirror/legacy-modes/mode/shell').then((m) => m.shell)),
  sh: legacy(() => import('@codemirror/legacy-modes/mode/shell').then((m) => m.shell)),
  bash: legacy(() => import('@codemirror/legacy-modes/mode/shell').then((m) => m.shell)),
  zsh: legacy(() => import('@codemirror/legacy-modes/mode/shell').then((m) => m.shell)),
  powershell: legacy(() =>
    import('@codemirror/legacy-modes/mode/powershell').then((m) => m.powerShell)
  ),
  ruby: legacy(() => import('@codemirror/legacy-modes/mode/ruby').then((m) => m.ruby)),
  rb: legacy(() => import('@codemirror/legacy-modes/mode/ruby').then((m) => m.ruby)),
  perl: legacy(() => import('@codemirror/legacy-modes/mode/perl').then((m) => m.perl)),
  lua: legacy(() => import('@codemirror/legacy-modes/mode/lua').then((m) => m.lua)),
  r: legacy(() => import('@codemirror/legacy-modes/mode/r').then((m) => m.r)),
  julia: legacy(() => import('@codemirror/legacy-modes/mode/julia').then((m) => m.julia)),
  tcl: legacy(() => import('@codemirror/legacy-modes/mode/tcl').then((m) => m.tcl)),

  // JVM, .NET, and mobile
  kotlin: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.kotlin)),
  kt: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.kotlin)),
  scala: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.scala)),
  csharp: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.csharp)),
  cs: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.csharp)),
  dart: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.dart)),
  objectivec: legacy(() => import('@codemirror/legacy-modes/mode/clike').then((m) => m.objectiveC)),
  groovy: legacy(() => import('@codemirror/legacy-modes/mode/groovy').then((m) => m.groovy)),
  swift: legacy(() => import('@codemirror/legacy-modes/mode/swift').then((m) => m.swift)),
  vb: legacy(() => import('@codemirror/legacy-modes/mode/vb').then((m) => m.vb)),

  // Functional
  haskell: legacy(() => import('@codemirror/legacy-modes/mode/haskell').then((m) => m.haskell)),
  elm: legacy(() => import('@codemirror/legacy-modes/mode/elm').then((m) => m.elm)),
  ocaml: legacy(() => import('@codemirror/legacy-modes/mode/mllike').then((m) => m.oCaml)),
  fsharp: legacy(() => import('@codemirror/legacy-modes/mode/mllike').then((m) => m.fSharp)),
  clojure: legacy(() => import('@codemirror/legacy-modes/mode/clojure').then((m) => m.clojure)),
  erlang: legacy(() => import('@codemirror/legacy-modes/mode/erlang').then((m) => m.erlang)),
  commonlisp: legacy(() =>
    import('@codemirror/legacy-modes/mode/commonlisp').then((m) => m.commonLisp)
  ),
  scheme: legacy(() => import('@codemirror/legacy-modes/mode/scheme').then((m) => m.scheme)),
  d: legacy(() => import('@codemirror/legacy-modes/mode/d').then((m) => m.d)),

  // Config and infrastructure
  toml: legacy(() => import('@codemirror/legacy-modes/mode/toml').then((m) => m.toml)),
  properties: legacy(() =>
    import('@codemirror/legacy-modes/mode/properties').then((m) => m.properties)
  ),
  ini: legacy(() => import('@codemirror/legacy-modes/mode/properties').then((m) => m.properties)),
  dockerfile: legacy(() =>
    import('@codemirror/legacy-modes/mode/dockerfile').then((m) => m.dockerFile)
  ),
  cmake: legacy(() => import('@codemirror/legacy-modes/mode/cmake').then((m) => m.cmake)),
  nginx: legacy(() => import('@codemirror/legacy-modes/mode/nginx').then((m) => m.nginx)),
  protobuf: legacy(() => import('@codemirror/legacy-modes/mode/protobuf').then((m) => m.protobuf)),
  diff: legacy(() => import('@codemirror/legacy-modes/mode/diff').then((m) => m.diff)),
};

// Intentional indefinite cache — bounded by the supported languages above.
// Each entry is a stateless LanguageSupport descriptor, safe to share across editors.
const languageCache = new Map<string, LanguageSupport>();

/** Clear the language cache (useful for HMR / testing). */
export function clearLanguageCache(): void {
  languageCache.clear();
}

export async function loadLanguage(lang: string): Promise<LanguageSupport | null> {
  const normalizedLang = lang.toLowerCase().trim();

  if (languageCache.has(normalizedLang)) {
    return languageCache.get(normalizedLang)!;
  }

  const loader = languageLoaders[normalizedLang];
  if (!loader) {
    return null;
  }

  const language = await tryAsync(loader, null);
  if (language) languageCache.set(normalizedLang, language);
  return language;
}
