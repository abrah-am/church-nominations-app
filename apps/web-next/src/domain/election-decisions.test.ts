import { describe, expect, it } from 'vitest'
import { createPositionFixtures } from '../data/position-fixtures'
import { getMajorityGuidance, validateDecisionSet } from './election-decisions'
import type { PositionPollSummary } from './types'

describe('M5a election decision rules', () => {
  it('calculates strict majority from ballots cast without recording an outcome', () => {
    const position = createPositionFixtures()[0]!
    const decisionsBefore = structuredClone(position.decisions)
    const poll = structuredClone(position.polls[0]!)
    poll.ballotsCast = 8
    poll.aggregateVotes = {
      'c-27-elaine': 4,
      'c-27-marcus': 3,
      'c-27-priya': 1,
      'c-27-robert': 0,
      'c-27-sofia': 0,
    }

    expect(getMajorityGuidance(poll)).toEqual({
      ballotsCast: 8,
      requiredVotes: 5,
      qualifiedCandidateIds: [],
    })
    expect(position.decisions).toEqual(decisionsBefore)
  })

  it('requires a complete unique decision set for a closed voting poll', () => {
    const position = createPositionFixtures()[0]!
    const poll: PositionPollSummary = {
      ...structuredClone(position.polls[1]!),
      status: 'Closed',
      recordedDecisions: [],
    }
    const errors = validateDecisionSet(position, poll, [
      { candidateId: 'c-27-marcus', status: 'Advanced' },
    ])

    expect(errors).toContain('Choose exactly one decision for every candidate in this poll.')
    expect(errors).toContain('Choose Elected, Advanced, or Eliminated for every listed candidate.')
    expect(validateDecisionSet(position, { ...poll, status: 'Open' }, [
      { candidateId: 'c-27-marcus', status: 'Advanced' },
      { candidateId: 'c-27-priya', status: 'Eliminated' },
    ])).toContain('Close the voting poll before recording candidate decisions.')
  })

  it('enforces opening cap and unique available opening assignment', () => {
    const position = createPositionFixtures()[0]!
    const poll: PositionPollSummary = {
      ...structuredClone(position.polls[1]!),
      status: 'Closed',
      recordedDecisions: [],
    }

    expect(validateDecisionSet(position, poll, [
      { candidateId: 'c-27-marcus', status: 'Elected', openingId: 'position-riverside-elder:opening:2' },
      { candidateId: 'c-27-priya', status: 'Elected', openingId: 'position-riverside-elder:opening:2' },
    ])).toEqual(expect.arrayContaining([
      expect.stringContaining('At most 1 additional candidate'),
      'Each Elected candidate must be assigned to a different opening.',
    ]))
  })

  it('requires an elected candidate or at least two candidates to advance', () => {
    const position = createPositionFixtures()[0]!
    const poll: PositionPollSummary = {
      ...structuredClone(position.polls[1]!),
      status: 'Closed',
      recordedDecisions: [],
    }

    const insufficientAdvancement = validateDecisionSet(position, poll, [
      { candidateId: 'c-27-marcus', status: 'Advanced' },
      { candidateId: 'c-27-priya', status: 'Eliminated' },
    ])
    expect(insufficientAdvancement)
      .toContain('Record at least one Elected candidate or advance at least two candidates.')

    const sufficientAdvancement = validateDecisionSet(position, poll, [
      { candidateId: 'c-27-marcus', status: 'Advanced' },
      { candidateId: 'c-27-priya', status: 'Advanced' },
    ])
    expect(sufficientAdvancement)
      .not.toContain('Record at least one Elected candidate or advance at least two candidates.')
  })

  it('does not qualify candidates when there are no ballots', () => {
    const poll = createPositionFixtures()[1]!.polls[0]!
    expect(getMajorityGuidance(poll)).toEqual({
      ballotsCast: 0,
      requiredVotes: 1,
      qualifiedCandidateIds: [],
    })
  })
})
