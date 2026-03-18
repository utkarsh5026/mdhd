import React from 'react';

import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';

import { TEXT_SIZE_SCALE_CLASSES } from '../../utils/text-size-classes';

type HeadingProps = React.ComponentPropsWithoutRef<'h1' | 'h2' | 'h3' | 'h4' | 'h5'>;

interface HeadingRenderProps extends HeadingProps {
  level: 1 | 2 | 3 | 4 | 5;
}

const HeadingRender: React.FC<HeadingRenderProps> = ({
  level,
  children,
  className: externalClassName,
  ...props
}) => {
  const textSizeScale = useReadingSettingsStore((s) => s.settings.textSizeScale);

  const sizeKey = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

  const headingStyles: Record<1 | 2 | 3 | 4 | 5, string> = {
    1: [
      TEXT_SIZE_SCALE_CLASSES[sizeKey][textSizeScale],
      'font-bold',
      'mt-8 sm:mt-12 lg:mt-16',
      'mb-4 sm:mb-6 lg:mb-8',
      'leading-tight lg:leading-none',
      'tracking-tight sm:tracking-normal',
    ].join(' '),

    2: [
      TEXT_SIZE_SCALE_CLASSES[sizeKey][textSizeScale],
      'font-semibold',
      'mt-7 sm:mt-10 lg:mt-12',
      'mb-3 sm:mb-5 lg:mb-6',
      'leading-tight sm:leading-normal lg:leading-tight',
      'tracking-tight sm:tracking-normal',
    ].join(' '),

    3: [
      TEXT_SIZE_SCALE_CLASSES[sizeKey][textSizeScale],
      'font-medium',
      'mt-6 sm:mt-8 lg:mt-10',
      'mb-3 sm:mb-4 lg:mb-5',
      'leading-normal sm:leading-relaxed',
      'tracking-normal sm:tracking-wide',
    ].join(' '),

    4: [
      TEXT_SIZE_SCALE_CLASSES[sizeKey][textSizeScale],
      'font-medium',
      'mt-5 sm:mt-6 lg:mt-8',
      'mb-2 sm:mb-3 lg:mb-4',
      'leading-normal sm:leading-relaxed',
      'tracking-normal',
    ].join(' '),

    5: [
      TEXT_SIZE_SCALE_CLASSES[sizeKey][textSizeScale],
      'font-medium',
      'mt-4 sm:mt-5 lg:mt-6',
      'mb-2 sm:mb-3',
      'leading-normal',
      'tracking-wide uppercase',
    ].join(' '),
  };

  const sharedClasses = [
    'text-primary/98',
    'text-pretty break-words',
    'group',
    'selection:bg-primary/20',
    '[transition:color_200ms,font-size_300ms_ease-in-out,line-height_300ms_ease-in-out]',
    'hover:text-primary',
    'scroll-mt-20',
  ].join(' ');

  const className = `${headingStyles[level]} ${sharedClasses}${externalClassName ? ` ${externalClassName}` : ''}`;
  const HeadingTag = `h${level}` as React.ElementType;

  return (
    <HeadingTag {...props} className={className}>
      {children}
    </HeadingTag>
  );
};

export default HeadingRender;
