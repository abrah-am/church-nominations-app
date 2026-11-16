import type {
  Candidate,
  CandidateDecisionEvent,
  CandidateResponseEvent,
  PositionCondition,
  PositionLifecycleStatus,
  PositionSnapshot,
} from './types'

function byTimestamp<T extends { decidedAt: string }>(left: T, right: T): number {
  return left.decidedAt.localeCompare(right.decidedAt)
}

export function getCurrentCandidateStatus(
  position: PositionSnapshot,
  candidateId: string,
): CandidateDecisionEvent['status'] {
  return getCurrentCandidateDecisionEvent(position, candidateId)?.status ?? 'Pending'
}

export function getCurrentCandidateDecisionEvent(
  position: PositionSnapshot,
  candidateId: string,
): CandidateDecisionEvent | undefined {
  const events = position.decisions.filter((event) => event.candidateId === candidateId)
  const superseded = new Set(
    events.map((event) => event.supersedesEventId).filter((id) => id !== undefined),
  )

  return (
    events
      .filter((event) => !superseded.has(event.id))
      .sort(byTimestamp)
      .at(-1)
  )
}

export function getPollCandidateStatus(
  position: PositionSnapshot,
  pollId: string,
  candidateId: string,
): CandidateDecisionEvent['status'] {
  return (
    position.decisions
      .filter((event) => event.pollId === pollId && event.candidateId === candidateId)
      .sort(byTimestamp)
      .at(-1)?.status ?? 'Pending'
  )
}

export function getPositionLifecycle(
  position: PositionSnapshot,
): PositionLifecycleStatus {
  return position.lifecycleEvents.at(-1)?.status ?? 'In Progress'
}

export type OpeningCondition = 'Unfilled' | 'Awaiting Acceptance' | 'Filled' | 'Vacancy'

export interface OpeningSummary {
  openingId: string
  number: number
  candidate: Candidate | undefined
  electedCandidate: Candidate | undefined
  latestResponse: CandidateResponseEvent | undefined
  responseHistory: CandidateResponseEvent[]
  filled: boolean
  condition: OpeningCondition
}

// Invitation-based replacement assignment is deliberately outside this port.
export function getOpeningSummaries(position: PositionSnapshot): OpeningSummary[] {
  const elected = position.candidates
    .flatMap((candidate) => {
      const election = getCurrentCandidateDecisionEvent(position, candidate.id)
      return election?.status === 'Elected'
        ? [{ candidate, electedAt: election.decidedAt }]
        : []
    })
    .sort((left, right) => left.electedAt.localeCompare(right.electedAt))
  const openingIds = Array.from(
    { length: position.openings },
    (_, index) => `${position.id}:opening:${index + 1}`,
  )
  const assigned = new Map<string, Candidate>()
  const responses = [...position.responseEvents].sort((left, right) =>
    left.respondedAt.localeCompare(right.respondedAt),
  )

  const electedEvents = elected.map(({ candidate }) => ({
    candidate,
    event: getCurrentCandidateDecisionEvent(position, candidate.id)!,
  }))

  for (const openingId of openingIds) {
    const latest = electedEvents
      .filter((item) => item.event.openingId === openingId)
      .sort((left, right) => left.event.decidedAt.localeCompare(right.event.decidedAt))
      .at(-1)
    if (latest) assigned.set(openingId, latest.candidate)
  }

  // Legacy Elected events have no opening assignment. Keep them visible without
  // rewriting history, assigning only the first unoccupied opening.
  for (const { candidate, event } of electedEvents) {
    if (event.openingId) continue
    if ([...assigned.values()].some((item) => item.id === candidate.id)) continue
    const openingId = openingIds.find((item) => !assigned.has(item))
    if (openingId) assigned.set(openingId, candidate)
  }

  return openingIds.map((openingId, index) => {
    const candidate = assigned.get(openingId)
    const election = candidate
      ? getCurrentCandidateDecisionEvent(position, candidate.id)
      : undefined
    const candidateResponses = candidate
      ? responses.filter(
          (event) => event.openingId === openingId
            && event.candidateId === candidate.id
            && event.decisionEventId === election?.id,
        )
      : []
    const responseHistory = responses.filter(
      (event) => event.openingId === openingId,
    )
    const latestResponse = candidateResponses.at(-1)
    const filled = getCurrentCandidateStatus(position, candidate?.id ?? '') === 'Elected'
      && latestResponse?.status === 'Accepted'
    const condition: OpeningCondition = filled
      ? 'Filled'
      : latestResponse?.status === 'Declined'
        ? 'Vacancy'
        : candidate
          ? 'Awaiting Acceptance'
          : 'Unfilled'

    return {
      openingId,
      number: index + 1,
      candidate,
      electedCandidate: candidate,
      latestResponse,
      responseHistory,
      filled,
      condition,
    }
  })
}

export function getFinalizationBlockers(position: PositionSnapshot): string[] {
  const blockers: string[] = []
  if (getPositionLifecycle(position) === 'Finalized') {
    blockers.push('This position is already finalized.')
  }
  if (position.polls.some((poll) => poll.status === 'Open')) {
    blockers.push('Close the open poll before finalizing.')
  }
  if (getOpeningSummaries(position).some((opening) => !opening.filled)) {
    blockers.push('Every opening must have an Accepted response before finalizing.')
  }
  return blockers
}

export function canReopenPosition(position: PositionSnapshot): boolean {
  return getPositionLifecycle(position) === 'Finalized'
}

export interface PollResult {
  candidateId: string
  name: string
  votes: number
  percentage: number
}

/** Aggregates are fixture/read-contract values; individual ballots are never modeled. */
export function getPollResults(
  poll: PositionSnapshot['polls'][number],
): PollResult[] {
  return poll.sourceCandidateIds
    .map((candidateId) => ({
      candidateId,
      name: poll.candidateNames[candidateId] ?? 'Unknown candidate',
      votes: poll.aggregateVotes[candidateId] ?? 0,
      percentage: poll.ballotsCast > 0
        ? Math.round(((poll.aggregateVotes[candidateId] ?? 0) / poll.ballotsCast) * 100)
        : 0,
    }))
    .sort((left, right) => right.votes - left.votes || left.name.localeCompare(right.name))
}

export function getPositionCondition(position: PositionSnapshot): PositionCondition {
  const openings = getOpeningSummaries(position)
  const acceptedCount = openings.filter(
    (opening) => opening.latestResponse?.status === 'Accepted',
  ).length
  const awaitingResponse = openings.some(
    (opening) => opening.candidate !== undefined && opening.latestResponse === undefined,
  )
  const finalized = getPositionLifecycle(position) === 'Finalized'
  const hasOpenPoll = position.polls.some((poll) => poll.status === 'Open')

  if (finalized && acceptedCount < position.openings) return 'Vacancy'
  if (hasOpenPoll) return 'In Progress'
  if (awaitingResponse) return 'Awaiting Acceptance'
  if (openings.some((opening) => opening.candidate === undefined)) return 'Vacancy'
  if (acceptedCount === position.openings) return 'Ready to Finalize'
  if (acceptedCount < position.openings) return 'Vacancy'
  return 'In Progress'
}
