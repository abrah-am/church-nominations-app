import { getOpeningSummaries, getPositionLifecycle } from './position-summary'
import type { CandidateDecisionEvent, PositionPollSummary, PositionSnapshot } from './types'

export interface RankedReplacementCandidate {
  candidateId: string
  name: string
  votes: number
}

export interface DirectReplacementRecommendation {
  openingId: string
  sourcePollId: string | null
  ranked: RankedReplacementCandidate[]
  outcome: 'unique' | 'tie' | 'unavailable'
  candidateIds: string[]
  reason: string
}

function candidateName(position: PositionSnapshot, poll: PositionPollSummary | undefined, candidateId: string) {
  return position.candidates.find((candidate) => candidate.id === candidateId)?.name
    ?? poll?.candidateNames[candidateId]
    ?? 'Unknown candidate'
}

function currentDecision(position: PositionSnapshot, candidateId: string): CandidateDecisionEvent | undefined {
  return [...position.decisions]
    .filter((event) => event.candidateId === candidateId)
    .sort((left, right) => left.decidedAt.localeCompare(right.decidedAt))
    .at(-1)
}

function isExcludedFromDirectPool(
  position: PositionSnapshot,
  candidateId: string,
  openingId: string,
): boolean {
  const openings = getOpeningSummaries(position)
  const declined = position.responseEvents.some((event) =>
    event.candidateId === candidateId && event.status === 'Declined',
  )
  const decision = currentDecision(position, candidateId)
  const assignedElsewhere = openings.some((opening) =>
    opening.openingId !== openingId
    && opening.electedCandidate?.id === candidateId
    && opening.condition !== 'Vacancy',
  )
  return declined
    || decision?.status === 'Declined'
    || decision?.status === 'Eliminated'
    || assignedElsewhere
    || (decision?.status === 'Elected' && decision.openingId !== undefined && decision.openingId !== openingId)
}

/** Position-scoped PD-018 recommendation. Other positions are absent from this snapshot. */
export function getDirectReplacementRecommendation(
  position: PositionSnapshot,
  openingId: string,
): DirectReplacementRecommendation {
  const opening = getOpeningSummaries(position).find((item) => item.openingId === openingId)
  const response = opening?.latestResponse
  const decision = position.decisions.find((event) => event.id === response?.decisionEventId)
  const poll = position.polls.find((item) => item.id === decision?.pollId)
  const unavailable = (reason: string): DirectReplacementRecommendation => ({
    openingId,
    sourcePollId: poll?.id ?? null,
    ranked: [],
    outcome: 'unavailable',
    candidateIds: [],
    reason,
  })

  if (getPositionLifecycle(position) === 'Finalized') {
    return unavailable('Reopen the position before inviting a replacement.')
  }
  if (!opening || opening.condition !== 'Vacancy' || response?.status !== 'Declined' || !decision) {
    return unavailable('Direct replacement is available after an Accepted opening is Declined.')
  }
  if (!poll || poll.type !== 'voting' || poll.status !== 'Closed' || poll.voided) {
    return unavailable('The associated completed, non-voided round is not available.')
  }

  const advancedIds = position.decisions
    .filter((event) => event.pollId === poll.id && event.status === 'Advanced')
    .map((event) => event.candidateId)
  const ranked = [...new Set(advancedIds)]
    .filter((candidateId) => !isExcludedFromDirectPool(position, candidateId, openingId))
    .map((candidateId) => ({
      candidateId,
      name: candidateName(position, poll, candidateId),
      votes: poll.aggregateVotes[candidateId] ?? 0,
    }))
    .sort((left, right) => right.votes - left.votes || left.name.localeCompare(right.name))

  if (!ranked.length) {
    return {
      openingId,
      sourcePollId: poll.id,
      ranked,
      outcome: 'unavailable',
      candidateIds: [],
      reason: 'No eligible Advanced candidate remains in the associated round.',
    }
  }

  const topVotes = ranked[0]!.votes
  const top = ranked.filter((candidate) => candidate.votes === topVotes)
  if (top.length === 1) {
    return {
      openingId,
      sourcePollId: poll.id,
      ranked,
      outcome: 'unique',
      candidateIds: [top[0]!.candidateId],
      reason: `Recommend ${top[0]!.name} from ${poll.title}. Invitation requires an explicit Admin action.`,
    }
  }
  return {
    openingId,
    sourcePollId: poll.id,
    ranked,
    outcome: 'tie',
    candidateIds: top.map((candidate) => candidate.candidateId),
    reason: `The highest vote count is tied. Confirm a tie-break poll containing only those candidates.`,
  }
}

export function getHistoricalReplacementNames(position: PositionSnapshot): string[] {
  const names = new Set<string>()
  const add = (name: string | undefined) => {
    const trimmed = name?.trim()
    if (trimmed) names.add(trimmed)
  }
  position.candidates.forEach((candidate) => add(candidate.name))
  position.polls.forEach((poll) => {
    Object.values(poll.candidateNames).forEach(add)
    poll.nominationSubmissions.forEach((submission) => add(submission.name))
  })
  return [...names].sort((left, right) => left.localeCompare(right, undefined, { sensitivity: 'base' }) || left.localeCompare(right))
}
