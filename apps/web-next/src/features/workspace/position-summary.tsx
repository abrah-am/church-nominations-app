import { getCurrentCandidateStatus, getOpeningSummaries, getPositionCondition, getPositionLifecycle } from '../../domain/position-summary'
import type { PositionSnapshot } from '../../domain/types'

interface PositionSummaryProps {
  position: PositionSnapshot
}

export function PositionSummary({ position }: PositionSummaryProps) {
  const openings = getOpeningSummaries(position)
  const electedCount = position.candidates.filter(
    (candidate) => getCurrentCandidateStatus(position, candidate.id) === 'Elected',
  ).length
  const acceptedCount = openings.filter((opening) => opening.filled).length
  const remaining = Math.max(position.openings - acceptedCount, 0)

  return (
    <section className="workspace-summary" aria-labelledby="position-summary-heading">
      <div className="workspace-section-heading">
        <div>
          <p className="workspace-eyebrow">Position overview</p>
          <h2 id="position-summary-heading">{position.name}</h2>
        </div>
        <div className="position-status">
          <p><span>Lifecycle</span><strong>{getPositionLifecycle(position)}</strong></p>
          <p><span>Derived condition</span><strong className="workspace-condition">{getPositionCondition(position)}</strong></p>
        </div>
      </div>
      <dl className="workspace-metrics">
        <div><dt>Openings</dt><dd>{position.openings}</dd></div>
        <div><dt>Elected</dt><dd>{electedCount}</dd></div>
        <div><dt>Accepted / filled</dt><dd>{acceptedCount}</dd></div>
        <div><dt>Remaining to fill</dt><dd>{remaining}</dd></div>
      </dl>
      <div className="opening-list">
        <h3>Opening assignments</h3>
        {openings.map((opening) => (
          <article className="opening-row" key={opening.openingId}>
            <h4>Opening {opening.number}</h4>
            {opening.electedCandidate ? (
              <div className="opening-candidate">
                <strong>{opening.electedCandidate.name}</strong>
                <span>Decision: Elected</span>
                <span>Latest response: {opening.latestResponse?.status ?? 'Awaiting response'}</span>
              </div>
            ) : <p>Vacant · no elected candidate assigned</p>}
            <span className={`workspace-status ${opening.filled ? 'is-positive' : ''}`}>
              {opening.filled ? 'Filled' : 'Not filled'}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
