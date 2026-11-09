export type CandidateStatus = 'Pending' | 'Advanced' | 'Elected' | 'Eliminated' | 'Declined'
export type PositionLifecycleStatus = 'In Progress' | 'Finalized' | 'Reopened'
export type PositionCondition = 'In Progress' | 'Awaiting Acceptance' | 'Ready to Finalize' | 'Vacancy'
export type CandidateResponseStatus = 'Accepted' | 'Declined'
export type Phase = 'intake' | 'review' | 'ready' | 'draft' | 'open' | 'closed'
export interface Submission { id: string; name: string; submittedAt: string }
export interface Candidate { id: string; name: string; sourceSubmissionIds: string[] }
export interface DecisionRevision { revision: number; decidedAt: string; decidedBy: string; outcomes: Record<string, CandidateStatus>; note: string }
export interface CandidateDecisionEvent { id: string; candidateId: string; pollId: string; status: CandidateStatus; decidedAt: string; decidedBy: string; note: string; supersedesEventId?: string }
export interface CandidateResponseEvent { id: string; candidateId: string; openingId: string; status: CandidateResponseStatus; respondedAt: string; recordedBy: string; note: string }
export interface CandidateInvitationEvent { id: string; candidateId: string; openingId: string; replacedCandidateId: string; sourcePollId: string; invitedAt: string; invitedBy: string }
export interface PositionLifecycleEvent { id: string; status: PositionLifecycleStatus; at: string; actor: string; detail: string; pollIds?: string[] }
export interface Ballot { id: string; selections: string[] }
export interface Church { id: string; name: string; address: string }
export interface ElectionTerm { id: string; churchId: string; name: string; year: number; status: 'Historical' | 'Preparing' | 'Current' }
export interface Department { id: string; termId: string; name: string; order: number }
export type PollType = 'nomination' | 'voting'
export interface Poll {
  id: string; type: PollType; number: number; title: string; createdAt: string; sourcePollId?: string; sourceCandidateIds: string[]
  candidateNames: Record<string, string>
  choiceCount: number; status: 'Draft' | 'Open' | 'Closed' | 'Approved'; openedAt?: string; closedAt?: string
  maxNamesPerParticipant?: number; nominationSubmissions?: Submission[]; approvedAt?: string; approvedBy?: string
  ballots: Ballot[]; revealedAt?: string; revealedBy?: string; decisions: DecisionRevision[]
}
export interface Position { id: string; termId: string; departmentId: string; name: string; openings: number; phase: Phase; submissions: Submission[]; candidates: Candidate[]; polls: Poll[]; decisions: CandidateDecisionEvent[]; lifecycleEvents: PositionLifecycleEvent[]; responseEvents: CandidateResponseEvent[]; invitationEvents: CandidateInvitationEvent[]; participationVisible: boolean }
export interface AuditEntry { id: string; action: string; positionId: string; pollId?: string; actor: string; at: string; detail: string }
export interface AppState { churches: Church[]; terms: ElectionTerm[]; departments: Department[]; positions: Position[]; selectedChurchId: string; selectedTermId: string; selectedPositionId: string; viewedPollIds: Record<string, string>; activeSessionPositionId: string | null; activeSessionPollId: string | null; audit: AuditEntry[] }

export const STORAGE_KEY = 'church-nominations-polls-prototype-v2'
export const now = () => new Date().toISOString()
export const id = () => crypto.randomUUID()

const candidates: Candidate[] = [
  { id: 'c-anna', name: 'Anna Williams', sourceSubmissionIds: ['s-1', 's-2'] },
  { id: 'c-david', name: 'David Chen', sourceSubmissionIds: ['s-3'] },
  { id: 'c-maria', name: 'Maria Santos', sourceSubmissionIds: ['s-4', 's-5'] },
  { id: 'c-james', name: 'James Okafor', sourceSubmissionIds: ['s-6'] },
]
const poll: Poll = {
  id: 'p-elder-1', type: 'voting', number: 1, title: 'Elder nominations · Round 1', createdAt: '2026-10-12T15:00:00.000Z',
  sourceCandidateIds: candidates.map((candidate) => candidate.id), candidateNames: Object.fromEntries(candidates.map((candidate) => [candidate.id, candidate.name])), choiceCount: 1, status: 'Closed',
  openedAt: '2026-10-12T16:00:00.000Z', closedAt: '2026-10-12T16:45:00.000Z',
  ballots: [
    { id: 'b-1', selections: ['c-anna'] }, { id: 'b-2', selections: ['c-anna'] }, { id: 'b-3', selections: ['c-david'] },
    { id: 'b-4', selections: ['c-maria'] }, { id: 'b-5', selections: ['c-anna'] }, { id: 'b-6', selections: ['c-james'] },
  ], decisions: [{
    revision: 1, decidedAt: '2026-10-12T17:00:00.000Z', decidedBy: 'Jordan Lee',
    outcomes: { 'c-anna': 'Elected', 'c-david': 'Advanced', 'c-maria': 'Advanced', 'c-james': 'Declined' },
    note: 'Initial reviewed outcomes for the prototype fixture.',
  }],
}

const elder2027Candidates: Candidate[] = [
  { id: 'c-27-elaine', name: 'Elaine Brooks', sourceSubmissionIds: ['s-27-1', 's-27-2'] },
  { id: 'c-27-marcus', name: 'Marcus Hill', sourceSubmissionIds: ['s-27-3'] },
  { id: 'c-27-priya', name: 'Priya Nair', sourceSubmissionIds: ['s-27-4', 's-27-5'] },
  { id: 'c-27-robert', name: 'Robert James', sourceSubmissionIds: ['s-27-6'] },
  { id: 'c-27-sofia', name: 'Sofia Martinez', sourceSubmissionIds: ['s-27-7'] },
]
const elder2027Polls: Poll[] = [
  {
    id: 'p-elder-2027-nomination-1', type: 'nomination', number: 1, title: 'Church Elder · Nomination Poll 1', createdAt: '2026-10-20T12:00:00.000Z',
    sourceCandidateIds: elder2027Candidates.map((candidate) => candidate.id),
    candidateNames: Object.fromEntries(elder2027Candidates.map((candidate) => [candidate.id, candidate.name])),
    choiceCount: 0, status: 'Approved', maxNamesPerParticipant: 3, openedAt: '2026-10-20T12:10:00.000Z', closedAt: '2026-10-22T12:00:00.000Z',
    nominationSubmissions: [
      { id: 's-27-1', name: 'Elaine Brooks', submittedAt: '2026-10-20T12:15:00.000Z' }, { id: 's-27-2', name: 'Elain Brooks', submittedAt: '2026-10-20T12:21:00.000Z' },
      { id: 's-27-3', name: 'Marcus Hill', submittedAt: '2026-10-20T12:43:00.000Z' }, { id: 's-27-4', name: 'Priya Nair', submittedAt: '2026-10-20T13:02:00.000Z' },
      { id: 's-27-5', name: 'Priya N.', submittedAt: '2026-10-20T13:08:00.000Z' }, { id: 's-27-6', name: 'Robert James', submittedAt: '2026-10-20T13:17:00.000Z' },
      { id: 's-27-7', name: 'Sofia Martinez', submittedAt: '2026-10-20T13:25:00.000Z' },
    ], approvedAt: '2026-10-22T12:30:00.000Z', approvedBy: 'Jordan Lee', ballots: [], decisions: [],
  },
  {
    id: 'p-elder-2027-1', type: 'voting', number: 1, title: 'Church Elder · Round 1', createdAt: '2026-10-25T15:00:00.000Z',
    sourceCandidateIds: elder2027Candidates.map((candidate) => candidate.id),
    candidateNames: Object.fromEntries(elder2027Candidates.map((candidate) => [candidate.id, candidate.name])),
    choiceCount: 1, status: 'Closed', openedAt: '2026-10-25T15:10:00.000Z', closedAt: '2026-10-25T15:42:00.000Z',
    ballots: [
      { id: 'b-27-1', selections: ['c-27-elaine'] }, { id: 'b-27-2', selections: ['c-27-elaine'] },
      { id: 'b-27-3', selections: ['c-27-marcus'] }, { id: 'b-27-4', selections: ['c-27-priya'] },
      { id: 'b-27-5', selections: ['c-27-robert'] }, { id: 'b-27-6', selections: ['c-27-priya'] },
      { id: 'b-27-7', selections: ['c-27-elaine'] }, { id: 'b-27-8', selections: ['c-27-marcus'] },
    ], revealedAt: '2026-10-25T16:00:00.000Z', revealedBy: 'Jordan Lee',
    decisions: [{
      revision: 1, decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee',
      outcomes: { 'c-27-elaine': 'Elected', 'c-27-marcus': 'Advanced', 'c-27-priya': 'Advanced', 'c-27-robert': 'Eliminated', 'c-27-sofia': 'Declined' },
      note: 'Committee reviewed the first poll and selected candidates for the next round.',
    }],
  },
  {
    id: 'p-elder-2027-2', type: 'voting', number: 2, title: 'Church Elder · Round 2', createdAt: '2026-10-26T14:00:00.000Z',
    sourcePollId: 'p-elder-2027-1', sourceCandidateIds: ['c-27-marcus', 'c-27-priya'],
    candidateNames: { 'c-27-marcus': 'Marcus Hill', 'c-27-priya': 'Priya Nair' },
    choiceCount: 1, status: 'Open', openedAt: '2026-10-26T14:10:00.000Z',
    ballots: [
      { id: 'b-27-9', selections: ['c-27-marcus'] }, { id: 'b-27-10', selections: ['c-27-priya'] },
      { id: 'b-27-11', selections: ['c-27-marcus'] }, { id: 'b-27-12', selections: ['c-27-marcus'] },
    ], decisions: [],
  },
]

export const createInitialState = (): AppState => ({
  churches: [{ id: 'church-riverside', name: 'Riverside Seventh-day Adventist Church', address: '1840 Riverside Drive, Portland, OR' }],
  terms: [
    { id: 'term-2026', churchId: 'church-riverside', name: '2026 Church Board', year: 2026, status: 'Historical' },
    { id: 'term-2027', churchId: 'church-riverside', name: '2027 Church Board', year: 2027, status: 'Preparing' },
  ],
  departments: [
    { id: 'dept-2026-board', termId: 'term-2026', name: 'Church Board', order: 0 },
    { id: 'dept-2027-ministry', termId: 'term-2027', name: 'Ministry', order: 0 },
    { id: 'dept-2027-finance', termId: 'term-2027', name: 'Finance', order: 1 },
  ],
  selectedPositionId: 'elder-2027',
  viewedPollIds: { 'elder': 'p-elder-1', 'elder-2027': 'p-elder-2027-2', 'treasurer': '' },
  selectedChurchId: 'church-riverside',
  selectedTermId: 'term-2027',
  activeSessionPositionId: 'elder-2027',
  activeSessionPollId: 'p-elder-2027-2',
  positions: [
    {
      id: 'elder', termId: 'term-2026', departmentId: 'dept-2026-board', name: 'Church Elder', openings: 2, phase: 'closed', participationVisible: false, lifecycleEvents: [], responseEvents: [], invitationEvents: [],
      submissions: [
        { id: 's-1', name: 'Anna Williams', submittedAt: '2026-10-10T12:15:00.000Z' }, { id: 's-2', name: 'Ana Williams', submittedAt: '2026-10-10T12:21:00.000Z' },
        { id: 's-3', name: 'David Chen', submittedAt: '2026-10-10T12:43:00.000Z' }, { id: 's-4', name: 'Maria Santos', submittedAt: '2026-10-10T13:02:00.000Z' },
        { id: 's-5', name: 'Maria S. Santos', submittedAt: '2026-10-10T13:08:00.000Z' }, { id: 's-6', name: 'James Okafor', submittedAt: '2026-10-10T13:17:00.000Z' },
      ], candidates, polls: [poll], decisions: [
        { id: 'decision-2026-anna', candidateId: 'c-anna', pollId: 'p-elder-1', status: 'Elected', decidedAt: '2026-10-12T17:00:00.000Z', decidedBy: 'Jordan Lee', note: 'Initial reviewed outcome.' },
        { id: 'decision-2026-david', candidateId: 'c-david', pollId: 'p-elder-1', status: 'Advanced', decidedAt: '2026-10-12T17:00:00.000Z', decidedBy: 'Jordan Lee', note: 'Initial reviewed outcome.' },
        { id: 'decision-2026-maria', candidateId: 'c-maria', pollId: 'p-elder-1', status: 'Advanced', decidedAt: '2026-10-12T17:00:00.000Z', decidedBy: 'Jordan Lee', note: 'Initial reviewed outcome.' },
        { id: 'decision-2026-james', candidateId: 'c-james', pollId: 'p-elder-1', status: 'Declined', decidedAt: '2026-10-12T17:00:00.000Z', decidedBy: 'Jordan Lee', note: 'Candidate declined.' },
      ],
    },
    {
      id: 'elder-2027', termId: 'term-2027', departmentId: 'dept-2027-ministry', name: 'Church Elder', openings: 2, phase: 'open', participationVisible: true, lifecycleEvents: [], responseEvents: [], invitationEvents: [],
      submissions: [
        { id: 's-27-1', name: 'Elaine Brooks', submittedAt: '2026-10-20T12:15:00.000Z' }, { id: 's-27-2', name: 'Elain Brooks', submittedAt: '2026-10-20T12:21:00.000Z' },
        { id: 's-27-3', name: 'Marcus Hill', submittedAt: '2026-10-20T12:43:00.000Z' }, { id: 's-27-4', name: 'Priya Nair', submittedAt: '2026-10-20T13:02:00.000Z' },
        { id: 's-27-5', name: 'Priya N.', submittedAt: '2026-10-20T13:08:00.000Z' }, { id: 's-27-6', name: 'Robert James', submittedAt: '2026-10-20T13:17:00.000Z' },
        { id: 's-27-7', name: 'Sofia Martinez', submittedAt: '2026-10-20T13:25:00.000Z' },
      ], candidates: elder2027Candidates, polls: elder2027Polls, decisions: [
        { id: 'decision-27-elaine-elected', candidateId: 'c-27-elaine', pollId: 'p-elder-2027-1', status: 'Elected', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'First round decision.' },
        { id: 'decision-27-marcus-advanced', candidateId: 'c-27-marcus', pollId: 'p-elder-2027-1', status: 'Advanced', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'First round decision.' },
        { id: 'decision-27-priya-advanced', candidateId: 'c-27-priya', pollId: 'p-elder-2027-1', status: 'Advanced', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'First round decision.' },
        { id: 'decision-27-robert-eliminated', candidateId: 'c-27-robert', pollId: 'p-elder-2027-1', status: 'Eliminated', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'First round decision.' },
        { id: 'decision-27-sofia-declined', candidateId: 'c-27-sofia', pollId: 'p-elder-2027-1', status: 'Declined', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'Candidate declined.' },
      ],
    },
    { id: 'treasurer', termId: 'term-2027', departmentId: 'dept-2027-finance', name: 'Treasurer', openings: 1, phase: 'intake', participationVisible: false, submissions: [], candidates: [], polls: [], decisions: [], lifecycleEvents: [], responseEvents: [], invitationEvents: [] },
  ], audit: [],
})

type SavedPosition = Omit<Position, 'termId' | 'departmentId'> & Partial<Pick<Position, 'termId' | 'departmentId'>>
type SavedState = Omit<Partial<AppState>, 'positions'> & { positions?: SavedPosition[] }
type SavedCandidate = Candidate & { status?: CandidateStatus }

export function migrateState(saved: SavedState): AppState {
  if (saved.churches && saved.terms && saved.departments && saved.activeSessionPositionId !== undefined) {
    const positions = (saved.positions ?? []).map((position) => {
      const polls = position.polls.map((item) => ({ ...item, type: item.type ?? 'voting' }))
      const candidates = (position.candidates as SavedCandidate[]).map(({ status: _legacyStatus, ...candidate }) => candidate)
      const decisions = position.decisions ?? polls.flatMap((sourcePoll) => sourcePoll.decisions.flatMap((revision) => Object.entries(revision.outcomes).map(([candidateId, status]) => ({ id: `migrated-${sourcePoll.id}-${revision.revision}-${candidateId}`, candidateId, pollId: sourcePoll.id, status, decidedAt: revision.decidedAt, decidedBy: revision.decidedBy, note: revision.note }))))
      return { ...position, candidates, polls, decisions, lifecycleEvents: position.lifecycleEvents ?? [], responseEvents: position.responseEvents ?? [], invitationEvents: position.invitationEvents ?? [] }
    })
    const findValidPollId = (positionId: string | null | undefined, requestedId: string | null | undefined) => {
      const position = positions.find((item) => item.id === positionId)
      return position?.polls.some((poll) => poll.id === requestedId) ? requestedId! : position?.polls.at(-1)?.id ?? null
    }
    return { ...saved, activeSessionPollId: findValidPollId(saved.activeSessionPositionId, saved.activeSessionPollId), viewedPollIds: Object.fromEntries(positions.map((position) => [position.id, findValidPollId(position.id, saved.viewedPollIds?.[position.id]) ?? ''])), positions } as AppState
  }
  const defaults = createInitialState()
  const positions = (saved.positions ?? defaults.positions).map((position) => {
    const polls = position.polls.map((item) => ({ ...item, type: item.type ?? 'voting' }))
    const candidates = (position.candidates as SavedCandidate[]).map(({ status: _legacyStatus, ...candidate }) => candidate)
    const decisions = position.decisions ?? polls.flatMap((sourcePoll) => sourcePoll.decisions.flatMap((revision) => Object.entries(revision.outcomes).map(([candidateId, status]) => ({ id: `migrated-${sourcePoll.id}-${revision.revision}-${candidateId}`, candidateId, pollId: sourcePoll.id, status, decidedAt: revision.decidedAt, decidedBy: revision.decidedBy, note: revision.note }))))
    return {
      ...position,
      termId: position.termId ?? (polls.length > 0 || position.phase !== 'intake' ? 'term-2026' : 'term-2027'),
      departmentId: position.departmentId ?? (polls.length > 0 || position.phase !== 'intake' ? 'dept-2026-board' : position.name.toLowerCase().includes('treasurer') ? 'dept-2027-finance' : 'dept-2027-ministry'),
      polls, candidates, decisions, lifecycleEvents: position.lifecycleEvents ?? [], responseEvents: position.responseEvents ?? [], invitationEvents: position.invitationEvents ?? [],
    }
  })
  const selectedPositionId = positions.find((position) => position.termId === 'term-2027')?.id ?? (saved.selectedPositionId && positions.some((position) => position.id === saved.selectedPositionId) ? saved.selectedPositionId : positions[0]?.id ?? defaults.selectedPositionId)
  const activeSessionPositionId = positions.find((position) => position.termId === 'term-2027')?.id ?? defaults.activeSessionPositionId
  return {
    ...defaults,
    positions,
    selectedChurchId: saved.selectedChurchId && defaults.churches.some((church) => church.id === saved.selectedChurchId) ? saved.selectedChurchId : defaults.churches[0].id,
    selectedTermId: positions.find((position) => position.id === selectedPositionId)?.termId ?? 'term-2027',
    selectedPositionId,
    activeSessionPositionId,
    activeSessionPollId: positions.find((position) => position.id === activeSessionPositionId)?.polls.at(-1)?.id ?? null,
    viewedPollIds: Object.fromEntries(positions.map((position) => [position.id, position.polls.at(-1)?.id ?? ''])),
    audit: saved.audit ?? [],
  }
}

export function getCounts(poll: Poll) {
  const counts: Record<string, number> = Object.fromEntries(poll.sourceCandidateIds.map((candidateId) => [candidateId, 0]))
  poll.ballots.forEach((ballot) => ballot.selections.forEach((candidateId) => { counts[candidateId] = (counts[candidateId] ?? 0) + 1 }))
  return counts
}

export function getCurrentCandidateStatus(position: Position, candidateId: string): CandidateStatus {
  const events = position.decisions.filter((decision) => decision.candidateId === candidateId)
  const superseded = new Set(events.map((event) => event.supersedesEventId).filter(Boolean))
  return events.filter((event) => !superseded.has(event.id)).sort((a, b) => a.decidedAt.localeCompare(b.decidedAt)).at(-1)?.status ?? 'Pending'
}

export function getPollCandidateStatus(position: Position, pollId: string, candidateId: string): CandidateStatus {
  return position.decisions.filter((event) => event.pollId === pollId && event.candidateId === candidateId).sort((a, b) => a.decidedAt.localeCompare(b.decidedAt)).at(-1)?.status ?? 'Pending'
}

export function getPositionLifecycle(position: Position): PositionLifecycleStatus {
  return position.lifecycleEvents?.at(-1)?.status ?? 'In Progress'
}

export function getOpeningSummaries(position: Position) {
  const elected = position.candidates.flatMap((candidate) => {
    const election = position.decisions.filter((event) => event.candidateId === candidate.id && event.status === 'Elected').sort((a, b) => a.decidedAt.localeCompare(b.decidedAt))[0]
    return election ? [{ candidate, electedAt: election.decidedAt }] : []
  }).sort((a, b) => a.electedAt.localeCompare(b.electedAt))
  const openingIds = Array.from({ length: position.openings }, (_, index) => `${position.id}:opening:${index + 1}`)
  const assigned = new Map<string, Candidate>()
  for (const response of position.responseEvents ?? []) {
    const candidate = elected.find((item) => item.candidate.id === response.candidateId)?.candidate
    if (candidate && openingIds.includes(response.openingId)) assigned.set(response.openingId, candidate)
  }
  for (const { candidate } of elected) {
    if ([...assigned.values()].some((item) => item.id === candidate.id)) continue
    const openingId = openingIds.find((item) => !assigned.has(item))
    if (openingId) assigned.set(openingId, candidate)
  }
  const electedById = new Map(elected.map(({ candidate }) => [candidate.id, candidate]))
  for (const invitation of position.invitationEvents ?? []) {
    if (!openingIds.includes(invitation.openingId) || !electedById.has(invitation.replacedCandidateId)) continue
    const replacement = position.candidates.find((candidate) => candidate.id === invitation.candidateId)
    if (replacement) assigned.set(invitation.openingId, replacement)
  }
  return openingIds.map((openingId, index) => {
    const candidate = assigned.get(openingId)
    const candidateResponses = candidate ? (position.responseEvents ?? []).filter((event) => event.openingId === openingId && event.candidateId === candidate.id) : []
    const invitation = (position.invitationEvents ?? []).filter((event) => event.openingId === openingId && event.candidateId === candidate?.id).at(-1)
    const electedCandidate = invitation ? electedById.get(invitation.replacedCandidateId) : candidate
    const openingHistory = (position.responseEvents ?? []).filter((event) => event.openingId === openingId)
    return { openingId, number: index + 1, candidate, electedCandidate, invitation, latestResponse: candidateResponses.at(-1), responseHistory: openingHistory }
  })
}

export function getPositionCondition(position: Position): PositionCondition {
  const openings = getOpeningSummaries(position)
  const acceptedCount = openings.filter((opening) => opening.latestResponse?.status === 'Accepted').length
  const awaitingResponse = openings.some((opening) => opening.candidate && !opening.latestResponse)
  const replacementPendingOrDeclined = openings.some((opening) => opening.invitation && opening.latestResponse?.status !== 'Accepted')
  const finalized = getPositionLifecycle(position) === 'Finalized'
  const hasOpenPoll = position.polls.some((poll) => poll.status === 'Open')
  if (finalized && acceptedCount < position.openings) return 'Vacancy'
  if (hasOpenPoll) return 'In Progress'
  if (replacementPendingOrDeclined) return 'Vacancy'
  if (awaitingResponse) return 'Awaiting Acceptance'
  if (openings.some((opening) => !opening.candidate)) return 'Vacancy'
  if (acceptedCount === position.openings) return 'Ready to Finalize'
  if (acceptedCount < position.openings) return 'Vacancy'
  return 'In Progress'
}

export function getReplacementOptions(position: Position, declinedCandidateId: string) {
  const sourcePoll = position.polls.filter((poll) => poll.type === 'voting' && poll.status === 'Closed' && poll.sourceCandidateIds.includes(declinedCandidateId) && getPollCandidateStatus(position, poll.id, declinedCandidateId) === 'Elected').at(-1)
  if (!sourcePoll) return { sourcePoll: undefined, options: [], topTie: [] as string[] }
  const filledCandidateIds = new Set(getOpeningSummaries(position).filter((opening) => opening.latestResponse?.status === 'Accepted').map((opening) => opening.candidate?.id))
  const declinedCandidateIds = new Set((position.responseEvents ?? []).filter((event) => event.status === 'Declined').map((event) => event.candidateId))
  const counts = getCounts(sourcePoll)
  const options = sourcePoll.sourceCandidateIds.filter((candidateId) => candidateId !== declinedCandidateId
    && getPollCandidateStatus(position, sourcePoll.id, candidateId) === 'Advanced'
    && !filledCandidateIds.has(candidateId)
    && !declinedCandidateIds.has(candidateId)
    && !['Declined', 'Eliminated'].includes(getCurrentCandidateStatus(position, candidateId)))
    .map((candidateId) => ({ candidateId, votes: counts[candidateId] ?? 0 }))
    .sort((a, b) => b.votes - a.votes || (sourcePoll.candidateNames[a.candidateId] ?? '').localeCompare(sourcePoll.candidateNames[b.candidateId] ?? ''))
  const topTie = options.length > 1 && options[0].votes === options[1].votes ? options.filter((option) => option.votes === options[0].votes).map((option) => option.candidateId) : []
  return { sourcePoll, options, topTie }
}