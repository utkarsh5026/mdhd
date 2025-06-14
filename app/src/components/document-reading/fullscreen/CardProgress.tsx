import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { MoreHorizontal } from "lucide-react";

interface CardProgressProps {
  currentIndex: number;
  totalCards: number;
  onSelectCard?: (index: number) => void;
  className?: string;
}

const MAX_VISIBLE_DOTS = 7;

/**
 * CardProgress component displays a progress indicator for card navigation
 * Shows dots representing each card with the current card highlighted
 * For large numbers of cards, it shows a subset with ellipses
 * Also displays the current position (e.g., "3 / 10")
 *
 * @param {number} currentIndex - Zero-based index of the current card
 * @param {number} totalCards - Total number of cards in the collection
 * @param {function} onSelectCard - Optional callback when a card dot is clicked
 * @param {string} className - Optional CSS class name for styling
 */
const CardProgress: React.FC<CardProgressProps> = ({
  currentIndex,
  totalCards,
  onSelectCard,
  className,
}) => {
  /**
   * Determines if all dots should be shown based on the total number of cards
   * @returns {boolean} True if all dots should be displayed
   */
  const showAllDots = useMemo(
    () => totalCards <= MAX_VISIBLE_DOTS,
    [totalCards]
  );

  /**
   * Calculates which dots to display in the progress indicator
   * For small collections, shows all dots
   * For large collections, shows first, last, current, and adjacent dots with ellipses
   *
   * @returns {Array<{index: number, isEllipsis?: boolean}>} Array of dot objects to render
   */
  const dotsToShow = useMemo(() => {
    const dotsToShow: Array<{ index: number; isEllipsis?: boolean }> = [];

    if (showAllDots) {
      return Array.from({ length: totalCards }, (_, i) => ({
        index: i,
        isEllipsis: false,
      }));
    }

    const startSlice = Math.max(0, currentIndex - 1);
    const endSlice = Math.min(totalCards - 1, currentIndex + 1);

    dotsToShow.push({ index: 0 });
    if (startSlice > 1) {
      dotsToShow.push({ index: -1, isEllipsis: true });
    }

    for (let i = startSlice; i <= endSlice; i++) {
      if (i !== 0 && i !== totalCards - 1) dotsToShow.push({ index: i });
    }

    if (endSlice < totalCards - 2) {
      dotsToShow.push({ index: -2, isEllipsis: true });
    }

    if (totalCards > 1) {
      dotsToShow.push({ index: totalCards - 1 });
    }
    return dotsToShow;
  }, [currentIndex, totalCards, showAllDots]);

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex items-center space-x-1.5">
        {dotsToShow.map((dot, i) => {
          if (dot.isEllipsis) {
            return (
              <div
                key={`ellipsis-${i}-${dot.index}`}
                className="text-muted-foreground px-0.5"
              >
                <MoreHorizontal className="h-3 w-3" />
              </div>
            );
          }

          const isActive = dot.index === currentIndex;
          return (
            <button
              key={dot.index}
              onClick={() => onSelectCard && onSelectCard(dot.index)}
              className={cn(
                "transition-all duration-200 rounded-full",
                isActive
                  ? "h-2.5 w-8 bg-primary"
                  : "h-2.5 w-2.5 bg-secondary hover:bg-secondary-foreground/20",
                onSelectCard && "cursor-pointer"
              )}
              aria-label={`Go to card ${dot.index + 1}`}
              disabled={isActive}
            />
          );
        })}
      </div>

      <div className="ml-3 text-xs text-muted-foreground font-cascadia-code">
        {currentIndex + 1} / {totalCards}
      </div>
    </div>
  );
};

export default CardProgress;
