import { describe, expect, it } from 'vitest'
import { createMockElectionStore, ElectionRuleError, getActiveSession } from './mock-election-store'
import { createPositionFixtures } from './position-fixtures'

function openNomination(store: ReturnType<typeof createMockElectionStore>, limit = 5) {
  store.configureNominationLimit(limit)
  store.createNominationPoll()
  store.openNominationPoll()
}

function currentPoll(store: ReturnType<typeof createMockElectionStore>, type: 'nomination' | 'voting') {
  return [...store.getAdminSnapshot().position.polls]
    .reverse()
    .find((poll) => poll.id.startsWith('m4-') && poll.type === type)
}

describe('shared mock election domain', () => {
  it('preserves accepted M2 history while adding M4 workflow polls and active-session state', () => {
    const store = createMockElectionStore()
    const historicalPosition = createPositionFixtures().find((item) => item.id === 'position-riverside-elder')!
    const initial = store.getAdminSnapshot()
    expect(initial.position).toEqual(historicalPosition)
    expect(initial.position.polls.length).toBeGreaterThan(0)
    expect(getActiveSession(initial)?.pollId).toBe('p-elder-2027-2')

    const originalPolls = structuredClone(initial.position.polls)
    expect(store.getAdminSnapshot().nominationStatus).toBe('not-created')
    expect(store.getVoterSnapshot().votingStatus).toBe('not-created')
    expect(store.getPresentationSnapshot().results).toBeNull()
    expect(() => store.configureNominationLimit(0)).toThrow(ElectionRuleError)
    expect(() => store.openNominationPoll()).toThrow(ElectionRuleError)

    store.configureNominationLimit(3)
    expect(store.getAdminSnapshot().nominationStatus).toBe('not-created')
    store.createNominationPoll()
    expect(store.getAdminSnapshot().nominationStatus).toBe('draft')
    expect(store.getAdminSnapshot().position.polls.slice(0, originalPolls.length)).toEqual(originalPolls)
    expect(initial.position.polls).toEqual(originalPolls)
    expect(getActiveSession(store.getAdminSnapshot())?.pollId).toBe('p-elder-2027-2')
    store.openNominationPoll()
    expect(getActiveSession(store.getAdminSnapshot())?.pollId).toMatch(/^m4-nomination-/)
    store.submitNomination(['M4 Candidate'])
    store.closeNominationPoll()
    expect(getActiveSession(store.getAdminSnapshot())).toBeNull()
    store.confirmNomineeRoster()
    const updatedPosition = store.getAdminSnapshot().position
    expect(updatedPosition.polls.slice(0, originalPolls.length)).toEqual(originalPolls)
    expect(updatedPosition.decisions).toEqual(historicalPosition.decisions)
    expect(updatedPosition.lifecycleEvents).toEqual(historicalPosition.lifecycleEvents)
    expect(createMockElectionStore().getAdminSnapshot().nominationStatus).toBe('not-created')
  })

  it('allows an empty intake to close but does not permit an empty nominee roster', () => {
    const store = createMockElectionStore()
    openNomination(store)
    store.closeNominationPoll()
    expect(store.getAdminSnapshot().nominationStatus).toBe('closed')
    expect(store.getVoterSnapshot().nominationStatus).toBe('closed')
    expect(() => store.confirmNomineeRoster()).toThrow(/at least one non-empty name/)
    expect(store.getAdminSnapshot().votingStatus).toBe('not-created')
  })

  it('enforces final anonymous nomination submission and manual consolidation', () => {
    const store = createMockElectionStore()
    openNomination(store, 4)
    expect(() => store.submitNomination(['A', 'B', 'C', 'D', 'E'])).toThrow(/1 to 4/)
    store.setNominationRoomVisible(true)
    store.submitNomination(['Elain Brooks', 'Elaine Brooks', 'Priya Nair', 'Aaron Z'])
    expect(() => store.submitNomination(['Another name'])).toThrow(/final/)

    const voter = store.getVoterSnapshot()
    expect(voter.ownNominationNames).toEqual(['Elain Brooks', 'Elaine Brooks', 'Priya Nair', 'Aaron Z'])
    expect(store.getAdminSnapshot().nominationSubmissions).toEqual(voter.ownNominationNames)
    expect(JSON.stringify(store.getAdminSnapshot())).not.toMatch(/submitter|participantId|voterId/i)

    expect(store.getPresentationSnapshot().nominationNames)
      .toEqual(['Aaron Z', 'Elain Brooks', 'Elaine Brooks', 'Priya Nair'])
    store.closeNominationPoll()
    const closedNames = store.getPresentationSnapshot().nominationNames
    expect(closedNames).toEqual(['Aaron Z', 'Elain Brooks', 'Elaine Brooks', 'Priya Nair'])
    expect(store.getVoterSnapshot().publishedNomineeNames).toEqual(closedNames)

    store.correctReviewedName(1, 'Elaine Brooks')
    store.removeReviewedName(2)
    expect(store.getPresentationSnapshot().nominationNames).toEqual(['Aaron Z', 'Elaine Brooks', 'Priya Nair'])
    expect(store.getVoterSnapshot().publishedNomineeNames).toEqual(['Aaron Z', 'Elaine Brooks', 'Priya Nair'])
    store.confirmNomineeRoster()
    expect(store.getAdminSnapshot().nomineeRoster).toEqual(['Aaron Z', 'Elaine Brooks', 'Priya Nair'])
    expect(store.getPresentationSnapshot().nominationNames).toEqual(['Aaron Z', 'Elaine Brooks', 'Priya Nair'])
    expect(store.getAdminSnapshot().position.candidates.filter((candidate) => candidate.id.startsWith('m4-')).map((candidate) => candidate.name))
      .toEqual(['Aaron Z', 'Elaine Brooks', 'Priya Nair'])
    expect(() => store.submitNomination(['A'])).toThrow(ElectionRuleError)
  })

  it('validates exact ballots, permits replacement only while open, and keeps aggregate controls independent', () => {
    const store = createMockElectionStore()
    openNomination(store, 4)
    store.submitNomination(['Elain Brooks', 'Elaine Brooks', 'Priya Nair', 'Aaron Z'])
    store.closeNominationPoll()
    store.correctReviewedName(1, 'Elaine Brooks')
    store.removeReviewedName(2)
    store.confirmNomineeRoster()

    expect(() => store.createVotingPoll(4)).toThrow(/between 1 and 3/)
    store.createVotingPoll(2)
    expect(store.getAdminSnapshot().votingStatus).toBe('draft')
    store.openVotingPoll()
    expect(store.getPresentationSnapshot().nominationNames).toEqual([])
    const [a, b, c] = store.getVoterSnapshot().candidates.map((candidate) => candidate.id)
    expect(a && b && c).toBeTruthy()
    expect(() => store.submitBallot([a!])).toThrow(/exactly 2/)
    expect(() => store.submitBallot([a!, a!])).toThrow(/distinct/)
    expect(() => store.submitBallot(['unlisted', b!])).toThrow(/listed candidate/)

    store.submitBallot([a!, b!])
    expect(currentPoll(store, 'voting')?.ballotsCast).toBe(1)
    expect(() => store.setResultsVisible(true)).not.toThrow()
    expect(store.getPresentationSnapshot().results?.map((result) => result.votes)).toEqual([1, 1, 0])
    expect(store.getPresentationSnapshot().ballotsCast).toBeNull()

    store.setParticipationVisible(true)
    expect(store.getPresentationSnapshot().ballotsCast).toBe(1)
    store.setResultsVisible(false)
    expect(store.getPresentationSnapshot().results).toBeNull()
    expect(store.getPresentationSnapshot().ballotsCast).toBe(1)

    store.submitBallot([b!, c!])
    const votingPoll = currentPoll(store, 'voting')!
    expect(votingPoll.ballotsCast).toBe(1)
    expect(votingPoll.aggregateVotes).toEqual({ [a!]: 0, [b!]: 1, [c!]: 1 })

    const nominationSnapshot = structuredClone(currentPoll(store, 'nomination'))
    store.closeVotingPoll()
    expect(() => store.submitBallot([a!, c!])).toThrow(/status is closed/)
    expect(currentPoll(store, 'nomination')).toEqual(nominationSnapshot)
    expect(currentPoll(store, 'voting')?.status).toBe('Closed')
  })

  it('keeps voter-only ballot data out of Admin and Presentation projections', () => {
    const store = createMockElectionStore()
    openNomination(store, 2)
    store.submitNomination(['Mina', 'Noah'])
    store.closeNominationPoll()
    store.confirmNomineeRoster()
    expect(store.getPresentationSnapshot().nominationNames).toEqual([])
    store.createVotingPoll(1)
    store.openVotingPoll()
    const candidateId = store.getVoterSnapshot().candidates[0]!.id
    store.submitBallot([candidateId])

    expect(store.getVoterSnapshot().ownBallot).toEqual([candidateId])
    expect(JSON.stringify(store.getAdminSnapshot())).not.toMatch(/ownBallot|ballotChoices|voterId|participantId/i)
    expect(JSON.stringify(store.getPresentationSnapshot())).not.toContain('"ownBallot"')
    expect(JSON.stringify(store.getPresentationSnapshot())).not.toMatch(/ownBallot|voterId|participantId/i)
  })

  it('keeps nomination list publication separate and clears it when voting starts', () => {
    const store = createMockElectionStore()
    openNomination(store, 3)
    store.submitNomination(['Zoe', 'Aaron', 'Aaron'])
    store.closeNominationPoll()
    expect(store.getPresentationSnapshot().nominationNames).toEqual([])
    const rawSubmissionHistory = currentPoll(store, 'nomination')?.nominationSubmissions
    expect(rawSubmissionHistory?.map((submission) => submission.name)).toEqual(['Zoe', 'Aaron', 'Aaron'])
    store.removeReviewedName(1)
    store.correctReviewedName(0, 'Aaron Updated')
    store.publishNominationList(true)
    expect(store.getPresentationSnapshot().nominationNames).toEqual(['Aaron Updated', 'Zoe'])
    expect(currentPoll(store, 'nomination')?.nominationSubmissions).toEqual(rawSubmissionHistory)
    store.publishNominationList(false)
    store.correctReviewedName(0, 'Aaron Revised')
    store.publishNominationList(true)
    expect(store.getPresentationSnapshot().nominationNames).toEqual(['Aaron Revised', 'Zoe'])
    expect(currentPoll(store, 'nomination')?.nominationSubmissions).toEqual(rawSubmissionHistory)
    store.confirmNomineeRoster()
    store.publishNominationList(true)
    expect(store.getPresentationSnapshot().nominationNames).toEqual(['Aaron Revised', 'Zoe'])
    store.publishNominationList(false)
    expect(store.getPresentationSnapshot().nominationNames).toEqual([])
    expect(() => store.publishNominationList(true)).not.toThrow()
    store.publishNominationList(true)
    expect(store.getPresentationSnapshot().nominationNames).toEqual(['Aaron Revised', 'Zoe'])
    store.createVotingPoll(1)
    store.openVotingPoll()
    expect(store.getPresentationSnapshot().nominationNames).toEqual([])
  })
})
