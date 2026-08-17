import { Loader2, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

import { ApiError, isNetworkError } from '@/services/auth';
import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { SharedContent } from '@/services/share';
import { fetchSharedContent } from '@/services/share';

import ShareSectionReader from './share-section-reader';

type Status = 'loading' | 'success' | 'not-found' | 'offline' | 'error';

const SharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [sections, setSections] = useState<MarkdownSection[]>([]);
  const [metadata, setMetadata] = useState<MarkdownMetadata | null>(null);
  const [sharer, setSharer] = useState<Pick<SharedContent, 'sharer_name' | 'sharer_avatar'>>({
    sharer_name: null,
    sharer_avatar: null,
  });
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('not-found');
      return;
    }

    let cancelled = false;

    fetchSharedContent(token)
      .then(({ content, sharer_name, sharer_avatar }) => {
        if (!cancelled) {
          const { sections: parsed, metadata: meta } = parseMarkdownIntoSections(content);
          setSections(parsed);
          setMetadata(meta);
          setSharer({ sharer_name, sharer_avatar });
          setStatus('success');
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // A shared document lives on the server by definition, so this is the
        // one screen a cached app shell still can't fill in offline. Say that
        // plainly instead of blaming the link.
        if (isNetworkError(err)) setStatus('offline');
        else if (err instanceof ApiError && err.status === 404) setStatus('not-found');
        else setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-semibold">Link not found</p>
        <p className="text-sm text-muted-foreground">
          This share link may have expired or been revoked.
        </p>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3 text-center px-4">
        <WifiOff className="h-6 w-6 text-muted-foreground" />
        <p className="text-lg font-semibold">You&rsquo;re offline</p>
        <p className="text-sm text-muted-foreground">
          Shared links are fetched from the server. Reconnect and reload to open this one — your own
          documents are still available offline.
        </p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-lg font-semibold text-destructive">Failed to load</p>
        <p className="text-sm text-muted-foreground">
          There was a problem loading this shared document.
        </p>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <ShareSectionReader
        sections={sections}
        metadata={metadata}
        sharerName={sharer.sharer_name}
        sharerAvatar={sharer.sharer_avatar}
      />
    </>
  );
};

export default SharePage;
