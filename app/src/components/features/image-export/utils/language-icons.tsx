import React from 'react';
import { FaCss3Alt, FaJava } from 'react-icons/fa';
import {
  SiC,
  SiCplusplus,
  SiDart,
  SiDocker,
  SiDotnet,
  SiElixir,
  SiGnubash,
  SiGo,
  SiGraphql,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiKotlin,
  SiLua,
  SiMarkdown,
  SiPerl,
  SiPhp,
  SiPython,
  SiR,
  SiReact,
  SiRuby,
  SiRust,
  SiScala,
  SiSvelte,
  SiSwift,
  SiTypescript,
  SiVuedotjs,
  SiYaml,
  SiZig,
} from 'react-icons/si';

const LANGUAGE_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  tsx: SiReact,
  jsx: SiReact,
  react: SiReact,
  python: SiPython,
  py: SiPython,
  rust: SiRust,
  rs: SiRust,
  go: SiGo,
  golang: SiGo,
  java: FaJava,
  kotlin: SiKotlin,
  kt: SiKotlin,
  swift: SiSwift,
  dart: SiDart,
  ruby: SiRuby,
  rb: SiRuby,
  php: SiPhp,
  c: SiC,
  cpp: SiCplusplus,
  'c++': SiCplusplus,
  csharp: SiDotnet,
  'c#': SiDotnet,
  html: SiHtml5,
  css: FaCss3Alt,
  scss: FaCss3Alt,
  sass: FaCss3Alt,
  json: SiJson,
  yaml: SiYaml,
  yml: SiYaml,
  markdown: SiMarkdown,
  md: SiMarkdown,
  graphql: SiGraphql,
  gql: SiGraphql,
  bash: SiGnubash,
  sh: SiGnubash,
  shell: SiGnubash,
  zsh: SiGnubash,
  lua: SiLua,
  perl: SiPerl,
  r: SiR,
  scala: SiScala,
  haskell: SiHaskell,
  hs: SiHaskell,
  elixir: SiElixir,
  ex: SiElixir,
  svelte: SiSvelte,
  vue: SiVuedotjs,
  docker: SiDocker,
  dockerfile: SiDocker,
  zig: SiZig,
};

export const LanguageIcon: React.FC<{
  language: string;
  className?: string;
  style?: React.CSSProperties;
}> = ({ language, className, style }) => {
  const Icon = LANGUAGE_ICON_MAP[language.toLowerCase()];
  if (!Icon) return null;
  return <Icon className={className} style={style} />;
};

// eslint-disable-next-line react-refresh/only-export-components
export const hasLanguageIcon = (language: string): boolean =>
  language.toLowerCase() in LANGUAGE_ICON_MAP;
