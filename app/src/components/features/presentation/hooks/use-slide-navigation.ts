import { useCallback, useEffect, useRef, useState } from 'react';

import type { MarkdownSection } from '@/services/section/parsing';

import type { SlideDirection } from '../components/presentation-slide';

interface UseSlideNavigationOptions {
  sections: MarkdownSection[];
  initialSlide?: number;
}

export function useSlideNavigation({ sections, initialSlide = 0 }: UseSlideNavigationOptions) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<SlideDirection>('none');
  const transitionRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const total = sections.length;
  const currentSection = sections[currentSlide];

  const navigateTo = useCallback(
    (index: number, dir: SlideDirection = 'none') => {
      if (index < 0 || index >= total || index === currentSlide || isTransitioning) return;
      setDirection(dir);
      setIsTransitioning(true);
      if (transitionRef.current) clearTimeout(transitionRef.current);
      transitionRef.current = setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, 250);
    },
    [total, currentSlide, isTransitioning]
  );

  const goNext = useCallback(
    () => navigateTo(currentSlide + 1, 'left'),
    [navigateTo, currentSlide]
  );
  const goPrev = useCallback(
    () => navigateTo(currentSlide - 1, 'right'),
    [navigateTo, currentSlide]
  );

  const jumpToSlide = useCallback(
    (index: number) => {
      if (index === currentSlide) return;
      const dir: SlideDirection = index > currentSlide ? 'left' : 'right';
      navigateTo(index, dir);
    },
    [navigateTo, currentSlide]
  );

  useEffect(() => {
    return () => {
      if (transitionRef.current) clearTimeout(transitionRef.current);
    };
  }, []);

  return {
    currentSlide,
    currentSection,
    total,
    isTransitioning,
    direction,
    goNext,
    goPrev,
    jumpToSlide,
  };
}
