import { useCallback, useEffect, useRef, useState } from 'react';

export interface Milestone {
  threshold: number;
  emoji: string;
  label: string;
}

export const MILESTONES: Milestone[] = [
  { threshold: 0.25, emoji: '🎯', label: 'Quarter done!' },
  { threshold: 0.5, emoji: '🔥', label: 'Halfway there!' },
  { threshold: 0.75, emoji: '⚡', label: 'Almost there!' },
  { threshold: 0.9, emoji: '🚀', label: 'So close!' },
  { threshold: 1, emoji: '🎉', label: 'All done!' },
];

interface UseMilestoneOptions {
  showDuration?: number;
  exitDelay?: number;
}

export function useMilestone(readCount: number, total: number, options: UseMilestoneOptions = {}) {
  const { showDuration = 1500, exitDelay = 300 } = options;

  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [visible, setVisible] = useState(false);
  const shownRef = useRef(new Set<number>());
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setMilestone(null), exitDelay);
  }, [exitDelay]);

  useEffect(() => {
    if (total <= 1) return;
    const progress = readCount / total;

    for (const m of MILESTONES) {
      if (progress >= m.threshold && !shownRef.current.has(m.threshold)) {
        shownRef.current.add(m.threshold);
        setMilestone(m);
        setVisible(true);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(dismiss, showDuration);
      }
    }
  }, [readCount, total, dismiss, showDuration]);

  useEffect(() => {
    shownRef.current = new Set<number>();
  }, [total]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { milestone, visible };
}
