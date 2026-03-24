/** Light haptic tap for navigation feedback on supported devices. */
export const hapticTap = () => navigator.vibrate?.(10);
