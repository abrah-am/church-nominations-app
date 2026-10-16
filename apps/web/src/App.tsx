import { useEffect, useState } from 'react';
import { checkApiHealth } from './api/health';

type ConnectionStatus = 'loading' | 'connected' | 'unavailable';

const statusText: Record<ConnectionStatus, string> = {
  loading: 'Checking API connection',
  connected: 'API connected',
  unavailable: 'API unavailable',
};

export default function App() {
  const [status, setStatus] = useState<ConnectionStatus>('loading');

  useEffect(() => {
    let active = true;

    checkApiHealth()
      .then(() => {
        if (active) setStatus('connected');
      })
      .catch(() => {
        if (active) setStatus('unavailable');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Church Nominations home">
          <span className="mark" aria-hidden="true">C</span>
          <span>Church Nominations</span>
        </a>
        <span className="environment-label">LOCAL DEVELOPMENT</span>
      </header>

      <section className="welcome" aria-labelledby="page-title">
        <p className="eyebrow">Application foundation</p>
        <h1 id="page-title">A clear start for thoughtful decisions.</h1>
        <p className="intro">The application is ready for its next steps. Frontend and API connectivity is checked below.</p>
      </section>

      <section className="connection" aria-labelledby="connection-title">
        <div className="connection-copy">
          <p className="eyebrow">System status</p>
          <h2 id="connection-title">Service connection</h2>
          <p className="connection-detail">Church Nominations API</p>
        </div>
        <div className={`status status-${status}`} role="status" aria-live="polite">
          <span className="status-indicator" aria-hidden="true" />
          <span>{statusText[status]}</span>
        </div>
      </section>

      <footer className="page-footer">
        <span>Private by design</span>
        <span className="footer-divider" aria-hidden="true" />
        <span>Local environment</span>
      </footer>
    </main>
  );
}
