import { describe, expect, it } from 'vitest'
import { getCurrentCandidateStatus, getOpeningSummaries, getPollCandidateStatus, getPollResults, getPositionCondition, getPositionLifecycle } from './position-summary'
import type { PositionSnapshot } from './types'
import { createPositionFixtures } from '../data/position-fixtures'

function createPosition(): PositionSnapshot {
  return {
    id: 'position-1',
    churchId: 'church-1',
    termId: 'term-1',
    departmentId: 'department-1',
    name: 'Position One',
    openings: 1,
    candidates: [{ id: 'candidate-1', name: 'Candidate One' }],
    polls: [
      {
        id: 'poll-1', status: 'Closed', type: 'voting', number: 1, title: 'Poll 1',
        sourceCandidateIds: ['candidate-1'], candidateNames: { 'candidate-1': 'Candidate One' },
        aggregateVotes: {}, ballotsCast: 0, recordedDecisions: [], nominationSubmissions: [], auditEntries: [],
      },
      {
        id: 'poll-2', status: 'Closed', type: 'voting', number: 2, title: 'Poll 2',
        sourceCandidateIds: ['candidate-1'], candidateNames: { 'candidate-1': 'Candidate One' },
        aggregateVotes: {}, ballotsCast: 0, recordedDecisions: [], nominationSubmissions: [], auditEntries: [],
      },
    ],
    decisions: [
      {
        id: 'decision-elected',
        candidateId: 'candidate-1',
        pollId: 'poll-1',
        status: 'Elected',
        decidedAt: '2026-01-01T12:00:00.000Z',
      },
    ],
    responseEvents: [],
    lifecycleEvents: [],
  }
}

describe('prototype-derived position summaries', () => {
  it('uses the latest unsuperseded decision for current status and keeps poll history stable', () => {
    const position = createPosition()
    position.decisions.push({
      id: 'decision-revised',
      candidateId: 'candidate-1',
      pollId: 'poll-2',
      status: 'Declined',
      decidedAt: '2026-01-02T12:00:00.000Z',
      supersedesEventId: 'decision-elected',
    })

    expect(getCurrentCandidateStatus(position, 'candidate-1')).toBe('Declined')
    expect(getPollCandidateStatus(position, 'poll-1', 'candidate-1')).toBe('Elected')
    expect(getPollCandidateStatus(position, 'poll-2', 'candidate-1')).toBe('Declined')
  })

  it('keeps response history separate from decisions and summarizes opening acceptance', () => {
    const position = createPosition()
    const opening = getOpeningSummaries(position)[0]

    expect(opening?.candidate?.id).toBe('candidate-1')
    expect(opening?.latestResponse).toBeUndefined()
    expect(getPositionCondition(position)).toBe('Awaiting Acceptance')

    position.responseEvents = [
      {
        id: 'response-accepted',
        candidateId: 'candidate-1',
        openingId: 'position-1:opening:1',
        decisionEventId: 'decision-elected',
        status: 'Accepted',
        respondedAt: '2026-01-03T12:00:00.000Z',
      },
    ]

    expect(getOpeningSummaries(position)[0]?.filled).toBe(true)
    expect(getPositionCondition(position)).toBe('Ready to Finalize')
    expect(getCurrentCandidateStatus(position, 'candidate-1')).toBe('Elected')
  })

  it('does not reuse a prior response for a later Elected decision', () => {
    const position = createPosition()
    position.responseEvents = [{
      id: 'response-old',
      candidateId: 'candidate-1',
      openingId: 'position-1:opening:1',
      decisionEventId: 'decision-elected',
      status: 'Accepted',
      respondedAt: '2026-01-03T12:00:00.000Z',
    }]
    position.decisions.push({
      id: 'decision-new-election',
      candidateId: 'candidate-1',
      pollId: 'poll-2',
      status: 'Elected',
      decidedAt: '2026-01-04T12:00:00.000Z',
      supersedesEventId: 'decision-elected',
    })

    const opening = getOpeningSummaries(position)[0]
    expect(opening?.candidate?.id).toBe('candidate-1')
    expect(opening?.latestResponse).toBeUndefined()
    expect(opening?.responseHistory.map((event) => event.id)).toEqual(['response-old'])
    expect(opening?.filled).toBe(false)
  })

  it('gates readiness while any poll is open', () => {
    const position = createPosition()
    position.responseEvents = [
      {
        id: 'response-accepted',
        candidateId: 'candidate-1',
        openingId: 'position-1:opening:1',
        decisionEventId: 'decision-elected',
        status: 'Accepted',
        respondedAt: '2026-01-03T12:00:00.000Z',
      },
    ]
    position.polls[1]!.status = 'Open'

    expect(getPositionCondition(position)).toBe('In Progress')
  })

  it('retains finalized lifecycle when the latest response later declines', () => {
    const position = createPosition()
    position.responseEvents = [
      {
        id: 'response-accepted',
        candidateId: 'candidate-1',
        openingId: 'position-1:opening:1',
        decisionEventId: 'decision-elected',
        status: 'Accepted',
        respondedAt: '2026-01-03T12:00:00.000Z',
      },
      {
        id: 'response-declined',
        candidateId: 'candidate-1',
        openingId: 'position-1:opening:1',
        decisionEventId: 'decision-elected',
        status: 'Declined',
        respondedAt: '2026-01-04T12:00:00.000Z',
      },
    ]
    position.lifecycleEvents = [
      { id: 'lifecycle-finalized', status: 'Finalized', at: '2026-01-03T13:00:00.000Z' },
    ]

    expect(getPositionLifecycle(position)).toBe('Finalized')
    expect(getPositionCondition(position)).toBe('Vacancy')
    expect(position.responseEvents.map((event) => event.status)).toEqual([
      'Accepted',
      'Declined',
    ])
    expect(getCurrentCandidateStatus(position, 'candidate-1')).toBe('Elected')
  })

  it('does not mutate source snapshots while deriving statuses or openings', () => {
    const position = createPosition()
    const before = structuredClone(position)

    getCurrentCandidateStatus(position, 'candidate-1')
    getPollCandidateStatus(position, 'poll-1', 'candidate-1')
    getOpeningSummaries(position)
    getPositionCondition(position)

    expect(position).toEqual(before)
  })

  it('preserves legacy Declined as a read-only candidate decision status', () => {
    const position = createPosition()
    position.decisions[0]!.status = 'Declined'

    expect(getCurrentCandidateStatus(position, 'candidate-1')).toBe('Declined')
    expect(getPollCandidateStatus(position, 'poll-1', 'candidate-1')).toBe('Declined')
  })

  it('derives fixture opening counts without treating an election as acceptance', () => {
    const position = createPositionFixtures()[0]!
    const openings = getOpeningSummaries(position)

    expect(position.openings).toBe(2)
    expect(position.candidates.filter((candidate) =>
      getCurrentCandidateStatus(position, candidate.id) === 'Elected',
    )).toHaveLength(1)
    expect(openings.map(({ candidate, latestResponse, filled }) => ({
      candidate: candidate?.name,
      response: latestResponse?.status ?? (candidate ? 'Awaiting response' : 'None'),
      filled,
    }))).toEqual([
      { candidate: 'Elaine Brooks', response: 'Awaiting response', filled: false },
      { candidate: undefined, response: 'None', filled: false },
    ])
    expect(getPositionCondition(position)).toBe('In Progress')
  })

  it('sorts aggregate votes descending then name, with percentages based on ballots cast', () => {
    const position = createPositionFixtures()[0]!
    const roundOne = position.polls.find((poll) => poll.id === 'p-elder-2027-1')!
    const roundTwo = position.polls.find((poll) => poll.id === 'p-elder-2027-2')!

    expect(getPollResults(roundOne).map(({ name, votes, percentage }) => [name, votes, percentage])).toEqual([
      ['Elaine Brooks', 3, 38],
      ['Marcus Hill', 2, 25],
      ['Priya Nair', 2, 25],
      ['Robert James', 1, 13],
      ['Sofia Martinez', 0, 0],
    ])
    expect(getPollResults(roundTwo).map(({ name, votes, percentage }) => [name, votes, percentage])).toEqual([
      ['Marcus Hill', 3, 75],
      ['Priya Nair', 1, 25],
    ])
  })

  it('uses zero-percent results when no ballots have been cast', () => {
    const position = createPositionFixtures()[1]!

    expect(getPollResults(position.polls[0]!)).toEqual([
      { candidateId: 'candidate-foundation-1', name: 'Candidate One', votes: 0, percentage: 0 },
    ])
  })
})
