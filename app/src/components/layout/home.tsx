import { useState, useCallback, useEffect } from 'react';
import { MarkdownViewer } from '@/components/features/content-reading';
import MarkdownEditor from './markdown-editor';
import HeroMain from './hero-section';
import Header from './header';
import { useReadingStore } from '@/components/features/content-reading/store/use-reading-store';
import { FileExplorerSidebar } from '@/components/features/file-explorer';
import type { StoredFile } from '@/services/indexeddb';

const Homepage = () => {
  const markdownInput = useReadingStore((state) => state.markdownInput);
  const isInitialized = useReadingStore((state) => state.isInitialized);
  const hasHydrated = useReadingStore((state) => state._hasHydrated);
  const initializeReading = useReadingStore((state) => state.initializeReading);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-resume reading after hydration completes
  useEffect(() => {
    if (hasHydrated && isInitialized && markdownInput.trim()) {
      setIsFullscreen(true);
    }
  }, [hasHydrated, isInitialized, markdownInput]);

  const handleStartReading = useCallback(() => {
    if (!markdownInput.trim()) return;
    setIsFullscreen(true);
  }, [markdownInput]);

  const handleExitFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  const handleFileSelect = useCallback(
    (file: StoredFile) => {
      initializeReading(file.content);
      setIsFullscreen(true);
    },
    [initializeReading]
  );

  if (isFullscreen) {
    return <MarkdownViewer markdown={markdownInput} exitFullScreen={handleExitFullscreen} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-cascadia-code bg-background">
      <Header />

      <div className="flex h-[calc(100vh-80px)] pt-20">
        <FileExplorerSidebar
          className="w-64 border-r border-border/50 shrink-0"
          onFileSelect={handleFileSelect}
        />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
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
    </div>
  );
};

export default Homepage;
