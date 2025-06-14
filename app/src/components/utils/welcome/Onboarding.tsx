import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpenText,
  BookMarked,
  BarChart3,
  Zap,
  PenSquare,
  Clock,
  List,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/ui/use-theme";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import useMobile from "@/hooks/device/use-mobile";
import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: BookOpenText,
    title: "Comprehensive Documentation",
    description:
      "Access detailed documentation on various programming concepts and technologies.",
    color: "#8b5cf6", // Purple
  },
  {
    icon: Clock,
    title: "Reading History",
    description:
      "Track your reading history and easily pick up where you left off.",
    color: "#3b82f6", // Blue
  },
  {
    icon: BookMarked,
    title: "Reading List",
    description:
      "Save documents to read later and organize your learning journey.",
    color: "#10b981", // Green
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description:
      "Visualize your reading habits and track your progress over time.",
    color: "#f97316", // Orange
  },
  {
    icon: Zap,
    title: "Achievements & Challenges",
    description:
      "Complete challenges and earn achievements to level up your learning.",
    color: "#eab308", // Yellow
  },
  {
    icon: PenSquare,
    title: "Annotated Content",
    description:
      "Clear explanations from first principles for better understanding.",
    color: "#ec4899", // Pink
  },
];

interface OnboardingPage {
  onComplete: () => void;
}
const OnboardingPage: React.FC<OnboardingPage> = ({ onComplete }) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Simulate loading time for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const totalSteps = 1; // Just one step for simplicity, but could be expanded

  const handleComplete = () => {
    onComplete();
  };

  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  // Features to highlight

  if (!showContent) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-muted-foreground">Loading First Principles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-y-auto font-cascadia-code">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${currentTheme.primary}60 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="container max-w-4xl mx-auto px-4 py-8 md:py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 md:mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-primary/10">
            <BookOpenText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Welcome to First Principles
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive documentation viewer with built-in reading
            tracking, analytics, and a focus on understanding from first
            principles.
          </p>
        </motion.div>

        {/* Progress Bar (only shown if multiple steps) */}
        {totalSteps > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Progress
              value={((currentStep + 1) / totalSteps) * 100}
              className="h-1.5 mb-2"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Getting Started</span>
              <span>
                {currentStep + 1} of {totalSteps}
              </span>
            </div>
          </motion.div>
        )}

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {features.map(({ title, icon, description, color }, index) => (
            <FeatureCard
              key={title}
              Icon={icon}
              title={title}
              description={description}
              delay={index}
              color={color}
            />
          ))}
        </motion.div>

        {/* Getting Started Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-card p-6 rounded-3xl border border-primary/10 mb-8"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <List className="h-5 w-5 mr-2 text-primary" />
            Getting Started
          </h2>

          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="text-xs font-medium">1</span>
              </div>
              <p>
                Browse the categories in the sidebar to find documentation on
                various topics
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="text-xs font-medium">2</span>
              </div>
              <p>
                Add documents to your reading list to keep track of what you
                want to learn
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="text-xs font-medium">3</span>
              </div>
              <p>
                Check your analytics to see your reading progress and
                achievements
              </p>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                <span className="text-xs font-medium">4</span>
              </div>
              <p>
                Complete daily challenges to level up and track your knowledge
                growth
              </p>
            </div>
          </div>
        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center md:justify-end gap-4"
        >
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={handleComplete}
          >
            Skip
          </Button>

          <Button className="rounded-full px-6 bg-primary" onClick={nextStep}>
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* App Preview Mockup - Consider adding a preview image here to show the interface */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="relative mt-8 mb-4 md:mb-0 mx-auto max-w-4xl"
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-primary/10 shadow-lg",
            isMobile ? "w-64 h-40 mx-auto" : "w-full h-auto aspect-video"
          )}
        >
          <div className="absolute inset-0 bg-card opacity-80"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">
              App preview image could go here
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
