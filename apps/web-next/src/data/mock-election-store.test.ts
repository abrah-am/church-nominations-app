import { describe, expect, it } from 'vitest'
import { createMockElectionStore, ElectionRuleError, getActiveSession } from './mock-election-store'
import { createPositionFixtures } from './position-fixtures'
import { getOpeningSummaries } from '../domain/position-summary'

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

function createClosedVotingRound(store: ReturnType<typeof createMockElectionStore>) {
  openNomination(store)
  store.submitNomination(['M5 Candidate A', 'M5 Candidate B'])
  store.closeNominationPoll()
  store.confirmNomineeRoster()
  store.createVotingPoll(1)
  store.openVotingPoll()
  const poll = currentPoll(store, 'voting')!
  const candidateIds = [...poll.sourceCandidateIds]
  store.submitBallot([candidateIds[0]!])
  store.closeVotingPoll()
  return { pollId: poll.id, candidateIds }
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

  it('records explicit decisions, append-only linked responses, and a reviewed next-poll draft', () => {
    const store = createMockElectionStore()
    const originalPosition = store.getAdminSnapshot().position
    const originalPolls = structuredClone(originalPosition.polls)
    const originalDecisions = structuredClone(originalPosition.decisions)
    const { pollId, candidateIds } = createClosedVotingRound(store)
    const beforeDecision = store.getAdminSnapshot().position.polls.find((poll) => poll.id === pollId)!

    expect(() => store.recordCandidateDecisions(pollId, [
      { candidateId: candidateIds[0]!, status: 'Elected', openingId: `${originalPosition.id}:opening:2` },
    ])).toThrow(/one decision for every candidate/)
    expect(store.getAdminSnapshot().position.decisions).toEqual(originalDecisions)
    expect(() => Reflect.apply(store.recordCandidateDecisions, store, [pollId, [
      { candidateId: candidateIds[0], status: 'Declined' },
      { candidateId: candidateIds[1], status: 'Advanced' },
    ]])).toThrow(/Choose Elected, Advanced, or Eliminated/)

    const eventsBefore = store.getAdminSnapshot().position.decisions.length
    expect(store.getAdminSnapshot().position.polls).toHaveLength(originalPolls.length + 2)
    store.recordCandidateDecisions(pollId, [
      { candidateId: candidateIds[0]!, status: 'Elected', openingId: `${originalPosition.id}:opening:2` },
      { candidateId: candidateIds[1]!, status: 'Advanced' },
    ])
    const afterDecision = store.getAdminSnapshot().position
    const savedEvents = afterDecision.decisions.filter((event) => event.pollId === pollId)
    expect(savedEvents).toHaveLength(2)
    expect(savedEvents.find((event) => event.status === 'Elected')?.openingId)
      .toBe(`${originalPosition.id}:opening:2`)
    expect(afterDecision.decisions.slice(0, originalDecisions.length)).toEqual(originalDecisions)
    expect(afterDecision.polls.slice(0, originalPolls.length)).toEqual(originalPolls)
    const decidedPoll = afterDecision.polls.find((poll) => poll.id === pollId)!
    expect(decidedPoll.aggregateVotes).toEqual(beforeDecision.aggregateVotes)
    expect(decidedPoll.ballotsCast).toBe(beforeDecision.ballotsCast)
    expect(decidedPoll.auditEntries.at(-1)?.action).toBe('Candidate decisions recorded')
    expect(afterDecision.polls).toHaveLength(originalPolls.length + 2)
    expect(afterDecision.decisions.length).toBe(eventsBefore + 2)
    expect(() => store.recordCandidateDecisions(pollId, [
      { candidateId: candidateIds[0]!, status: 'Advanced' },
      { candidateId: candidateIds[1]!, status: 'Eliminated' },
    ])).toThrow(/cannot be overwritten/)

    const elected = savedEvents.find((event) => event.status === 'Elected')!
    store.recordCandidateResponse({
      candidateId: elected.candidateId,
      openingId: elected.openingId!,
      decisionEventId: elected.id,
      status: 'Accepted',
    })
    const afterResponse = store.getAdminSnapshot().position
    expect(afterResponse.responseEvents).toEqual([expect.objectContaining({
      candidateId: elected.candidateId,
      openingId: elected.openingId,
      decisionEventId: elected.id,
      status: 'Accepted',
    })])
    expect(getOpeningSummaries(afterResponse).find((opening) => opening.openingId === elected.openingId)?.filled)
      .toBe(true)
    expect(afterResponse.polls.find((poll) => poll.id === pollId)?.auditEntries.at(-1)?.action)
      .toBe('Candidate response recorded: Accepted')
    expect(() => store.recordCandidateResponse({
      candidateId: elected.candidateId,
      openingId: elected.openingId!,
      decisionEventId: elected.id,
      status: 'Declined',
    })).toThrow(/cannot be overwritten/)
    expect(() => Reflect.apply(store.recordCandidateResponse, store, [{
      candidateId: elected.candidateId,
      openingId: elected.openingId,
      decisionEventId: elected.id,
      status: 'Awaiting Acceptance',
    }])).toThrow(/Select Accepted or Declined/)
    expect(afterResponse.decisions).toEqual(store.getAdminSnapshot().position.decisions)
    expect(afterResponse.polls.find((poll) => poll.id === pollId)?.aggregateVotes)
      .toEqual(beforeDecision.aggregateVotes)

    const nextRoster = [candidateIds[1]!]
    expect(() => store.createNextPoll(pollId, nextRoster, 2)).toThrow(/between 1 and 1/)
    store.createNextPoll(pollId, nextRoster, 1)
    const nextPoll = store.getAdminSnapshot().position.polls.find((poll) => poll.sourcePollId === pollId)!
    expect(nextPoll).toMatchObject({
      status: 'Draft',
      choiceCount: 1,
      sourceCandidateIds: nextRoster,
      aggregateVotes: { [candidateIds[1]!]: 0 },
      ballotsCast: 0,
    })
    expect(nextPoll.auditEntries[0]?.action).toBe('Next poll created')
    expect(store.getAdminSnapshot().position.polls.slice(0, originalPolls.length)).toEqual(originalPolls)
    expect(store.getAdminSnapshot().position.polls.find((poll) => poll.id === pollId)?.aggregateVotes)
      .toEqual(beforeDecision.aggregateVotes)
    expect(JSON.stringify(store.getVoterSnapshot())).not.toMatch(/responseEvents|decisionEventId|auditEntries/)
    expect(JSON.stringify(store.getPresentationSnapshot())).not.toMatch(/responseEvents|decisionEventId|auditEntries/)
    expect(() => store.createNextPoll(pollId, nextRoster, 1)).toThrow(/already been created/)
  })

  it('requires saved decisions and an Advanced-only non-empty next-poll roster', () => {
    const store = createMockElectionStore()
    const historicalRound = store.getAdminSnapshot().position.polls.find(
      (poll) => poll.id === 'p-elder-2027-1',
    )!
    const historicalAdvanced = historicalRound.recordedDecisions
      .filter((decision) => decision.status === 'Advanced')
      .map((decision) => decision.candidateId)
    expect(() => store.createNextPoll(historicalRound.id, historicalAdvanced, 1))
      .toThrow(/already been created/)

    const { pollId, candidateIds } = createClosedVotingRound(store)
    expect(() => store.createNextPoll(pollId, [candidateIds[0]!], 1)).toThrow(/Save a complete decision set/)
    store.recordCandidateDecisions(pollId, [
      {
        candidateId: candidateIds[0]!,
        status: 'Elected',
        openingId: 'position-riverside-elder:opening:2',
      },
      { candidateId: candidateIds[1]!, status: 'Advanced' },
    ])
    expect(() => store.createNextPoll(pollId, [candidateIds[0]!], 1)).toThrow(/Advanced candidates/)
    expect(() => store.createNextPoll(pollId, [], 1)).toThrow(/Advanced candidates/)
  })
})
