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
  const events = position.decisions.filter((event) => event.candidateId === candidateId)
  const superseded = new Set(
    events.map((event) => event.supersedesEventId).filter((id) => id !== undefined),
  )

  return (
    events
      .filter((event) => !superseded.has(event.id))
      .sort(byTimestamp)
      .at(-1)?.status ?? 'Pending'
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

export interface OpeningSummary {
  openingId: string
  number: number
  candidate: Candidate | undefined
  electedCandidate: Candidate | undefined
  latestResponse: CandidateResponseEvent | undefined
  responseHistory: CandidateResponseEvent[]
  filled: boolean
}

// Invitation-based replacement assignment is deliberately outside this port.
export function getOpeningSummaries(position: PositionSnapshot): OpeningSummary[] {
  const elected = position.candidates
    .flatMap((candidate) => {
      const currentStatus = getCurrentCandidateStatus(position, candidate.id)
      const election = position.decisions
        .filter((event) => event.candidateId === candidate.id && event.status === 'Elected')
        .sort(byTimestamp)
        .at(-1)
      return currentStatus === 'Elected' && election
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

  for (const response of responses) {
    const candidate = elected.find((item) => item.candidate.id === response.candidateId)?.candidate
    if (candidate && openingIds.includes(response.openingId)) {
      assigned.set(response.openingId, candidate)
    }
  }

  for (const { candidate } of elected) {
    if ([...assigned.values()].some((item) => item.id === candidate.id)) continue
    const openingId = openingIds.find((item) => !assigned.has(item))
    if (openingId) assigned.set(openingId, candidate)
  }

  return openingIds.map((openingId, index) => {
    const candidate = assigned.get(openingId)
    const candidateResponses = candidate
      ? responses.filter(
          (event) => event.openingId === openingId && event.candidateId === candidate.id,
        )
      : []
    const responseHistory = responses.filter(
      (event) => event.openingId === openingId,
    )
    const latestResponse = candidateResponses.at(-1)

    return {
      openingId,
      number: index + 1,
      candidate,
      electedCandidate: candidate,
      latestResponse,
      responseHistory,
      filled: getCurrentCandidateStatus(position, candidate?.id ?? '') === 'Elected'
        && latestResponse?.status === 'Accepted',
    }
  })
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
