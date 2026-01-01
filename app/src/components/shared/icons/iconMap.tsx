import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiGo,
  SiRust,
  SiC,
  SiCplusplus,
  SiPhp,
  SiRuby,
  SiSwift,
  SiKotlin,
  SiDart,
  SiHtml5,
  SiCss3,
  SiSass,
  SiMarkdown,
  SiShell,
  SiLua,
  SiPerl,
  SiScala,
  SiElixir,
  SiHaskell,
  SiClojure,
  SiR,
  SiJson,
  SiYaml,
  SiMysql,
  SiPostgresql,
  SiCmake,
} from 'react-icons/si';
import { FiFolder, FiFileText } from 'react-icons/fi';
import { FaJava, FaCode, FaDocker, FaFile } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { TbBrandCSharp, TbBrandPowershell } from 'react-icons/tb';
import { CiDatabase } from 'react-icons/ci';

export const iconMap: Record<string, IconType> = {
  // Core Programming Languages
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  python: SiPython,
  py: SiPython,
  java: FaJava,
  c: SiC,
  'c++': SiCplusplus,
  cpp: SiCplusplus,
  'c#': TbBrandCSharp,
  csharp: TbBrandCSharp,
  php: SiPhp,
  ruby: SiRuby,
  rb: SiRuby,
  go: SiGo,
  golang: SiGo,
  rust: SiRust,
  rs: SiRust,
  swift: SiSwift,
  kotlin: SiKotlin,
  kt: SiKotlin,
  dart: SiDart,

  // Web Languages
  html: SiHtml5,
  htm: SiHtml5,
  css: SiCss3,
  scss: SiSass,
  sass: SiSass,

  // Scripting Languages
  shell: SiShell,
  sh: SiShell,
  bash: SiShell,
  zsh: SiShell,
  fish: SiShell,
  powershell: TbBrandPowershell,
  ps1: TbBrandPowershell,
  lua: SiLua,
  perl: SiPerl,
  pl: SiPerl,

  // Functional Languages
  haskell: SiHaskell,
  hs: SiHaskell,
  clojure: SiClojure,
  clj: SiClojure,
  elixir: SiElixir,
  ex: SiElixir,
  scala: SiScala,

  // Scientific/Statistical Languages
  r: SiR,

  markdown: SiMarkdown,
  md: SiMarkdown,
  json: SiJson,
  yaml: SiYaml,
  yml: SiYaml,
  xml: FiFileText,
  toml: FiFileText,
  ini: FiFileText,
  conf: FiFileText,
  config: FiFileText,

  // Database Languages
  sql: CiDatabase,
  mysql: SiMysql,
  postgresql: SiPostgresql,
  sqlite: CiDatabase,

  // Container & Config Files
  dockerfile: FaDocker,
  docker: FaDocker,
  makefile: FaCode,
  make: FaCode,
  cmake: SiCmake,

  // Other commonly highlighted languages
  diff: FaCode,
  patch: FaCode,
  log: FaFile,
  text: FaFile,
  txt: FaFile,
};

/**
 * Gets the icon component for a given technology/language name
 * @param name The name of the technology/language (case insensitive)
 * @returns The corresponding icon component or a default folder icon
 */
export const getIconForTech = (name?: string): IconType => {
  if (!name) return FiFolder;

  const normalizedName = name.split(' ').join('_').toLowerCase().trim();
  return iconMap[normalizedName] || FaCode;
};

export default getIconForTech;
