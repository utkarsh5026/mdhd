import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

import { MarkdownRender } from '@/components/features/markdown-render';
import type { MarkdownMetadata } from '@/services/section/parsing';
import { extractFrontmatter } from '@/services/section/parsing';
import { fetchSharedContent } from '@/services/share';

import MetadataDisplay from '../layout/metadata-display';

type Status = 'loading' | 'success' | 'not-found' | 'error';

const SharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<MarkdownMetadata | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('not-found');
      return;
    }

    let cancelled = false;

    fetchSharedContent(token)
      .then((text) => {
        if (!cancelled) {
          const { content: stripped, metadata: meta } = extractFrontmatter(text);
          setContent(stripped);
          setMetadata(meta);
          setStatus('success');
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '';
          setStatus(message.includes('404') ? 'not-found' : 'error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="max-w-4xl mx-auto px-4 py-10">
        {status === 'loading' && (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {status === 'not-found' && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <p className="text-lg font-semibold">Link not found</p>
            <p className="text-sm text-muted-foreground">
              This share link may have expired or been revoked.
            </p>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
            <p className="text-lg font-semibold text-destructive">Failed to load</p>
            <p className="text-sm text-muted-foreground">
              There was a problem loading this shared document.
            </p>
          </div>
        )}
        {status === 'success' && (
          <>
            {metadata && <MetadataDisplay metadata={metadata} />}
            <MarkdownRender markdown={content} />
          </>
        )}
      </div>
    </div>
  );
};

export default SharePage;
