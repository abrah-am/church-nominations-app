import { describe, expect, it } from 'vitest'
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
})
