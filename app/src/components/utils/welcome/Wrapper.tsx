import React, { useState, useEffect } from "react";
import OnboardingPage from "./Onboarding";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboarding } from "./useOnboarding";
import LoadingAnimation from "@/components/utils/init/LoadingAnimation";

// Props for the AppWrapper component
interface AppWrapperProps {
  children: React.ReactNode;
}

/**
 * AppWrapper component that handles the application initialization flow
 * including loading states and the onboarding experience for first-time users.
 */
const AppWrapper: React.FC<AppWrapperProps> = ({ children }) => {
  // State for initial app loading
  const [isLoading, setIsLoading] = useState(true);

  // Custom hook for onboarding state management
  const { showOnboarding, completeOnboarding } = useOnboarding();

  // Simulate initial app loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200); // Short delay for initial loading

    return () => clearTimeout(timer);
  }, []);

  // Initial loading screen
  if (isLoading) {
    return <LoadingAnimation />;
  }

  // Show onboarding for first-time users
  if (showOnboarding) {
    return <OnboardingPage onComplete={completeOnboarding} />;
  }

  // Regular app content with entry animation
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="app-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-background text-foreground"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AppWrapper;
