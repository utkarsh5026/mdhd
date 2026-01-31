import { useState, useCallback, useMemo } from 'react';
import useResize from '../utils/use-resize';

interface UseMobileOptions {
  phoneBreakpoint?: number;
  tabletBreakpoint?: number;
  debounceDelay?: number;
  detectTouch?: boolean;
  initialDevice?: string;
}

/**
 * useMobile
 *
 * A hook that detects device type based on viewport size and touch capabilities.
 *
 * Features:
 * - Identifies phone, tablet, or desktop devices
 * - Detects touch capabilities
 * - Tracks screen dimensions on resize
 * - Handles orientation changes on mobile devices
 * - Works with server-side rendering
 */
const useMobile = (options: UseMobileOptions = {}) => {
  const {
    phoneBreakpoint = 768,
    tabletBreakpoint = 1024,
    debounceDelay = 150,
    detectTouch = true,
    initialDevice = 'desktop',
  } = options;

  const initialState = useMemo(
    () => ({
      isMobile: initialDevice !== 'desktop',
      isPhone: initialDevice === 'phone',
      isTablet: initialDevice === 'tablet',
      deviceType: initialDevice,
      hasTouch: false,
      width: null as number | null,
    }),
    [initialDevice]
  );

  const [deviceInfo, setDeviceInfo] = useState(initialState);

  /**
   * Detects device type based on viewport dimensions and capabilities
   */
  const detectDevice = useCallback(
    (width: number, height: number) => {
      if (globalThis.window === undefined) {
        return initialState;
      }

      const touchCapable = Boolean(
        'ontouchstart' in globalThis.window || navigator.maxTouchPoints > 0
      );
      const hasCoarsePointer = globalThis.matchMedia?.('(pointer: coarse)').matches ?? false;
      const hasFinePointer = globalThis.matchMedia?.('(pointer: fine)').matches ?? false;
      const prefersMobile = globalThis.matchMedia?.('(hover: none)').matches ?? false;

      let detectedDeviceType = 'desktop';
      let isPhoneDetected = false;
      let isTabletDetected = false;

      if (width < phoneBreakpoint) {
        detectedDeviceType = 'phone';
        isPhoneDetected = true;
      } else if (width < tabletBreakpoint) {
        if (detectTouch && (touchCapable || prefersMobile)) {
          if (!hasFinePointer || hasCoarsePointer || height > width) {
            detectedDeviceType = 'tablet';
            isTabletDetected = true;
          }
        }
      }

      // Large tablets (iPad Pro, etc.)
      if (width >= tabletBreakpoint && touchCapable && hasCoarsePointer && !hasFinePointer) {
        detectedDeviceType = 'tablet';
        isTabletDetected = true;
      }

      // Phone in landscape mode
      if (
        width >= phoneBreakpoint &&
        width < tabletBreakpoint &&
        height < phoneBreakpoint &&
        touchCapable &&
        hasCoarsePointer
      ) {
        detectedDeviceType = 'phone';
        isPhoneDetected = true;
        isTabletDetected = false;
      }

      // Mobile browsers in "desktop mode"
      if (width >= tabletBreakpoint && prefersMobile && !hasFinePointer && hasCoarsePointer) {
        detectedDeviceType = 'tablet';
        isTabletDetected = true;
      }

      const isMobileDetected = isPhoneDetected || isTabletDetected;

      return {
        isMobile: isMobileDetected,
        isPhone: isPhoneDetected,
        isTablet: isTabletDetected,
        deviceType: detectedDeviceType,
        hasTouch: touchCapable,
        width,
      };
    },
    [phoneBreakpoint, tabletBreakpoint, detectTouch, initialState]
  );

  useResize(
    ({ width, height }) => {
      setDeviceInfo(detectDevice(width, height));
    },
    {
      debounceDelay,
      listenToOrientation: detectTouch,
    }
  );

  return deviceInfo;
};

export default useMobile;
