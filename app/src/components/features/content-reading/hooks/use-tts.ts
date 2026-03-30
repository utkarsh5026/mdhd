import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useReadingSettingsStore } from '@/components/features/settings/store/reading-settings-store';
import { stripMarkdown } from '@/utils/markdown-to-text';

import {
  useReadingActions,
  useReadingNavigation,
  useReadingSections,
} from './use-reading-selectors';
import type { TTSStatus } from './use-speech-synthesis';
import { useSpeechSynthesis } from './use-speech-synthesis';

export interface UseTTSReturn {
  ttsStatus: TTSStatus;
  voices: SpeechSynthesisVoice[];
  currentVoice: SpeechSynthesisVoice | null;
  speed: number;
  autoAdvance: boolean;
  isSupported: boolean;
  playCurrentSection: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setVoice: (voice: SpeechSynthesisVoice) => void;
  toggleAutoAdvance: () => void;
}

/**
 * High-level TTS hook integrating Web Speech API with the reading navigation
 * system. Handles auto-advance on utterance end, section change detection,
 * and reading mode cleanup.
 */
export function useTTS(): UseTTSReturn {
  const { currentIndex, readingMode } = useReadingNavigation();
  const sections = useReadingSections();
  const { goToNext, updateCurrentIndex, markSectionAsRead } = useReadingActions();

  const { ttsSpeed, setTtsSpeed } = useTTSSpeed();
  const { ttsVoiceName, setTtsVoiceName } = useTTSVoiceName();
  const { ttsAutoAdvance, toggleTtsAutoAdvance } = useTTSAutoAdvance();

  const isAutoAdvancingRef = useRef(false);
  const currentIndexRef = useRef(currentIndex);

  currentIndexRef.current = currentIndex;

  const handleUtteranceEnd = useCallback(() => {
    if (!ttsAutoAdvance) return;
    if (currentIndexRef.current >= sections.length - 1) return;

    isAutoAdvancingRef.current = true;

    if (readingMode === 'card') {
      goToNext();
      setTimeout(() => {
        isAutoAdvancingRef.current = false;
      }, 250);
      return;
    }

    const nextIndex = currentIndexRef.current + 1;
    const nextSection = sections[nextIndex];
    if (nextSection) {
      const el = document.getElementById(`section-${nextSection.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    markSectionAsRead(nextIndex);
    updateCurrentIndex(nextIndex);
    setTimeout(() => {
      isAutoAdvancingRef.current = false;
    }, 350);
  }, [ttsAutoAdvance, sections, readingMode, goToNext, markSectionAsRead, updateCurrentIndex]);

  const { status, voices, speak, pause, resume, stop, isSupported } =
    useSpeechSynthesis(handleUtteranceEnd);

  const currentVoice = voices.find((v) => v.name === ttsVoiceName) ?? null;

  const speakSection = useCallback(
    (sectionIndex: number) => {
      const section = sections[sectionIndex];
      if (!section) return;

      const text = stripMarkdown(section.content);
      if (!text.trim()) {
        if (ttsAutoAdvance && sectionIndex < sections.length - 1) {
          handleUtteranceEnd();
        }
        return;
      }

      speak(text, {
        rate: ttsSpeed,
        voice: currentVoice ?? undefined,
      });
    },
    [sections, ttsSpeed, currentVoice, ttsAutoAdvance, speak, handleUtteranceEnd]
  );

  const playCurrentSection = useCallback(() => {
    speakSection(currentIndex);
  }, [speakSection, currentIndex]);

  const togglePlayPause = useCallback(() => {
    switch (status) {
      case 'idle':
        playCurrentSection();
        break;
      case 'playing':
        pause();
        break;
      case 'paused':
        resume();
        break;
    }
  }, [status, playCurrentSection, pause, resume]);

  const setSpeed = useCallback(
    (speed: number) => {
      setTtsSpeed(speed);
      if (status === 'playing') {
        speakSection(currentIndex);
      }
    },
    [setTtsSpeed, status, speakSection, currentIndex]
  );

  const setVoice = useCallback(
    (voice: SpeechSynthesisVoice) => {
      setTtsVoiceName(voice.name);
      if (status === 'playing') {
        setTimeout(() => speakSection(currentIndex), 50);
      }
    },
    [setTtsVoiceName, status, speakSection, currentIndex]
  );

  // Auto-play next section after auto-advance navigation
  useEffect(() => {
    if (isAutoAdvancingRef.current && status === 'idle') {
      const timer = setTimeout(
        () => {
          speakSection(currentIndex);
        },
        readingMode === 'card' ? 250 : 350
      );
      return () => clearTimeout(timer);
    }
  }, [currentIndex, status, speakSection, readingMode]);

  useEffect(() => {
    stop();
  }, [readingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ttsStatus: status,
    voices,
    currentVoice,
    speed: ttsSpeed,
    autoAdvance: ttsAutoAdvance,
    isSupported,
    playCurrentSection,
    togglePlayPause,
    stop,
    setSpeed,
    setVoice,
    toggleAutoAdvance: toggleTtsAutoAdvance,
  };
}

function useTTSSpeed() {
  return useReadingSettingsStore(
    useShallow(({ tts, setTtsSpeed }) => ({
      ttsSpeed: tts.speed,
      setTtsSpeed,
    }))
  );
}

function useTTSVoiceName() {
  return useReadingSettingsStore(
    useShallow(({ tts, setTtsVoiceName }) => ({
      ttsVoiceName: tts.voiceName,
      setTtsVoiceName,
    }))
  );
}

function useTTSAutoAdvance() {
  return useReadingSettingsStore(
    useShallow(({ tts, toggleTtsAutoAdvance }) => ({
      ttsAutoAdvance: tts.autoAdvance,
      toggleTtsAutoAdvance,
    }))
  );
}
