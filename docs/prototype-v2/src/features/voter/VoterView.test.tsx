import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import VoterView from './VoterView'
import { createInitialState, STORAGE_KEY } from '../../model'
import { StateProvider } from '../../state/StateProvider'

afterEach(cleanup)
beforeEach(() => localStorage.removeItem(STORAGE_KEY))

describe('Voter ballot candidate snapshots', () => {
  it('displays the approved voting-poll name snapshot rather than later position names', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const poll = position.polls.find((item) => item.id === 'p-elder-2027-2')!
    poll.candidateNames = { 'c-27-marcus': 'Marcus Approved Snapshot', 'c-27-priya': 'Priya Approved Snapshot' }
    position.candidates.find((candidate) => candidate.id === 'c-27-marcus')!.name = 'Marcus Later Edit'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    render(<StateProvider><VoterView /></StateProvider>)

    expect(screen.getByRole('radio', { name: 'Marcus Approved Snapshot' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'Priya Approved Snapshot' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Marcus Later Edit' })).not.toBeInTheDocument()
  })
})
