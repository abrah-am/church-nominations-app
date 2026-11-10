import type { PositionSnapshot } from '../domain/types'

const riversidePosition: PositionSnapshot = {
  id: 'position-riverside-elder',
  churchId: 'church-riverside',
  termId: 'term-riverside-2027',
  departmentId: 'department-riverside-ministry',
  name: 'Church Elder',
  openings: 2,
  candidates: [
    { id: 'c-27-elaine', name: 'Elaine Brooks' },
    { id: 'c-27-marcus', name: 'Marcus Hill' },
    { id: 'c-27-priya', name: 'Priya Nair' },
    { id: 'c-27-robert', name: 'Robert James' },
    { id: 'c-27-sofia', name: 'Sofia Martinez' },
  ],
  polls: [
    {
      id: 'p-elder-2027-nomination-1',
      type: 'nomination',
      number: 1,
      title: 'Church Elder · Nomination Poll 1',
      status: 'Approved',
      sourceCandidateIds: ['c-27-elaine', 'c-27-marcus', 'c-27-priya', 'c-27-robert', 'c-27-sofia'],
      candidateNames: {
        'c-27-elaine': 'Elaine Brooks',
        'c-27-marcus': 'Marcus Hill',
        'c-27-priya': 'Priya Nair',
        'c-27-robert': 'Robert James',
        'c-27-sofia': 'Sofia Martinez',
      },
      aggregateVotes: {},
      ballotsCast: 0,
      recordedDecisions: [],
      nominationSubmissions: [
        { id: 's-27-1', name: 'Elaine Brooks', submittedAt: '2026-10-20T12:15:00.000Z' },
        { id: 's-27-2', name: 'Elain Brooks', submittedAt: '2026-10-20T12:21:00.000Z' },
        { id: 's-27-3', name: 'Marcus Hill', submittedAt: '2026-10-20T12:43:00.000Z' },
        { id: 's-27-4', name: 'Priya Nair', submittedAt: '2026-10-20T13:02:00.000Z' },
        { id: 's-27-5', name: 'Priya N.', submittedAt: '2026-10-20T13:08:00.000Z' },
        { id: 's-27-6', name: 'Robert James', submittedAt: '2026-10-20T13:17:00.000Z' },
        { id: 's-27-7', name: 'Sofia Martinez', submittedAt: '2026-10-20T13:25:00.000Z' },
      ],
      auditEntries: [],
    },
    {
      id: 'p-elder-2027-1',
      type: 'voting',
      number: 1,
      title: 'Church Elder · Round 1',
      status: 'Closed',
      sourceCandidateIds: ['c-27-elaine', 'c-27-marcus', 'c-27-priya', 'c-27-robert', 'c-27-sofia'],
      candidateNames: {
        'c-27-elaine': 'Elaine Brooks',
        'c-27-marcus': 'Marcus Hill',
        'c-27-priya': 'Priya Nair',
        'c-27-robert': 'Robert James',
        'c-27-sofia': 'Sofia Martinez',
      },
      aggregateVotes: {
        'c-27-elaine': 3,
        'c-27-marcus': 2,
        'c-27-priya': 2,
        'c-27-robert': 1,
        'c-27-sofia': 0,
      },
      ballotsCast: 8,
      recordedDecisions: [
        { candidateId: 'c-27-elaine', status: 'Elected' },
        { candidateId: 'c-27-marcus', status: 'Advanced' },
        { candidateId: 'c-27-priya', status: 'Advanced' },
        { candidateId: 'c-27-robert', status: 'Eliminated' },
        { candidateId: 'c-27-sofia', status: 'Declined' },
      ],
      nominationSubmissions: [],
      auditEntries: [],
    },
    {
      id: 'p-elder-2027-2',
      type: 'voting',
      number: 2,
      title: 'Church Elder · Round 2',
      status: 'Open',
      sourceCandidateIds: ['c-27-marcus', 'c-27-priya'],
      candidateNames: { 'c-27-marcus': 'Marcus Hill', 'c-27-priya': 'Priya Nair' },
      aggregateVotes: { 'c-27-marcus': 3, 'c-27-priya': 1 },
      ballotsCast: 4,
      recordedDecisions: [],
      nominationSubmissions: [],
      auditEntries: [],
    },
  ],
  decisions: [
    { id: 'decision-27-elaine-elected', candidateId: 'c-27-elaine', pollId: 'p-elder-2027-1', status: 'Elected', decidedAt: '2026-10-25T16:15:00.000Z' },
    { id: 'decision-27-marcus-advanced', candidateId: 'c-27-marcus', pollId: 'p-elder-2027-1', status: 'Advanced', decidedAt: '2026-10-25T16:15:00.000Z' },
    { id: 'decision-27-priya-advanced', candidateId: 'c-27-priya', pollId: 'p-elder-2027-1', status: 'Advanced', decidedAt: '2026-10-25T16:15:00.000Z' },
    { id: 'decision-27-robert-eliminated', candidateId: 'c-27-robert', pollId: 'p-elder-2027-1', status: 'Eliminated', decidedAt: '2026-10-25T16:15:00.000Z' },
    { id: 'decision-27-sofia-declined', candidateId: 'c-27-sofia', pollId: 'p-elder-2027-1', status: 'Declined', decidedAt: '2026-10-25T16:15:00.000Z' },
  ],
  responseEvents: [],
  lifecycleEvents: [],
}

const activeSessionFixtures = [
  {
    churchId: 'church-riverside',
    termId: 'term-riverside-2027',
    session: {
      churchId: 'church-riverside',
      termId: 'term-riverside-2027',
      positionId: 'position-riverside-elder',
      positionName: 'Church Elder',
      pollId: 'p-elder-2027-2',
      pollTitle: 'Church Elder · Round 2',
      status: 'Open' as const,
    },
  },
]

const foundationPosition: PositionSnapshot = {
  id: 'position-foundation-1',
  churchId: 'church-foundation',
  termId: 'term-foundation',
  departmentId: 'department-foundation',
  name: 'Foundation Position',
  openings: 1,
  candidates: [{ id: 'candidate-foundation-1', name: 'Candidate One' }],
  polls: [{
    id: 'poll-foundation-1',
    type: 'voting',
    number: 1,
    title: 'Foundation Poll 1',
    status: 'Closed',
    sourceCandidateIds: ['candidate-foundation-1'],
    candidateNames: { 'candidate-foundation-1': 'Candidate One' },
    aggregateVotes: { 'candidate-foundation-1': 0 },
    ballotsCast: 0,
    recordedDecisions: [{ candidateId: 'candidate-foundation-1', status: 'Elected' }],
    nominationSubmissions: [],
    auditEntries: [],
  }],
  decisions: [{
    id: 'decision-foundation-1',
    candidateId: 'candidate-foundation-1',
    pollId: 'poll-foundation-1',
    status: 'Elected',
    decidedAt: '2026-01-02T12:00:00.000Z',
  }],
  responseEvents: [],
  lifecycleEvents: [],
}

/** Returns deterministic, isolated fixture data; values are static and synthetic. */
export function createPositionFixtures(): PositionSnapshot[] {
  return structuredClone([riversidePosition, foundationPosition])
}

/** Active sessions are scoped independently from the position being viewed. */
export function createActiveSessionFixtures() {
  return structuredClone(activeSessionFixtures)
}
