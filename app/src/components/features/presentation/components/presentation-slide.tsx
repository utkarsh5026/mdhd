import { memo, useMemo } from 'react';

import CustomMarkdownRenderer from '@/components/features/markdown-render/components/markdown-render';
import { useReadingSettings } from '@/components/features/settings/store/reading-settings-store';
import { fontFamilyMap } from '@/lib/font';
import { cn } from '@/lib/utils';
import type { MarkdownSection } from '@/services/section/parsing';

import { parsePresenterNotes } from '../utils/parse-notes';

interface PresentationSlideProps {
  section: MarkdownSection;
  isTransitioning: boolean;
}

const PresentationSlide: React.FC<PresentationSlideProps> = memo(({ section, isTransitioning }) => {
  const { settings } = useReadingSettings();
  const fontFamily = fontFamilyMap[settings.fontFamily];

  const { slideMarkdown } = useMemo(() => parsePresenterNotes(section.content), [section.content]);

  return (
    <div
      className={cn(
        'flex items-center justify-center h-full w-full overflow-y-auto',
        isTransitioning ? 'opacity-0' : 'opacity-100',
        'transition-opacity duration-200'
      )}
    >
      <div className="w-full max-w-4xl px-12 py-16">
        <div
          className="prose prose-xl prose-invert max-w-none
              prose-headings:text-center prose-headings:mb-8
              prose-h1:text-5xl prose-h2:text-4xl prose-h3:text-3xl
              prose-p:text-2xl prose-li:text-xl
              prose-blockquote:text-xl prose-blockquote:border-primary/40"
        >
          <CustomMarkdownRenderer markdown={slideMarkdown} fontFamily={fontFamily} />
        </div>
      </div>
    </div>
  );
});

PresentationSlide.displayName = 'PresentationSlide';

export default PresentationSlide;
