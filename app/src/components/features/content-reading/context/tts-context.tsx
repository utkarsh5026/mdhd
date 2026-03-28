import { createContext, use } from 'react';

import type { UseTTSReturn } from '../hooks/use-tts';

const TTSContext = createContext<UseTTSReturn | null>(null);

export function useTTSContext(): UseTTSReturn {
  const ctx = use(TTSContext);
  if (!ctx) throw new Error('useTTSContext must be used within a TTSProvider');
  return ctx;
}

export default TTSContext;
