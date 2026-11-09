import { useEffect, useState } from 'react'
import { id, now } from '../../model'
import { usePrototypeState } from '../../state/StateProvider'
import StatusBadge from '../../components/StatusBadge'

export default function VoterView() {
  const { sessionPosition: position, sessionPoll: poll, updatePosition, submitNomination: recordNomination } = usePrototypeState()
  const finalized = position.lifecycleEvents?.at(-1)?.status === 'Finalized'
  const [selected, setSelected] = useState<string[]>([])
  const [nominationNames, setNominationNames] = useState<string[]>([''])
  const [hasVoted, setHasVoted] = useState(false)
  const [notice, setNotice] = useState('')
  const isNominationPoll = poll?.type === 'nomination'
  const nominationLimit = poll?.maxNamesPerParticipant ?? 0
  const nominationCountKey = poll ? `prototype-nominations-${poll.id}` : ''
  const [submittedNominationCount, setSubmittedNominationCount] = useState(() => Number(poll ? sessionStorage.getItem(`prototype-nominations-${poll.id}`) : 0) || 0)
  const nominationsRemaining = Math.max(0, nominationLimit - submittedNominationCount)
  const candidates = position.candidates.filter((candidate) => poll?.sourceCandidateIds.includes(candidate.id)).map((candidate) => ({ ...candidate, name: poll?.candidateNames[candidate.id] ?? candidate.name }))
  useEffect(() => { setHasVoted(Boolean(poll && sessionStorage.getItem(`prototype-vote-${poll.id}`))) }, [poll?.id])
  useEffect(() => { setSubmittedNominationCount(Number(poll ? sessionStorage.getItem(`prototype-nominations-${poll.id}`) : 0) || 0); setNominationNames(['']) }, [poll?.id])

  const submitBallot = () => {
    if (!poll || poll.type !== 'voting' || poll.status !== 'Open' || selected.length !== poll.choiceCount) { setNotice(`Select exactly ${poll?.choiceCount ?? 0} candidate${poll?.choiceCount === 1 ? '' : 's'} to continue.`); return }
    updatePosition(position.id, (current) => ({ ...current, polls: current.polls.map((item) => item.id === poll.id ? { ...item, ballots: [...item.ballots, { id: id(), selections: selected }] } : item) }))
    sessionStorage.setItem(`prototype-vote-${poll.id}`, 'submitted')
    setHasVoted(true)
    setSelected([])
    setNotice('Your anonymous ballot has been recorded. Thank you for participating.')
  }
  const submitNomination = () => {
    const names = nominationNames.map((name) => name.trim()).filter(Boolean).slice(0, nominationsRemaining)
    if (!poll || poll.type !== 'nomination' || poll.status !== 'Open' || names.length === 0 || submittedNominationCount >= nominationLimit) return
    const submittedAt = now()
    recordNomination(position.id, poll.id, names.map((name) => ({ id: id(), name, submittedAt })))
    const nextCount = submittedNominationCount + names.length
    sessionStorage.setItem(nominationCountKey, String(nextCount))
    setSubmittedNominationCount(nextCount)
    setNominationNames([''])
    setNotice(nextCount >= nominationLimit ? `${names.length} name${names.length === 1 ? '' : 's'} submitted. Your name limit has been reached.` : `${names.length} name${names.length === 1 ? '' : 's'} submitted. You may submit ${nominationLimit - nextCount} more.`)
  }
  const statusText = finalized ? 'Session complete' : poll?.status === 'Open' ? `${isNominationPoll ? 'Nomination poll' : 'Voting poll'} ${poll.number} is open` : poll?.status === 'Closed' ? `Poll ${poll.number} is closed` : 'No action is currently open'

  return <section className="voter-wrap">
    <div className="page-heading"><div><p className="eyebrow">{finalized ? 'Participant session' : 'Anonymous guest access'}</p><h1>{finalized ? 'Session complete' : isNominationPoll ? 'Submit a nomination' : 'Participate in voting'}</h1><p className="lead-copy">{finalized ? 'This position’s participant session has ended.' : 'No sign-in required. Your identity is not collected in this simulation.'}</p></div>{!finalized && <StatusBadge status={poll?.status ?? 'Closed'} />}</div>
    <div className="toolbar-row voter-toolbar"><p className="position-hint">{position.name} · {position.openings} opening{position.openings === 1 ? '' : 's'}</p></div>
    {finalized && <section className="voter-panel quiet-panel" aria-live="polite"><div className="quiet-symbol">✓</div><p className="eyebrow">Session complete</p><h2>Thank you for participating</h2><p className="section-copy">This position’s participant session has ended. No further submissions are being accepted.</p></section>}
    {!finalized && notice && <div className={`alert ${hasVoted ? 'alert-success' : 'alert-info'}`} role="status">{notice}</div>}
    {!finalized && isNominationPoll && poll?.status === 'Open' && <section className="voter-panel"><p className="eyebrow">{statusText}</p><h2>{poll.title}</h2><p className="section-copy">You may propose up to {nominationLimit} names for this poll. {nominationsRemaining} name{nominationsRemaining === 1 ? '' : 's'} remaining.</p>{nominationsRemaining > 0 ? <><div className="nomination-name-fields">{nominationNames.map((name, index) => <label className="field-label" key={index}>Name {index + 1}<input className="form-control form-control-lg" value={name} onChange={(event) => setNominationNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Full name" /></label>)}</div><div className="button-row nomination-form-actions">{nominationNames.length < nominationsRemaining && <button className="btn btn-outline-primary" onClick={() => setNominationNames((current) => [...current, ''])}>Add another name</button>}<button className="btn btn-primary btn-lg" disabled={!nominationNames.some((name) => name.trim())} onClick={submitNomination}>Submit names</button></div></> : <div className="private-strip">You have submitted the maximum of {nominationLimit} names for this poll.</div>}<p className="privacy-line">Each submitted name is retained for administrator review. Names are not linked to any later ballot.</p></section>}
    {!finalized && poll?.type === 'voting' && poll.status === 'Open' && <section className="voter-panel"><div className="poll-title-row"><div><p className="eyebrow">{statusText}</p><h2>{position.name} · Round {poll.number}</h2></div><span className="choice-rule">Choose {poll.choiceCount}</span></div><p className="section-copy">Select exactly {poll.choiceCount} candidate{poll.choiceCount === 1 ? '' : 's'}. Your ballot is anonymous and cannot be changed after submission.</p><div className="ballot-options">{candidates.map((candidate) => <label key={candidate.id} className={`ballot-option ${selected.includes(candidate.id) ? 'selected' : ''}`}><input className="form-check-input" type={poll.choiceCount === 1 ? 'radio' : 'checkbox'} name="candidate-choice" checked={selected.includes(candidate.id)} onChange={() => setSelected((current) => current.includes(candidate.id) ? current.filter((value) => value !== candidate.id) : poll.choiceCount === 1 ? [candidate.id] : current.length < poll.choiceCount ? [...current, candidate.id] : current)} /><span>{candidate.name}</span></label>)}</div><button className="btn btn-primary btn-lg w-100" disabled={hasVoted || selected.length !== poll.choiceCount} onClick={submitBallot}>{hasVoted ? 'Ballot submitted' : 'Review and submit ballot'}</button><p className="privacy-line">Ballots are stored without voter names. Individual selections are never shown to administrators or the audience.</p></section>}
    {!finalized && poll?.status === 'Closed' && <section className="voter-panel quiet-panel"><div className="quiet-symbol">✓</div><p className="eyebrow">{poll.type === 'nomination' ? 'Nomination poll closed' : 'Voting poll closed'}</p><h2>Thank you for participating</h2><p className="section-copy">This poll is no longer accepting submissions. Results are not displayed here.</p></section>}
    {!poll && <section className="voter-panel quiet-panel"><div className="quiet-symbol">•</div><p className="eyebrow">No active poll</p><h2>Nothing to submit right now</h2><p className="section-copy">Please follow the instructions shown by your meeting administrator.</p></section>}
    {!finalized && poll?.status === 'Draft' && <section className="voter-panel quiet-panel"><div className="quiet-symbol">•</div><p className="eyebrow">Poll not open</p><h2>Voting has not started</h2><p className="section-copy">The administrator will open the poll when it is time to vote.</p></section>}
  </section>
}