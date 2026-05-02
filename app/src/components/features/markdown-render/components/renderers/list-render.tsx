import React from 'react';

import { useMarkdownStyleStore } from '@/components/features/markdown-style/store/markdown-style-store';

import { useBionicTransform } from '../../hooks/use-bionic-transform';
import {
  useBodyFontWeight,
  useSpacing,
  useTextSizeScale,
} from '../../hooks/use-typography-settings';
import { TEXT_SIZE_SCALE_CLASSES } from '../../utils/text-size-classes';
import {
  BODY_FONT_WEIGHT_CLASSES,
  LETTER_SPACING_CLASSES,
  PARAGRAPH_SPACING_CLASSES,
  WORD_SPACING_CLASSES,
} from '../../utils/typography-classes';

type ListProps =
  | { type: 'ul'; props: React.ComponentPropsWithoutRef<'ul'> }
  | { type: 'ol'; props: React.ComponentPropsWithoutRef<'ol'> }
  | { type: 'li'; props: React.ComponentPropsWithoutRef<'li'> };

/**
 * ListRender Component
 *
 * Renders lists with enhanced typography and spacing for optimal readability.
 * Features responsive design, improved visual hierarchy, and better contrast.
 * Optimized for both mobile and desktop viewing experiences.
 */
const UL_LIST_STYLE_TYPE: Record<string, string> = {
  disc: 'disc',
  dash: '"– "',
  arrow: '"→ "',
  none: 'none',
};

const OL_LIST_STYLE_TYPE: Record<string, string> = {
  decimal: 'decimal',
  roman: 'lower-roman',
  alpha: 'lower-alpha',
};

const ListRender: React.FC<ListProps> = ({ type, props }) => {
  const bionicChildren = useBionicTransform(type === 'li' ? props.children : undefined);
  const textSizeScale = useTextSizeScale();
  const { letterSpacing, wordSpacing, paragraphSpacing } = useSpacing();
  const bodyFontWeight = useBodyFontWeight();
  const unorderedListMarker = useMarkdownStyleStore((s) => s.settings.unorderedListMarker);
  const orderedListMarker = useMarkdownStyleStore((s) => s.settings.orderedListMarker);

  const baseListClasses = [
    PARAGRAPH_SPACING_CLASSES[paragraphSpacing],
    'ml-5 sm:ml-7 lg:ml-8',
    'space-y-1.5 sm:space-y-2.5',
    TEXT_SIZE_SCALE_CLASSES.paragraph[textSizeScale],
    '[transition:font-size_300ms_ease-in-out]',
    'leading-relaxed sm:leading-7',
    'text-pretty break-words',
  ].join(' ');

  const listItemClasses = [
    'pl-1 sm:pl-2',
    'leading-relaxed sm:leading-7',
    'text-foreground/92',
    'break-words text-pretty',
    'mb-1 sm:mb-2',
    LETTER_SPACING_CLASSES[letterSpacing],
    WORD_SPACING_CLASSES[wordSpacing],
    BODY_FONT_WEIGHT_CLASSES[bodyFontWeight],
  ].join(' ');

  if (type === 'ul') {
    return (
      <ul
        {...props}
        className={`${baseListClasses} marker:text-primary/70 text-foreground/92`}
        style={{ listStyleType: UL_LIST_STYLE_TYPE[unorderedListMarker] }}
      />
    );
  }

  if (type === 'ol') {
    return (
      <ol
        {...props}
        className={`${baseListClasses} marker:text-primary/70 marker:font-medium text-foreground/92`}
        style={{ listStyleType: OL_LIST_STYLE_TYPE[orderedListMarker] }}
      />
    );
  }

  return (
    <li {...props} className={listItemClasses}>
      {bionicChildren}
    </li>
  );
};

export default ListRender;
