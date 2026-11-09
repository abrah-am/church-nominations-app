import { QRCodeSVG } from 'qrcode.react'
import { getCounts } from '../../model'
import { usePrototypeState } from '../../state/StateProvider'

export default function PresentationView() {
  const { sessionPosition: position, sessionPoll: poll } = usePrototypeState()
  const isNominationPoll = poll?.type === 'nomination'
  const canShowResults = poll?.status === 'Closed' && Boolean(poll.revealedAt)
  const counts = poll ? getCounts(poll) : {}
  const sortedCandidateIds = poll?.type === 'voting' ? [...poll.sourceCandidateIds].sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0) || (poll.candidateNames[a] ?? '').localeCompare(poll.candidateNames[b] ?? '')) : []
  const voterUrl = `${window.location.origin}/vote`
  const instructions = poll?.status === 'Open' ? isNominationPoll ? 'Scan to submit a nomination' : `Scan to vote · Choose ${poll.choiceCount}` : !poll && position.phase === 'intake' ? 'Please wait for nomination intake to open.' : 'Please wait for the administrator to begin.'

  return <section className="presentation-view">
    <header className="presentation-head"><div><p className="eyebrow">Church nominations · Live room display</p><h1>{position.name}</h1><p className="presentation-subtitle">{position.openings} opening{position.openings === 1 ? '' : 's'} · {poll ? `${isNominationPoll ? 'Nomination poll' : 'Voting poll'} ${poll.number} · ${poll.status}` : 'No poll is currently open'}</p></div><span className="live-indicator"><i />{poll?.status === 'Open' ? isNominationPoll ? 'Nominations open' : 'Voting open' : 'Live display'}</span></header>
    <div className="presentation-grid"><section className="presentation-main">
      {canShowResults && poll && poll.type === 'voting' ? <><div className="presentation-section-heading"><p className="eyebrow">Aggregate voting results · Revealed by administrator</p><h2>{poll.title}</h2><span>{poll.ballots.length} ballots · {poll.choiceCount} choice{poll.choiceCount === 1 ? '' : 's'} each</span></div><div className="result-list">{sortedCandidateIds.map((candidateId) => {
        const candidate = position.candidates.find((item) => item.id === candidateId)
        const name = poll.candidateNames[candidateId] ?? candidate?.name ?? 'Candidate'
        const count = counts[candidateId] ?? 0
        const percentage = poll.ballots.length ? Math.round(count / poll.ballots.length * 100) : 0
        return <div className="result-row" key={candidateId}><div className="result-name"><span>{name}</span><strong>{count} · {percentage}%</strong></div><div className="result-track" role="img" aria-label={`${name}: ${count} votes, ${percentage}% of ballots cast`}><span style={{ width: `${percentage}%` }} /></div></div>
      })}</div></> : <div className="presentation-wait"><span className="wait-index">01</span><div><p className="eyebrow">Meeting instructions</p><h2>{instructions}</h2><p>Use your personal device to participate. Your ballot remains private.</p></div></div>}
      {position.participationVisible && poll && poll.status === 'Open' && <div className="participation-total"><span className="participation-number">{isNominationPoll ? (poll.nominationSubmissions?.length ?? 0) : poll.ballots.length}</span><span><strong>{isNominationPoll ? 'Names submitted' : 'Participants submitted'}</strong><small>Aggregate participation only</small></span></div>}
      {poll?.type === 'nomination' && poll.status === 'Open' && <div className="results-wait-note">Nomination intake is open. Participant names are reviewed by the administrator after intake closes.</div>}
      {!canShowResults && poll?.type === 'voting' && poll.status === 'Closed' && <div className="results-wait-note">Voting is closed. Results will appear here only after the administrator reveals them.</div>}
    </section><aside className="presentation-access"><div className="qr-frame"><QRCodeSVG value={voterUrl} size={160} bgColor="#ffffff" fgColor="#003b5c" includeMargin /></div><h2>Join on your device</h2><p>Scan the QR code or open this link:</p><a href={voterUrl}>{window.location.host}/vote</a><div className="access-instruction">{instructions}</div></aside></div>
    <footer className="presentation-footer"><span>Church Nominations</span><span>Aggregate display · No voter identities or individual ballots</span></footer>
  </section>
}