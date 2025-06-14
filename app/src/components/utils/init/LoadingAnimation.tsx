import React, { useEffect, useState } from "react";

interface LoadingAnimationProps {
  minDuration?: number; // Minimum duration in ms
}

const words = [
  "Thinking",
  "Loading",
  "Processing",
  "Initializing",
  "Analyzing",
  "Building",
  "Compiling",
];

/**
 * LoadingAnimation Component 😊
 *
 * This delightful component brings your application to life with a charming loading animation!
 * It keeps users engaged while they wait, featuring:
 *
 * - Fun animated geometric shapes that spin and pulse 🎉
 * - A progress bar that visually represents loading progress 📊
 * - A typewriter text effect that adds a playful touch as it cycles through words ✨
 * - Smooth entrance and exit animations for a polished experience 🌈
 * - Responsive design that looks great on any device, from mobile to desktop 📱💻
 *
 * Enjoy a seamless loading experience that keeps users informed and entertained! 🎈
 */
const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  minDuration = 2000,
}) => {
  // State to track if animation is still showing
  const [isVisible, setIsVisible] = useState(true);

  // State to trigger the exit animation
  const [isExiting, setIsExiting] = useState(false);

  // Animation progress state (0-100)
  const [progress, setProgress] = useState(0);

  // Random words for the typing effect
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    // Simulate progress over time
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        // Accelerate progress as we go
        const increment = prev < 60 ? 1 : prev < 85 ? 2 : 3;
        return Math.min(prev + increment, 100);
      });
    }, 45);

    // Typing effect - change word every 1.8 seconds
    const wordInterval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % words.length);
    }, 50);

    // Timer to ensure minimum display duration
    const minDisplayTimer = setTimeout(() => {
      // Check if we've reached 100%
      if (progress >= 100) {
        startExitAnimation();
      } else {
        // Set up a watcher to trigger exit once we hit 100%
        const exitWatcher = setInterval(() => {
          if (progress >= 100) {
            startExitAnimation();
            clearInterval(exitWatcher);
          }
        }, 50);

        // Clean up watcher if component unmounts
        return () => clearInterval(exitWatcher);
      }
    }, minDuration);

    // Function to start the exit animation
    const startExitAnimation = () => {
      setIsExiting(true);
      setTimeout(() => setIsVisible(false), 800);
    };

    // Clean up all intervals on unmount
    return () => {
      clearInterval(progressInterval);
      clearInterval(wordInterval);
      clearTimeout(minDisplayTimer);
    };
  }, [minDuration, progress, words]);

  // Hide the component when animation is done
  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-800 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
      style={{ fontFamily: "var(--font-type-mono)" }}
    >
      <div className="w-full max-w-sm px-4 sm:px-0 flex flex-col items-center">
        {/* Logo animation */}
        <div className="relative mb-8 w-24 h-24">
          {/* Outer spinning hexagon */}
          <div
            className="absolute inset-0 border-4 border-primary/30 rounded-md animate-spin-slow"
            style={{ animationDirection: "reverse" }}
          />

          {/* Inner pulsing hexagon */}
          <div className="absolute inset-3 bg-primary/10 rounded-sm animate-pulse" />

          {/* Center rotating square */}
          <div className="absolute inset-5 border-2 border-primary/60 rounded-sm animate-spin" />

          {/* Dot in the center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
          </div>
        </div>

        {/* Text elements */}
        <h2 className="text-lg sm:text-xl font-medium text-foreground mb-2">
          First Principles
        </h2>

        {/* Typing effect */}
        <div className="h-6 mb-6 text-primary/80 font-light text-sm sm:text-base flex items-center">
          <span className="inline-block w-full text-center">
            {words[wordIndex]}
            <span className="inline-block animate-blink ml-0.5">_</span>
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Progress percentage */}
        <div className="text-xs text-muted-foreground">
          {progress}% complete
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
