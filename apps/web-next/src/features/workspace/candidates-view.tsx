import { getCurrentCandidateStatus, getPollCandidateStatus } from '../../domain/position-summary'
import type { PositionSnapshot } from '../../domain/types'

interface CandidatesViewProps {
  position: PositionSnapshot
  viewedPollId: string | null
}

export function CandidatesView({ position, viewedPollId }: CandidatesViewProps) {
  const poll = position.polls.find((entry) => entry.id === viewedPollId)
  return (
    <section className="candidates-view" aria-labelledby="candidates-heading">
      <div className="poll-detail-heading">
        <div>
          <p className="workspace-eyebrow">Position-wide roster</p>
          <h2 id="candidates-heading">Candidates</h2>
        </div>
        <span>{position.candidates.length} candidates</span>
      </div>
      {position.candidates.length ? (
        <table className="candidate-table">
          <caption className="visually-hidden">Position-wide candidate status and viewed poll history</caption>
          <thead>
            <tr>
              <th scope="col">Candidate</th>
              <th scope="col">Current effective status</th>
              <th scope="col">Viewed poll name snapshot</th>
              <th scope="col">Viewed poll record</th>
              <th scope="col">Latest candidate response</th>
            </tr>
          </thead>
          <tbody>
            {position.candidates.map((candidate) => {
              const response = position.responseEvents
                .filter((event) => event.candidateId === candidate.id)
                .sort((left, right) => left.respondedAt.localeCompare(right.respondedAt))
                .at(-1)
              const pollStatus = poll?.type === 'voting'
                ? poll.recordedDecisions.find((decision) => decision.candidateId === candidate.id)?.status
                  ?? getPollCandidateStatus(position, poll.id, candidate.id)
                : undefined
              const currentStatus = getCurrentCandidateStatus(position, candidate.id)
              return (
                <tr key={candidate.id}>
                  <th scope="row">{candidate.name}</th>
                  <td>
                    <span className="mobile-field-label">Current effective status</span>
                    {currentStatus}
                    {currentStatus === 'Declined' ? <small className="legacy-note">Legacy recorded decision value; not a response.</small> : null}
                  </td>
                  <td>
                    <span className="mobile-field-label">Viewed poll name snapshot</span>
                    {poll?.candidateNames[candidate.id] ?? 'Not in viewed poll'}
                  </td>
                  <td>
                    <span className="mobile-field-label">Viewed poll record</span>
                    {poll ? pollStatus ?? 'No record' : 'No poll selected'}
                    {pollStatus === 'Declined' ? <small className="legacy-note">Legacy recorded decision value; not a response.</small> : null}
                  </td>
                  <td>
                    <span className="mobile-field-label">Latest candidate response</span>
                    {response?.status ?? (currentStatus === 'Elected' ? 'Awaiting response' : 'No response recorded')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : <p>No candidates in this position.</p>}
      {poll?.type === 'voting' ? <p className="source-snapshot-note">Viewed-poll names and statuses remain separate from current effective status.</p> : null}
    </section>
  )
}
