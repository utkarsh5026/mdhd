import { ArrowRight, Braces, Check, Copy, ExternalLink, Image, Link, Play } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { toast } from 'sonner';

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
  SnippetType,
  VideoSnippet,
} from '@/services/markdown/snippets';
import { tryCatch } from '@/utils/functions/error';

export type ActiveTab = SnippetType;

const domainOf = (url: string): string =>
  tryCatch(() => new URL(url).hostname.replace(/^www\./, ''), url);

interface SectionDividerProps {
  sectionTitle: string;
  sectionIndex: number;
  count: number;
  onNavigate: (index: number) => void;
}

export const SectionDivider: React.FC<SectionDividerProps> = memo(
  ({ sectionTitle, sectionIndex, count, onNavigate }) => (
    <button
      onClick={() => onNavigate(sectionIndex)}
      className={cn(
        'w-full flex items-center gap-2.5 px-3.5 py-2.5 mt-1 first:mt-0 text-left',
        'bg-muted/15 hover:bg-accent/30 transition-colors duration-150 group/divider',
        'border-t border-border/15'
      )}
      title={`Go to "${sectionTitle || 'Intro'}"`}
    >
      <span className="text-[12px] font-semibold text-foreground/70 truncate group-hover/divider:text-foreground/90 transition-colors">
        {sectionTitle || 'Intro'}
      </span>
      <span className="flex-1" />
      <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0 bg-muted/40 px-1.5 py-0.5 rounded-full">
        {count}
      </span>
      <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0 opacity-0 group-hover/divider:opacity-100 transition-opacity" />
    </button>
  )
);
SectionDivider.displayName = 'SectionDivider';

const CodeLangIcon: React.FC<{ language: string; className?: string }> = ({
  language,
  className,
}) => {
  if (hasLanguageIcon(language)) {
    return <LanguageIcon language={language} className={className} />;
  }
  return <Braces className={className} />;
};

const SnippetRowWrapper: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({
  onClick,
  children,
}) => (
  <button
    className={cn(
      'w-full min-w-0 text-left px-3 py-2.5 group',
      'hover:bg-accent/30 transition-colors duration-200'
    )}
    onClick={onClick}
  >
    {children}
  </button>
);

const DetailHeader: React.FC<{ snippet: Snippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <button
    onClick={() => onNavigate(snippet.sectionIndex)}
    className={cn(
      'flex items-center gap-1.5 px-4 py-2.5 border-b border-border/10 min-w-0 bg-muted/5 w-full text-left',
      'hover:bg-muted/15 transition-colors duration-150 group/detail-header'
    )}
    title={`Go to "${snippet.sectionTitle || 'Intro'}"`}
  >
    <span className="text-[10px] text-muted-foreground/35 shrink-0">in</span>
    <span className="text-[11px] font-medium text-muted-foreground/60 truncate group-hover/detail-header:text-foreground/70 transition-colors">
      {snippet.sectionTitle || 'Intro'}
    </span>
    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground/25 shrink-0 opacity-0 group-hover/detail-header:opacity-100 transition-opacity" />
  </button>
);

const SnippetDetailWrapper: React.FC<{
  snippet: Snippet;
  onNavigate: (i: number) => void;
  children: React.ReactNode;
}> = ({ snippet, onNavigate, children }) => (
  <div className="flex flex-col h-full min-w-0 overflow-hidden">
    <DetailHeader snippet={snippet} onNavigate={onNavigate} />
    {children}
  </div>
);

const ExternalLinkButton: React.FC<{ href: string; label: string }> = ({ href, label }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className={cn(
      'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium',
      'bg-accent/50 text-foreground/80 hover:bg-accent/70 hover:text-foreground',
      'ring-1 ring-border/15 transition-all duration-200'
    )}
  >
    <ExternalLink className="w-3 h-3" />
    {label}
  </a>
);

const CodeRow: React.FC<{
  snippet: CodeSnippet;
  onClick: (s: Snippet) => void;
}> = ({ snippet, onClick }) => {
  const { selectedTheme } = useCodeThemeStore();
  const bg = getThemeBackground(selectedTheme);
  const lineCount = snippet.code.split('\n').length;

  return (
    <SnippetRowWrapper onClick={() => onClick(snippet)}>
      <div
        className={cn(
          'rounded-2xl overflow-hidden min-w-0',
          'ring-1 ring-border/20 group-hover:ring-border/40',
          'transition-all duration-200 relative'
        )}
        style={{ backgroundColor: bg }}
      >
        {/* Window-style header bar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
          <div className="flex items-center gap-1.5 ml-1">
            <CodeLangIcon
              language={snippet.language}
              className="w-3 h-3 text-muted-foreground/40 shrink-0"
            />
            <span className="text-[10px] font-medium text-muted-foreground/40 font-mono uppercase tracking-wide">
              {snippet.language}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/25 tabular-nums ml-auto">
            {lineCount} lines
          </span>
        </div>

        {/* Code preview */}
        <pre className="px-3 py-2.5 text-[11px] leading-relaxed text-foreground/70 whitespace-pre overflow-hidden max-w-full font-source-code-pro">
          {snippet.code
            .split('\n')
            .slice(0, 4)
            .map((line, i) => (
              <div key={i} className="truncate">
                <span className="inline-block w-5 text-right mr-2.5 text-muted-foreground/20 select-none text-[10px]">
                  {i + 1}
                </span>
                {line}
              </div>
            ))}
        </pre>
        {lineCount > 4 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{
              background: `linear-gradient(to bottom, transparent, ${bg})`,
            }}
          />
        )}
      </div>
    </SnippetRowWrapper>
  );
};

const ImageRow: React.FC<{
  snippet: ImageSnippet;
  onClick: (s: Snippet) => void;
}> = ({ snippet, onClick }) => (
  <SnippetRowWrapper onClick={() => onClick(snippet)}>
    <div
      className={cn(
        'w-full rounded-xl overflow-hidden',
        'ring-1 ring-border/20 group-hover:ring-border/40',
        'bg-muted/10 transition-all duration-200',
        'flex items-center justify-center'
      )}
    >
      <img
        src={snippet.src}
        alt={snippet.alt}
        className="w-full max-h-48 object-contain p-2"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement | null)?.classList.remove('hidden');
        }}
      />
      <div className="hidden w-full h-28 items-center justify-center">
        <Image className="w-6 h-6 text-muted-foreground/15" />
      </div>
    </div>

    <div className="flex items-center gap-2 mt-1.5 px-0.5 min-w-0">
      <Image className="w-2.5 h-2.5 text-muted-foreground/30 shrink-0" />
      <p className="text-[10px] text-muted-foreground/45 truncate min-w-0">
        {snippet.alt || domainOf(snippet.src)}
      </p>
    </div>
  </SnippetRowWrapper>
);

const VideoRow: React.FC<{
  snippet: VideoSnippet;
  onClick: (s: Snippet) => void;
}> = ({ snippet, onClick }) => (
  <SnippetRowWrapper onClick={() => onClick(snippet)}>
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={cn(
          'w-10 h-10 rounded-xl shrink-0 flex items-center justify-center',
          'bg-muted/25 ring-1 ring-border/20 group-hover:ring-border/40',
          'transition-all duration-200'
        )}
      >
        <Play className="w-3.5 h-3.5 text-muted-foreground/50 ml-0.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-foreground/75 truncate font-medium">
          {snippet.isEmbed ? 'Embedded Video' : 'Video'}
        </p>
        <p className="text-[10px] text-muted-foreground/35 truncate mt-0.5">
          {domainOf(snippet.src)}
        </p>
      </div>
    </div>
  </SnippetRowWrapper>
);

const LinkRow: React.FC<{
  snippet: LinkSnippet;
  onClick: (s: Snippet) => void;
}> = ({ snippet, onClick }) => (
  <SnippetRowWrapper onClick={() => onClick(snippet)}>
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={cn(
          'w-8 h-8 rounded-lg shrink-0 flex items-center justify-center',
          'bg-muted/25 ring-1 ring-border/20 group-hover:ring-border/40',
          'transition-all duration-200'
        )}
      >
        <Link className="w-3.5 h-3.5 text-muted-foreground/45" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-foreground/75 truncate font-medium">{snippet.text}</p>
        <p className="text-[10px] text-muted-foreground/35 truncate mt-0.5">
          {domainOf(snippet.url)}
        </p>
      </div>
    </div>
  </SnippetRowWrapper>
);

const CodeDetail: React.FC<{ snippet: CodeSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => {
  const [copied, setCopied] = useState(false);
  const { selectedTheme } = useCodeThemeStore();
  const bg = getThemeBackground(selectedTheme);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(snippet.code).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {
        toast.error('Failed to copy');
      }
    );
  }, [snippet.code]);

  return (
    <SnippetDetailWrapper snippet={snippet} onNavigate={onNavigate}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/10 min-w-0">
        <div className="flex items-center gap-2">
          <CodeLangIcon
            language={snippet.language}
            className="w-3.5 h-3.5 text-muted-foreground/50"
          />
          <span className="text-[11px] text-muted-foreground/50 font-mono">{snippet.language}</span>
          <span className="w-px h-3 bg-border/20" />
          <span className="text-[10px] text-muted-foreground/30 tabular-nums">
            {snippet.code.split('\n').length} lines
          </span>
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px]',
            'transition-all duration-200',
            copied
              ? 'text-green-500 bg-green-500/8'
              : 'text-muted-foreground/50 hover:text-foreground hover:bg-accent/50'
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>

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
    </SnippetDetailWrapper>
  );
};

const ImageDetail: React.FC<{ snippet: ImageSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <SnippetDetailWrapper snippet={snippet} onNavigate={onNavigate}>
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 overflow-auto min-w-0 w-full">
      <div className="rounded-xl overflow-hidden ring-1 ring-border/20 shadow-lg shadow-black/5 max-w-full min-w-0 w-full">
        <img
          src={snippet.src}
          alt={snippet.alt}
          className="w-full max-h-[55vh] object-contain block"
        />
      </div>
      {snippet.alt && (
        <p className="text-[13px] text-muted-foreground/60 text-center max-w-xs leading-relaxed">
          {snippet.alt}
        </p>
      )}
      <ExternalLinkButton href={snippet.src} label="Open original" />
    </div>
  </SnippetDetailWrapper>
);

const VideoDetail: React.FC<{ snippet: VideoSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <SnippetDetailWrapper snippet={snippet} onNavigate={onNavigate}>
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-4 overflow-auto min-w-0">
      {snippet.isEmbed ? (
        <div className="w-full rounded-xl overflow-hidden ring-1 ring-border/20 shadow-lg shadow-black/5">
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
          className="max-w-full max-h-[55vh] rounded-xl ring-1 ring-border/20 shadow-lg shadow-black/5"
        />
      )}
      <ExternalLinkButton href={snippet.src} label={domainOf(snippet.src)} />
    </div>
  </SnippetDetailWrapper>
);

const LinkDetail: React.FC<{ snippet: LinkSnippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => (
  <SnippetDetailWrapper snippet={snippet} onNavigate={onNavigate}>
    <div className="flex-1 flex flex-col items-center justify-center gap-5 p-6 min-w-0">
      <div
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center',
          'bg-muted/20 ring-1 ring-border/20'
        )}
      >
        <Link className="w-5 h-5 text-muted-foreground/35" />
      </div>
      <div className="text-center space-y-2 max-w-sm min-w-0">
        <p className="text-sm text-foreground/80 leading-snug font-medium">{snippet.text}</p>
        <p className="text-[11px] text-muted-foreground/35 break-all leading-relaxed">
          {snippet.url}
        </p>
      </div>
      <ExternalLinkButton href={snippet.url} label="Open link" />
    </div>
  </SnippetDetailWrapper>
);

interface SnippetRowProps {
  snippet: Snippet;
  onClick: (s: Snippet) => void;
}

const ROW_REGISTRY = {
  code: CodeRow,
  image: ImageRow,
  video: VideoRow,
  link: LinkRow,
} satisfies Record<SnippetType, React.FC<{ snippet: never; onClick: (s: Snippet) => void }>>;

export const SnippetRow: React.FC<SnippetRowProps> = ({ snippet, onClick }) => {
  const Row = ROW_REGISTRY[snippet.type] as React.FC<SnippetRowProps>;
  return <Row snippet={snippet} onClick={onClick} />;
};

const DETAIL_REGISTRY = {
  code: CodeDetail,
  image: ImageDetail,
  video: VideoDetail,
  link: LinkDetail,
} satisfies Record<SnippetType, React.FC<{ snippet: never; onNavigate: (i: number) => void }>>;

export const SnippetDetail: React.FC<{ snippet: Snippet; onNavigate: (i: number) => void }> = ({
  snippet,
  onNavigate,
}) => {
  const Detail = DETAIL_REGISTRY[snippet.type] as React.FC<{
    snippet: Snippet;
    onNavigate: (i: number) => void;
  }>;
  return <Detail snippet={snippet} onNavigate={onNavigate} />;
};
