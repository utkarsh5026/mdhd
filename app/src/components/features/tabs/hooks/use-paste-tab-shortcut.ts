import { useCallback, useEffect } from 'react';

import { useKeyPress } from '@/hooks';

import { useTabsStore } from '../store/tabs-store';

/** Returns true if the active element is an editable field (input, textarea, contenteditable). */
function isEditableElementFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  if (el.getAttribute('role') === 'textbox') return true;
  return false;
}

/**
 * Creates a paste tab from text content, skipping empty strings.
 * Returns the new tab ID or null if skipped.
 */
function createPasteTab(content: string): string | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return useTabsStore.getState().createTab(trimmed, undefined, 'paste');
}

/**
 * Ctrl/Cmd + Shift + V — read clipboard via Clipboard API and open as a new tab.
 * Works regardless of focus state (uses async clipboard API, not paste event).
 */
export function usePasteTabShortcut() {
  useKeyPress('ctrl+shift+v', (e) => {
    e.preventDefault();
    navigator.clipboard
      .readText()
      .then((text) => createPasteTab(text))
      .catch((err) => {
        console.warn('[paste-shortcut] Clipboard read denied:', err);
      });
  });
}

/**
 * Listens for the native `paste` event globally.
 * When the user pastes outside of an editable element, creates a new tab
 * with the pasted content. This extends the welcome-screen paste behavior
 * to work anywhere in the app.
 */
export function useGlobalPasteToTab() {
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (isEditableElementFocused()) return;
    const text = e.clipboardData?.getData('text');
    if (text) createPasteTab(text);
  }, []);

  useEffect(() => {
    globalThis.addEventListener('paste', handlePaste);
    return () => globalThis.removeEventListener('paste', handlePaste);
  }, [handlePaste]);
}
