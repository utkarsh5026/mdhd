/* eslint-disable react-refresh/only-export-components */
import { ArrowRight, Braces, Check, Copy, ExternalLink, Image, Link, Play } from 'lucide-react';
import { memo, useCallback, useState } from 'react';

import {
  hasLanguageIcon,
  LanguageIcon,
} from '@/components/features/image-export/utils/language-icons';
import CodeMirrorDisplay from '@/components/features/markdown-render/components/renderers/codemirror-display';
import { useCodeThemeStore } from '@/components/features/settings/store/code-theme';
import { getThemeBackground } from '@/components/features/settings/store/codemirror-themes';
import { cn } from '@/lib/utils';
import type {
  CodeSnippet,
  ImageSnippet,
  LinkSnippet,
  Snippet,
  SnippetGroups,
  SnippetType,
  VideoSnippet,
} from '@/services/markdown/snippets';

export type ActiveTab = SnippetType;

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

interface SectionChipProps {
  sectionTitle: string;
  sectionIndex: number;
  onNavigate: (index: number) => void;
}

const SectionChip: React.FC<SectionChipProps> = memo(
  ({ sectionTitle, sectionIndex, onNavigate }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onNavigate(sectionIndex);
      }}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] shrink-0',
        'text-muted-foreground/60',
        'hover:text-primary hover:bg-primary/8',
        'transition-colors duration-150 max-w-40'
      )}
      title={`Go to "${sectionTitle}"`}
    >
      <span className="truncate">{sectionTitle || 'Intro'}</span>
      <ArrowRight className="w-2.5 h-2.5 shrink-0 opacity-60" />
    </button>
  )
);
SectionChip.displayName = 'SectionChip';

const CodeLangIcon: React.FC<{ language: string; className?: string }> = ({
  language,
  className,
}) => {
  if (hasLanguageIcon(language)) {
    return <LanguageIcon language={language} className={className} />;
  }
  return <Braces className={className} />;
};

const CodeRow: React.FC<{
  snippet: CodeSnippet;
  onClick: (s: Snippet) => void;
  onNavigate: (i: number) => void;
}> = ({ snippet, onClick, onNavigate }) => {
  const { selectedTheme } = useCodeThemeStore();
  const bg = getThemeBackground(selectedTheme);

  return (
    <button
      className={cn('w-full min-w-0 text-left px-3.5 py-3 group')}
      onClick={() => onClick(snippet)}
    >
      {/* Code preview block */}
      <div
        className="rounded-2xl overflow-hidden border border-border/30 text-[11px]  leading-relaxed min-w-0 group-hover:border-border/50 transition-colors"
        style={{ backgroundColor: bg }}
      >
        <pre className="px-3 py-2.5 text-foreground/70 whitespace-pre overflow-hidden max-w-full font-source-code-pro">
          {snippet.code
            .split('\n')
            .slice(0, 3)
            .map((line, i) => (
              <div key={i} className="truncate">
                <span className="inline-block w-5 text-right mr-2.5 text-muted-foreground/30 select-none text-[10px]">
                  {i + 1}
                </span>
                {line}
              </div>
            ))}
          {snippet.code.split('\n').length > 3 && (
            <div className="text-muted-foreground/30 pl-[1.9rem] text-[10px] mt-0.5">
              +{snippet.code.split('\n').length - 3} more
            </div>
          )}
        </pre>
      </div>

      {/* Meta row below code */}
      <div className="flex items-center gap-2 mt-2 px-0.5 min-w-0">
        <CodeLangIcon
          language={snippet.language}
          className="w-3 h-3 text-muted-foreground/50 shrink-0"
        />
        <span className="text-[10px] font-medium text-muted-foreground/60 font-mono">
          {snippet.language}
        </span>
        <span className="text-[10px] text-muted-foreground/30">
          {snippet.code.split('\n').length}L
        </span>
        <div className="ml-auto">
          <SectionChip
            sectionTitle={snippet.sectionTitle}
            sectionIndex={snippet.sectionIndex}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </button>
  );
};

const ImageRow: React.FC<{
  snippet: ImageSnippet;
  onClick: (s: Snippet) => void;
  onNavigate: (i: number) => void;
}> = ({ snippet, onClick, onNavigate }) => (
  <button
    className={cn('w-full min-w-0 text-left px-3.5 py-3 transition-all group')}
    onClick={() => onClick(snippet)}
  >
    {/* Image preview */}
    <div className="w-full max-h-64 rounded-2xl overflow-hidden bg-muted/20 border border-border/30 group-hover:border-border/50 transition-colors flex items-center justify-center p-2 cursor-pointer">
      <img
        src={snippet.src}
        alt={snippet.alt}
        className="w-full max-h-44 object-contain"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
        }}
      />
      <div className="hidden w-full h-24 items-center justify-center">
        <Image className="w-6 h-6 text-muted-foreground/20" />
      </div>
    </div>

    {/* Caption */}
    <div className="flex items-center gap-2 mt-1.5 px-0.5 min-w-0">
      <p className="text-[11px] text-muted-foreground/50 truncate min-w-0">
        {snippet.alt || domainOf(snippet.src)}
      </p>
      <div className="ml-auto">
        <SectionChip
          sectionTitle={snippet.sectionTitle}
          sectionIndex={snippet.sectionIndex}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  </button>
);

const VideoRow: React.FC<{
  snippet: VideoSnippet;
  onClick: (s: Snippet) => void;
  onNavigate: (i: number) => void;
}> = ({ snippet, onClick, onNavigate }) => (
  <button
    className={cn('w-full min-w-0 text-left px-3.5 py-3 group')}
    onClick={() => onClick(snippet)}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-lg bg-muted/40 shrink-0 flex items-center justify-center border border-border/30 group-hover:border-border/50 transition-colors">
        <Play className="w-3.5 h-3.5 text-muted-foreground/60 ml-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground/80 truncate">
          {snippet.isEmbed ? 'Embedded Video' : 'Video'}
        </p>
        <p className="text-[10px] text-muted-foreground/40 truncate mt-0.5">
          {domainOf(snippet.src)}
        </p>
      </div>
      <SectionChip
        sectionTitle={snippet.sectionTitle}
        sectionIndex={snippet.sectionIndex}
        onNavigate={onNavigate}
      />
    </div>
  </button>
);

const LinkRow: React.FC<{
  snippet: LinkSnippet;
  onClick: (s: Snippet) => void;
  onNavigate: (i: number) => void;
}> = ({ snippet, onClick, onNavigate }) => (
  <button
    className={cn(
      'w-full min-w-0 text-left px-3.5 py-3 transition-all group',
      'hover:bg-accent/40'
    )}
    onClick={() => onClick(snippet)}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-2xl bg-muted/40 shrink-0 flex items-center justify-center border border-border/30 group-hover:border-border/50 transition-colors">
        <Link className="w-3.5 h-3.5 text-muted-foreground/50" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground/80 truncate">{snippet.text}</p>
        <p className="text-[10px] text-muted-foreground/40 truncate mt-0.5">
          {domainOf(snippet.url)}
        </p>
      </div>
      <SectionChip
        sectionTitle={snippet.sectionTitle}
        sectionIndex={snippet.sectionIndex}
        onNavigate={onNavigate}
      />
    </div>
  </button>
);

interface SnippetRowProps {
  snippet: Snippet;
  onClick: (s: Snippet) => void;
  onNavigate: (i: number) => void;
}

export const SnippetRow: React.FC<SnippetRowProps> = ({ snippet, onClick, onNavigate }) => {
  if (snippet.type === 'code')
    return <CodeRow snippet={snippet} onClick={onClick} onNavigate={onNavigate} />;
  if (snippet.type === 'image')
    return <ImageRow snippet={snippet} onClick={onClick} onNavigate={onNavigate} />;
  if (snippet.type === 'video')
    return <VideoRow snippet={snippet} onClick={onClick} onNavigate={onNavigate} />;
  return <LinkRow snippet={snippet} onClick={onClick} onNavigate={onNavigate} />;
};

interface DetailHeaderProps {
  snippet: Snippet;
  onNavigate: (i: number) => void;
}

const DetailHeader: React.FC<DetailHeaderProps> = ({ snippet, onNavigate }) => (
  <div className="flex items-center px-4 py-2 border-b border-border/15 min-w-0">
    <span className="text-[10px] text-muted-foreground/40 shrink-0 mr-1.5">in</span>
    <SectionChip
      sectionTitle={snippet.sectionTitle}
      sectionIndex={snippet.sectionIndex}
      onNavigate={onNavigate}
    />
  </div>
);

const CodeDetail: React.FC<{ snippet: CodeSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);
  const { selectedTheme } = useCodeThemeStore();
  const bg = getThemeBackground(selectedTheme);

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(snippet.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [snippet.code]);

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      <DetailHeader snippet={snippet} onNavigate={onNavigate} />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-border/15 min-w-0">
        <div className="flex items-center gap-2">
          <CodeLangIcon
            language={snippet.language}
            className="w-3.5 h-3.5 text-muted-foreground/50"
          />
          <span className="text-[11px] text-muted-foreground/50 font-mono">{snippet.language}</span>
          <span className="text-[10px] text-muted-foreground/30">
            {snippet.code.split('\n').length} lines
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-muted-foreground/50 hover:text-foreground hover:bg-accent/40 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-green-500" />
              <span className="text-green-500">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* CodeMirror rendered code */}
      <div className="flex-1 overflow-auto min-w-0" style={{ backgroundColor: bg }}>
        <CodeMirrorDisplay
          code={snippet.code}
          language={snippet.language}
          themeKey={selectedTheme}
          showLineNumbers
          enableCodeFolding
          enableWordWrap={false}
          fontSize="0.8rem"
        />
      </div>
    </div>
  );
};

const ImageDetail: React.FC<{ snippet: ImageSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <div className="flex flex-col h-full min-w-0 overflow-hidden">
    <DetailHeader snippet={snippet} onNavigate={onNavigate} />
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 overflow-auto min-w-0 w-full">
      <div className="rounded-xl overflow-hidden border border-border/30 shadow-lg max-w-full min-w-0 w-full">
        <img
          src={snippet.src}
          alt={snippet.alt}
          className="w-full max-h-[55vh] object-contain block"
        />
      </div>
      {snippet.alt && (
        <p className="text-sm text-muted-foreground text-center max-w-xs">{snippet.alt}</p>
      )}
      <a
        href={snippet.src}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs',
          'bg-accent/60 text-foreground hover:bg-accent transition-colors'
        )}
      >
        <ExternalLink className="w-3 h-3" />
        Open original
      </a>
    </div>
  </div>
);

const VideoDetail: React.FC<{ snippet: VideoSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <div className="flex flex-col h-full min-w-0 overflow-hidden">
    <DetailHeader snippet={snippet} onNavigate={onNavigate} />
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 overflow-auto min-w-0">
      {snippet.isEmbed ? (
        <div className="w-full rounded-xl overflow-hidden border border-border/30 shadow-lg">
          <iframe
            src={snippet.src}
            className="w-full"
            style={{ aspectRatio: '16/9' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Embedded video"
          />
        </div>
      ) : (
        <video
          src={snippet.src}
          controls
          className="max-w-full max-h-[55vh] rounded-xl border border-border/30 shadow-lg"
        />
      )}
      <a
        href={snippet.src}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs',
          'bg-accent/60 text-foreground hover:bg-accent transition-colors'
        )}
      >
        <ExternalLink className="w-3 h-3" />
        {domainOf(snippet.src)}
      </a>
    </div>
  </div>
);

const LinkDetail: React.FC<{ snippet: LinkSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <div className="flex flex-col h-full min-w-0 overflow-hidden">
    <DetailHeader snippet={snippet} onNavigate={onNavigate} />
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 min-w-0">
      <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border/30 flex items-center justify-center">
        <Link className="w-5 h-5 text-muted-foreground/40" />
      </div>
      <div className="text-center space-y-1.5 max-w-sm min-w-0">
        <p className="text-sm text-foreground/80 leading-snug">{snippet.text}</p>
        <p className="text-[11px] text-muted-foreground/40 break-all leading-relaxed">
          {snippet.url}
        </p>
      </div>
      <a
        href={snippet.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs',
          'bg-accent/60 text-foreground hover:bg-accent',
          'transition-colors duration-150'
        )}
      >
        <ExternalLink className="w-3 h-3" />
        Open link
      </a>
    </div>
  </div>
);

export const SnippetDetail: React.FC<{ snippet: Snippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => {
  if (snippet.type === 'code') return <CodeDetail snippet={snippet} onNavigate={onNavigate} />;
  if (snippet.type === 'image') return <ImageDetail snippet={snippet} onNavigate={onNavigate} />;
  if (snippet.type === 'video') return <VideoDetail snippet={snippet} onNavigate={onNavigate} />;
  return <LinkDetail snippet={snippet} onNavigate={onNavigate} />;
};

export const TAB_CONFIG: Record<
  SnippetType,
  { label: string; Icon: React.FC<{ className?: string }> }
> = {
  code: { label: 'Code', Icon: Braces },
  image: { label: 'Images', Icon: Image },
  video: { label: 'Videos', Icon: Play },
  link: { label: 'Links', Icon: Link },
};

interface TypeTabsProps {
  groups: SnippetGroups;
  active: ActiveTab;
  onChange: (t: ActiveTab) => void;
}

export const TypeTabs: React.FC<TypeTabsProps> = ({ groups, active, onChange }) => {
  const visibleTabs = (Object.keys(TAB_CONFIG) as SnippetType[]).filter(
    (t) => groups[t].length > 0
  );

  return (
    <div className="flex gap-0.5 px-3 py-2 border-b border-border/15 overflow-x-auto shrink-0">
      {visibleTabs.map((type) => {
        const { label, Icon } = TAB_CONFIG[type];
        const count = groups[type].length;
        const isActive = active === type;
        return (
          <button
            key={type}
            onClick={() => onChange(type)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs whitespace-nowrap',
              'transition-colors duration-150',
              isActive
                ? 'text-foreground bg-accent/60'
                : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-accent/30'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
            <span className="text-[10px] opacity-50">{count}</span>
          </button>
        );
      })}
    </div>
  );
};
