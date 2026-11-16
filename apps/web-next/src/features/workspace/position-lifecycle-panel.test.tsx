import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { MockElectionProvider } from '../../data/mock-election-provider'
import { createMockElectionStore } from '../../data/mock-election-store'
import type { PositionSnapshot } from '../../domain/types'
import { InteractiveVoterView } from '../voter/interactive-voter-view'
import { PositionLifecyclePanel } from './position-lifecycle-panel'

function acceptedPosition(): PositionSnapshot {
  return {
    id: 'position-ui',
    churchId: 'church-1',
    termId: 'term-1',
    departmentId: 'department-1',
    name: 'Deacon',
    openings: 1,
    candidates: [
      { id: 'elected', name: 'Accepted Candidate' },
      { id: 'next', name: 'Next Candidate' },
    ],
    polls: [{
      id: 'round-1',
      type: 'voting',
      number: 1,
      title: 'Round 1',
      status: 'Closed',
      sourceCandidateIds: ['elected', 'next'],
      candidateNames: { elected: 'Accepted Candidate', next: 'Next Candidate' },
      aggregateVotes: { elected: 3, next: 1 },
      ballotsCast: 3,
      recordedDecisions: [],
      nominationSubmissions: [],
      auditEntries: [],
    }],
    decisions: [
      { id: 'd1', candidateId: 'elected', pollId: 'round-1', status: 'Elected', openingId: 'position-ui:opening:1', decidedAt: '2026-04-01T00:00:00.000Z' },
      { id: 'd2', candidateId: 'next', pollId: 'round-1', status: 'Advanced', decidedAt: '2026-04-01T00:00:00.000Z' },
    ],
    responseEvents: [{
      id: 'r1',
      candidateId: 'elected',
      openingId: 'position-ui:opening:1',
      decisionEventId: 'd1',
      status: 'Accepted',
      respondedAt: '2026-04-02T00:00:00.000Z',
    }],
    lifecycleEvents: [],
  }
}

describe('M5b lifecycle panel', () => {
  it('requires confirmation before finalizing and neutralizes the participant view', async () => {
    const user = userEvent.setup()
    const store = createMockElectionStore(acceptedPosition())
    render(
      <MockElectionProvider store={store}>
        <PositionLifecyclePanel />
        <InteractiveVoterView />
      </MockElectionProvider>,
    )

    expect(screen.getByRole('button', { name: 'Finalize position' })).toBeDisabled()
    await user.click(screen.getByRole('checkbox', { name: 'I confirm finalizing this position.' }))
    await user.click(screen.getByRole('button', { name: 'Finalize position' }))

    expect(screen.getByRole('heading', { name: 'This position is complete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit nominations' })).not.toBeInTheDocument()
    expect(store.getPresentationSnapshot().results).toBeNull()
    expect(screen.getByRole('button', { name: 'Reopen position' })).toBeDisabled()
  })
})
