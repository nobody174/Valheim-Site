import { useRegisterSW } from 'virtual:pwa-register/react';
import styles from './App.module.css';

/** Service worker status: tells the owner when the app is offline-ready or an update is waiting. */
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;
  return (
    <div className={styles.toast} role="status">
      {needRefresh ? (
        <>
          <span>A new version is available.</span>
          <button type="button" onClick={() => void updateServiceWorker(true)}>
            Reload
          </button>
        </>
      ) : (
        <span>Ready to work offline.</span>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          setOfflineReady(false);
          setNeedRefresh(false);
        }}
      >
        ✕
      </button>
    </div>
  );
}
