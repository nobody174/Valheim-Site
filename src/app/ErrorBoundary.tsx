import { Component, type ReactNode } from 'react';
import { appStore } from '../state/store';
import { buildExport } from '../state/model';
import { downloadText } from './RescueBanner';

interface State {
  failed: boolean;
}

/** Catches a crash while drawing a page and offers a way out, so the screen is never blank. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  private exportData = () => {
    try {
      downloadText(
        `valheim-companion-${new Date().toISOString().slice(0, 10)}.json`,
        JSON.stringify(buildExport(appStore.getState(), new Date()), null, 2),
      );
    } catch {
      // nothing more to try; the saved data is still in this browser
    }
  };

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" style={{ padding: '1.5rem', maxWidth: '40rem' }}>
        <h1>Something went wrong</h1>
        <p>
          This page could not be drawn. Your saved data is still in this browser. Reloading usually
          fixes it.
        </p>
        <p>
          <button type="button" style={{ minHeight: 44 }} onClick={() => window.location.reload()}>
            Reload
          </button>{' '}
          <button type="button" style={{ minHeight: 44 }} onClick={this.exportData}>
            Download a backup
          </button>
        </p>
      </div>
    );
  }
}
