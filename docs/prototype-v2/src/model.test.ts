import { describe, expect, it } from 'vitest'
import { createInitialState, getCounts, getCurrentCandidateStatus, getOpeningSummaries, getPollCandidateStatus, getPositionCondition, getPositionLifecycle, getReplacementOptions, migrateState, type CandidateResponseEvent } from './model'

describe('prototype fixtures and aggregate counting', () => {
  it('starts with historical and preparing terms with independent position ownership', () => {
    const state = createInitialState()
    expect(state.terms.map((term) => term.status)).toEqual(['Historical', 'Preparing'])
    expect(state.positions).toHaveLength(3)
    expect(state.positions[0].submissions.map((submission) => submission.name)).toContain('Ana Williams')
    expect(state.positions[0].candidates.find((candidate) => candidate.id === 'c-anna')?.sourceSubmissionIds).toHaveLength(2)
    expect(state.positions.filter((position) => position.termId === 'term-2026')).toHaveLength(1)
    expect(state.positions.filter((position) => position.termId === 'term-2027')).toHaveLength(2)
    expect(state.activeSessionPositionId).toBe('elder-2027')
    const activePosition = state.positions.find((position) => position.id === state.activeSessionPositionId)
    expect(activePosition?.polls.map((item) => item.type)).toEqual(['nomination', 'voting', 'voting'])
    expect(activePosition?.polls.map((item) => item.status)).toEqual(['Approved', 'Closed', 'Open'])
    expect(activePosition?.polls[0].nominationSubmissions).toHaveLength(7)
    expect(activePosition?.polls[0].nominationSubmissions?.[1].name).toBe('Elain Brooks')
    expect(activePosition?.polls[0].maxNamesPerParticipant).toBe(3)
    expect(activePosition?.polls[2].sourceCandidateIds).toEqual(['c-27-marcus', 'c-27-priya'])
    expect(activePosition?.polls[2].ballots).toHaveLength(4)
    expect(getPollCandidateStatus(activePosition!, 'p-elder-2027-1', 'c-27-elaine')).toBe('Elected')
    expect(getCurrentCandidateStatus(activePosition!, 'c-27-elaine')).toBe('Elected')
    const declineRevision = { id: 'later-decline', candidateId: 'c-27-elaine', pollId: 'p-elder-2027-2', status: 'Declined' as const, decidedAt: '2026-10-27T12:00:00.000Z', decidedBy: 'Jordan Lee', note: 'Candidate declined after election.', supersedesEventId: 'decision-27-elaine-elected' }
    const revised = { ...activePosition!, decisions: [...activePosition!.decisions, declineRevision] }
    expect(getCurrentCandidateStatus(revised, 'c-27-elaine')).toBe('Declined')
    expect(getPollCandidateStatus(revised, 'p-elder-2027-1', 'c-27-elaine')).toBe('Elected')
    expect(revised.polls[1].ballots).toHaveLength(8)
  })
  it('counts aggregate choices without returning voter identities', () => {
    const poll = createInitialState().positions[0].polls[0]
    expect(getCounts(poll)).toEqual({ 'c-anna': 3, 'c-david': 1, 'c-maria': 1, 'c-james': 1 })
    expect(poll.ballots[0]).not.toHaveProperty('voter')
  })
  it('migrates saved flat state without resetting election records', () => {
    const original = createInitialState()
    const legacy = { positions: original.positions.map(({ termId: _termId, departmentId: _departmentId, ...position }) => position), selectedPositionId: 'elder', audit: [] }
    const migrated = migrateState(legacy)
    expect(migrated.positions[0].id).toBe('elder')
    expect(migrated.positions[0].polls[0].id).toBe('p-elder-1')
    expect(migrated.positions[0].polls[0].type).toBe('voting')
    expect(migrated.positions[0].polls[0].ballots).toHaveLength(6)
    expect(migrated.positions[0].termId).toBe('term-2026')
    expect(migrated.selectedPositionId).toBe('treasurer')
    expect(migrated.activeSessionPositionId).toBe('treasurer')
  })

  it('derives awaiting acceptance, ready-to-finalize, and refuses readiness while any poll is open', () => {
    const position = structuredClone(createInitialState().positions.find((item) => item.id === 'elder-2027')!)
    position.polls[2].status = 'Closed'
    const openings = getOpeningSummaries(position)
    position.openings = 1
    expect(getPositionCondition(position)).toBe('Awaiting Acceptance')
    position.responseEvents = [{ id: 'accept-ready', candidateId: openings[0].candidate!.id, openingId: openings[0].openingId, status: 'Accepted', respondedAt: '2026-10-28T12:00:00.000Z', recordedBy: 'Admin', note: '' }]
    expect(getPositionCondition({ ...position, openings: 2 })).toBe('Vacancy')
    expect(getPositionCondition(position)).toBe('Ready to Finalize')
    position.polls[2].status = 'Open'
    expect(getPositionCondition(position)).toBe('In Progress')
  })

  it('keeps accepted and later declined response events and derives finalized vacancy without reopening', () => {
    const position = structuredClone(createInitialState().positions.find((item) => item.id === 'elder-2027')!)
    position.openings = 1
    position.polls[2].status = 'Closed'
    const opening = getOpeningSummaries(position)[0]
    const accepted: CandidateResponseEvent = { id: 'response-accepted', candidateId: opening.candidate!.id, openingId: opening.openingId, status: 'Accepted', respondedAt: '2026-10-27T12:00:00.000Z', recordedBy: 'Admin', note: '' }
    position.responseEvents = [accepted]
    position.lifecycleEvents = [{ id: 'finalized', status: 'Finalized', at: '2026-10-28T12:00:00.000Z', actor: 'Admin', detail: 'Position finalized.' }]
    position.responseEvents.push({ id: 'response-later-declined', candidateId: accepted.candidateId, openingId: accepted.openingId, status: 'Declined', respondedAt: '2026-10-29T12:00:00.000Z', recordedBy: 'Admin', note: 'Later decline recorded.' })
    expect(position.lifecycleEvents.at(-1)?.status).toBe('Finalized')
    expect(getPositionLifecycle(position)).toBe('Finalized')
    expect(getPositionCondition(position)).toBe('Vacancy')
    expect(position.responseEvents.map((event) => event.status)).toEqual(['Accepted', 'Declined'])
    expect(position.decisions.find((event) => event.candidateId === accepted.candidateId)?.status).toBe('Elected')
  })

  it('selects replacement candidates from the electing poll and surfaces top ties without electing or drafting', () => {
    const position = structuredClone(createInitialState().positions.find((item) => item.id === 'elder-2027')!)
    const result = getReplacementOptions(position, 'c-27-elaine')
    expect(result.sourcePoll?.id).toBe('p-elder-2027-1')
    expect(result.options.map((option) => option.candidateId)).toEqual(['c-27-marcus', 'c-27-priya'])
    expect(result.topTie).toEqual(['c-27-marcus', 'c-27-priya'])
    expect(position.polls).toHaveLength(3)
    expect(position.decisions.filter((event) => event.candidateId === 'c-27-marcus')).toHaveLength(1)
  })
})