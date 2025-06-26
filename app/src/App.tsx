import MDHDHomepage from "@/components/layout/HomePage";
import LandingPage from "./components/landing/landing-page";
import LoadingPage from "./components/utils/init/LoadingAnimation";
import { useTheme } from "./hooks";
import "./index.css";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

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

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  }, []);

  if (isLoading) {
    return <LoadingPage onComplete={handleLoadingComplete} />;
  }

  if (showLanding) {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <>
      <MDHDHomepage />
      <Toaster />
    </>
  );
};

export default App;
