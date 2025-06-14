import {
  SiPython,
  SiJavascript,
  SiTypescript,
  SiGo,
  SiReact,
  SiNodedotjs,
  SiExpress,
  SiMongodb,
  SiMysql,
  SiPostgresql,
  SiSqlite,
  SiRedis,
  SiDocker,
  SiKubernetes,
  SiGit,
  SiGithub,
  SiLinux,
  SiCss3,
  SiTailwindcss,
  SiGraphql,
  SiRust,
  SiThealgorithms,
} from "react-icons/si";
import { FiFolder, FiPackage } from "react-icons/fi";
import { FaAws, FaJava } from "react-icons/fa";
import { IconType } from "react-icons";
import { Code } from "lucide-react";

export const iconMap: Record<string, IconType> = {
  python: SiPython,
  javascript: SiJavascript,
  js: SiJavascript,
  typescript: SiTypescript,
  ts: SiTypescript,
  go: SiGo,
  golang: SiGo,
  rust: SiRust,
  java: FaJava,

  // Frontend Frameworks/Libraries
  react: SiReact,

  nodejs: SiNodedotjs,
  express: SiExpress,

  mongodb: SiMongodb,
  mysql: SiMysql,
  postgres: SiPostgresql,
  postgresql: SiPostgresql,
  sqlite: SiSqlite,
  redis: SiRedis,

  // DevOps and Cloud
  docker: SiDocker,
  kubernetes: SiKubernetes,
  aws: FaAws,

  // Version Control
  git: SiGit,
  github: SiGithub,

  // Operating Systems
  linux: SiLinux,
  css: SiCss3,
  tailwind: SiTailwindcss,
  graphql: SiGraphql,
  design_patterns: FiPackage,
  algorithms: SiThealgorithms,
};

/**
 * Gets the icon component for a given technology/language name
 * @param name The name of the technology/language (case insensitive)
 * @returns The corresponding icon component or a default folder icon
 */
export const getIconForTech = (name?: string): IconType => {
  if (!name) return FiFolder;

  const normalizedName = name.split(" ").join("_").toLowerCase().trim();
  return iconMap[normalizedName] || Code;
};

export default getIconForTech;
