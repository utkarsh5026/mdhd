import { RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import {
  useReadingSettings,
  useReadingSettingsStore,
} from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import { cn } from '@/lib/utils';

import { useReadingContent, useReadingSections } from '../../hooks';
import { READER_PADDING_CLASSES } from '.';
import MetadataDisplay from './metadata-display';

interface ScrollContentReaderProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  handleDoubleClick: () => void;
  onScrollProgress: (progress: number) => void;
  onSectionVisible: (index: number) => void;
  onSectionClick?: (sectionIndex: number) => void;
}

const ScrollContentReader: React.FC<ScrollContentReaderProps> = ({
  scrollRef,
  handleDoubleClick,
  onScrollProgress,
  onSectionVisible,
  onSectionClick,
}) => {
  const sections = useReadingSections();
  const { metadata } = useReadingContent();
  const { settings } = useReadingSettings();
  const fontFamily = fontFamilyMap[settings.fontFamily];
  const { fontSize, lineHeight, contentWidth } = settings;
  const hasCustomBackground =
    useReadingSettingsStore((s) => s.settings.background.backgroundType) !== 'theme';
  const sectionRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [isLoaded, setIsLoaded] = useState(false);

  const onSectionVisibleRef = useRef(onSectionVisible);
  const onScrollProgressRef = useRef(onScrollProgress);
  onSectionVisibleRef.current = onSectionVisible;
  onScrollProgressRef.current = onScrollProgress;

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    if (maxScroll <= 0) {
      onScrollProgressRef.current(100);
      return;
    }
    const progress = (scrollTop / maxScroll) * 100;
    onScrollProgressRef.current(Math.min(100, Math.max(0, progress)));
  }, [scrollRef]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollRef, handleScroll]);

  const sectionsCount = useMemo(() => sections.length, [sections]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
            const index = parseInt(entry.target.getAttribute('data-section-index') ?? '0', 10);
            onSectionVisibleRef.current(index);
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
  }, [sectionsCount, scrollRef]);

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
        'h-full overflow-y-auto',
        !hasCustomBackground && 'bg-background',
        isLoaded ? 'opacity-100' : 'opacity-0',
        'transition-opacity duration-200'
      )}
      ref={scrollRef}
      onDoubleClick={handleDoubleClick}
    >
      <div className={READER_PADDING_CLASSES}>
        <div
          className={cn(
            'mx-auto',
            hasCustomBackground && 'bg-background/80 backdrop-blur-sm rounded-2xl p-6'
          )}
          style={{ maxWidth: `${contentWidth}px` }}
        >
          {/* Show metadata at the top of the content */}
          {metadata && <MetadataDisplay metadata={metadata} />}
          {sections.map((section, index) => (
            <div
              key={section.id}
              ref={(el) => setSectionRef(index, el)}
              data-section-index={index}
              id={`section-${section.id}`}
              className={cn('scroll-section', index > 0 && 'pt-4 border-t border-border/30')}
              onClick={(e) => {
                if (onSectionClick && !(e.target instanceof HTMLAnchorElement)) {
                  onSectionClick(index);
                }
              }}
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
