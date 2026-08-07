/**
 * Maps source-file extensions to the language identifiers MDHD uses in fenced
 * code blocks.
 *
 * The values here are the same strings `markdown-render/utils/language-loader`
 * resolves to a CodeMirror parser and `image-export/utils/language-icons` maps
 * to an icon, so a file imported as `rust` highlights and labels itself with no
 * further translation.
 *
 * Kept free of imports so `formats.ts` — which every upload path touches — can
 * pull it in eagerly without dragging the rest of the import service along.
 */

/**
 * Extension (lower-cased, including the dot) → fenced-block language id.
 *
 * `.html`, `.htm`, `.md` and `.markdown` are deliberately absent: those already
 * belong to the prose importers in `formats.ts` and reading them as source
 * would shadow the converters.
 */
const CODE_EXTENSIONS: Readonly<Record<string, string>> = {
  // JavaScript / TypeScript
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'tsx',

  // Styles and templates
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.vue': 'html',
  '.svelte': 'html',

  // Data and config
  '.json': 'json',
  '.jsonc': 'json',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.ini': 'properties',
  '.cfg': 'properties',
  '.conf': 'properties',
  '.properties': 'properties',
  '.env': 'shell',
  '.proto': 'protobuf',
  '.graphql': 'graphql',
  '.gql': 'graphql',

  // Systems
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hh': 'cpp',
  '.hxx': 'cpp',
  '.rs': 'rust',
  '.go': 'go',
  '.zig': 'zig',
  '.d': 'd',

  // JVM and .NET
  '.java': 'java',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.scala': 'scala',
  '.sc': 'scala',
  '.groovy': 'groovy',
  '.gradle': 'groovy',
  '.cs': 'csharp',
  '.fs': 'fsharp',
  '.fsx': 'fsharp',
  '.vb': 'vb',

  // Apple / mobile
  '.swift': 'swift',
  '.m': 'objectivec',
  '.mm': 'objectivec',
  '.dart': 'dart',

  // Scripting
  '.py': 'python',
  '.pyw': 'python',
  '.pyi': 'python',
  '.rb': 'ruby',
  '.rake': 'ruby',
  '.gemspec': 'ruby',
  '.php': 'php',
  '.pl': 'perl',
  '.pm': 'perl',
  '.lua': 'lua',
  '.r': 'r',
  '.jl': 'julia',
  '.tcl': 'tcl',
  '.sh': 'shell',
  '.bash': 'shell',
  '.zsh': 'shell',
  '.fish': 'shell',
  '.ps1': 'powershell',
  '.psm1': 'powershell',

  // Functional
  '.hs': 'haskell',
  '.elm': 'elm',
  '.ml': 'ocaml',
  '.mli': 'ocaml',
  '.clj': 'clojure',
  '.cljs': 'clojure',
  '.cljc': 'clojure',
  '.erl': 'erlang',
  '.hrl': 'erlang',
  '.lisp': 'commonlisp',
  '.scm': 'scheme',

  // Query and infrastructure
  '.sql': 'sql',
  '.cmake': 'cmake',
  '.tf': 'properties',
  '.diff': 'diff',
  '.patch': 'diff',
};

/**
 * Extension-less filenames that are still source, matched case-insensitively
 * against the whole basename.
 */
const CODE_FILENAMES: Readonly<Record<string, string>> = {
  dockerfile: 'dockerfile',
  containerfile: 'dockerfile',
  makefile: 'cmake',
  gnumakefile: 'cmake',
  cmakelists: 'cmake',
  rakefile: 'ruby',
  gemfile: 'ruby',
  brewfile: 'ruby',
  procfile: 'properties',
  '.gitignore': 'properties',
  '.dockerignore': 'properties',
  '.env': 'shell',
  '.bashrc': 'shell',
  '.zshrc': 'shell',
};

/** Every extension this module recognizes, for building `accept` attributes. */
export const CODE_EXTENSION_LIST: readonly string[] = Object.keys(CODE_EXTENSIONS);

/**
 * Human-readable names for language ids whose display form is not just the id
 * with a capital letter. Used for the subtitle line of an imported file.
 */
const LANGUAGE_LABELS: Readonly<Record<string, string>> = {
  javascript: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  typescript: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  csharp: 'C#',
  cpp: 'C++',
  fsharp: 'F#',
  objectivec: 'Objective-C',
  php: 'PHP',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
  xml: 'XML',
  graphql: 'GraphQL',
  protobuf: 'Protocol Buffers',
  shell: 'Shell',
  powershell: 'PowerShell',
  ocaml: 'OCaml',
  vb: 'Visual Basic',
  properties: 'Config',
  cmake: 'Make / CMake',
  diff: 'Diff',
};

/**
 * Resolves the fenced-block language for a source filename.
 *
 * Checks the extension first, then the bare basename so `Dockerfile` and
 * `Makefile` — which have no extension at all — are still recognized.
 *
 * @param filename - A bare filename or full path.
 * @returns The language id (e.g. `rust`), or `null` when the file is not one
 *   this module treats as source.
 */
export function detectCodeLanguage(filename: string): string | null {
  const basename = (filename.split('/').pop() ?? filename).toLowerCase();

  const dot = basename.lastIndexOf('.');
  if (dot > 0) {
    const byExtension = CODE_EXTENSIONS[basename.slice(dot)];
    if (byExtension) return byExtension;
  }

  return CODE_FILENAMES[basename] ?? null;
}

/**
 * Display name for a language id — `TypeScript` rather than `typescript`.
 *
 * @param language - A language id produced by {@link detectCodeLanguage}.
 */
export function languageLabel(language: string): string {
  return LANGUAGE_LABELS[language] ?? language.charAt(0).toUpperCase() + language.slice(1);
}
