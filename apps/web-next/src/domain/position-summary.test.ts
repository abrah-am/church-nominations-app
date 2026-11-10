import { describe, expect, it } from 'vitest'
import { getCurrentCandidateStatus, getOpeningSummaries, getPollCandidateStatus, getPositionCondition, getPositionLifecycle } from './position-summary'
import type { PositionSnapshot } from './types'

function createPosition(): PositionSnapshot {
  return {
    id: 'position-1',
    churchId: 'church-1',
    termId: 'term-1',
    openings: 1,
    candidates: [{ id: 'candidate-1', name: 'Candidate One' }],
    polls: [{ id: 'poll-1', status: 'Closed' }, { id: 'poll-2', status: 'Closed' }],
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
        status: 'Accepted',
        respondedAt: '2026-01-03T12:00:00.000Z',
      },
    ]

    expect(getPositionCondition(position)).toBe('Ready to Finalize')
    expect(getCurrentCandidateStatus(position, 'candidate-1')).toBe('Elected')
  })

  it('gates readiness while any poll is open', () => {
    const position = createPosition()
    position.responseEvents = [
      {
        id: 'response-accepted',
        candidateId: 'candidate-1',
        openingId: 'position-1:opening:1',
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
        status: 'Accepted',
        respondedAt: '2026-01-03T12:00:00.000Z',
      },
      {
        id: 'response-declined',
        candidateId: 'candidate-1',
        openingId: 'position-1:opening:1',
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
})
