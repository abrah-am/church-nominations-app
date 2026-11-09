import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getCounts, getCurrentCandidateStatus, getOpeningSummaries, getPollCandidateStatus, getPositionCondition, getPositionLifecycle, getReplacementOptions, id, now, type Candidate, type CandidateDecisionEvent, type CandidateInvitationEvent, type CandidateResponseEvent, type CandidateStatus, type Poll } from '../../model'
import { usePrototypeState } from '../../state/StateProvider'
import StatusBadge from '../../components/StatusBadge'

const statusChoices: CandidateStatus[] = ['Pending', 'Advanced', 'Elected', 'Eliminated']
type DetailTab = 'results' | 'decisions' | 'workspace' | 'audit'

interface ClosedRoundWorkspaceProps {
  poll: Poll
  sortedResults: string[]
  results: Record<string, number>
  totalBallots: number
  candidateById: Record<string, Candidate>
  decisionStatuses: Record<string, CandidateStatus>
  setDecisionStatuses: (update: (current: Record<string, CandidateStatus>) => Record<string, CandidateStatus>) => void
  position: ReturnType<typeof usePrototypeState>['position']
  openingSummaries: ReturnType<typeof getOpeningSummaries>
  lifecycle: ReturnType<typeof getPositionLifecycle>
  readOnly: boolean
  positionReadOnly: boolean
  termReadOnly: boolean
  decisionNote: string
  setDecisionNote: (value: string) => void
  saveDecisions: () => void
  recordResponse: (candidateId: string, openingId: string, status: 'Accepted' | 'Declined') => void
  setResponseCandidateId: (candidateId: string) => void
}

function ClosedRoundWorkspace({ poll, sortedResults, results, totalBallots, candidateById, decisionStatuses, setDecisionStatuses, position, openingSummaries, lifecycle, readOnly, positionReadOnly, termReadOnly, decisionNote, setDecisionNote, saveDecisions, recordResponse, setResponseCandidateId }: ClosedRoundWorkspaceProps) {
  return <div className="closed-round-workspace">
    <div className="results-summary-heading"><strong>{totalBallots}</strong><span>ballots cast · final admin totals</span></div>
    {totalBallots === 0 && <p className="empty-copy">No ballots have been cast yet.</p>}
    <p className="help-text">Percentages use ballots cast as the denominator. Multi-select totals may exceed 100%. Individual ballot selections are never displayed.</p>
    <div className="closed-round-list">{sortedResults.map((candidateId) => {
      const count = results[candidateId] ?? 0
      const percentage = totalBallots ? Math.round(count / totalBallots * 100) : 0
      const name = poll.candidateNames[candidateId] ?? candidateById[candidateId]?.name ?? 'Candidate'
      const status = decisionStatuses[candidateId] ?? getPollCandidateStatus(position, poll.id, candidateId)
      const opening = openingSummaries.find((item) => item.candidate?.id === candidateId && item.electedCandidate?.id === candidateId)
      return <article className="closed-round-row" key={candidateId}>
        <div className="closed-round-result"><div className="result-name"><span>{name}</span><strong>{count} votes · {percentage}%</strong></div><div className="result-track" role="img" aria-label={`${name}: ${count} votes, ${percentage}% of ballots cast`}><span style={{ width: `${percentage}%` }} /></div></div>
        <div className="closed-round-decision"><label className="field-label">Election decision<select className="form-select decision-select" disabled={positionReadOnly || status === 'Elected'} value={status} onChange={(event) => setDecisionStatuses((current) => ({ ...current, [candidateId]: event.target.value as CandidateStatus }))}>{statusChoices.map((choice) => <option key={choice}>{choice}</option>)}</select></label>
          {status === 'Elected' ? <div className="candidate-response-control"><span>Candidate response: <strong>{opening?.latestResponse?.status ?? 'Awaiting response'}</strong></span>{opening && !readOnly && lifecycle !== 'Finalized' && !opening.latestResponse && <div className="button-row"><button className="btn btn-sm btn-outline-primary" onClick={() => recordResponse(candidateId, opening.openingId, 'Accepted')}>Record acceptance</button><button className="btn btn-sm btn-outline-secondary" onClick={() => recordResponse(candidateId, opening.openingId, 'Declined')}>Record decline</button></div>}{opening && lifecycle === 'Finalized' && opening.latestResponse?.status === 'Accepted' && !termReadOnly && <button className="btn btn-sm btn-outline-danger" onClick={() => setResponseCandidateId(candidateId)}>Record later decline</button>}</div> : <small className="help-text">Candidate response is recorded only after an Elected decision.</small>}
        </div>
      </article>
    })}</div>
    <label className="field-label decision-note">Decision note<input className="form-control" disabled={positionReadOnly} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Reason or meeting note" /></label>
    {!positionReadOnly && <button className="btn btn-primary" onClick={saveDecisions}>Save decision revision</button>}
  </div>
}

export default function AdminView() {
  const { state, position, selectPoll, openPollAndActivate, updatePosition, addPoll, updatePoll, appendDecisionEvents, addAudit } = usePrototypeState()
  const selectedTerm = state.terms.find((term) => term.id === position.termId)
  const lifecycle = getPositionLifecycle(position)
  const termReadOnly = selectedTerm?.status === 'Historical'
  const readOnly = termReadOnly || lifecycle === 'Finalized'
  const [actor, setActor] = useState('Administrator')
  const [sourceId, setSourceId] = useState('')
  const [choiceCount, setChoiceCount] = useState('1')
  const [draftIds, setDraftIds] = useState<string[] | null>(null)
  const [manualDraftEdits, setManualDraftEdits] = useState(false)
  const [showSourceChoices, setShowSourceChoices] = useState(false)
  const [decisionStatuses, setDecisionStatuses] = useState<Record<string, CandidateStatus>>({})
  const [decisionNote, setDecisionNote] = useState('')
  const [notice, setNotice] = useState('')
  const [nominationLimitInput, setNominationLimitInput] = useState('')
  const [consolidationIds, setConsolidationIds] = useState<string[]>([])
  const [approvalReviewOpen, setApprovalReviewOpen] = useState(false)
  const [showVotingSetup, setShowVotingSetup] = useState(false)
  const [directRosterText, setDirectRosterText] = useState('')
  const [detailTab, setDetailTab] = useState<DetailTab>('results')
  const [positionView, setPositionView] = useState<'polls' | 'candidates'>('polls')
  const [showQr, setShowQr] = useState(false)
  const [activationConflict, setActivationConflict] = useState<Poll | null>(null)
  const [lifecycleDialog, setLifecycleDialog] = useState<'finalize' | 'reopen' | null>(null)
  const [responseCandidateId, setResponseCandidateId] = useState<string | null>(null)
  const [invitationDraft, setInvitationDraft] = useState<{ candidateId: string; openingId: string; replacedCandidateId: string; sourcePollId: string } | null>(null)
  const [replacementDraft, setReplacementDraft] = useState<{ candidateIds: string[]; rationale: string; sourcePollId: string; tieBreak: boolean; declinedCandidateId: string } | null>(null)
  const viewedPollId = state.viewedPollIds?.[position.id] ?? position.polls.at(-1)?.id ?? ''
  const selectedPoll = position.polls.find((poll) => poll.id === viewedPollId)
  const activeSessionPosition = state.positions.find((item) => item.id === state.activeSessionPositionId)
  const activeSessionPoll = activeSessionPosition?.polls.find((poll) => poll.id === state.activeSessionPollId)
  const currentStatuses = Object.fromEntries(position.candidates.map((candidate) => [candidate.id, getCurrentCandidateStatus(position, candidate.id)])) as Record<string, CandidateStatus>
  const nominationPoll = selectedPoll?.type === 'nomination' ? selectedPoll : undefined
  const nominationSubmissions = nominationPoll?.nominationSubmissions ?? []
  const candidateById = Object.fromEntries(position.candidates.map((candidate) => [candidate.id, candidate]))
  const completedVotingPolls = position.polls.filter((poll) => poll.type === 'voting' && poll.status === 'Closed')
  const latestCompletedVotingPoll = completedVotingPolls.at(-1)
  const approvedNominationPoll = position.polls.find((poll) => poll.type === 'nomination' && poll.status === 'Approved')
  const firstVotingRound = position.polls.every((poll) => poll.type !== 'voting')
  const resolvedSourceId = sourceId || (firstVotingRound ? approvedNominationPoll?.id : latestCompletedVotingPoll?.id) || ''
  const sourcePoll = position.polls.find((poll) => poll.id === resolvedSourceId)
  const candidateSourceOptions = (firstVotingRound ? (approvedNominationPoll ? [approvedNominationPoll] : []) : completedVotingPolls).filter((poll, index, polls) => poll.id !== resolvedSourceId && polls.findIndex((candidate) => candidate.id === poll.id) === index)

  useEffect(() => {
    setDecisionStatuses(Object.fromEntries((selectedPoll?.type === 'voting' ? selectedPoll.sourceCandidateIds : []).map((candidateId) => {
      const status = getPollCandidateStatus(position, selectedPoll!.id, candidateId)
      return [candidateId, status === 'Declined' ? 'Pending' : status]
    })))
    setDetailTab(selectedPoll?.type === 'voting' && selectedPoll.status === 'Closed' ? 'workspace' : 'results')
  }, [selectedPoll?.id, selectedPoll?.status, position.id])

  const availableDraftIds = sourcePoll?.sourceCandidateIds ?? position.candidates.map((candidate) => candidate.id)
  const sourceResults = sourcePoll?.type === 'voting' ? getCounts(sourcePoll) : {}
  const sourceBallotsCast = sourcePoll?.type === 'voting' ? sourcePoll.ballots.length : 0
  const sourceDecision = (candidateId: string): CandidateStatus => sourcePoll?.type === 'voting'
    ? sourcePoll.decisions.at(-1)?.outcomes[candidateId] ?? getPollCandidateStatus(position, sourcePoll.id, candidateId)
    : 'Pending'
  const sourceCandidateName = (candidateId: string) => sourcePoll ? sourcePoll.candidateNames[candidateId] ?? 'Candidate' : candidateById[candidateId]?.name ?? 'Candidate'
  const sortedDraftIds = [...availableDraftIds].sort((a, b) => (sourceResults[b] ?? 0) - (sourceResults[a] ?? 0) || sourceCandidateName(a).localeCompare(sourceCandidateName(b)))
  const defaultDraftIds = sourcePoll?.type === 'nomination'
    ? sourcePoll.sourceCandidateIds.filter((candidateId) => !['Elected', 'Declined'].includes(currentStatuses[candidateId]))
    : sourcePoll?.type === 'voting'
      ? sourcePoll.sourceCandidateIds.filter((candidateId) => sourceDecision(candidateId) === 'Advanced' && !['Elected', 'Declined'].includes(currentStatuses[candidateId]))
      : availableDraftIds.filter((candidateId) => !['Elected', 'Declined'].includes(currentStatuses[candidateId]))
  const selectedDraftIds = draftIds ?? defaultDraftIds
  const selectionLimitOptions = Array.from({ length: selectedDraftIds.length }, (_, index) => index + 1)
  const voterUrl = `${window.location.origin}/vote`
  const presentationUrl = `${window.location.origin}/presentation`
  const electedCount = Object.values(currentStatuses).filter((status) => status === 'Elected').length
  const results = selectedPoll?.type === 'voting' ? getCounts(selectedPoll) : {}
  const totalBallots = selectedPoll?.type === 'voting' ? selectedPoll.ballots.length : 0
  const sortedResults = selectedPoll?.type === 'voting' ? [...selectedPoll.sourceCandidateIds].sort((a, b) => (results[b] ?? 0) - (results[a] ?? 0) || (selectedPoll.candidateNames[a] ?? candidateById[a]?.name ?? '').localeCompare(selectedPoll.candidateNames[b] ?? candidateById[b]?.name ?? '')) : []
  const positionCondition = getPositionCondition(position)
  const displayedCondition = termReadOnly && positionCondition === 'Ready to Finalize' ? 'In Progress' : positionCondition
  const openingSummaries = getOpeningSummaries(position)
  const acceptedCount = openingSummaries.filter((opening) => opening.latestResponse?.status === 'Accepted').length
  const remainingOpenings = Math.max(0, position.openings - acceptedCount)
  const positionReadOnly = readOnly

  const beginVotingSetup = (preferredSourceId = '') => {
    setSourceId(preferredSourceId || (firstVotingRound ? approvedNominationPoll?.id : latestCompletedVotingPoll?.id) || '')
    setDraftIds(null)
    setManualDraftEdits(false)
    setShowSourceChoices(false)
    setChoiceCount('1')
    setShowVotingSetup(true)
    setPositionView('polls')
  }
  const changeVotingSource = (nextSourceId: string) => {
    if (nextSourceId === resolvedSourceId) { setShowSourceChoices(false); return }
    if (manualDraftEdits && !window.confirm('Changing the candidate source will replace your manual candidate selections. Continue?')) return
    setSourceId(nextSourceId)
    setDraftIds(null)
    setManualDraftEdits(false)
    setChoiceCount('1')
    setShowSourceChoices(false)
  }
  const makePoll = () => {
    if (!selectedDraftIds.length) { setNotice('Select at least one candidate for the draft.'); return }
    const round = position.polls.filter((poll) => poll.type === 'voting').length + 1
    const poll: Poll = {
      id: id(), type: 'voting', number: round, title: `${position.name} · Round ${round}`,
      createdAt: now(), sourcePollId: sourcePoll?.id, sourceCandidateIds: [...selectedDraftIds],
      candidateNames: Object.fromEntries(selectedDraftIds.map((candidateId) => [candidateId, sourcePoll?.candidateNames[candidateId] ?? candidateById[candidateId]?.name ?? 'Candidate'])),
      choiceCount: Math.max(1, Math.min(Number(choiceCount) || 1, selectedDraftIds.length)), status: 'Draft', ballots: [], decisions: [],
    }
    addPoll(position.id, poll)
    selectPoll(position.id, poll.id)
    addAudit({ action: 'Poll draft created', positionId: position.id, pollId: poll.id, actor, detail: `Based on ${sourcePoll?.title ?? 'current nominations'}` })
    setShowVotingSetup(false)
    setDraftIds(null)
    setManualDraftEdits(false)
    setNotice('Voting draft created. Review its roster and settings before opening.')
  }
  const createNominationPoll = () => {
    const number = position.polls.filter((poll) => poll.type === 'nomination').length + 1
    const poll: Poll = { id: id(), type: 'nomination', number, title: `${position.name} · Nomination Poll ${number}`, createdAt: now(), sourceCandidateIds: [], candidateNames: {}, choiceCount: 0, status: 'Draft', ballots: [], decisions: [], nominationSubmissions: [] }
    addPoll(position.id, poll)
    selectPoll(position.id, poll.id)
    updatePosition(position.id, (current) => ({ ...current, phase: 'intake' }))
    addAudit({ action: 'Nomination poll created', positionId: position.id, pollId: poll.id, actor, detail: `Nomination poll ${number} created.` })
    setNotice('Nomination poll created. Open intake when ready for participants.')
  }
  const openNomination = () => {
    if (!nominationPoll) return
    const limit = Number(nominationLimitInput || nominationPoll.maxNamesPerParticipant)
    if (!Number.isInteger(limit) || limit < 1) { setNotice('Set a whole-number name of at least 1 before opening intake.'); return }
    const result = openPollAndActivate(position.id, nominationPoll.id, false)
    if (!result.ok && result.conflictPoll) { setActivationConflict(result.conflictPoll); return }
    updatePoll(position.id, nominationPoll.id, (poll) => ({ ...poll, maxNamesPerParticipant: limit, status: 'Open', openedAt: poll.openedAt ?? now() }))
    addAudit({ action: 'Nomination intake opened', positionId: position.id, pollId: nominationPoll.id, actor, detail: nominationPoll.title })
    setNotice('Nomination intake is open. The voter link now accepts free-text names.')
  }
  const activateSelectedPoll = (poll: Poll) => {
    const result = openPollAndActivate(position.id, poll.id, false)
    if (!result.ok && result.conflictPoll) { setActivationConflict(result.conflictPoll); return }
    if (result.ok) setNotice(`${poll.title} is now open and active for voters and presentation.`)
  }
  const resolveActivationConflict = () => {
    if (!activationConflict || !selectedPoll) return
    const result = openPollAndActivate(position.id, selectedPoll.id, true)
    if (result.ok) {
      if (selectedPoll.type === 'nomination') updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, status: 'Open', maxNamesPerParticipant: Number(nominationLimitInput || poll.maxNamesPerParticipant), openedAt: poll.openedAt ?? now() }))
      else updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, status: 'Open', openedAt: poll.openedAt ?? now() }))
      addAudit({ action: 'Poll session switched', positionId: position.id, pollId: selectedPoll.id, actor, detail: `Closed ${activationConflict.title} and opened ${selectedPoll.title}.` })
      setNotice(`${selectedPoll.title} is now the active voter and presentation session.`)
    }
    setActivationConflict(null)
  }
  const closeNomination = () => {
    if (!nominationPoll) return
    const snapshot = [...nominationSubmissions]
    updatePoll(position.id, nominationPoll.id, (poll) => ({ ...poll, status: 'Closed', closedAt: now(), nominationSubmissions: snapshot }))
    updatePosition(position.id, (current) => ({ ...current, phase: 'review', candidates: snapshot.map((submission) => ({ id: id(), name: submission.name, sourceSubmissionIds: [submission.id] })) }))
    addAudit({ action: 'Nomination intake closed', positionId: position.id, pollId: nominationPoll.id, actor, detail: `${snapshot.length} original submissions preserved.` })
    setNotice('Intake closed. Original submissions are preserved; review and consolidate the candidate list below.')
  }
  const approveNominationRoster = () => {
    if (!nominationPoll || nominationPoll.status !== 'Closed') return
    const invalidCandidate = position.candidates.find((candidate) => !candidate.name.trim())
    if (invalidCandidate) { setNotice('Every candidate must have a non-blank name before roster approval.'); return }
    const approvedCandidates = position.candidates.map((candidate) => ({ id: candidate.id, name: candidate.name, sourceSubmissionIds: [...candidate.sourceSubmissionIds] }))
    updatePoll(position.id, nominationPoll.id, (poll) => ({ ...poll, status: 'Approved', approvedAt: now(), approvedBy: actor, sourceCandidateIds: approvedCandidates.map((candidate) => candidate.id), candidateNames: Object.fromEntries(approvedCandidates.map((candidate) => [candidate.id, candidate.name])) }))
    updatePosition(position.id, (current) => ({ ...current, phase: 'ready' }))
    setApprovalReviewOpen(false)
    setNotice('Candidate list approved. Create a voting poll from this roster when ready.')
  }
  const consolidateCandidates = () => {
    if (!nominationPoll || nominationPoll.status !== 'Closed' || consolidationIds.length < 2) return
    const [primaryId, ...mergedIds] = consolidationIds
    const primary = position.candidates.find((candidate) => candidate.id === primaryId)
    const merged = position.candidates.filter((candidate) => mergedIds.includes(candidate.id))
    if (!primary || !window.confirm(`Merge ${merged.length} selected candidates into ${primary.name}? Their original nominations remain preserved.`)) return
    const sourceSubmissionIds = [...new Set([primary, ...merged].flatMap((candidate) => candidate.sourceSubmissionIds))]
    updatePosition(position.id, (current) => ({
      ...current,
      candidates: current.candidates.filter((candidate) => !mergedIds.includes(candidate.id)).map((candidate) => candidate.id === primaryId ? { ...candidate, sourceSubmissionIds } : candidate),
    }))
    addAudit({ action: 'Nomination candidates consolidated', positionId: position.id, pollId: nominationPoll.id, actor, detail: `${merged.map((candidate) => candidate.name).join(', ')} merged into ${primary.name}.` })
    setConsolidationIds([])
    setNotice(`Selected nominations were consolidated into ${primary.name}. Original submissions remain preserved.`)
  }
  const editCandidate = (candidateId: string, patch: Partial<Candidate>) => {
    const previousName = candidateById[candidateId]?.name
    updatePosition(position.id, (current) => ({ ...current, candidates: current.candidates.map((candidate) => candidate.id === candidateId ? { ...candidate, ...patch } : candidate) }))
    if (patch.name !== undefined && previousName !== undefined && patch.name !== previousName) addAudit({ action: 'Nomination candidate name corrected', positionId: position.id, pollId: nominationPoll?.id, actor, detail: `Candidate name changed from ${previousName} to ${patch.name}. Original submissions remain unchanged.` })
  }
  const excludeCandidate = (candidateId: string) => {
    const candidate = position.candidates.find((item) => item.id === candidateId)
    if (!candidate || !nominationPoll || nominationPoll.status !== 'Closed') return
    updatePosition(position.id, (current) => ({ ...current, candidates: current.candidates.filter((item) => item.id !== candidateId) }))
    setConsolidationIds((current) => current.filter((id) => id !== candidateId))
    addAudit({ action: 'Nomination candidate excluded', positionId: position.id, pollId: nominationPoll.id, actor, detail: `${candidate.name} excluded. Original submissions remain preserved.` })
  }
  const saveDecisions = () => {
    if (selectedPoll?.type !== 'voting') return
    const outcomes = Object.fromEntries(selectedPoll.sourceCandidateIds.map((candidateId) => {
      const status = decisionStatuses[candidateId] ?? getPollCandidateStatus(position, selectedPoll.id, candidateId)
      return [candidateId, position.decisions.some((event) => event.candidateId === candidateId && event.status === 'Elected') ? 'Elected' : status === 'Declined' ? 'Pending' : status]
    })) as Record<string, CandidateStatus>
    const revision = { revision: selectedPoll.decisions.length + 1, decidedAt: now(), decidedBy: actor, outcomes, note: decisionNote }
    updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, decisions: [...poll.decisions, revision] }))
    const events: CandidateDecisionEvent[] = Object.entries(outcomes).filter(([candidateId]) => !position.decisions.some((event) => event.candidateId === candidateId && event.status === 'Elected')).map(([candidateId, status]) => {
      const previous = [...position.decisions].reverse().find((event) => event.candidateId === candidateId && !position.decisions.some((later) => later.supersedesEventId === event.id))
      return { id: id(), candidateId, pollId: selectedPoll.id, status, decidedAt: revision.decidedAt, decidedBy: actor, note: decisionNote || `Recorded from ${selectedPoll.title}.`, ...(previous ? { supersedesEventId: previous.id } : {}) }
    })
    appendDecisionEvents(position.id, events)
    addAudit({ action: 'Decision revision saved', positionId: position.id, pollId: selectedPoll.id, actor, detail: `Revision ${revision.revision}${decisionNote ? ` · ${decisionNote}` : ''}` })
    setNotice(`Decision revision ${revision.revision} saved to the audit history.`)
  }
  const reveal = () => {
    if (selectedPoll?.type !== 'voting' || selectedPoll.status !== 'Closed') return
    updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, revealedAt: now(), revealedBy: actor }))
    addAudit({ action: 'Aggregate results revealed', positionId: position.id, pollId: selectedPoll.id, actor, detail: 'Presentation results made available.' })
  }
  const copyUrl = async (url: string, label: string) => {
    try { await navigator.clipboard.writeText(url); setNotice(`${label} URL copied.`) }
    catch { setNotice(`Copy is unavailable in this browser. URL: ${url}`) }
  }
  const finalizePosition = () => {
    if (getPositionCondition(position) !== 'Ready to Finalize' || position.polls.some((poll) => poll.status === 'Open')) return
    const at = now()
    const eventId = id()
    updatePosition(position.id, (current) => ({ ...current, lifecycleEvents: [...current.lifecycleEvents, { id: eventId, status: 'Finalized', at, actor, detail: 'All openings accepted; no polls were open.' }] }))
    addAudit({ action: 'Position finalized', positionId: position.id, actor, detail: `Finalized with ${position.openings} accepted opening${position.openings === 1 ? '' : 's'}. Presentation visibility unchanged.` })
    setLifecycleDialog(null)
    setNotice('Position finalized. Participant activity has ended; poll history and presentation visibility are unchanged.')
  }
  const reopenPosition = () => {
    if (lifecycle !== 'Finalized') return
    updatePosition(position.id, (current) => ({ ...current, lifecycleEvents: [...current.lifecycleEvents, { id: id(), status: 'Reopened', at: now(), actor, detail: 'Position explicitly reopened for follow-up.' }] }))
    addAudit({ action: 'Position reopened', positionId: position.id, actor, detail: 'Position reopened. No poll was created or opened.' })
    setLifecycleDialog(null)
    setNotice('Position reopened. No poll was created or activated.')
  }
  const recordResponse = (candidateId: string, openingId: string, status: 'Accepted' | 'Declined') => {
    const response: CandidateResponseEvent = { id: id(), candidateId, openingId, status, respondedAt: now(), recordedBy: actor, note: status === 'Declined' ? 'Later decline recorded after finalization.' : 'Candidate response recorded.' }
    updatePosition(position.id, (current) => ({ ...current, responseEvents: [...current.responseEvents, response] }))
    const invitedCandidate = position.invitationEvents?.some((event) => event.candidateId === candidateId && event.openingId === openingId)
    addAudit({ action: status === 'Declined' ? invitedCandidate ? 'Replacement invitee declined' : 'Later candidate decline recorded' : invitedCandidate ? 'Replacement invitee accepted' : 'Candidate acceptance recorded', positionId: position.id, pollId: invitedCandidate ? position.invitationEvents?.find((event) => event.candidateId === candidateId && event.openingId === openingId)?.sourcePollId : undefined, actor, detail: `${candidateById[candidateId]?.name ?? 'Candidate'} · opening ${openingId.split(':').at(-1)}` })
    setResponseCandidateId(null)
    setNotice(`${status} response appended to candidate history.`)
  }
  const recordInvitation = () => {
    if (!invitationDraft || lifecycle !== 'Reopened' || positionCondition !== 'Vacancy') return
    const options = getReplacementOptions(position, invitationDraft.replacedCandidateId)
    if (options.topTie.length || options.options[0]?.candidateId !== invitationDraft.candidateId || options.sourcePoll?.id !== invitationDraft.sourcePollId) return
    const invitation: CandidateInvitationEvent = { id: id(), ...invitationDraft, invitedAt: now(), invitedBy: actor }
    updatePosition(position.id, (current) => ({ ...current, invitationEvents: [...(current.invitationEvents ?? []), invitation] }))
    addAudit({ action: 'Replacement candidate invited', positionId: position.id, pollId: invitation.sourcePollId, actor, detail: `${candidateById[invitation.candidateId]?.name ?? 'Candidate'} invited for opening ${invitation.openingId.split(':').at(-1)} from ${position.polls.find((poll) => poll.id === invitation.sourcePollId)?.title ?? 'source round'}.` })
    setInvitationDraft(null)
    setNotice('Invitation recorded. The opening remains vacant until the candidate separately accepts.')
  }
  const makeReplacementDraft = () => {
    if (!replacementDraft || lifecycle === 'Finalized' || !replacementDraft.candidateIds.length || !replacementDraft.rationale.trim()) return
    const source = position.polls.find((poll) => poll.id === replacementDraft.sourcePollId)
    if (!source) return
    const replacementOptions = getReplacementOptions(position, replacementDraft.declinedCandidateId)
    if (replacementDraft.tieBreak && (replacementDraft.candidateIds.length !== replacementOptions.topTie.length || !replacementOptions.topTie.every((candidateId) => replacementDraft.candidateIds.includes(candidateId)))) return
    const number = position.polls.filter((poll) => poll.type === 'voting').length + 1
    const draft: Poll = { id: id(), type: 'voting', number, title: `${position.name} · Replacement Round ${number}`, createdAt: now(), sourcePollId: source.id, sourceCandidateIds: [...replacementDraft.candidateIds], candidateNames: Object.fromEntries(replacementDraft.candidateIds.map((candidateId) => [candidateId, source.candidateNames[candidateId] ?? candidateById[candidateId]?.name ?? 'Candidate'])), choiceCount: 1, status: 'Draft', ballots: [], decisions: [] }
    addPoll(position.id, draft)
    selectPoll(position.id, draft.id)
    addAudit({ action: replacementDraft.tieBreak ? 'Replacement tie-break draft created' : 'Replacement poll draft created', positionId: position.id, pollId: draft.id, actor, detail: `Source: ${source.title}. Rationale: ${replacementDraft.rationale}` })
    setReplacementDraft(null)
    setPositionView('polls')
    setNotice('Replacement poll draft created. It is not open and no candidate has been elected.')
  }
  const handleOpen = (poll: Poll) => {
    if (poll.type === 'nomination') openNomination()
    else activateSelectedPoll(poll)
  }

  return <section>
    <header className="position-summary">
      <div className="position-summary-heading"><div><p className="eyebrow">{selectedTerm?.name} · {state.departments.find((department) => department.id === position.departmentId)?.name}</p><h1>{position.name}</h1></div><a className="btn btn-sm btn-outline-primary" href="/admin/setup">Position setup</a></div>
      <div className="position-summary-metrics"><div><strong>{position.openings}</strong><span>openings</span></div><div><strong>{electedCount}</strong><span>elected</span></div><div><strong>{acceptedCount}</strong><span>accepted</span></div><div><strong>{remainingOpenings}</strong><span>remaining openings</span></div><div className="position-summary-status"><span>Position status</span><strong>{lifecycle}{positionCondition === 'Vacancy' && lifecycle === 'Finalized' ? ' · Vacancy' : ''}</strong></div></div>
    </header>

    <section className="position-lifecycle-strip" aria-label="Position completion summary">
      <div className="lifecycle-strip-heading"><div><span className="eyebrow">Position completion</span><strong>{lifecycle === 'Finalized' ? `Finalized${displayedCondition === 'Vacancy' ? ' · Vacancy' : ''}` : `${lifecycle} · ${displayedCondition}`}</strong></div><div className="button-row">{positionCondition === 'Ready to Finalize' && lifecycle !== 'Finalized' && !termReadOnly && <button className="btn btn-sm btn-primary" onClick={() => setLifecycleDialog('finalize')}>Finalize position</button>}{lifecycle === 'Finalized' && <button className="btn btn-sm btn-outline-secondary" disabled={termReadOnly} onClick={() => setLifecycleDialog('reopen')}>Reopen position</button>}</div></div>
        <div className="opening-status-list">{openingSummaries.map((opening) => <article className="opening-status-row" key={opening.openingId}><span className="opening-number">Opening {opening.number}</span><div className="opening-candidate"><strong>{opening.candidate?.name ?? 'Vacant'}</strong><small>Election decision: {opening.electedCandidate ? `Elected · ${opening.electedCandidate.name}` : opening.candidate ? 'Replacement invitee' : 'None recorded'}</small></div><div className="opening-response"><span>Latest response: <strong>{opening.latestResponse?.status ?? (opening.invitation ? 'Awaiting response' : opening.candidate ? 'Awaiting response' : 'Vacancy')}</strong></span>{opening.responseHistory.map((response) => <small key={response.id}>{response.status} · {new Date(response.respondedAt).toLocaleString()} · {response.recordedBy}</small>)}</div><div className="opening-actions">{opening.candidate && !opening.latestResponse && lifecycle !== 'Finalized' && <><button className="btn btn-sm btn-outline-primary" disabled={readOnly} onClick={() => recordResponse(opening.candidate!.id, opening.openingId, 'Accepted')}>Record acceptance</button><button className="btn btn-sm btn-outline-secondary" disabled={readOnly} onClick={() => recordResponse(opening.candidate!.id, opening.openingId, 'Declined')}>Record decline</button></>}{opening.candidate && lifecycle === 'Finalized' && opening.latestResponse?.status === 'Accepted' && <button className="btn btn-sm btn-outline-danger" disabled={termReadOnly} onClick={() => setResponseCandidateId(opening.candidate!.id)}>Record later decline</button>}</div></article>)}</div>
      {positionCondition === 'Vacancy' && lifecycle === 'Reopened' && !termReadOnly && openingSummaries.filter((opening) => !opening.invitation && opening.latestResponse?.status === 'Declined').map((opening) => {
        const declinedCandidateId = opening.electedCandidate?.id ?? opening.candidate?.id
        if (!declinedCandidateId) return null
        const replacement = getReplacementOptions(position, declinedCandidateId)
        const uniqueTop = replacement.options[0] && replacement.topTie.length === 0 ? replacement.options[0] : undefined
        return <article className="replacement-path-row" key={`replacement:${opening.openingId}`}>
          <div><strong>Opening {opening.number} replacement options</strong><small>Source: {replacement.sourcePoll?.title ?? 'No eligible source round'}</small></div>
          <div className="button-row">{uniqueTop && <button className="btn btn-sm btn-outline-primary" onClick={() => setInvitationDraft({ candidateId: uniqueTop.candidateId, openingId: opening.openingId, replacedCandidateId: declinedCandidateId, sourcePollId: replacement.sourcePoll!.id })}>Invite {candidateById[uniqueTop.candidateId]?.name ?? 'top candidate'}</button>}{replacement.sourcePoll && <button className="btn btn-sm btn-outline-secondary" onClick={() => setReplacementDraft({ candidateIds: [], rationale: '', sourcePollId: replacement.sourcePoll!.id, tieBreak: replacement.topTie.length > 0, declinedCandidateId })}>{replacement.topTie.length ? 'Plan tie-break poll' : 'Plan replacement poll'}</button>}</div>
          {replacement.topTie.length > 0 && <small className="replacement-tie-note">Top eligible candidates are tied. Use a tie-break poll; direct invitation is unavailable.</small>}
        </article>
      })}
      {positionCondition === 'Vacancy' && <p className="help-text lifecycle-vacancy-note">A vacancy does not create an election or poll. An administrator must choose an eligible candidate path and record a rationale.</p>}
    </section>

    <section className="session-toolbar" aria-label="Participant session and sharing">
      <div className="session-toolbar-state"><span className={`session-indicator ${activeSessionPoll?.status === 'Open' ? 'is-active' : ''}`}>{activeSessionPoll?.status === 'Open' ? 'Active participant session' : 'Last participant session'}</span><strong>{activeSessionPoll ? `${activeSessionPosition?.name ?? ''} · ${activeSessionPoll.type === 'nomination' ? `Nomination ${activeSessionPoll.number}` : `Round ${activeSessionPoll.number}`} · ${activeSessionPoll.status}` : 'No active poll'}</strong><span className="view-session-indicator">{state.activeSessionPositionId === position.id && state.activeSessionPollId === selectedPoll?.id ? 'Viewing selected poll' : 'Viewing history does not change the active session'}</span></div>
      <div className="session-toolbar-actions"><div className="session-action-group"><span>Voter link</span><button className="btn btn-sm btn-outline-primary" onClick={() => void copyUrl(voterUrl, 'Voter link')}>Copy voter URL</button><button className="btn btn-sm btn-outline-secondary" aria-expanded={showQr} onClick={() => setShowQr((value) => !value)}>{showQr ? 'Hide QR' : 'Show QR'}</button><a className="btn btn-sm btn-outline-secondary" href="/vote" target="_blank" rel="noreferrer">Preview</a></div><div className="session-action-group"><span>Presentation</span><a className="btn btn-sm btn-outline-primary" href="/presentation" target="_blank" rel="noreferrer">Open</a><button className="btn btn-sm btn-outline-secondary" onClick={() => void copyUrl(presentationUrl, 'Presentation')}>Copy presentation URL</button></div><details className="session-controls-menu"><summary>Session controls</summary><label className="form-check form-switch control-switch"><input className="form-check-input" type="checkbox" disabled={positionReadOnly || state.activeSessionPositionId !== position.id} checked={position.participationVisible} onChange={(event) => updatePosition(position.id, (current) => ({ ...current, participationVisible: event.target.checked }))} /><span className="form-check-label">Show aggregate participation on Presentation</span></label><p className="help-text">Aggregate count only. No voter identities, ballot details, or choice mapping.</p><span className="help-text">Controls apply to this position’s active participant session.</span></details></div>
      {showQr && <div className="session-qr" aria-label="Voter link QR code"><QRCodeSVG value={voterUrl} size={112} includeMargin /><span>{new URL(voterUrl).host}/vote</span></div>}
    </section>
    {readOnly && <div className="alert alert-secondary py-2">Historical term: polls, results, candidates, and decisions are read-only.</div>}
    {positionReadOnly && lifecycle === 'Finalized' && <div className="alert alert-secondary py-2">Finalized position: decisions and polls are read-only. Reopen explicitly for follow-up; prior history remains unchanged.</div>}
    {notice && <div className="alert alert-info py-2" role="status">{notice}</div>}

    <div className="position-workspace-switch" role="tablist" aria-label="Position workspace"><button role="tab" aria-selected={positionView === 'polls'} className={positionView === 'polls' ? 'active' : ''} onClick={() => setPositionView('polls')}>Polls</button><button role="tab" aria-selected={positionView === 'candidates'} className={positionView === 'candidates' ? 'active' : ''} onClick={() => { setPositionView('candidates'); setShowVotingSetup(false) }}>Candidates <span>{position.candidates.length}</span></button></div>

    {positionView === 'candidates' ? <section className="candidate-overview" aria-label="Position-wide candidates"><div className="section-heading"><div><p className="eyebrow">Position-wide roster</p><h2>Current candidates</h2></div><span className="count-label">{position.candidates.length} candidates</span></div>{position.candidates.length ? <div className="candidate-overview-list">{position.candidates.map((candidate) => <div key={candidate.id} className="candidate-overview-row"><strong>{candidate.name}</strong><StatusBadge status={currentStatuses[candidate.id]} /></div>)}</div> : <p className="empty-copy">No candidates have been added to this position.</p>}</section> : <div className="election-workspace-layout">
      <nav className="poll-navigator" aria-label="Position poll history"><div className="poll-navigator-heading"><div><p className="eyebrow">Poll history</p><h2>{position.polls.length} polls</h2></div>{!positionReadOnly && <details className="action-menu"><summary aria-label="Create poll">New poll</summary><div className="action-menu-panel"><button onClick={createNominationPoll}>Nomination poll</button><button onClick={() => beginVotingSetup()}>Voting round</button></div></details>}</div><div className="poll-navigator-list">{position.polls.map((poll) => <button key={poll.id} className={`poll-nav-item ${selectedPoll?.id === poll.id ? 'selected' : ''} ${state.activeSessionPollId === poll.id && state.activeSessionPositionId === position.id && poll.status === 'Open' ? 'session-poll' : ''}`} aria-current={selectedPoll?.id === poll.id ? 'page' : undefined} onClick={() => { setShowVotingSetup(false); selectPoll(position.id, poll.id) }}><span className="poll-nav-type">{poll.type === 'nomination' ? `Nomination ${poll.number}` : `Round ${poll.number}`}</span><span className="poll-nav-meta"><StatusBadge status={poll.status} />{state.activeSessionPollId === poll.id && state.activeSessionPositionId === position.id && poll.status === 'Open' && <small>Active</small>}</span></button>)}</div>
        <details className="secondary-admin-settings"><summary>Administrator settings</summary><label className="field-label">Audit identity<input className="form-control form-control-sm" value={actor} onChange={(event) => setActor(event.target.value)} /></label><button className="btn btn-sm btn-outline-danger" onClick={() => { if (window.confirm('Reset all prototype data in this browser?')) { localStorage.removeItem('church-nominations-polls-prototype-v2'); window.location.reload() } }}>Reset demo</button></details>
        <details className="secondary-admin-settings"><summary>Position audit history</summary>{state.audit.filter((entry) => entry.positionId === position.id).slice(-12).reverse().map((entry) => <article key={entry.id} className="audit-item"><strong>{entry.action}</strong><span>{entry.actor} · {new Date(entry.at).toLocaleString()}</span><small>{entry.detail}</small></article>)}</details>
      </nav>

      <main className="selected-poll-workspace">
        {!selectedPoll && !showVotingSetup && <section className="workspace-section empty-poll-choice"><p className="eyebrow">No polls yet</p><h2>Start this position’s election</h2><p className="section-copy">Create a nomination poll or start directly with a voting poll from the current roster.</p><div className="button-row"><button className="btn btn-outline-primary" onClick={createNominationPoll}>Create nomination poll</button><button className="btn btn-primary" onClick={() => beginVotingSetup()}>Create voting round</button></div></section>}

        {showVotingSetup && <section className="workspace-section"><div className="section-heading"><div><p className="eyebrow">Voting setup · draft only</p><h2>Create Round {position.polls.filter((poll) => poll.type === 'voting').length + 1}</h2><p className="section-copy">Source poll: <strong>{sourcePoll?.title ?? 'Current position roster'}</strong>. Saving creates a draft only; it will not open or change the active session.</p></div><button className="btn btn-sm btn-outline-secondary" onClick={() => setShowVotingSetup(false)}>Cancel</button></div>
          {availableDraftIds.length === 0 && position.candidates.length === 0 && <div className="direct-roster-entry"><label className="field-label">Candidate names<textarea className="form-control" rows={4} value={directRosterText} onChange={(event) => setDirectRosterText(event.target.value)} placeholder={'Enter one candidate per line\nExample: Alex Rivera'} /></label><p className="help-text">Candidate names become read-only when the poll is created.</p><button className="btn btn-outline-primary" disabled={!directRosterText.trim()} onClick={() => { const names = directRosterText.split('\n').map((name) => name.trim()).filter(Boolean); if (!names.length) return; const created = names.map((name) => ({ id: id(), name, sourceSubmissionIds: [] })); updatePosition(position.id, (current) => ({ ...current, candidates: created, phase: 'ready' })); setDraftIds(created.map((candidate) => candidate.id)); setDirectRosterText('') }}>Save candidate list</button></div>}
          <div className="voting-config-toolbar"><span className="source-context">Default: {firstVotingRound ? 'approved nomination roster' : 'most recent completed voting poll · Advanced candidates'}</span>{candidateSourceOptions.length > 0 && <button className="btn btn-sm btn-link" disabled={positionReadOnly} onClick={() => setShowSourceChoices((show) => !show)} aria-expanded={showSourceChoices}>Change source poll</button>}</div>
          {showSourceChoices && <div className="source-choice-panel"><label className="field-label">Candidate source poll<select className="form-select" value={resolvedSourceId} onChange={(event) => changeVotingSource(event.target.value)}>{sourcePoll && <option value={sourcePoll.id}>{sourcePoll.title} · selected source</option>}{candidateSourceOptions.map((poll) => <option key={poll.id} value={poll.id}>{poll.title} · {poll.type === 'nomination' ? 'approved roster' : 'completed voting poll'}</option>)}</select></label><p className="help-text">Advanced candidates from a completed voting poll are preselected. Elected and Declined candidates are excluded by default.</p></div>}
          <div className="candidate-selection-actions"><span>{selectedDraftIds.length} selected</span><div><button className="btn btn-sm btn-link" onClick={() => { setDraftIds(availableDraftIds.filter((candidateId) => !['Elected', 'Declined'].includes(currentStatuses[candidateId]))); setManualDraftEdits(true) }}>Select eligible</button><button className="btn btn-sm btn-link" onClick={() => { setDraftIds([]); setManualDraftEdits(true) }}>Clear</button></div></div>
          {sourcePoll?.type === 'voting' && <p className="help-text source-stats-context">Stats and decisions from {sourcePoll.title} · {sourceBallotsCast} ballots cast</p>}
          <div className="roster-checks">{sortedDraftIds.map((candidateId) => { const name = sourceCandidateName(candidateId); const status = currentStatuses[candidateId] ?? 'Pending'; const eligible = status !== 'Elected' && status !== 'Declined'; const votes = sourceResults[candidateId] ?? 0; const percentage = sourceBallotsCast ? Math.round(votes / sourceBallotsCast * 100) : 0; const decision = sourceDecision(candidateId); return <label key={candidateId} className={`candidate-selection-row ${eligible ? '' : 'candidate-ineligible'}`}><input className="form-check-input" type="checkbox" disabled={readOnly || !eligible} checked={selectedDraftIds.includes(candidateId)} onChange={(event) => { setDraftIds((current) => { const chosen = current ?? defaultDraftIds; return event.target.checked ? [...chosen, candidateId] : chosen.filter((value) => value !== candidateId) }); setManualDraftEdits(true) }} /><span className="candidate-selection-name">{name}</span><span className="candidate-source-stats">{votes} votes · {percentage}%</span><small className="candidate-source-decision">Decision: {decision}</small></label> })}</div>
          <div className="voting-draft-summary"><strong>{selectedDraftIds.length} candidate{selectedDraftIds.length === 1 ? '' : 's'}</strong><label className="field-label">Maximum selections per ballot<select className="form-select" value={choiceCount} disabled={positionReadOnly || !selectedDraftIds.length} onChange={(event) => setChoiceCount(event.target.value)}>{selectionLimitOptions.map((count) => <option key={count} value={count}>{count}</option>)}</select></label></div><div className="voting-create-footer"><p className="help-text">Candidate names are saved as a poll snapshot. Open Voting remains a separate action.</p><button className="btn btn-primary" disabled={positionReadOnly || selectedDraftIds.length === 0} onClick={makePoll}>Create voting draft</button></div>
        </section>}

        {selectedPoll && !showVotingSetup && <>
          <header className="selected-poll-heading"><div><p className="eyebrow">{selectedPoll.type === 'nomination' ? `Nomination ${selectedPoll.number}` : `Round ${selectedPoll.number}`} · {selectedPoll.status}</p><h2>{selectedPoll.title}</h2></div><span className={`session-indicator ${state.activeSessionPositionId === position.id && state.activeSessionPollId === selectedPoll.id && selectedPoll.status === 'Open' && lifecycle !== 'Finalized' ? 'is-active' : ''}`}>{state.activeSessionPositionId === position.id && state.activeSessionPollId === selectedPoll.id && selectedPoll.status === 'Open' && lifecycle !== 'Finalized' ? 'Active participant poll' : 'Historical view · session unchanged'}</span></header>
          {selectedPoll.type === 'nomination' && <section className="workspace-section poll-panel"><div className="section-heading"><div><p className="eyebrow">Nomination poll · {selectedPoll.status}</p><p className="section-copy">Collect suggestions, then review and approve the candidate roster. Original submissions remain preserved in the poll record.</p></div><div className="button-row">{!readOnly && selectedPoll.status === 'Draft' && <button className="btn btn-primary" disabled={!Number.isInteger(Number(nominationLimitInput || selectedPoll.maxNamesPerParticipant)) || Number(nominationLimitInput || selectedPoll.maxNamesPerParticipant) < 1} onClick={() => handleOpen(selectedPoll)}>Open intake</button>}{!readOnly && selectedPoll.status === 'Open' && state.activeSessionPollId === selectedPoll.id && <button className="btn btn-outline-danger" onClick={() => { if (window.confirm('Close this nomination intake? Participants will no longer be able to submit names.')) closeNomination() }}>Close intake</button>}</div></div>
            {selectedPoll.status === 'Draft' && <><p className="empty-copy">Configure the name limit before opening this poll.</p><label className="field-label">Maximum names per participant<input className="form-control" type="number" min="1" step="1" value={nominationLimitInput || selectedPoll.maxNamesPerParticipant || ''} onChange={(event) => setNominationLimitInput(event.target.value)} /></label></>}
            {selectedPoll.status === 'Open' && <><p className="private-strip">Intake is open · {nominationSubmissions.length} names received · {selectedPoll.maxNamesPerParticipant} per participant. Individual submitter identity is not displayed.</p><ol className="submission-list anonymous-submissions" aria-label="Anonymous submitted names">{nominationSubmissions.map((submission) => <li className="submission-row" key={submission.id}><span>{submission.name}</span></li>)}</ol></>}
            {(selectedPoll.status === 'Closed' || selectedPoll.status === 'Approved') && <div className="roster-block"><div className="section-heading compact"><div><p className="eyebrow">{selectedPoll.status === 'Approved' ? 'Approved candidate list' : 'Review and consolidate'}</p><h3>Candidate roster</h3></div><span className="count-label">{position.candidates.length} candidates</span></div><div className={`candidate-edit-list ${selectedPoll.status === 'Approved' ? 'approved-roster' : 'consolidation-roster'}`}>{position.candidates.map((candidate) => <div className="candidate-edit-row" key={candidate.id}>{!readOnly && selectedPoll.status === 'Closed' && <input type="checkbox" className="form-check-input" aria-label={`Select ${candidate.name} for consolidation`} checked={consolidationIds.includes(candidate.id)} onChange={(event) => setConsolidationIds((current) => event.target.checked ? [...current, candidate.id] : current.filter((candidateId) => candidateId !== candidate.id))} />}{selectedPoll.status === 'Approved' ? <strong className="approved-candidate-name">{candidate.name}</strong> : <input className="form-control" aria-label={`Candidate name ${candidate.name}`} value={candidate.name} onChange={(event) => editCandidate(candidate.id, { name: event.target.value })} />}<div className="source-note">{selectedPoll.status === 'Approved' ? `${candidate.sourceSubmissionIds.length} nomination${candidate.sourceSubmissionIds.length === 1 ? '' : 's'}` : `From ${candidate.sourceSubmissionIds.length} original submission${candidate.sourceSubmissionIds.length === 1 ? '' : 's'}`}</div>{selectedPoll.status !== 'Approved' && <StatusBadge status={currentStatuses[candidate.id]} />}{!readOnly && selectedPoll.status === 'Closed' && <button className="btn btn-sm btn-outline-secondary" onClick={() => excludeCandidate(candidate.id)}>Exclude</button>}</div>)}</div><details className="submission-traceability"><summary>Anonymous original submissions and consolidation history</summary><ul className="submission-trace-list">{nominationSubmissions.map((submission) => { const candidate = position.candidates.find((item) => item.sourceSubmissionIds.includes(submission.id)); return <li key={submission.id}><span>{submission.name}</span><span>{candidate ? `Current candidate: ${candidate.name}` : 'No current candidate (excluded)'}</span></li> })}</ul></details>{!readOnly && selectedPoll.status === 'Closed' && <div className="nomination-roster-actions">{consolidationIds.length > 1 && <><label className="field-label">Keep as candidate<select className="form-select form-select-sm" value={consolidationIds[0]} onChange={(event) => setConsolidationIds((current) => [event.target.value, ...current.filter((candidateId) => candidateId !== event.target.value)])}>{consolidationIds.map((candidateId) => <option key={candidateId} value={candidateId}>{position.candidates.find((candidate) => candidate.id === candidateId)?.name}</option>)}</select></label><button className="btn btn-sm btn-outline-primary" onClick={consolidateCandidates}>Consolidate {consolidationIds.length} selected</button></>}{position.candidates.some((candidate) => !candidate.name.trim()) && <p className="alert alert-danger py-2 roster-validation-error" role="alert">Every candidate must have a non-blank name before roster approval.</p>}<button className="btn btn-sm btn-primary" disabled={position.candidates.some((candidate) => !candidate.name.trim())} onClick={() => setApprovalReviewOpen(true)}>Approve candidate roster</button></div>}{selectedPoll.status === 'Approved' && !readOnly && <button className="btn btn-sm btn-primary mt-2" onClick={() => beginVotingSetup(selectedPoll.id)}>Create voting round from approved roster</button>}</div>}
          </section>}

          {selectedPoll.type === 'voting' && <section className="workspace-section poll-panel"><div className="section-heading"><div><p className="eyebrow">Round {selectedPoll.number} · {selectedPoll.status}</p><p className="section-copy">{selectedPoll.choiceCount} selection{selectedPoll.choiceCount === 1 ? '' : 's'} per ballot · {selectedPoll.sourceCandidateIds.length} candidates{selectedPoll.sourcePollId ? ` · Source: ${position.polls.find((poll) => poll.id === selectedPoll.sourcePollId)?.title ?? 'earlier poll'}` : ''}</p></div><div className="button-row">{!positionReadOnly && selectedPoll.status === 'Draft' && <button className="btn btn-primary" onClick={() => handleOpen(selectedPoll)}>Open Voting</button>}{!positionReadOnly && selectedPoll.status === 'Open' && state.activeSessionPollId === selectedPoll.id && <button className="btn btn-outline-danger" onClick={() => { if (!window.confirm(`Close ${selectedPoll.title}? Participants will no longer be able to submit ballots.`)) return; updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, status: 'Closed', closedAt: now() })); updatePosition(position.id, (current) => ({ ...current, phase: 'closed' })); addAudit({ action: 'Voting poll closed', positionId: position.id, pollId: selectedPoll.id, actor, detail: 'Final aggregate results are available to admins. Presentation stays hidden until explicitly revealed.' }); setNotice('Voting closed. Final aggregate results are available here. Presentation remains hidden until explicitly revealed.') }}>Close voting</button>}</div></div>
            {selectedPoll.status === 'Draft' && <div className="draft-choice-control"><label className="field-label">Maximum selections per ballot<select className="form-select form-select-sm" disabled={readOnly} value={selectedPoll.choiceCount} onChange={(event) => {
              const nextChoiceCount = Number(event.target.value)
              updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, choiceCount: Math.max(1, Math.min(nextChoiceCount, poll.sourceCandidateIds.length)) }))
            }}>{Array.from({ length: selectedPoll.sourceCandidateIds.length }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} selection{count === 1 ? '' : 's'}</option>)}</select></label></div>}
            {selectedPoll.status === 'Closed' && <nav className="poll-detail-tabs" role="tablist" aria-label="Voting poll details">{(['workspace', 'audit'] as const).map((tab) => <button key={tab} role="tab" aria-selected={detailTab === tab} className={detailTab === tab ? 'active' : ''} onClick={() => setDetailTab(tab)}>{tab === 'workspace' ? 'Results & decisions' : 'Audit'}</button>)}</nav>}
            {selectedPoll.status !== 'Closed' && <nav className="poll-detail-tabs" role="tablist" aria-label="Voting poll details">{(['results', 'decisions', 'audit'] as const).map((tab) => <button key={tab} role="tab" aria-selected={detailTab === tab} className={detailTab === tab ? 'active' : ''} onClick={() => setDetailTab(tab)}>{tab === 'results' ? 'Results' : tab === 'decisions' ? 'Decisions' : 'Audit'}</button>)}</nav>}
            {selectedPoll.status === 'Closed' && detailTab === 'workspace' && <><ClosedRoundWorkspace poll={selectedPoll} sortedResults={sortedResults} results={results} totalBallots={totalBallots} candidateById={candidateById} decisionStatuses={decisionStatuses} setDecisionStatuses={setDecisionStatuses} position={position} openingSummaries={openingSummaries} lifecycle={lifecycle} readOnly={readOnly} positionReadOnly={positionReadOnly} termReadOnly={termReadOnly} decisionNote={decisionNote} setDecisionNote={setDecisionNote} saveDecisions={saveDecisions} recordResponse={recordResponse} setResponseCandidateId={setResponseCandidateId} /><div className="button-row closed-round-actions">{!readOnly && (!selectedPoll.revealedAt ? <button className="btn btn-outline-primary" onClick={reveal}>Reveal results on Presentation</button> : <button className="btn btn-outline-secondary" onClick={() => { if (!window.confirm('Hide aggregate results from Presentation?')) return; updatePoll(position.id, selectedPoll.id, (poll) => ({ ...poll, revealedAt: undefined, revealedBy: undefined })); addAudit({ action: 'Aggregate results hidden', positionId: position.id, pollId: selectedPoll.id, actor, detail: 'Audience results hidden.' }) }}>Hide audience results</button>)}{!readOnly && latestCompletedVotingPoll && <button className="btn btn-outline-primary" onClick={() => beginVotingSetup(latestCompletedVotingPoll.id)}>Create next round from {latestCompletedVotingPoll.title}</button>}</div></>}
            {selectedPoll.status !== 'Closed' && detailTab === 'results' && <div className="results-summary"><div className="results-summary-heading"><strong>{totalBallots}</strong><span>ballots cast · {selectedPoll.status === 'Open' ? 'live admin totals' : 'final admin totals'}</span></div>{totalBallots === 0 && <p className="empty-copy">No ballots have been cast yet.</p>}<div className="result-list">{sortedResults.map((candidateId) => { const count = results[candidateId] ?? 0; const percentage = totalBallots ? Math.round(count / totalBallots * 100) : 0; const name = selectedPoll.candidateNames[candidateId] ?? candidateById[candidateId]?.name ?? 'Candidate'; return <div className="result-row" key={candidateId}><div className="result-name"><span>{name}</span><strong>{count} · {percentage}%</strong></div><div className="result-track" role="img" aria-label={`${name}: ${count} votes, ${percentage}% of ballots cast`}><span style={{ width: `${percentage}%` }} /></div></div>})}</div><p className="help-text">Percentages use ballots cast as the denominator. Multi-select totals may exceed 100%. Individual ballot selections are never displayed.</p></div>}
            {selectedPoll.status !== 'Closed' && detailTab === 'decisions' && <div className="decision-workspace"><p className="section-copy">Candidate decisions are independent of ballots and do not alter results. Vote counts are supporting context.</p>{selectedPoll.sourceCandidateIds.map((candidateId) => { const name = selectedPoll.candidateNames[candidateId] ?? candidateById[candidateId]?.name ?? 'Candidate'; const elected = getPollCandidateStatus(position, selectedPoll.id, candidateId) === 'Elected'; return <label className="decision-row" key={candidateId}><span>{name}<small>{results[candidateId] ?? 0} votes · current position status: {currentStatuses[candidateId]}</small></span><select className="form-select" disabled={positionReadOnly || selectedPoll.status === 'Open' || elected} value={elected ? 'Elected' : decisionStatuses[candidateId] ?? getPollCandidateStatus(position, selectedPoll.id, candidateId)} onChange={(event) => setDecisionStatuses((current) => ({ ...current, [candidateId]: event.target.value as CandidateStatus }))}>{statusChoices.map((status) => <option key={status}>{status}</option>)}</select></label>})}<label className="field-label decision-note">Decision note<input className="form-control" disabled={positionReadOnly} value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} placeholder="Reason or meeting note" /></label>{!positionReadOnly && selectedPoll.status !== 'Open' && <button className="btn btn-primary" onClick={saveDecisions}>Save decision revision</button>}</div>}
            {detailTab === 'audit' && <div className="revision-history"><h3>Decision revisions</h3>{selectedPoll.decisions.length ? selectedPoll.decisions.map((revision) => <article className="revision-row" key={revision.revision}><div><strong>Revision {revision.revision}</strong><span>{revision.decidedBy} · {new Date(revision.decidedAt).toLocaleString()}</span></div><p>{revision.note || 'No note recorded'}</p><div className="status-list">{Object.entries(revision.outcomes).map(([candidateId, status]) => <span key={candidateId}>{selectedPoll.candidateNames[candidateId] ?? candidateById[candidateId]?.name}: {status}</span>)}</div></article>) : <p className="empty-copy">No decision revisions for this poll.</p>}{state.audit.filter((entry) => entry.pollId === selectedPoll.id).length > 0 && <><h3>Poll activity</h3>{state.audit.filter((entry) => entry.pollId === selectedPoll.id).slice().reverse().map((entry) => <article className="audit-item" key={entry.id}><strong>{entry.action}</strong><span>{entry.actor} · {new Date(entry.at).toLocaleString()}</span><small>{entry.detail}</small></article>)}</>}</div>}
          </section>}
        </>}
      </main>
    </div>}

    {approvalReviewOpen && selectedPoll?.type === 'nomination' && selectedPoll.status === 'Closed' && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog approval-review-dialog" role="alertdialog" aria-modal="true" aria-labelledby="approval-review-title" aria-describedby="approval-review-copy"><p className="eyebrow">Final roster review</p><h2 id="approval-review-title">Approve candidate names?</h2><p id="approval-review-copy">Confirming snapshots these exact names and their source submissions into the approved nomination poll.</p><ul className="approval-review-list">{position.candidates.map((candidate) => <li key={candidate.id}><strong>{candidate.name}</strong><span>{candidate.sourceSubmissionIds.length} original submission{candidate.sourceSubmissionIds.length === 1 ? '' : 's'}</span></li>)}</ul>{position.candidates.some((candidate) => !candidate.name.trim()) && <p className="alert alert-danger py-2" role="alert">Every candidate must have a non-blank name. Correct or exclude blank entries before approval.</p>}<div className="button-row"><button className="btn btn-outline-secondary" autoFocus onClick={() => setApprovalReviewOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={position.candidates.length === 0 || position.candidates.some((candidate) => !candidate.name.trim())} onClick={approveNominationRoster}>Confirm roster approval</button></div></section></div>}
    {lifecycleDialog && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="lifecycle-dialog-title" aria-describedby="lifecycle-dialog-copy"><p className="eyebrow">Position lifecycle</p><h2 id="lifecycle-dialog-title">{lifecycleDialog === 'finalize' ? 'Finalize this position?' : 'Reopen this position?'}</h2><p id="lifecycle-dialog-copy">{lifecycleDialog === 'finalize' ? 'All openings are accepted and no polls are open. Finalization ends participant activity. Poll history remains available and Presentation visibility will not change.' : 'Reopening allows follow-up decisions, responses, and new poll drafts. It will not create or open a poll, and prior records remain unchanged.'}</p><div className="button-row"><button className="btn btn-outline-secondary" autoFocus onClick={() => setLifecycleDialog(null)}>Cancel</button><button className="btn btn-primary" onClick={lifecycleDialog === 'finalize' ? finalizePosition : reopenPosition}>{lifecycleDialog === 'finalize' ? 'Confirm finalization' : 'Confirm reopen'}</button></div></section></div>}
    {responseCandidateId && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="later-decline-title" aria-describedby="later-decline-copy"><p className="eyebrow">Append candidate response</p><h2 id="later-decline-title">Record later decline?</h2><p id="later-decline-copy">This adds a new Declined response for {candidateById[responseCandidateId]?.name}. The earlier Accepted response and Elected decision remain unchanged. The position stays finalized.</p><div className="button-row"><button className="btn btn-outline-secondary" autoFocus onClick={() => setResponseCandidateId(null)}>Cancel</button><button className="btn btn-outline-danger" onClick={() => { const opening = openingSummaries.find((item) => item.candidate?.id === responseCandidateId); if (opening) recordResponse(responseCandidateId, opening.openingId, 'Declined') }}>Record later decline</button></div></section></div>}
    {invitationDraft && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="invitation-title" aria-describedby="invitation-copy"><p className="eyebrow">Direct replacement invitation</p><h2 id="invitation-title">Invite {candidateById[invitationDraft.candidateId]?.name}?</h2><p id="invitation-copy">This records an invitation for Opening {openingSummaries.find((opening) => opening.openingId === invitationDraft.openingId)?.number} from {position.polls.find((poll) => poll.id === invitationDraft.sourcePollId)?.title}. It does not elect the candidate or fill the opening. The vacancy remains until a separate Accepted response is recorded.</p><div className="button-row"><button className="btn btn-outline-secondary" autoFocus onClick={() => setInvitationDraft(null)}>Cancel</button><button className="btn btn-primary" onClick={recordInvitation}>Confirm invitation</button></div></section></div>}
    {replacementDraft && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog replacement-dialog" role="dialog" aria-modal="true" aria-labelledby="replacement-title"><p className="eyebrow">Replacement path · draft only</p><h2 id="replacement-title">{replacementDraft.tieBreak ? 'Create tie-break draft?' : 'Plan replacement poll'}</h2>{replacementDraft.sourcePollId ? <><p className="section-copy">Source: {position.polls.find((poll) => poll.id === replacementDraft.sourcePollId)?.title}. Eligible candidates ranked by votes:</p><div className="replacement-options">{getReplacementOptions(position, replacementDraft.declinedCandidateId).options.filter((option) => !replacementDraft.tieBreak || getReplacementOptions(position, replacementDraft.declinedCandidateId).topTie.includes(option.candidateId)).map((option) => <label key={option.candidateId}><input type="checkbox" checked={replacementDraft.candidateIds.includes(option.candidateId)} onChange={(event) => setReplacementDraft((current) => current ? { ...current, candidateIds: event.target.checked ? [...current.candidateIds, option.candidateId] : current.candidateIds.filter((candidateId) => candidateId !== option.candidateId) } : current)} /><span>{candidateById[option.candidateId]?.name ?? option.candidateId}</span><small>{option.votes} votes</small></label>)}</div>{replacementDraft.tieBreak && <p className="help-text">Select every tied top candidate for the explicit tie-break draft.</p>}<label className="field-label replacement-rationale">Rationale<textarea className="form-control" rows={3} value={replacementDraft.rationale} onChange={(event) => setReplacementDraft((current) => current ? { ...current, rationale: event.target.value } : current)} /></label>{lifecycle === 'Finalized' && <p className="help-text">Reopen the position before creating a replacement poll draft.</p>}</> : <p>No eligible candidates were found in this candidate’s completed election poll. Keep the vacancy and obtain a new decision before proceeding.</p>}<div className="button-row"><button className="btn btn-outline-secondary" autoFocus onClick={() => setReplacementDraft(null)}>Cancel</button><button className="btn btn-primary" disabled={lifecycle === 'Finalized' || !replacementDraft.candidateIds.length || !replacementDraft.rationale.trim()} onClick={makeReplacementDraft}>Create draft only</button></div></section></div>}
    {activationConflict && <div className="confirm-backdrop" role="presentation"><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="poll-conflict-title" aria-describedby="poll-conflict-copy"><p className="eyebrow">Another poll is open</p><h2 id="poll-conflict-title">Switch the active session?</h2><p id="poll-conflict-copy">{activationConflict.title} is currently accepting submissions. Close it and open {selectedPoll?.title ?? 'the selected poll'}? Closing stops submissions but does not reveal results.</p><div className="button-row"><button className="btn btn-outline-secondary" autoFocus onClick={() => setActivationConflict(null)}>Keep current poll open</button><button className="btn btn-primary" onClick={resolveActivationConflict}>Close current and open selected</button></div></section></div>}
  </section>
}