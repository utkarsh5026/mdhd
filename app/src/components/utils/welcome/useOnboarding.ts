import { useEffect, useState } from "react";

const ONBOARDING_COMPLETED_KEY = "firstPrinciples_onboardingCompleted";

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    const onboardingCompleted =
      localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
    setShowOnboarding(!onboardingCompleted);
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  };

  return { showOnboarding, completeOnboarding };
};
