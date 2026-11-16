import { describe, expect, it } from 'vitest'
import { getDirectReplacementRecommendation, getHistoricalReplacementNames } from './replacement-rules'
import type { PositionSnapshot } from './types'

function position(): PositionSnapshot {
  return {
    id: 'position-1',
    churchId: 'church-1',
    termId: 'term-1',
    departmentId: 'department-1',
    name: 'Elder',
    openings: 2,
    candidates: [
      { id: 'declined', name: 'Declined Person' },
      { id: 'top', name: 'Top Candidate' },
      { id: 'tied', name: 'Tied Candidate' },
      { id: 'lower', name: 'Lower Candidate' },
      { id: 'eliminated', name: 'Eliminated Candidate' },
      { id: 'other-opening', name: 'Other Opening' },
    ],
    polls: [{
      id: 'round-1',
      type: 'voting',
      number: 1,
      title: 'Round 1',
      status: 'Closed',
      sourceCandidateIds: ['declined', 'top', 'tied', 'lower', 'eliminated', 'other-opening'],
      candidateNames: {
        declined: 'Declined Person',
        top: 'Top Candidate',
        tied: 'Tied Candidate',
        lower: 'Lower Candidate',
        eliminated: 'Eliminated Candidate',
        'other-opening': 'Other Opening',
      },
      aggregateVotes: { declined: 5, top: 4, tied: 4, lower: 1, eliminated: 3, 'other-opening': 4 },
      ballotsCast: 9,
      recordedDecisions: [],
      nominationSubmissions: [{ id: 'sub-1', name: 'Historical Nominee', submittedAt: '2026-01-01T00:00:00.000Z' }],
      auditEntries: [],
    }],
    decisions: [
      { id: 'elected', candidateId: 'declined', pollId: 'round-1', status: 'Elected', openingId: 'position-1:opening:1', decidedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'advanced-top', candidateId: 'top', pollId: 'round-1', status: 'Advanced', decidedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'advanced-tied', candidateId: 'tied', pollId: 'round-1', status: 'Advanced', decidedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'advanced-lower', candidateId: 'lower', pollId: 'round-1', status: 'Advanced', decidedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'eliminated-event', candidateId: 'eliminated', pollId: 'round-1', status: 'Eliminated', decidedAt: '2026-02-01T00:00:00.000Z' },
      { id: 'other-elected', candidateId: 'other-opening', pollId: 'round-1', status: 'Elected', openingId: 'position-1:opening:2', decidedAt: '2026-02-01T00:00:00.000Z' },
    ],
    responseEvents: [{
      id: 'response-declined',
      candidateId: 'declined',
      openingId: 'position-1:opening:1',
      decisionEventId: 'elected',
      status: 'Declined',
      respondedAt: '2026-02-02T00:00:00.000Z',
    }],
    lifecycleEvents: [],
  }
}

describe('direct replacement recommendations', () => {
  it('ranks eligible Advanced candidates and recommends a unique top', () => {
    const snapshot = position()
    snapshot.decisions = snapshot.decisions.filter((event) => event.candidateId !== 'tied')
    snapshot.polls[0]!.aggregateVotes['top'] = 6

    const recommendation = getDirectReplacementRecommendation(snapshot, 'position-1:opening:1')

    expect(recommendation.outcome).toBe('unique')
    expect(recommendation.candidateIds).toEqual(['top'])
    expect(recommendation.ranked.map((candidate) => candidate.candidateId)).toEqual(['top', 'lower'])
  })

  it('requires a tie-break when the highest eligible candidates have equal votes', () => {
    const snapshot = position()
    snapshot.polls[0]!.aggregateVotes['top'] = 4
    snapshot.polls[0]!.aggregateVotes['tied'] = 4
    snapshot.polls[0]!.aggregateVotes['other-opening'] = 9

    const recommendation = getDirectReplacementRecommendation(snapshot, 'position-1:opening:1')

    expect(recommendation.outcome).toBe('tie')
    expect(recommendation.candidateIds).toEqual(['tied', 'top'])
    expect(recommendation.ranked.map((candidate) => candidate.candidateId)).not.toContain('eliminated')
    expect(recommendation.ranked.map((candidate) => candidate.candidateId)).not.toContain('other-opening')
    expect(recommendation.ranked.map((candidate) => candidate.candidateId)).not.toContain('declined')
  })

  it('does not use a voided or non-associated round', () => {
    const snapshot = position()
    snapshot.polls[0]!.voided = true
    snapshot.polls.push({
      ...snapshot.polls[0]!,
      id: 'other-round',
      number: 2,
      voided: false,
      aggregateVotes: { top: 9 },
    })

    expect(getDirectReplacementRecommendation(snapshot, 'position-1:opening:1').outcome).toBe('unavailable')
  })

  it('keeps every historical name available for a manual roster', () => {
    const names = getHistoricalReplacementNames(position())
    expect(names).toContain('Eliminated Candidate')
    expect(names).toContain('Declined Person')
    expect(names).toContain('Historical Nominee')
  })

  it('reports an empty historical source without inventing names', () => {
    const snapshot = position()
    snapshot.candidates = []
    snapshot.polls = []
    expect(getHistoricalReplacementNames(snapshot)).toEqual([])
  })
})
