import { Link } from 'react-router-dom'
import { usePresentationElectionSnapshot } from '../../data/mock-election-hooks'

export function InteractivePresentationView() {
  const snapshot = usePresentationElectionSnapshot()
  const resultsVisible = snapshot.results !== null
  const votingStatus = snapshot.votingStatus
  const nominationActive = snapshot.nominationStatus === 'open'

  return (
    <div className="interactive-presentation">
      <a className="skip-link" href="#presentation-content">Skip to presentation</a>
      <div className="interactive-presentation-inner">
        <header className="interactive-presentation-header">
          <div>
            <p>{snapshot.churchName} · {snapshot.termName}</p>
            <h1>{snapshot.positionName}</h1>
            <p>{snapshot.openings} opening{snapshot.openings === 1 ? '' : 's'} · {snapshot.pollTitle ?? 'No poll created'}</p>
          </div>
          <span className="presentation-status">{votingStatus === 'open' ? 'Voting open' : `Voting ${votingStatus}`}</span>
        </header>

        <section id="presentation-content" tabIndex={-1} className="interactive-presentation-content">
          {nominationActive && snapshot.nominationNames.length > 0 ? (
            <section aria-labelledby="live-nominations-heading">
              <p className="presentation-eyebrow">Live nominations · room display only</p>
              <h2 id="live-nominations-heading">Names submitted so far</h2>
              <ul>{snapshot.nominationNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
            </section>
          ) : null}
          {!nominationActive && snapshot.nominationNames.length > 0 ? (
            <section aria-labelledby="published-nominations-heading">
              <p className="presentation-eyebrow">Published nomination list</p>
              <h2 id="published-nominations-heading">Nominees</h2>
              <ul>{snapshot.nominationNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
            </section>
          ) : null}

          {resultsVisible ? (
            <section aria-labelledby="aggregate-results-heading" aria-live="polite">
              <p className="presentation-eyebrow">Aggregate results · Admin enabled</p>
              <h2 id="aggregate-results-heading">{snapshot.pollTitle ?? 'Current poll results'}</h2>
              <p>Aggregate candidate totals. No individual ballot information is shown.</p>
              <ol aria-label="Aggregate candidate results" className="presentation-results">
                {snapshot.results?.map((result) => (
                  <li key={result.candidateId}>
                    <span>{result.name}</span>
                    <strong>{result.votes} {result.votes === 1 ? 'vote' : 'votes'} · {result.percentage}%</strong>
                    <span className="presentation-result-track" aria-hidden="true">
                      <span style={{ width: `${result.percentage}%` }} />
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <section className="presentation-waiting" aria-live="polite">
              <p className="presentation-eyebrow">Aggregate results are hidden</p>
              <h2>Please follow the meeting instructions.</h2>
              <p>Ballot choices remain private.</p>
            </section>
          )}

          {snapshot.ballotsCast !== null ? (
            <aside className="presentation-participation" aria-label="Current poll participation">
              <strong>{snapshot.ballotsCast}</strong>
              <span>ballots cast in the current poll</span>
            </aside>
          ) : null}
        </section>
        <footer>
          <span>Aggregate-only display · no voter identities or individual ballot information</span>
          <nav aria-label="Experience navigation">
            <Link to="/admin">Admin</Link>
            <Link to="/voter/preview?state=voting">Participant</Link>
          </nav>
        </footer>
      </div>
    </div>
  )
}
