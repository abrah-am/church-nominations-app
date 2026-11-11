import type {
  ActiveSessionSnapshot,
  PositionPollSummary,
  PositionSnapshot,
} from '../domain/types'
import { createActiveSessionFixtures, createPositionFixtures } from './position-fixtures'

export interface ExperiencePreview {
  churchName: string
  termName: string
  position: PositionSnapshot
  activeSession: ActiveSessionSnapshot
  activePoll: PositionPollSummary
  choiceCount: number
  nominationNameLimit: number
  voterOwnSubmittedNames: string[]
}

/**
 * Read-only demo context shared by Admin, Voter, and Presentation previews.
 * The sample's private ballot choices and voter identities are intentionally
 * absent; only the approved Admin aggregate snapshot is reused.
 */
export function createExperiencePreview(): ExperiencePreview {
  const position = createPositionFixtures().find(
    (item) => item.id === 'position-riverside-elder',
  )
  const activeSession = createActiveSessionFixtures()[0]?.session

  if (!position || !activeSession) {
    throw new Error('The shared experience preview fixture is incomplete.')
  }

  const activePoll = position.polls.find(
    (item) => item.id === activeSession.pollId,
  )

  if (!activePoll) {
    throw new Error('The active preview poll is missing from its position.')
  }

  return {
    churchName: 'Riverside Seventh-day Adventist Church',
    termName: '2027',
    position,
    activeSession,
    activePoll,
    choiceCount: 1,
    nominationNameLimit: 5,
    voterOwnSubmittedNames: ['Elaine Brooks', 'Marcus Hill'],
  }
}
