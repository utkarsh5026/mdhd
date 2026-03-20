import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';

import type { MarkdownSection } from '@/services/section/parsing';

import { usePresentationActions, usePresentationShowNotes } from '../store/presentation-store';
import PresentationSlide from './presentation-slide';
import PresenterNotesPanel from './presenter-notes-panel';
import SlideControls from './slide-controls';

interface PresentationModeProps {
  sections: MarkdownSection[];
  initialSlide?: number;
  onExit: () => void;
}

const PresentationMode: React.FC<PresentationModeProps> = memo(
  ({ sections, initialSlide = 0, onExit }) => {
    const [currentSlide, setCurrentSlide] = useState(initialSlide);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const transitionRef = useRef<ReturnType<typeof setTimeout>>(undefined);

    const showNotes = usePresentationShowNotes();
    const { toggleNotes, stopPresentation } = usePresentationActions();

    const total = sections.length;
    const currentSection = sections[currentSlide];

    const navigateTo = useCallback(
      (index: number) => {
        if (index < 0 || index >= total || index === currentSlide) return;
        setIsTransitioning(true);
        if (transitionRef.current) clearTimeout(transitionRef.current);
        transitionRef.current = setTimeout(() => {
          setCurrentSlide(index);
          setIsTransitioning(false);
        }, 150);
      },
      [total, currentSlide]
    );

    const goNext = useCallback(() => navigateTo(currentSlide + 1), [navigateTo, currentSlide]);
    const goPrev = useCallback(() => navigateTo(currentSlide - 1), [navigateTo, currentSlide]);

    const handleExit = useCallback(() => {
      stopPresentation();
      onExit();
    }, [stopPresentation, onExit]);

    // Keyboard navigation
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Don't capture if inside an input
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
          return;
        }

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
          case ' ':
            e.preventDefault();
            goNext();
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            goPrev();
            break;
          case 'Escape':
            e.preventDefault();
            handleExit();
            break;
          case 'n':
          case 'N':
            e.preventDefault();
            toggleNotes();
            break;
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goNext, goPrev, handleExit, toggleNotes]);

    useEffect(() => {
      return () => {
        if (transitionRef.current) clearTimeout(transitionRef.current);
      };
    }, []);

    // Swipe support
    const swipeHandlers = useSwipeable({
      onSwipedLeft: goNext,
      onSwipedRight: goPrev,
      delta: 50,
      preventScrollOnSwipe: true,
      trackTouch: true,
      trackMouse: false,
      swipeDuration: 500,
    });

    if (!currentSection) return null;

    return (
      <div className="fixed inset-0 z-60 flex flex-col bg-background text-foreground">
        {/* Slide area */}
        <div {...swipeHandlers} className="flex-1 min-h-0 overflow-hidden">
          <PresentationSlide section={currentSection} isTransitioning={isTransitioning} />
        </div>

        {/* Presenter notes */}
        <PresenterNotesPanel section={currentSection} visible={showNotes} />

        {/* Controls bar */}
        <SlideControls
          currentIndex={currentSlide}
          total={total}
          showNotes={showNotes}
          onPrevious={goPrev}
          onNext={goNext}
          onToggleNotes={toggleNotes}
          onExit={handleExit}
        />
      </div>
    );
  }
);

PresentationMode.displayName = 'PresentationMode';

export default PresentationMode;
