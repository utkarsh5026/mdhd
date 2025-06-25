import { RiRobot2Fill } from "react-icons/ri";
import { SiAnthropic, SiGoogle, SiOpenai } from "react-icons/si";
import type { LLMProviderId } from "../types";

/**
 * Get provider icon component
 */
export const getProviderIcon = (providerId: LLMProviderId) => {
  switch (providerId) {
    case "openai":
      return <SiOpenai className="w-4 h-4" />;
    case "anthropic":
      return <SiAnthropic className="w-4 h-4" />;
    case "google":
      return <SiGoogle className="w-4 h-4" />;
    default:
      return <RiRobot2Fill className="w-4 h-4" />;
  }
};

export const getComponentColorScheme = (type: string) => {
  switch (type) {
    case "code":
      return "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    case "table":
      return "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800";
    case "heading":
      return "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800";
    case "list":
      return "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800";
    case "blockquote":
      return "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800";
    case "image":
      return "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800";
    default:
      return "bg-gray-50 dark:bg-gray-950/30 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800";
  }
};
