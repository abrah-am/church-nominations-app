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
}

// Invitation-based replacement assignment is deliberately outside this port.
export function getOpeningSummaries(position: PositionSnapshot): OpeningSummary[] {
  const elected = position.candidates
    .flatMap((candidate) => {
      const election = position.decisions
        .filter((event) => event.candidateId === candidate.id && event.status === 'Elected')
        .sort(byTimestamp)[0]
      return election ? [{ candidate, electedAt: election.decidedAt }] : []
    })
    .sort((left, right) => left.electedAt.localeCompare(right.electedAt))
  const openingIds = Array.from(
    { length: position.openings },
    (_, index) => `${position.id}:opening:${index + 1}`,
  )
  const assigned = new Map<string, Candidate>()

  for (const response of position.responseEvents) {
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
      ? position.responseEvents.filter(
          (event) => event.openingId === openingId && event.candidateId === candidate.id,
        )
      : []
    const responseHistory = position.responseEvents.filter(
      (event) => event.openingId === openingId,
    )

    return {
      openingId,
      number: index + 1,
      candidate,
      electedCandidate: candidate,
      latestResponse: candidateResponses.at(-1),
      responseHistory,
    }
  })
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
