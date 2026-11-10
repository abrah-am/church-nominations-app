import type { ActiveSessionSnapshot, PositionSnapshot } from '../domain/types'

export interface PositionQuery {
  churchId: string
  termId: string
  positionId: string
}

export interface ActiveSessionQuery {
  churchId: string
  termId: string
}

export interface PositionReader {
  getPosition(query: PositionQuery): Promise<PositionSnapshot>
  getActiveSession(query: ActiveSessionQuery): Promise<ActiveSessionSnapshot | null>
}

export type PositionDataErrorCode = 'POSITION_NOT_FOUND' | 'ACTIVE_SESSION_SCOPE_MISMATCH'

export class PositionDataError extends Error {
  readonly code: PositionDataErrorCode

  constructor(code: PositionDataErrorCode, message: string) {
    super(message)
    this.name = 'PositionDataError'
    this.code = code
  }
}
