import { describe, expect, it } from 'vitest'
import { createExperiencePreview } from './experience-preview'

describe('shared experience preview', () => {
  it('uses the existing active-session and position fixtures consistently', () => {
    const preview = createExperiencePreview()

    expect(preview.activeSession.positionId).toBe(preview.position.id)
    expect(preview.activeSession.pollId).toBe(preview.activePoll.id)
    expect(preview.activePoll.status).toBe('Open')
    expect(preview.activePoll.ballotsCast).toBe(4)
    expect(preview.activePoll.aggregateVotes).toEqual({
      'c-27-marcus': 3,
      'c-27-priya': 1,
    })
    expect(preview.choiceCount).toBe(1)
  })

  it('contains no individual ballot selections or voter identity fields', () => {
    const serializedPreview = JSON.stringify(createExperiencePreview())

    expect(serializedPreview).not.toMatch(/voterId|voterName|submitterId/i)
    expect(serializedPreview).not.toContain('selections')
    expect(createExperiencePreview().activePoll).not.toHaveProperty('ballots')
  })

  it('returns an isolated mock snapshot for each preview consumer', () => {
    const first = createExperiencePreview()
    const second = createExperiencePreview()

    first.activePoll.aggregateVotes['c-27-marcus'] = 99

    expect(second.activePoll.aggregateVotes['c-27-marcus']).toBe(3)
  })
})
