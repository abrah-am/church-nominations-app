import { describe, expect, it } from 'vitest'
import type { PositionReader } from './position-reader'
import { PositionDataError, type PositionQuery } from './position-reader'

export function runPositionReaderContract(
  name: string,
  createReader: () => PositionReader,
  query: PositionQuery,
): void {
  describe(`${name} position reader contract`, () => {
    it('returns the requested snapshot asynchronously and within its church/term scope', async () => {
      const reader = createReader()
      const result = await reader.getPosition(query)

      expect(result).toMatchObject({
        id: query.positionId,
        churchId: query.churchId,
        termId: query.termId,
      })
    })

    it('rejects missing or out-of-scope data with a typed error', async () => {
      const reader = createReader()

      await expect(
        reader.getPosition({ ...query, churchId: 'other-church' }),
      ).rejects.toMatchObject<Partial<PositionDataError>>({
        name: 'PositionDataError',
        code: 'POSITION_NOT_FOUND',
      })
      await expect(
        reader.getPosition({ ...query, positionId: 'missing-position' }),
      ).rejects.toBeInstanceOf(PositionDataError)
    })

    it('returns independent snapshots that cannot mutate stored fixture data', async () => {
      const reader = createReader()
      const first = await reader.getPosition(query)
      const originalName = first.candidates[0]?.name
      const originalPollCount = first.polls.length

      if (first.candidates[0]) first.candidates[0].name = 'Mutated by caller'
      first.polls.pop()
      first.decisions.splice(0)

      const second = await reader.getPosition(query)
      expect(second.candidates[0]?.name).toBe(originalName)
      expect(second.polls).toHaveLength(originalPollCount)
      expect(second.decisions).toHaveLength(1)
    })

    it('does not expose ballot or credential fields in returned data', async () => {
      const result = await createReader().getPosition(query)
      const fieldNames = collectFieldNames(result)

      expect(fieldNames).not.toContain('ballots')
      expect(fieldNames).not.toContain('ballot')
      expect(fieldNames).not.toContain('credentials')
      expect(fieldNames).not.toContain('credential')
    })

    it('does not expose voter or submitter identity fields in returned data', async () => {
      const result = await createReader().getPosition(query)
      const fieldNames = collectFieldNames(result)
      const prohibitedIdentityFields = [
        'voter',
        'voterId',
        'voterName',
        'voterIdentity',
        'submitter',
        'submitterId',
        'submitterName',
        'submitterIdentity',
        'submittedBy',
        'participantId',
        'participantName',
      ]

      // These explicit names do not prohibit legitimate admin attribution
      // fields such as decidedBy, recordedBy, invitedBy, or lifecycle actor.
      for (const field of prohibitedIdentityFields) {
        expect(fieldNames).not.toContain(field)
      }
    })
  })
}

function collectFieldNames(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectFieldNames)
  if (value === null || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectFieldNames(child),
  ])
}
