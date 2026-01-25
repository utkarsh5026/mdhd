import { cn } from '@/lib/utils';
import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import type { MarkdownSection, MarkdownMetadata } from '@/services/section/parsing';
import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import { RefObject, useEffect, useCallback, useRef, useState } from 'react';
import MetadataDisplay from './metadata-display';

interface ScrollContentReaderProps {
  sections: MarkdownSection[];
  metadata: MarkdownMetadata | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  handleDoubleClick: () => void;
  onScrollProgress: (progress: number) => void;
  onSectionVisible: (index: number) => void;
}

const ScrollContentReader: React.FC<ScrollContentReaderProps> = ({
  sections,
  metadata,
  scrollRef,
  handleDoubleClick,
  onScrollProgress,
  onSectionVisible,
}) => {
  const { settings } = useReadingSettings();
  const fontFamily = fontFamilyMap[settings.fontFamily];
  const { fontSize, lineHeight, contentWidth } = settings;
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      onScrollProgress(100);
      return;
    }
    const progress = (scrollTop / maxScroll) * 100;
    onScrollProgress(Math.min(100, Math.max(0, progress)));
  }, [scrollRef, onScrollProgress]);

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    // Initial progress calculation
    handleScroll();

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRef, handleScroll]);

  // IntersectionObserver to track visible sections
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            const index = parseInt(entry.target.getAttribute('data-section-index') || '0', 10);
            onSectionVisible(index);
          }
        });
      },
      {
        root: scrollRef.current,
        threshold: [0, 0.3, 0.5, 0.7, 1],
      }
    );

    sectionRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [sections, scrollRef, onSectionVisible]);

  // Store ref for each section element
  const setSectionRef = useCallback((index: number, element: HTMLElement | null) => {
    if (element) {
      sectionRefs.current.set(index, element);
    } else {
      sectionRefs.current.delete(index);
    }
  }, []);

  return (
    <div
      className={cn(
        'h-full overflow-y-auto bg-background',
        isLoaded ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-200'
      )}
      ref={scrollRef}
      onDoubleClick={handleDoubleClick}
    >
      <div className="px-6 md:px-12 lg:px-20 xl:px-32 py-20 md:py-24">
        <div className="mx-auto" style={{ maxWidth: `${contentWidth}px` }}>
          {/* Show metadata at the top of the content */}
          {metadata && <MetadataDisplay metadata={metadata} />}
          {sections.map((section, index) => (
            <div
              key={section.id}
              ref={(el) => setSectionRef(index, el)}
              data-section-index={index}
              id={`section-${section.id}`}
              className={cn('scroll-section', index > 0 && 'pt-4 border-t border-border/30')}
            >
              <div
                className="prose prose-lg prose-invert max-w-none"
                style={{
                  fontSize: `${fontSize}px`,
                  lineHeight: lineHeight,
                }}
              >
                <CustomMarkdownRenderer
                  markdown={section.content}
                  className="fullscreen-card-content"
                  fontFamily={fontFamily}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScrollContentReader;
