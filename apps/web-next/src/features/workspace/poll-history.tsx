import type { ActiveSessionSnapshot, PositionSnapshot } from '../../domain/types'

interface PollHistoryProps {
  position: PositionSnapshot
  activeSession: ActiveSessionSnapshot | null
  viewedPollId: string | null
  onSelect: (pollId: string) => void
}

export function PollHistory({ position, activeSession, viewedPollId, onSelect }: PollHistoryProps) {
  return (
    <section className="poll-history" aria-labelledby="poll-history-heading">
      <h2 id="poll-history-heading">Poll history</h2>
      {position.polls.length ? (
        <ul>
          {position.polls.map((poll) => {
            const viewed = poll.id === viewedPollId
            const active = activeSession?.positionId === position.id
              && activeSession.pollId === poll.id
            return (
              <li key={poll.id}>
                <button
                  type="button"
                  className={`poll-history-item${viewed ? ' is-viewed' : ''}`}
                  aria-current={viewed ? 'true' : undefined}
                  onClick={() => onSelect(poll.id)}
                >
                  <span className="poll-title">{poll.title}</span>
                  <span className="poll-meta">{poll.type === 'nomination' ? 'Nomination' : 'Voting'} · {poll.status}</span>
                  <span className="poll-markers">
                    {viewed ? <span className="viewed-marker">Viewed</span> : null}
                    {active ? <span className="active-marker">Active session</span> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : <p>No polls in this position.</p>}
    </section>
  )
}
