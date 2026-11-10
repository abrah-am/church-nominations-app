import { describe, expect, it } from 'vitest'
import { createActiveSessionFixtures } from './position-fixtures'
import { runPositionReaderContract } from './position-reader.contract'
import { createInMemoryPositionReader } from './in-memory-position-reader'

const query = {
  churchId: 'church-foundation',
  termId: 'term-foundation',
  positionId: 'position-foundation-1',
}

runPositionReaderContract('in-memory', createInMemoryPositionReader, query)

describe('in-memory position reader fixture isolation', () => {
  it('creates deterministic independent fixture instances', async () => {
    const firstReader = createInMemoryPositionReader()
    const secondReader = createInMemoryPositionReader()

    const first = await firstReader.getPosition(query)
    const second = await secondReader.getPosition(query)
    if (first.candidates[0]) first.candidates[0].name = 'Mutated fixture copy'

    expect(second.candidates[0]?.name).toBe('Candidate One')
    expect(await secondReader.getPosition(query)).toEqual(second)
  })

  it('scopes the independently read active session to church and term', async () => {
    const reader = createInMemoryPositionReader()

    const activeQuery = {
      churchId: 'church-riverside',
      termId: 'term-riverside-2027',
    }
    const first = await reader.getActiveSession(activeQuery)
    expect(first).toMatchObject({
      churchId: 'church-riverside',
      termId: 'term-riverside-2027',
      positionId: 'position-riverside-elder',
    })
    if (first) first.positionName = 'Mutated session copy'
    await expect(reader.getActiveSession(activeQuery)).resolves.toMatchObject({
      positionName: 'Church Elder',
    })
    await expect(reader.getActiveSession({
      churchId: 'church-foundation',
      termId: 'term-foundation',
    })).resolves.toBeNull()
    await expect(reader.getActiveSession({
      churchId: 'other-church',
      termId: 'term-riverside-2027',
    })).resolves.toBeNull()
  })

  it('rejects a session snapshot whose embedded scope disagrees with its reader scope', async () => {
    const session = createActiveSessionFixtures()[0]!
    const reader = createInMemoryPositionReader([], [{
      ...session,
      session: { ...session.session, termId: 'term-other' },
    }])

    await expect(reader.getActiveSession({
      churchId: 'church-riverside',
      termId: 'term-riverside-2027',
    })).rejects.toMatchObject({
      name: 'PositionDataError',
      code: 'ACTIVE_SESSION_SCOPE_MISMATCH',
    })
  })
})
