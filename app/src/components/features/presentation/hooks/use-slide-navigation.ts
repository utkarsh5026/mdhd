import { useCallback, useEffect, useRef, useState } from 'react';

import type { MarkdownSection } from '@/services/section/parsing';

import type { SlideDirection } from '../store/types';

const TRANSITION_DURATION_MS = 200;

interface UseSlideNavigationOptions {
  sections: MarkdownSection[];
  initialSlide?: number;
}

export function useSlideNavigation({ sections, initialSlide = 0 }: UseSlideNavigationOptions) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<SlideDirection>('none');
  const transitionRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const currentSlideRef = useRef(currentSlide);
  const isTransitioningRef = useRef(isTransitioning);

  currentSlideRef.current = currentSlide;
  isTransitioningRef.current = isTransitioning;

  const total = sections.length;
  const currentSection = sections[currentSlide];

  const navigateTo = useCallback(
    (index: number, dir: SlideDirection = 'none') => {
      if (
        index < 0 ||
        index >= total ||
        index === currentSlideRef.current ||
        isTransitioningRef.current
      )
        return;
      setDirection(dir);
      setIsTransitioning(true);
      if (transitionRef.current) clearTimeout(transitionRef.current);
      transitionRef.current = setTimeout(() => {
        setCurrentSlide(index);
        setIsTransitioning(false);
      }, TRANSITION_DURATION_MS);
    },
    [total]
  );

  const goNext = useCallback(() => navigateTo(currentSlideRef.current + 1, 'left'), [navigateTo]);
  const goPrev = useCallback(() => navigateTo(currentSlideRef.current - 1, 'right'), [navigateTo]);

  const jumpToSlide = useCallback(
    (index: number) => {
      if (index === currentSlideRef.current) return;
      const dir: SlideDirection = index > currentSlideRef.current ? 'left' : 'right';
      navigateTo(index, dir);
    },
    [navigateTo]
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
