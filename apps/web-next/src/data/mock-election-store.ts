import type {
  ActiveSessionSnapshot,
  PositionPollSummary,
  PositionSnapshot,
} from '../domain/types'
import { createPositionFixtures } from './position-fixtures'

export type NominationStatus = 'not-created' | 'draft' | 'open' | 'closed' | 'confirmed'
export type VotingStatus = 'not-created' | 'draft' | 'open' | 'closed'

export interface AdminElectionSnapshot {
  churchName: string
  termName: string
  position: PositionSnapshot
  nominationStatus: NominationStatus
  nominationNameLimit: number
  nominationSubmissions: readonly string[]
  reviewedNames: readonly string[]
  nomineeRoster: readonly string[]
  votingStatus: VotingStatus
  choiceCount: number
  presentation: {
    resultsVisible: boolean
    participationVisible: boolean
    nominationNamesVisible: boolean
  }
}

export interface VoterElectionSnapshot {
  churchName: string
  termName: string
  positionName: string
  openings: number
  nominationStatus: NominationStatus
  nominationNameLimit: number
  publishedNomineeNames: readonly string[]
  ownNominationSubmitted: boolean
  ownNominationNames: readonly string[]
  votingStatus: VotingStatus
  pollTitle: string | null
  choiceCount: number
  candidates: readonly { id: string; name: string }[]
  ownBallot: readonly string[]
}

export interface PresentationElectionSnapshot {
  churchName: string
  termName: string
  positionName: string
  openings: number
  nominationStatus: NominationStatus
  votingStatus: VotingStatus
  pollTitle: string | null
  results: readonly { candidateId: string; name: string; votes: number; percentage: number }[] | null
  ballotsCast: number | null
  nominationNames: readonly string[]
}

export class ElectionRuleError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ElectionRuleError'
  }
}

interface InternalState {
  position: PositionSnapshot
  nominationStatus: NominationStatus
  nominationNameLimit: number
  nominationSubmissions: string[]
  reviewedNames: string[]
  nomineeRoster: string[]
  votingStatus: VotingStatus
  choiceCount: number
  resultsVisible: boolean
  participationVisible: boolean
  nominationRoomVisible: boolean
  nominationListPublished: boolean
  sharedNominationList: string[]
  ownNominationSubmitted: boolean
  ownNominationNames: string[]
  ownBallot: string[]
}

export interface MockElectionStore {
  subscribe: (listener: () => void) => () => void
  getAdminSnapshot: () => AdminElectionSnapshot
  getVoterSnapshot: () => VoterElectionSnapshot
  getPresentationSnapshot: () => PresentationElectionSnapshot
  configureNominationLimit: (limit: number) => void
  createNominationPoll: () => void
  openNominationPoll: () => void
  closeNominationPoll: () => void
  submitNomination: (names: readonly string[]) => void
  correctReviewedName: (index: number, name: string) => void
  removeReviewedName: (index: number) => void
  confirmNomineeRoster: () => void
  createVotingPoll: (choiceCount: number) => void
  openVotingPoll: () => void
  closeVotingPoll: () => void
  submitBallot: (candidateIds: readonly string[]) => void
  setResultsVisible: (visible: boolean) => void
  setParticipationVisible: (visible: boolean) => void
  setNominationRoomVisible: (visible: boolean) => void
  publishNominationList: (visible: boolean) => void
}

const churchName = 'Riverside Seventh-day Adventist Church'
const termName = '2027'
const defaultNominationLimit = 5

function createInitialState(): InternalState {
  const fixture = createPositionFixtures().find((item) => item.id === 'position-riverside-elder')
  if (!fixture) throw new Error('The M4 mock election fixture is incomplete.')

  // Keep the accepted M2 history in the shared position snapshot; M4 polls are additive.
  return {
    position: fixture,
    nominationStatus: 'not-created',
    nominationNameLimit: defaultNominationLimit,
    nominationSubmissions: [],
    reviewedNames: [],
    nomineeRoster: [],
    votingStatus: 'not-created',
    choiceCount: 1,
    resultsVisible: false,
    participationVisible: false,
    nominationRoomVisible: false,
    nominationListPublished: false,
    sharedNominationList: [],
    ownNominationSubmitted: false,
    ownNominationNames: [],
    ownBallot: [],
  }
}

function currentPoll(state: InternalState, type: 'nomination' | 'voting') {
  return [...state.position.polls].reverse().find((poll) =>
    poll.id.startsWith('m4-') && poll.type === type,
  )
}

function sortNames(names: readonly string[]) {
  return [...names].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: 'base' }) || left.localeCompare(right),
  )
}

function updatePoll(
  state: InternalState,
  pollId: string,
  update: (poll: PositionPollSummary) => PositionPollSummary,
) {
  state.position.polls = state.position.polls.map((poll) =>
    poll.id === pollId ? update(poll) : poll,
  )
}

function makePoll(
  id: string,
  type: 'nomination' | 'voting',
  number: number,
  title: string,
): PositionPollSummary {
  return {
    id,
    type,
    number,
    title,
    status: 'Draft',
    sourceCandidateIds: [],
    candidateNames: {},
    aggregateVotes: {},
    ballotsCast: 0,
    recordedDecisions: [],
    nominationSubmissions: [],
    auditEntries: [],
  }
}

function buildAdminSnapshot(state: InternalState): AdminElectionSnapshot {
  return Object.freeze({
    churchName,
    termName,
    position: structuredClone(state.position),
    nominationStatus: state.nominationStatus,
    nominationNameLimit: state.nominationNameLimit,
    nominationSubmissions: Object.freeze([...state.nominationSubmissions]),
    reviewedNames: Object.freeze([...state.reviewedNames]),
    nomineeRoster: Object.freeze([...state.nomineeRoster]),
    votingStatus: state.votingStatus,
    choiceCount: state.choiceCount,
    presentation: Object.freeze({
      resultsVisible: state.resultsVisible,
      participationVisible: state.participationVisible,
      nominationNamesVisible: state.nominationStatus === 'open'
        ? state.nominationRoomVisible
        : state.nominationListPublished,
    }),
  })
}

function buildVoterSnapshot(state: InternalState): VoterElectionSnapshot {
  const poll = currentPoll(state, 'voting')
  const candidates = state.nomineeRoster.map((name, index) => ({
    id: `m4-nominee-${index + 1}`,
    name,
  }))
  return Object.freeze({
    churchName,
    termName,
    positionName: state.position.name,
    openings: state.position.openings,
    nominationStatus: state.nominationStatus,
    nominationNameLimit: state.nominationNameLimit,
    publishedNomineeNames: Object.freeze(
      state.votingStatus !== 'open' && state.votingStatus !== 'closed' && state.nominationListPublished
        ? [...state.sharedNominationList]
        : [],
    ),
    ownNominationSubmitted: state.ownNominationSubmitted,
    ownNominationNames: Object.freeze([...state.ownNominationNames]),
    votingStatus: state.votingStatus,
    pollTitle: poll?.title ?? null,
    choiceCount: state.choiceCount,
    candidates: Object.freeze(candidates),
    ownBallot: Object.freeze([...state.ownBallot]),
  })
}

function buildPresentationSnapshot(state: InternalState): PresentationElectionSnapshot {
  const poll = currentPoll(state, 'voting')
  const shouldShowResults = state.resultsVisible
    && (state.votingStatus === 'open' || state.votingStatus === 'closed')
  const results = shouldShowResults && poll
    ? poll.sourceCandidateIds.map((candidateId) => {
      const votes = poll.aggregateVotes[candidateId] ?? 0
      return {
        candidateId,
        name: poll.candidateNames[candidateId] ?? 'Candidate',
        votes,
        percentage: poll.ballotsCast ? Math.round((votes / poll.ballotsCast) * 100) : 0,
      }
    })
    : null
  const nominationNames = state.votingStatus === 'open' || state.votingStatus === 'closed'
    ? []
    : state.nominationStatus === 'open'
    ? (state.nominationRoomVisible ? sortNames(state.nominationSubmissions) : [])
    : (state.nominationListPublished ? [...state.sharedNominationList] : [])

  return Object.freeze({
    churchName,
    termName,
    positionName: state.position.name,
    openings: state.position.openings,
    nominationStatus: state.nominationStatus,
    votingStatus: state.votingStatus,
    pollTitle: poll?.title ?? null,
    results: results ? Object.freeze(results) : null,
    ballotsCast: state.participationVisible && state.votingStatus !== 'not-created'
      ? poll?.ballotsCast ?? 0
      : null,
    nominationNames: Object.freeze(nominationNames),
  })
}

export function createMockElectionStore(): MockElectionStore {
  let state = createInitialState()
  let adminSnapshot = buildAdminSnapshot(state)
  let voterSnapshot = buildVoterSnapshot(state)
  let presentationSnapshot = buildPresentationSnapshot(state)
  const listeners = new Set<() => void>()

  function commit(change: (draft: InternalState) => void) {
    const draft = structuredClone(state)
    change(draft)
    state = draft
    adminSnapshot = buildAdminSnapshot(state)
    voterSnapshot = buildVoterSnapshot(state)
    presentationSnapshot = buildPresentationSnapshot(state)
    listeners.forEach((listener) => listener())
  }

  function requireStatus<T extends string>(
    actual: T,
    expected: T,
    action: string,
  ) {
    if (actual !== expected) {
      throw new ElectionRuleError('INVALID_LIFECYCLE', `Cannot ${action} while status is ${actual}.`)
    }
  }

  const store: MockElectionStore = {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getAdminSnapshot: () => adminSnapshot,
    getVoterSnapshot: () => voterSnapshot,
    getPresentationSnapshot: () => presentationSnapshot,
    configureNominationLimit(limit) {
      if (state.nominationStatus !== 'not-created') {
        throw new ElectionRuleError('NOMINATION_ALREADY_CREATED', 'Name limit cannot change after intake creation.')
      }
      if (!Number.isSafeInteger(limit) || limit < 1) {
        throw new ElectionRuleError('INVALID_NAME_LIMIT', 'Name limit must be a positive whole number.')
      }
      commit((draft) => { draft.nominationNameLimit = limit })
    },
    createNominationPoll() {
      requireStatus(state.nominationStatus, 'not-created', 'create nomination intake')
      commit((draft) => {
        draft.nominationStatus = 'draft'
        const number = draft.position.polls.filter((poll) => poll.type === 'nomination').length + 1
        draft.position.polls.push(makePoll(
          `m4-nomination-${number}`,
          'nomination',
          number,
          `${draft.position.name} · Nomination Poll ${number}`,
        ))
      })
    },
    openNominationPoll() {
      requireStatus(state.nominationStatus, 'draft', 'open nomination intake')
      const poll = currentPoll(state, 'nomination')!
      commit((draft) => {
        draft.nominationStatus = 'open'
        updatePoll(draft, poll.id, (item) => ({ ...item, status: 'Open' }))
      })
    },
    closeNominationPoll() {
      requireStatus(state.nominationStatus, 'open', 'close nomination intake')
      const poll = currentPoll(state, 'nomination')!
      commit((draft) => {
        draft.nominationStatus = 'closed'
        draft.reviewedNames = sortNames(draft.nominationSubmissions)
        draft.sharedNominationList = [...draft.reviewedNames]
        const publishToParticipants = draft.nominationRoomVisible
        draft.nominationRoomVisible = false
        draft.nominationListPublished = publishToParticipants
        updatePoll(draft, poll.id, (item) => ({
          ...item,
          status: 'Closed',
          nominationSubmissions: draft.nominationSubmissions.map((name, index) => ({
            id: `anonymous-name-${index + 1}`,
            name,
            submittedAt: `Mock submission ${index + 1}`,
          })),
        }))
      })
    },
    submitNomination(names) {
      requireStatus(state.nominationStatus, 'open', 'submit nominations')
      if (state.ownNominationSubmitted) {
        throw new ElectionRuleError('NOMINATION_ALREADY_SUBMITTED', 'Nomination submission is final for this open poll.')
      }
      const cleaned = names.map((name) => name.trim())
      if (cleaned.length < 1 || cleaned.length > state.nominationNameLimit || cleaned.some((name) => !name)) {
        throw new ElectionRuleError('INVALID_NOMINATIONS', `Enter 1 to ${state.nominationNameLimit} non-empty names.`)
      }
      commit((draft) => {
        draft.ownNominationSubmitted = true
        draft.ownNominationNames = cleaned
        draft.nominationSubmissions.push(...cleaned)
        const poll = currentPoll(draft, 'nomination')
        if (poll) updatePoll(draft, poll.id, (item) => ({ ...item, nominationSubmissions: [] }))
      })
    },
    correctReviewedName(index, name) {
      if (state.nominationStatus !== 'closed') {
        throw new ElectionRuleError('NOMINATION_NOT_REVIEWABLE', 'Names can only be corrected after intake closes.')
      }
      const cleaned = name.trim()
      if (!cleaned || !Number.isInteger(index) || index < 0 || index >= state.reviewedNames.length) {
        throw new ElectionRuleError('INVALID_REVIEW_EDIT', 'Enter a name and select an available submission.')
      }
      commit((draft) => {
        draft.reviewedNames[index] = cleaned
        if (draft.nominationListPublished) draft.sharedNominationList[index] = cleaned
      })
    },
    removeReviewedName(index) {
      if (state.nominationStatus !== 'closed') {
        throw new ElectionRuleError('NOMINATION_NOT_REVIEWABLE', 'Names can only be consolidated after intake closes.')
      }
      if (!Number.isInteger(index) || index < 0 || index >= state.reviewedNames.length) {
        throw new ElectionRuleError('INVALID_REVIEW_EDIT', 'Select an available submission to remove.')
      }
      commit((draft) => {
        draft.reviewedNames.splice(index, 1)
        if (draft.nominationListPublished) draft.sharedNominationList.splice(index, 1)
      })
    },
    confirmNomineeRoster() {
      requireStatus(state.nominationStatus, 'closed', 'confirm nominee roster')
      const roster = state.reviewedNames.map((name) => name.trim())
      if (!roster.length || roster.some((name) => !name) || new Set(roster.map((name) => name.toLocaleLowerCase())).size !== roster.length) {
        throw new ElectionRuleError('INVALID_NOMINEE_ROSTER', 'Confirm at least one non-empty name and consolidate duplicate names before confirming.')
      }
      const poll = currentPoll(state, 'nomination')!
      commit((draft) => {
        draft.nominationStatus = 'confirmed'
        draft.nomineeRoster = roster
        draft.sharedNominationList = [...roster]
        draft.position.candidates.push(
          ...roster.map((name, index) => ({ id: `m4-nominee-${index + 1}`, name })),
        )
        updatePoll(draft, poll.id, (item) => ({
          ...item,
          status: 'Approved',
          sourceCandidateIds: roster.map((_, index) => `m4-nominee-${index + 1}`),
          candidateNames: Object.fromEntries(roster.map((name, index) => [`m4-nominee-${index + 1}`, name])),
        }))
      })
    },
    createVotingPoll(choiceCount) {
      requireStatus(state.votingStatus, 'not-created', 'create voting poll')
      if (state.nominationStatus !== 'confirmed') {
        throw new ElectionRuleError('NOMINEES_NOT_CONFIRMED', 'Confirm the nominee roster before creating a voting poll.')
      }
      if (!Number.isInteger(choiceCount) || choiceCount < 1 || choiceCount > state.nomineeRoster.length) {
        throw new ElectionRuleError('INVALID_CHOICE_COUNT', `Choice count must be between 1 and ${state.nomineeRoster.length}.`)
      }
      commit((draft) => {
        draft.votingStatus = 'draft'
        draft.choiceCount = choiceCount
        const number = draft.position.polls.filter((item) => item.type === 'voting').length + 1
        const poll = makePoll(
          `m4-voting-${number}`,
          'voting',
          number,
          `${draft.position.name} · Round ${number}`,
        )
        poll.sourceCandidateIds = draft.nomineeRoster.map((_, index) => `m4-nominee-${index + 1}`)
        poll.candidateNames = Object.fromEntries(draft.nomineeRoster.map((name, index) => [`m4-nominee-${index + 1}`, name]))
        poll.aggregateVotes = Object.fromEntries(poll.sourceCandidateIds.map((id) => [id, 0]))
        draft.position.polls.push(poll)
      })
    },
    openVotingPoll() {
      requireStatus(state.votingStatus, 'draft', 'open voting')
      const poll = currentPoll(state, 'voting')!
      commit((draft) => {
        draft.votingStatus = 'open'
        draft.resultsVisible = false
        draft.participationVisible = false
        draft.nominationListPublished = false
        updatePoll(draft, poll.id, (item) => ({ ...item, status: 'Open' }))
      })
    },
    closeVotingPoll() {
      requireStatus(state.votingStatus, 'open', 'close voting')
      const poll = currentPoll(state, 'voting')!
      commit((draft) => {
        draft.votingStatus = 'closed'
        updatePoll(draft, poll.id, (item) => ({ ...item, status: 'Closed' }))
      })
    },
    submitBallot(candidateIds) {
      requireStatus(state.votingStatus, 'open', 'submit or replace a ballot')
      if (candidateIds.length !== state.choiceCount
        || new Set(candidateIds).size !== candidateIds.length
        || candidateIds.some((id) => !state.nomineeRoster.some((_, index) => id === `m4-nominee-${index + 1}`))) {
        throw new ElectionRuleError('INVALID_BALLOT', `Select exactly ${state.choiceCount} distinct listed candidate${state.choiceCount === 1 ? '' : 's'}.`)
      }
      const poll = currentPoll(state, 'voting')!
      commit((draft) => {
        const changed = draft.ownBallot.length > 0
        updatePoll(draft, poll.id, (item) => {
          const aggregateVotes = { ...item.aggregateVotes }
          draft.ownBallot.forEach((id) => { aggregateVotes[id] = Math.max(0, (aggregateVotes[id] ?? 0) - 1) })
          candidateIds.forEach((id) => { aggregateVotes[id] = (aggregateVotes[id] ?? 0) + 1 })
          return {
            ...item,
            aggregateVotes,
            ballotsCast: item.ballotsCast + (changed ? 0 : 1),
          }
        })
        draft.ownBallot = [...candidateIds]
      })
    },
    setResultsVisible(visible) {
      if (state.votingStatus !== 'open' && state.votingStatus !== 'closed') {
        throw new ElectionRuleError('VOTING_NOT_STARTED', 'Result visibility is available after the voting poll opens.')
      }
      commit((draft) => { draft.resultsVisible = visible })
    },
    setParticipationVisible(visible) {
      if (state.votingStatus !== 'open' && state.votingStatus !== 'closed') {
        throw new ElectionRuleError('VOTING_NOT_STARTED', 'Participation visibility is available after the voting poll opens.')
      }
      commit((draft) => { draft.participationVisible = visible })
    },
    setNominationRoomVisible(visible) {
      if (state.nominationStatus !== 'open') {
        throw new ElectionRuleError('NOMINATION_NOT_OPEN', 'Live nomination names can only be shown during open intake.')
      }
      commit((draft) => { draft.nominationRoomVisible = visible })
    },
    publishNominationList(visible) {
      if (visible && state.nominationStatus !== 'closed' && state.nominationStatus !== 'confirmed') {
        throw new ElectionRuleError('NOMINATION_NOT_CLOSED', 'The nomination list can only be published after intake closes.')
      }
      if (!visible && state.nominationStatus !== 'closed' && state.nominationStatus !== 'confirmed') {
        throw new ElectionRuleError('NOMINATION_NOT_CLOSED', 'The nomination list can only be hidden after intake closes.')
      }
      if (state.votingStatus === 'open' || state.votingStatus === 'closed') {
        throw new ElectionRuleError('VOTING_HAS_STARTED', 'Nomination content is unavailable after the voting poll starts.')
      }
      commit((draft) => {
        draft.nominationListPublished = visible
        if (visible) {
          draft.sharedNominationList = [...(draft.nominationStatus === 'confirmed'
            ? draft.nomineeRoster
            : draft.reviewedNames)]
        }
      })
    },
  }

  return store
}

export function getActiveSession(snapshot: AdminElectionSnapshot): ActiveSessionSnapshot | null {
  const workflowPolls = snapshot.position.polls.filter((item) => item.id.startsWith('m4-'))
  const workflowHasStarted = snapshot.nominationStatus === 'open'
    || snapshot.nominationStatus === 'closed'
    || snapshot.nominationStatus === 'confirmed'
    || snapshot.votingStatus === 'open'
    || snapshot.votingStatus === 'closed'
  if (workflowHasStarted) {
    const poll = [...workflowPolls].reverse().find((item) =>
      item.status === 'Open' && (item.type === 'nomination' || item.type === 'voting'),
    )
    if (!poll) return null
    return {
      churchId: snapshot.position.churchId,
      termId: snapshot.position.termId,
      positionId: snapshot.position.id,
      positionName: snapshot.position.name,
      pollId: poll.id,
      pollTitle: poll.title,
      status: poll.status,
    }
  }
  const poll = snapshot.position.polls.find((item) => item.type === 'voting' && item.status === 'Open')
  if (!poll) return null
  return {
    churchId: snapshot.position.churchId,
    termId: snapshot.position.termId,
    positionId: snapshot.position.id,
    positionName: snapshot.position.name,
    pollId: poll.id,
    pollTitle: poll.title,
    status: poll.status,
  }
}
