import { getOpeningSummaries } from './position-summary'
import type {
  CandidateStatus,
  PositionPollSummary,
  PositionSnapshot,
} from './types'

export type ElectionDecisionStatus = Extract<CandidateStatus, 'Elected' | 'Advanced' | 'Eliminated'>

export interface CandidateDecisionDraft {
  candidateId: string
  status: ElectionDecisionStatus
  openingId?: string
}

export interface MajorityGuidance {
  ballotsCast: number
  requiredVotes: number
  qualifiedCandidateIds: string[]
}

function isElectionDecisionStatus(status: unknown): status is ElectionDecisionStatus {
  return status === 'Elected' || status === 'Advanced' || status === 'Eliminated'
}

/** Strict-majority qualification is guidance; this function never records outcomes. */
export function getMajorityGuidance(poll: PositionPollSummary): MajorityGuidance {
  const requiredVotes = Math.floor(poll.ballotsCast / 2) + 1
  return {
    ballotsCast: poll.ballotsCast,
    requiredVotes,
    qualifiedCandidateIds: poll.ballotsCast > 0
      ? poll.sourceCandidateIds.filter(
          (candidateId) => (poll.aggregateVotes[candidateId] ?? 0) >= requiredVotes,
        )
      : [],
  }
}

/**
 * Validate a complete, explicit decision set without mutating election data.
 * The Admin remains responsible for confirming each decision; calculated
 * majority status is intentionally not used to write an Elected outcome.
 */
export function validateDecisionSet(
  position: PositionSnapshot,
  poll: PositionPollSummary,
  decisions: readonly CandidateDecisionDraft[],
): string[] {
  const errors: string[] = []
  if (poll.type !== 'voting') errors.push('Candidate decisions are available only for voting polls.')
  if (poll.status !== 'Closed') errors.push('Close the voting poll before recording candidate decisions.')
  if (!poll.sourceCandidateIds.length) errors.push('This poll has no candidate roster to decide.')

  const uniqueCandidates = new Set(poll.sourceCandidateIds)
  if (uniqueCandidates.size !== poll.sourceCandidateIds.length) {
    errors.push('The poll roster contains duplicate candidate IDs and cannot be decided safely.')
  }
  if (decisions.length !== poll.sourceCandidateIds.length) {
    errors.push('Choose exactly one decision for every candidate in this poll.')
  }
  if (decisions.some((decision) => !isElectionDecisionStatus(decision.status))) {
    errors.push('Choose Elected, Advanced, or Eliminated for every candidate.')
  }

  const decisionIds = decisions.map((decision) => decision.candidateId)
  if (new Set(decisionIds).size !== decisionIds.length) {
    errors.push('A candidate can have only one decision in this submission.')
  }
  if (decisionIds.some((candidateId) => !uniqueCandidates.has(candidateId))) {
    errors.push('Remove decisions for candidates who are not in this poll.')
  }
  if (poll.sourceCandidateIds.some((candidateId) => !decisionIds.includes(candidateId))) {
    errors.push('Choose Elected, Advanced, or Eliminated for every listed candidate.')
  }

  const elected = decisions.filter((decision) => decision.status === 'Elected')
  const advanced = decisions.filter((decision) => decision.status === 'Advanced')
  if (elected.length === 0 && advanced.length < 2) {
    errors.push('Record at least one Elected candidate or advance at least two candidates.')
  }

  const occupiedOpenings = getOpeningSummaries(position).filter((opening) => opening.electedCandidate)
  const remainingOpeningCount = Math.max(0, position.openings - occupiedOpenings.length)
  if (elected.length > remainingOpeningCount) {
    errors.push(`At most ${remainingOpeningCount} additional candidate${remainingOpeningCount === 1 ? '' : 's'} may be Elected for the ${position.openings} opening${position.openings === 1 ? '' : 's'}.`)
  }

  const availableOpeningIds = getOpeningSummaries(position)
    .filter((opening) => !opening.electedCandidate)
    .map((opening) => opening.openingId)
  const selectedOpeningIds = elected.map((decision) => decision.openingId)
  if (elected.some((decision) => !decision.openingId || !availableOpeningIds.includes(decision.openingId))) {
    errors.push('Assign each Elected candidate to an available opening.')
  }
  if (new Set(selectedOpeningIds).size !== selectedOpeningIds.length) {
    errors.push('Each Elected candidate must be assigned to a different opening.')
  }

  return errors
}
