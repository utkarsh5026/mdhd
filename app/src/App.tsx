import MDHDHomepage from "@/components/layout/HomePage";
import LandingPage from "./components/landing/LandingPage";
import { useTheme } from "./hooks";
import "./index.css";
import { useEffect, useState } from "react";

const App = () => {
  const [showLanding, setShowLanding] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  useTheme();

  useEffect(() => {
    const hasSeenLanding = localStorage.getItem("hasSeenLanding");
    setShowLanding(!hasSeenLanding);
    setIsLoading(false);
  }, []);

  const handleGetStarted = () => {
    localStorage.setItem("hasSeenLanding", "true");
    setShowLanding(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-t-2 border-primary rounded-full"></div>
      </div>
    );
  }

  // Show landing page for first-time visitors
  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return <MDHDHomepage />;
};

export default App;
