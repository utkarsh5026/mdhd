import { memo } from 'react';
import { useSwipeable } from 'react-swipeable';

import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import { useControlsVisibility } from '../hooks/use-controls-visibility';
import { useSlideKeyboard } from '../hooks/use-slide-keyboard';
import { useSlideNavigation } from '../hooks/use-slide-navigation';
import {
  usePresentationActions,
  usePresentationShowFilmstrip,
  usePresentationShowNotes,
  usePresentationShowOverview,
  usePresentationStartTime,
} from '../store/presentation-store';
import PresentationSlide from './presentation-slide';
import PresenterNotesPanel from './presenter-notes-panel';
import SlideControls from './slide-controls';
import SlideFilmstrip from './slide-filmstrip';
import SlideOverview from './slide-overview';

interface PresentationModeProps {
  sections: MarkdownSection[];
  initialSlide?: number;
  onExit: () => void;
}

const PresentationMode: React.FC<PresentationModeProps> = memo(
  ({ sections, initialSlide = 0, onExit }) => {
    const {
      currentSlide,
      currentSection,
      total,
      isTransitioning,
      direction,
      goNext,
      goPrev,
      jumpToSlide,
    } = useSlideNavigation({ sections, initialSlide });
    const { controlsVisible, cursorHidden, hideControls } = useControlsVisibility(currentSlide);
    const { handleExit } = useSlideKeyboard({ goNext, goPrev, onExit });

    const showNotes = usePresentationShowNotes();
    const showOverview = usePresentationShowOverview();
    const showFilmstrip = usePresentationShowFilmstrip();
    const startTime = usePresentationStartTime();
    const { toggleNotes, toggleOverview, toggleFilmstrip } = usePresentationActions();

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
      <div
        className={cn(
          'fixed inset-0 z-60 flex flex-col bg-background text-foreground',
          cursorHidden && 'cursor-none'
        )}
      >
        {/* Slide area — clicking here hides the controls bar */}
        <div {...swipeHandlers} className="flex-1 min-h-0 overflow-hidden" onClick={hideControls}>
          <PresentationSlide
            section={currentSection}
            isTransitioning={isTransitioning}
            direction={direction}
          />
        </div>

        {/* Presenter notes */}
        <PresenterNotesPanel section={currentSection} visible={showNotes} />

        <div
          className="absolute bottom-0 left-0 right-0 z-10 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <SlideFilmstrip
            sections={sections}
            currentIndex={currentSlide}
            visible={controlsVisible && showFilmstrip}
            onSelect={jumpToSlide}
          />

          <SlideControls
            currentIndex={currentSlide}
            total={total}
            showNotes={showNotes}
            showFilmstrip={showFilmstrip}
            startTime={startTime}
            visible={controlsVisible}
            onPrevious={goPrev}
            onNext={goNext}
            onToggleNotes={toggleNotes}
            onToggleOverview={toggleOverview}
            onToggleFilmstrip={toggleFilmstrip}
            onExit={handleExit}
          />
        </div>

        {/* Slide overview grid */}
        {showOverview && (
          <SlideOverview
            sections={sections}
            currentIndex={currentSlide}
            onSelect={jumpToSlide}
            onClose={toggleOverview}
          />
        )}
      </div>
    );
  }
);

PresentationMode.displayName = 'PresentationMode';

export default PresentationMode;
