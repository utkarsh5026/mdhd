import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Toaster } from 'sonner';

import type { MarkdownMetadata, MarkdownSection } from '@/services/section/parsing';
import { parseMarkdownIntoSections } from '@/services/section/parsing';
import type { SharedContent } from '@/services/share';
import { fetchSharedContent } from '@/services/share';

import ShareSectionReader from './share-section-reader';

type Status = 'loading' | 'success' | 'not-found' | 'error';

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
        if (!cancelled) {
          const message = err instanceof Error ? err.message : '';
          setStatus(message.includes('404') ? 'not-found' : 'error');
        }
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
