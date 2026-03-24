import type { LanguageSupport } from '@codemirror/language';

import { tryAsync } from '@/utils/functions/error';

type LanguageLoader = () => Promise<LanguageSupport>;

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
};

// Intentional indefinite cache — bounded by the ~20 supported languages above.
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
