import { useState, useCallback } from "react";
import { MarkdownViewer } from "@/components/features/content-reading";
import MarkdownEditor from "./markdown-editor";
import HeroMain from "./Hero";
import Header from "./header";
import { useReadingStore } from "@/components/features/content-reading/store/use-reading-store";

const Homepage = () => {
  const markdownInput = useReadingStore((state) => state.markdownInput);
  const initializeReading = useReadingStore((state) => state.initializeReading);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    setIsFullscreen(true);
  }, [markdownInput]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  if (isFullscreen) {
    return (
      <MarkdownViewer
        markdown={markdownInput}
        exitFullScreen={handleExitFullscreen}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-cascadia-code bg-background">
      <Header />

      <div className="relative z-10 pt-20">
        <div className="container mx-auto px-6 py-12">
          {/* Hero Section */}
          <HeroMain />

          {/* Editor */}
          <div className="max-w-3xl mx-auto">
            <MarkdownEditor
              markdownInput={markdownInput}
              setMarkdownInput={initializeReading}
              handleStartReading={handleStartReading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
