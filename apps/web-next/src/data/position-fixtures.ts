import type { PositionSnapshot } from '../domain/types'

/** Returns deterministic, isolated fixture data; all values are synthetic. */
export function createPositionFixtures(): PositionSnapshot[] {
  return [
    {
      id: 'position-foundation-1',
      churchId: 'church-foundation',
      termId: 'term-foundation',
      openings: 1,
      candidates: [{ id: 'candidate-foundation-1', name: 'Candidate One' }],
      polls: [
        { id: 'poll-foundation-1', status: 'Closed' },
        { id: 'poll-foundation-2', status: 'Open' },
      ],
      decisions: [
        {
          id: 'decision-foundation-1',
          candidateId: 'candidate-foundation-1',
          pollId: 'poll-foundation-1',
          status: 'Elected',
          decidedAt: '2026-01-02T12:00:00.000Z',
        },
      ],
      responseEvents: [],
      lifecycleEvents: [],
    },
  ]
}
