import React, { useMemo, useState } from 'react';
import { List, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { useParagraphToList, splitChildrenIntoSentences } from '../../hooks/use-paragraph-to-list';
import { transformBionicChildren } from '../../hooks/use-bionic-transform';
import { TEXT_SIZE_SCALE_CLASSES } from '../../utils/text-size-classes';

/**
 * ParagraphRender Component
 *
 * Renders paragraph elements with enhanced typography and spacing for optimal readability.
 * Includes a toggle button (visible on hover) to switch between paragraph and list view,
 * which splits the text into individual sentences for enhanced scannability.
 */
const ParagraphRender: React.FC<React.ComponentPropsWithoutRef<'p'>> = ({ children, ...rest }) => {
  const bionicReading = useReadingSettingsStore((s) => s.settings.bionicReading);
  const sentenceFocusOnHover = useReadingSettingsStore((s) => s.settings.sentenceFocusOnHover);
  const textSizeScale = useReadingSettingsStore((s) => s.settings.textSizeScale);
  const { isListView, sentences, toggleListView } = useParagraphToList(children);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const focusSentences = useMemo(
    () => (sentenceFocusOnHover && !isListView ? splitChildrenIntoSentences(children) : []),
    [sentenceFocusOnHover, isListView, children]
  );

  const bionicChildren = useMemo(
    () => (bionicReading ? transformBionicChildren(children) : children),
    [bionicReading, children]
  );

  const paragraphClasses = [
    'text-foreground/92',
    'my-3 sm:my-5 lg:my-6',
    'leading-relaxed sm:leading-7 lg:leading-8',
    'text-pretty break-words',
    TEXT_SIZE_SCALE_CLASSES.paragraph[textSizeScale],
    'px-0',
    'first:mt-0 last:mb-0',
    'tracking-normal',
    'font-normal',
    '[transition:font-size_300ms_ease-in-out,line-height_300ms_ease-in-out]',
  ].join(' ');

  const toggleButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleListView}
      title={isListView ? 'Show as paragraph' : 'Show as list'}
      className="
        opacity-0 group-hover/para:opacity-100
        transition-opacity duration-200
        absolute -right-1 top-0
        h-6 w-6 p-0 rounded-lg
        hover:bg-primary/10 hover:text-primary
        text-muted-foreground
        cursor-pointer
      "
    >
      {isListView ? <AlignLeft className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
    </Button>
  );

  if (isListView) {
    const listBaseClasses = [
      'my-3 sm:my-5',
      'ml-5 sm:ml-7 lg:ml-8',
      'space-y-1.5 sm:space-y-2.5',
      TEXT_SIZE_SCALE_CLASSES.paragraph[textSizeScale],
      '[transition:font-size_300ms_ease-in-out]',
      'leading-relaxed sm:leading-7',
      'text-pretty break-words',
      'list-disc marker:text-primary/70 text-foreground/92',
      'first:mt-0 last:mb-0',
    ].join(' ');

    const listItemClasses = [
      'pl-1 sm:pl-2',
      'leading-relaxed sm:leading-7',
      'text-foreground/92',
      'break-words text-pretty',
    ].join(' ');

    return (
      <div className="relative group/para">
        {toggleButton}
        <ul className={listBaseClasses}>
          {sentences.map((sentence, i) => (
            <li key={i} className={listItemClasses}>
              {bionicReading ? transformBionicChildren(sentence) : sentence}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const showSentenceFocus = focusSentences.length > 1;

  return (
    <div className="relative group/para">
      {toggleButton}
      <p
        {...rest}
        className={paragraphClasses}
        onMouseLeave={showSentenceFocus ? () => setFocusedIndex(null) : undefined}
      >
        {showSentenceFocus
          ? focusSentences.map((sentence, i) => (
              <span
                key={i}
                onMouseEnter={() => setFocusedIndex(i)}
                className={`transition-opacity duration-150 ${
                  focusedIndex !== null && focusedIndex !== i ? 'opacity-30' : 'opacity-100'
                }`}
              >
                {bionicReading ? transformBionicChildren(sentence) : sentence}
                {i < focusSentences.length - 1 ? ' ' : ''}
              </span>
            ))
          : bionicChildren}
      </p>
    </div>
  );
};

export default ParagraphRender;
