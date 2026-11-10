import type { PositionSnapshot } from '../domain/types'

export interface PositionQuery {
  churchId: string
  termId: string
  positionId: string
}

export interface PositionReader {
  getPosition(query: PositionQuery): Promise<PositionSnapshot>
}

export type PositionDataErrorCode = 'POSITION_NOT_FOUND'

export class PositionDataError extends Error {
  readonly code: PositionDataErrorCode

  constructor(code: PositionDataErrorCode, message: string) {
    super(message)
    this.name = 'PositionDataError'
    this.code = code
  }
}
