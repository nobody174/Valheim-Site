import { useState } from 'react';
import { useNavigate } from 'react-router';
import { hitPath } from './SearchResults';
import type { SearchDoc } from './search';

/**
 * Keyboard navigation over a flat list of hits, shared by the palette and the landing page:
 * ArrowUp/ArrowDown move the highlight, Enter opens the highlighted hit (the first one until
 * the user moves). `onOpen` runs after navigating.
 */
export function useHitKeys(hits: SearchDoc[], onOpen?: () => void) {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const activeHit = hits[Math.min(active, hits.length - 1)];

  /** Returns true when the key was handled. */
  const handleKey = (e: React.KeyboardEvent): boolean => {
    if (e.key === 'ArrowDown') {
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && activeHit) {
      navigate(hitPath(activeHit));
      onOpen?.();
    } else {
      return false;
    }
    e.preventDefault();
    return true;
  };

  return { activeHit, handleKey, resetActive: () => setActive(0) };
}
