import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MockElectionProvider } from '../../data/mock-election-provider'
import { createMockElectionStore } from '../../data/mock-election-store'
import { getOpeningSummaries } from '../../domain/position-summary'
import { ElectionDecisionsPanel } from './election-decisions-panel'

function setupClosedRound() {
  const store = createMockElectionStore()
  store.configureNominationLimit(5)
  store.createNominationPoll()
  store.openNominationPoll()
  store.submitNomination(['First Candidate', 'Second Candidate'])
  store.closeNominationPoll()
  store.confirmNomineeRoster()
  store.createVotingPoll(1)
  store.openVotingPoll()
  const poll = [...store.getAdminSnapshot().position.polls]
    .reverse()
    .find((item) => item.type === 'voting' && item.id.startsWith('m4-'))!
  const candidateIds = [...poll.sourceCandidateIds]
  store.submitBallot([candidateIds[0]!])
  store.closeVotingPoll()
  return { store, pollId: poll.id, candidateIds }
}

describe('M5a Admin decision and response interface', () => {
  it('keeps majority guidance separate from explicit decisions and requires next-poll review', async () => {
    const user = userEvent.setup()
    const { store, pollId, candidateIds } = setupClosedRound()
    render(
      <MockElectionProvider store={store}>
        <ElectionDecisionsPanel />
      </MockElectionProvider>,
    )

    expect(screen.getByText(/Qualified for Admin review: First Candidate/)).toBeInTheDocument()
    expect(store.getAdminSnapshot().position.decisions.filter((event) => event.pollId === pollId)).toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Record one explicit decision per candidate' })).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: 'First Candidate decision' }), 'Elected')
    await user.selectOptions(screen.getByRole('combobox', { name: 'First Candidate opening' }), 'position-riverside-elder:opening:2')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Second Candidate decision' }), 'Advanced')
    const saveButton = screen.getByRole('button', { name: 'Save confirmed decisions' })
    expect(saveButton).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: /I reviewed and explicitly confirm/ }))
    await user.click(saveButton)

    expect(await screen.findByRole('heading', { name: 'Saved decisions (history)' })).toBeInTheDocument()
    expect(store.getAdminSnapshot().position.decisions.filter((event) => event.pollId === pollId)).toHaveLength(2)
    const nextPollHeading = screen.getByRole('heading', { name: 'Create Next Poll' })
    const nextPollSection = nextPollHeading.closest('section')!
    const nextRoster = within(nextPollSection).getByRole('checkbox', { name: 'Second Candidate' })
    expect(within(nextPollSection).getByRole('spinbutton', { name: 'Exact distinct choices per ballot' }))
      .toHaveValue(1)
    expect(nextRoster).toBeChecked()
    await user.click(nextRoster)
    expect(nextRoster).not.toBeChecked()
    await user.click(nextRoster)
    const voterBeforeNextPoll = store.getVoterSnapshot()
    await user.click(within(nextPollSection).getByRole('checkbox', { name: /I reviewed and confirm this next-poll roster/ }))
    await user.click(within(nextPollSection).getByRole('button', { name: 'Confirm and create next poll' }))

    const nextPoll = store.getAdminSnapshot().position.polls.find((poll) => poll.sourcePollId === pollId)
    expect(nextPoll).toMatchObject({
      status: 'Draft',
      sourceCandidateIds: [candidateIds[1]],
      aggregateVotes: { [candidateIds[1]!]: 0 },
      ballotsCast: 0,
    })
    expect(await screen.findByRole('status')).toHaveTextContent('Next poll created as a fresh draft')
    expect(store.getVoterSnapshot()).toEqual(voterBeforeNextPoll)
  })

  it('records an Accepted response against its elected decision and derives Filled status', async () => {
    const user = userEvent.setup()
    const store = createMockElectionStore()
    render(
      <MockElectionProvider store={store}>
        <ElectionDecisionsPanel />
      </MockElectionProvider>,
    )

    expect(screen.queryByRole('heading', { name: 'Create Next Poll' })).not.toBeInTheDocument()
    const firstOpening = screen.getByRole('heading', { name: 'Opening 1' }).closest('article')!
    expect(within(firstOpening).getByText('Awaiting Acceptance')).toBeInTheDocument()
    await user.selectOptions(screen.getByRole('combobox', { name: 'Candidate response for Elaine Brooks' }), 'Accepted')
    await user.click(screen.getByRole('button', { name: 'Record candidate response' }))

    expect(await within(firstOpening).findByText('Filled · Accepted')).toBeInTheDocument()
    expect(store.getAdminSnapshot().position.responseEvents).toHaveLength(1)
    const response = store.getAdminSnapshot().position.responseEvents[0]!
    const decision = store.getAdminSnapshot().position.decisions.find((event) => event.id === response.decisionEventId)
    expect(decision).toMatchObject({
      id: response.decisionEventId,
      candidateId: response.candidateId,
      status: 'Elected',
    })
    expect(response.openingId).toBe('position-riverside-elder:opening:1')
    expect(JSON.stringify(store.getVoterSnapshot())).not.toContain('Accepted')
    expect(JSON.stringify(store.getPresentationSnapshot())).not.toContain('decisionEventId')
  })

  it('records a Declined response without filling the assigned opening', async () => {
    const user = userEvent.setup()
    const store = createMockElectionStore()
    render(
      <MockElectionProvider store={store}>
        <ElectionDecisionsPanel />
      </MockElectionProvider>,
    )

    const firstOpening = screen.getByRole('heading', { name: 'Opening 1' }).closest('article')!
    await user.selectOptions(screen.getByRole('combobox', { name: 'Candidate response for Elaine Brooks' }), 'Declined')
    await user.click(screen.getByRole('button', { name: 'Record candidate response' }))

    expect(await within(firstOpening).findByText('Vacancy · Declined')).toBeInTheDocument()
    expect(getOpeningSummaries(store.getAdminSnapshot().position).find((opening) =>
      opening.openingId === 'position-riverside-elder:opening:1')?.filled).toBe(false)
    expect(store.getAdminSnapshot().position.responseEvents).toEqual([
      expect.objectContaining({ status: 'Declined', candidateId: 'c-27-elaine' }),
    ])
    expect(store.getAdminSnapshot().position.decisions).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'Elected', candidateId: 'c-27-elaine' })]),
    )
  })
})
