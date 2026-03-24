import { useEffect, useRef, useState } from 'react';

/**
 * Listens for a key (with optional modifiers) and calls a handler on keydown.
 *
 * @param targetKey - Key string, optionally with modifiers: `'Escape'`, `'ctrl+k'`, `'shift+enter'`
 * @param handler   - Optional callback invoked on each matching keydown event
 * @returns boolean — `true` while the key is held down
 *
 * @example
 * useKeyPress('Escape', () => closeModal());
 * useKeyPress('ctrl+k', (e) => { e.preventDefault(); openSearch(); });
 * const isShiftHeld = useKeyPress('Shift');
 */
export function useKeyPress(targetKey: string, handler?: (event: KeyboardEvent) => void): boolean {
  const [pressed, setPressed] = useState(false);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      const parts = targetKey.toLowerCase().split('+');
      const key = parts.pop()!;
      const needsCtrl = parts.includes('ctrl') || parts.includes('meta');
      const needsShift = parts.includes('shift');
      const needsAlt = parts.includes('alt');

      const modifiersMatch =
        (!needsCtrl || event.ctrlKey || event.metaKey) &&
        (!needsShift || event.shiftKey) &&
        (!needsAlt || event.altKey);

      if (event.key.toLowerCase() === key && modifiersMatch) {
        setPressed(true);
        handlerRef.current?.(event);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      const parts = targetKey.toLowerCase().split('+');
      const key = parts.pop()!;
      if (event.key.toLowerCase() === key) setPressed(false);
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return pressed;
}
