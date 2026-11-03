import { useEffect, useState } from 'react';
import {
  getNominationPresentation,
  NominationPresentationSnapshot,
  streamNominationPresentation,
} from '../../api/nominations';

const neutralSnapshot: NominationPresentationSnapshot = { revealed: false, intakeOpen: false, listCreated: false, activeNames: [], events: [] };

export default function NominationPresentationPage({ accessToken }: { accessToken: string }) {
  const [snapshot, setSnapshot] = useState(neutralSnapshot);
  const [connection, setConnection] = useState('Connecting to the presentation…');

  useEffect(() => {
    let current = true;
    let lastEventId: string | null = null;
    let retryTimer: number | undefined;
    let controller: AbortController | undefined;

    const refreshAndConnect = async () => {
      try {
        const authoritative = await getNominationPresentation(accessToken);
        if (!current) return;
        setSnapshot(authoritative);
        setConnection('Live presentation');
      } catch {
        if (!current) return;
        setSnapshot(neutralSnapshot);
        setConnection('Presentation unavailable. Reconnecting…');
        retryTimer = window.setTimeout(refreshAndConnect, 3000);
        return;
      }

      controller = new AbortController();
      try {
        await streamNominationPresentation(accessToken, controller.signal, lastEventId, (next, eventId) => {
          if (!current) return;
          if (eventId) lastEventId = eventId;
          setSnapshot(next);
          setConnection(next.intakeOpen ? 'Live presentation · incoming names' : next.revealed ? 'Live presentation' : 'Waiting for the administrator to confirm the consolidated list');
        });
      } catch {
        if (current && !controller.signal.aborted) {
          setSnapshot(neutralSnapshot);
          setConnection('Connection interrupted. Refreshing the presentation…');
        }
      }
      if (current && !controller.signal.aborted) {
        setSnapshot(neutralSnapshot);
        setConnection('Reconnecting to the presentation…');
        retryTimer = window.setTimeout(refreshAndConnect, 1500);
      }
    };

    void refreshAndConnect();
    return () => {
      current = false;
      controller?.abort();
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [accessToken]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      getNominationPresentation(accessToken).then((next) => {
        setSnapshot(next);
        setConnection(next.intakeOpen ? 'Live presentation · incoming names' : 'Live presentation');
      }).catch(() => {
        setSnapshot(neutralSnapshot);
        setConnection('Presentation unavailable. Reconnecting…');
      });
    }, 2500);
    return () => window.clearInterval(refreshTimer);
  }, [accessToken]);

  return (
    <main className="nomination-presentation" aria-labelledby="presentation-title">
      <header className="presentation-header">
        <p className="eyebrow">Church nominations</p>
        <h1 id="presentation-title">Shared nominations</h1>
        <p className="presentation-connection" role="status" aria-live="polite">{connection}</p>
      </header>
      {!snapshot.intakeOpen && !snapshot.listCreated ? (
        <section className="presentation-neutral" aria-label="Nominations not published">
          <span className="presentation-neutral-mark" aria-hidden="true" />
          <h2>{snapshot.listCreated ? 'The consolidated list is not being shown' : 'Nominations are not being shown'}</h2>
        </section>
      ) : (
        <div className="presentation-content">
          <section aria-labelledby="presentation-list-title">
            <div className="presentation-section-heading">
              <h2 id="presentation-list-title">{snapshot.intakeOpen ? 'Incoming names' : 'Current list'}</h2>
              <span>{snapshot.activeNames.length} {snapshot.activeNames.length === 1 ? 'name' : 'names'}</span>
            </div>
            {snapshot.activeNames.length ? (
              <ol className="presentation-name-list" aria-label="Current list">
                {snapshot.activeNames.map((name, index) => <li key={`${index}-${name}`}>{name}</li>)}
              </ol>
            ) : <p className="presentation-empty">{snapshot.intakeOpen ? 'No names submitted yet.' : 'No active names.'}</p>}
          </section>
          {snapshot.revealed && <section className="presentation-history" aria-labelledby="presentation-history-title">
            <div className="presentation-section-heading">
              <h2 id="presentation-history-title">Confirmed changes</h2>
              <span>Chronological</span>
            </div>
            {snapshot.events.length ? (
              <ol className="presentation-event-list" aria-label="Confirmed changes">
                {snapshot.events.map((event) => (
                  <li key={event.id}>
                    <div className="presentation-event-copy">
                      {event.action === 'CORRECTED' ? (
                        <><strong>{event.beforeName}</strong><span aria-hidden="true"> → </span><strong>{event.afterName}</strong><span> corrected</span></>
                      ) : event.action === 'REMOVED' ? (
                        <><strong>{event.beforeName}</strong><span> removed</span>{event.removalReason && <span> · {event.removalReason.toLowerCase()}{event.reasonDetail ? `: ${event.reasonDetail}` : ''}</span>}</>
                      ) : <><strong>{event.afterName ?? event.beforeName}</strong><span> restored</span></>}
                    </div>
                    <p>{event.actorLabel} · <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString()}</time></p>
                  </li>
                ))}
              </ol>
            ) : <p className="presentation-empty">No confirmed changes.</p>}
          </section>}
        </div>
      )}
    </main>
  );
}
