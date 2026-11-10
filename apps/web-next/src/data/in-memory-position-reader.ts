import type { ActiveSessionSnapshot, PositionSnapshot } from '../domain/types'
import { createActiveSessionFixtures, createPositionFixtures } from './position-fixtures'
import { PositionDataError, type PositionReader } from './position-reader'

function clonePosition(position: PositionSnapshot): PositionSnapshot {
  return structuredClone(position)
}

export function createInMemoryPositionReader(
  initialSnapshots: readonly PositionSnapshot[] = createPositionFixtures(),
  initialSessions: readonly {
    churchId: string
    termId: string
    session: ActiveSessionSnapshot
  }[] = createActiveSessionFixtures(),
): PositionReader {
  const snapshots = initialSnapshots.map(clonePosition)
  const sessions = structuredClone(initialSessions)

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
    async getActiveSession(query) {
      const session = sessions.find(
        (item) => item.churchId === query.churchId && item.termId === query.termId,
      )
      if (!session) return null
      if (
        session.session.churchId !== query.churchId
        || session.session.termId !== query.termId
      ) {
        throw new PositionDataError(
          'ACTIVE_SESSION_SCOPE_MISMATCH',
          'No active session exists within the requested church and term.',
        )
      }
      return structuredClone(session.session)
    },
  }
}
