import type { PositionSnapshot } from '../domain/types'
import { createPositionFixtures } from './position-fixtures'
import { PositionDataError, type PositionReader } from './position-reader'

function clonePosition(position: PositionSnapshot): PositionSnapshot {
  return structuredClone(position)
}

export function createInMemoryPositionReader(
  initialSnapshots: readonly PositionSnapshot[] = createPositionFixtures(),
): PositionReader {
  const snapshots = initialSnapshots.map(clonePosition)

  return {
    async getPosition(query) {
      const position = snapshots.find(
        (item) =>
          item.id === query.positionId &&
          item.churchId === query.churchId &&
          item.termId === query.termId,
      )

      if (!position) {
        throw new PositionDataError(
          'POSITION_NOT_FOUND',
          'No position exists for the requested church, term, and position.',
        )
      }

      return clonePosition(position)
    },
  }
}
