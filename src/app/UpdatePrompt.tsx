import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './App.module.css';

/** How long the "offline ready" notice stays up. */
const NOTICE_MS = 4000;

/**
 * Registers the service worker. New versions install and activate on their own (autoUpdate), so
 * the only thing to say is that the app now works offline, briefly.
 */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW();

  useEffect(() => {
    if (!offlineReady) return;
    const timer = setTimeout(() => setOfflineReady(false), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [offlineReady, setOfflineReady]);

  if (!offlineReady) return null;
  return (
    <div className={styles.toast} role="status">
      <span>Ready to work offline.</span>
      <button type="button" aria-label="Dismiss" onClick={() => setOfflineReady(false)}>
        ✕
      </button>
    </div>
  );
}
