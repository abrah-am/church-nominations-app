export type CandidateStatus =
  | 'Pending'
  | 'Advanced'
  | 'Elected'
  | 'Eliminated'
  | 'Declined'

export type PositionLifecycleStatus = 'In Progress' | 'Finalized' | 'Reopened'
export type PositionCondition =
  | 'In Progress'
  | 'Awaiting Acceptance'
  | 'Ready to Finalize'
  | 'Vacancy'
export type CandidateResponseStatus = 'Accepted' | 'Declined'
export type PollStatus = 'Draft' | 'Open' | 'Closed' | 'Approved'

export interface Candidate {
  id: string
  name: string
}

export interface CandidateDecisionEvent {
  id: string
  candidateId: string
  pollId: string
  status: CandidateStatus
  decidedAt: string
  supersedesEventId?: string
}

export interface CandidateResponseEvent {
  id: string
  candidateId: string
  openingId: string
  status: CandidateResponseStatus
  respondedAt: string
}

export interface PositionLifecycleEvent {
  id: string
  status: PositionLifecycleStatus
  at: string
}

export interface PositionPollSummary {
  id: string
  type: 'nomination' | 'voting'
  number: number
  title: string
  status: PollStatus
  sourceCandidateIds: string[]
  candidateNames: Record<string, string>
  aggregateVotes: Record<string, number>
  ballotsCast: number
  recordedDecisions: Array<{ candidateId: string; status: CandidateStatus }>
  nominationSubmissions: Array<{ id: string; name: string; submittedAt: string }>
  auditEntries: Array<{ id: string; action: string; at: string; detail: string }>
}

export interface ActiveSessionSnapshot {
  churchId: string
  termId: string
  positionId: string
  positionName: string
  pollId: string
  pollTitle: string
  status: PollStatus
}

/**
 * Minimal application-facing aggregate/admin summary. This is not a backend
 * wire DTO and intentionally contains no individual ballots or credentials.
 */
export interface PositionSnapshot {
  id: string
  churchId: string
  termId: string
  departmentId: string
  name: string
  openings: number
  candidates: Candidate[]
  polls: PositionPollSummary[]
  decisions: CandidateDecisionEvent[]
  responseEvents: CandidateResponseEvent[]
  lifecycleEvents: PositionLifecycleEvent[]
}
