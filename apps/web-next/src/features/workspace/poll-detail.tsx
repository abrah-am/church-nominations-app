import { getPollResults } from '../../domain/position-summary'
import type { PositionSnapshot, PositionPollSummary } from '../../domain/types'

interface PollDetailProps {
  position: PositionSnapshot
  poll: PositionPollSummary | undefined
  detailView: 'record' | 'audit'
  onDetailViewChange: (view: 'record' | 'audit') => void
}

function AuditPanel({ poll }: { poll: PositionPollSummary }) {
  return (
    <section aria-labelledby="audit-heading" className="poll-record-panel">
      <h3 id="audit-heading">Audit</h3>
      {poll.auditEntries.length ? (
        <ul className="audit-list">
          {poll.auditEntries.map((entry) => (
            <li key={entry.id}><strong>{entry.action}</strong><span>{entry.detail}</span><time>{entry.at}</time></li>
          ))}
        </ul>
      ) : <p>No audit entries are included in this mock snapshot.</p>}
    </section>
  )
}

export function PollDetail({ position, poll, detailView, onDetailViewChange }: PollDetailProps) {
  if (!poll) {
    return (
      <section className="poll-detail" aria-labelledby="poll-detail-heading">
        <h2 id="poll-detail-heading">Selected poll</h2>
        <p>No poll selected. Poll history is empty or the selected poll is unavailable.</p>
      </section>
    )
  }
  const candidates = new Map(position.candidates.map((candidate) => [candidate.id, candidate.name]))

  return (
    <section className="poll-detail" aria-labelledby="poll-detail-heading">
      <div className="poll-detail-heading">
        <div>
          <p className="workspace-eyebrow">Administrator read-only view</p>
          <h2 id="poll-detail-heading">{poll.title}</h2>
        </div>
        <span className="workspace-status">{poll.status}</span>
      </div>
      {poll.type === 'nomination' ? (
        <section className="poll-record-panel" aria-labelledby="approved-roster-heading">
          <h3 id="approved-roster-heading">Approved nomination roster</h3>
          {poll.status === 'Approved' ? (
            <ul className="roster-list">
              {poll.sourceCandidateIds.map((id) => (
                <li key={id}>{poll.candidateNames[id] ?? candidates.get(id) ?? 'Unknown candidate'}</li>
              ))}
            </ul>
          ) : <p>This nomination snapshot is {poll.status.toLowerCase()}.</p>}
          {poll.nominationSubmissions.length ? (
            <details className="traceability">
              <summary>Original nomination traceability ({poll.nominationSubmissions.length} submissions)</summary>
              <ul>
                {poll.nominationSubmissions.map((submission) => (
                  <li key={submission.id}><span>{submission.name}</span><time>{submission.submittedAt}</time></li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>
      ) : (
        <>
          <div className="detail-tabs" role="group" aria-label={`${poll.title} detail sections`}>
            <button type="button" aria-pressed={detailView === 'record'} onClick={() => onDetailViewChange('record')}>
              Results and decisions
            </button>
            <button type="button" aria-pressed={detailView === 'audit'} onClick={() => onDetailViewChange('audit')}>
              Audit
            </button>
          </div>
          {detailView === 'audit' ? <AuditPanel poll={poll} /> : (
            <section className="poll-record-panel" aria-labelledby="results-heading">
              <div className="results-heading">
                <div>
                  <h3 id="results-heading">Aggregate results and recorded decisions</h3>
                  <p>{poll.ballotsCast} ballots cast · aggregate counts only</p>
                </div>
                {poll.status === 'Open' ? <span className="mock-label">MOCK admin snapshot · not live backend data</span> : null}
              </div>
              {poll.status === 'Draft' ? (
                <p>Draft snapshot · no results or candidate roster are present.</p>
              ) : (
                <table className="result-table">
                  <caption className="visually-hidden">Poll aggregate results and recorded election decisions</caption>
                  <thead>
                    <tr>
                      <th scope="col">Candidate snapshot</th>
                      <th scope="col">Votes · share of ballots cast</th>
                      <th scope="col">Recorded decision</th>
                    </tr>
                  </thead>
                  <tbody>
                  {getPollResults(poll).map((result) => {
                    const decision = poll.recordedDecisions.find((entry) => entry.candidateId === result.candidateId)
                    return (
                      <tr key={result.candidateId}>
                        <th scope="row">{result.name}</th>
                        <td>
                          <span className="mobile-field-label">Votes · share of ballots cast</span>
                          <span>{result.votes} {result.votes === 1 ? 'vote' : 'votes'} · {result.percentage}%</span>
                          <span className="result-bar" aria-hidden="true"><span style={{ width: `${result.percentage}%` }} /></span>
                        </td>
                        <td>
                          <span className="mobile-field-label">Recorded decision</span>
                          {decision?.status ?? 'No recorded decision'}
                          {decision?.status === 'Declined' ? <small className="legacy-note">Legacy recorded decision value; not a response.</small> : null}
                        </td>
                      </tr>
                    )
                  })}
                  </tbody>
                </table>
              )}
              {poll.status !== 'Draft' && poll.recordedDecisions.length === 0 ? (
                <p className="recorded-note">No recorded election decisions for this poll.</p>
              ) : null}
            </section>
          )}
        </>
      )}
    </section>
  )
}
