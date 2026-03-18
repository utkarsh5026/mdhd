import React from 'react';
import { useBionicTransform } from '../../hooks/use-bionic-transform';
import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { TEXT_SIZE_SCALE_CLASSES } from '../../utils/text-size-classes';

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
const ListRender: React.FC<ListProps> = ({ type, props }) => {
  const bionicChildren = useBionicTransform(type === 'li' ? props.children : undefined);
  const textSizeScale = useReadingSettingsStore((s) => s.settings.textSizeScale);

  const baseListClasses = [
    'my-3 sm:my-5',
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
    // Improved contrast: 85% -> 92% to match paragraphs
    'text-foreground/92',
    'break-words text-pretty',
    'mb-1 sm:mb-2',
  ].join(' ');

  if (type === 'ul') {
    return (
      <ul
        {...props}
        className={`${baseListClasses} list-disc marker:text-primary/70 text-foreground/92`}
      />
    );
  }

  if (type === 'ol') {
    return (
      <ol
        {...props}
        className={`${baseListClasses} list-decimal marker:text-primary/70 marker:font-medium text-foreground/92`}
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
