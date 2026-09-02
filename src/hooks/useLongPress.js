import { useRef, useState, useCallback } from 'react';

// Requires a sustained press before firing onComplete, so a quick tap does
// nothing - used to gate exits from Kids mode that a young kid can't do by
// accident but a parent can do on purpose.
export function useLongPress(onComplete, { duration = 2000 } = {}) {
  const timeoutRef = useRef(null);
  const [pressing, setPressing] = useState(false);

  const start = useCallback(() => {
    setPressing(true);
    timeoutRef.current = setTimeout(() => {
      setPressing(false);
      onComplete();
    }, duration);
  }, [onComplete, duration]);

  const cancel = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setPressing(false);
  }, []);

  return {
    pressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: cancel,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: cancel,
      onTouchCancel: cancel,
    },
  };
}
