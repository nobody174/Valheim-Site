import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './App.module.css';

/** How long the "offline ready" notice stays up. */
const NOTICE_MS = 4000;

/** How often an open tab asks whether a newer version was deployed. */
const UPDATE_CHECK_MS = 5 * 60 * 1000;

/**
 * Registers the service worker. New versions install and activate on their own (autoUpdate) and the
 * page reloads once they take over; saved data is already in storage, so nothing is lost. A tab left
 * open checks every few minutes and when it comes back into view, so it does not run old code for days.
 */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => undefined);
      };
      setInterval(check, UPDATE_CHECK_MS);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check();
      });
    },
  });

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
