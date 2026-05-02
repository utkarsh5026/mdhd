import { useCallback, useEffect, useRef, useState } from 'react';

/** Playback state of the speech synthesis engine. */
export type TTSStatus = 'idle' | 'playing' | 'paused';

/** Options forwarded to the underlying `SpeechSynthesisUtterance`. */
interface SpeakOptions {
  /** Playback rate multiplier. `1.0` is normal speed; valid range is `0.1`–`10`. */
  rate?: number;
  /** Voice to use. Must be one of the entries returned by {@link UseSpeechSynthesisReturn.voices}. */
  voice?: SpeechSynthesisVoice;
}

/** Return value of {@link useSpeechSynthesis}. */
export interface UseSpeechSynthesisReturn {
  /** Current playback state. */
  status: TTSStatus;
  /** Available voices loaded from `speechSynthesis.getVoices()`. Populated asynchronously. */
  voices: SpeechSynthesisVoice[];
  /**
   * Cancels any in-progress speech and starts speaking `text` with the given options.
   * Has no effect when `isSupported` is `false` or `text` is blank.
   */
  speak: (text: string, options?: SpeakOptions) => void;
  /** Pauses the current utterance. No-op when nothing is speaking. */
  pause: () => void;
  /** Resumes a paused utterance. No-op when not paused. */
  resume: () => void;
  /** Cancels the current utterance and resets status to `'idle'`. */
  stop: () => void;
  /** `true` when the Web Speech API is available in the current environment. */
  isSupported: boolean;
}

/**
 * Low-level hook wrapping the Web Speech API's `SpeechSynthesis` interface.
 *
 * Handles voice loading, utterance lifecycle, a Chrome keepalive workaround
 * (Chrome silently stops synthesis after ~15 s without interaction — this hook
 * works around it by pausing/resuming every 10 s), and cleanup on unmount.
 *
 * @param onEnd - Called when an utterance finishes naturally. Not called when
 *   speech is cancelled via {@link UseSpeechSynthesisReturn.stop} or when a new
 *   call to {@link UseSpeechSynthesisReturn.speak} interrupts the current one.
 * @returns Controls and state for the speech synthesis engine.
 *
 * @example
 * ```tsx
 * const { speak, stop, status, voices, isSupported } = useSpeechSynthesis(() => {
 *   console.log('finished');
 * });
 *
 * if (isSupported) speak('Hello world', { rate: 1.2, voice: voices[0] });
 * ```
 */
export function useSpeechSynthesis(onEnd?: () => void): UseSpeechSynthesisReturn {
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const [status, setStatus] = useState<TTSStatus>('idle');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const cancelledRef = useRef(false);

  const keepaliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
  }, []);

  const startKeepalive = useCallback(() => {
    keepaliveRef.current = setInterval(() => {
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        speechSynthesis.resume();
      }
    }, 10_000);
  }, []);

  const teardownUtterance = useCallback(() => {
    clearKeepalive();
    setStatus('idle');
    utteranceRef.current = null;
  }, [clearKeepalive]);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const available = speechSynthesis.getVoices();
      if (available.length > 0) setVoices(available);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) {
      return;
    }

    cancelledRef.current = true;
    speechSynthesis.cancel();
    clearKeepalive();
    setStatus('idle');
    utteranceRef.current = null;
  }, [isSupported, clearKeepalive]);

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!isSupported || !text.trim()) return;

      cancelledRef.current = true;
      speechSynthesis.cancel();
      clearKeepalive();

      const utterance = new SpeechSynthesisUtterance(text);
      if (options?.rate) utterance.rate = options.rate;
      if (options?.voice) utterance.voice = options.voice;

      cancelledRef.current = false;
      utteranceRef.current = utterance;

      utterance.onstart = () => setStatus('playing');
      utterance.onpause = () => setStatus('paused');
      utterance.onresume = () => setStatus('playing');

      utterance.onend = () => {
        teardownUtterance();
        if (!cancelledRef.current) {
          onEndRef.current?.();
        }
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('[TTS] Speech synthesis error:', e.error);
        }
        teardownUtterance();
      };

      speechSynthesis.speak(utterance);
      setStatus('playing');
      startKeepalive();
    },
    [isSupported, clearKeepalive, teardownUtterance, startKeepalive]
  );

  const pause = useCallback(() => {
    if (!isSupported || !speechSynthesis.speaking) return;
    speechSynthesis.pause();
    clearKeepalive();
    setStatus('paused');
  }, [isSupported, clearKeepalive]);

  const resume = useCallback(() => {
    if (!isSupported || !speechSynthesis.paused) return;
    speechSynthesis.resume();
    setStatus('playing');
    startKeepalive();
  }, [isSupported, startKeepalive]);

  useEffect(() => {
    return () => {
      if (isSupported) {
        cancelledRef.current = true;
        speechSynthesis.cancel();
      }
      clearKeepalive();
    };
  }, [isSupported, clearKeepalive]);

  return { status, voices, speak, pause, resume, stop, isSupported };
}
