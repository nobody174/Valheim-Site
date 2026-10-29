import { useCallback, useRef, useState } from 'react';

/**
 * Show a long list in steps: the first `step` rows now, the next step when the reader scrolls near the
 * end, or all of it on request. Keeps pages with thousands of rows quick to open on a phone. Without
 * IntersectionObserver (old browsers, tests) everything shows at once. Remount with a new `key` when
 * the list changes so it starts from the top again.
 */
export function useProgressive(total: number, step = 80) {
  const [count, setCount] = useState(() => (typeof IntersectionObserver === 'undefined' ? Infinity : step));
  const observer = useRef<IntersectionObserver | null>(null);

  const sentinelRef = useCallback(
    (node: HTMLElement | null) => {
      observer.current?.disconnect();
      observer.current = null;
      if (!node || typeof IntersectionObserver === 'undefined') return;
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) setCount((c) => c + step);
        },
        { rootMargin: '600px' },
      );
      observer.current.observe(node);
    },
    // A new callback after each step makes the observer look again, so a still-visible end loads the next step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, count],
  );

  return {
    count: Math.min(count, total),
    hasMore: count < total,
    sentinelRef,
    showAll: () => setCount(Infinity),
  };
}
