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
