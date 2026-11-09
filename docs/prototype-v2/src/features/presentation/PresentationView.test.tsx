import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import PresentationView from './PresentationView'
import { StateProvider } from '../../state/StateProvider'
import { createInitialState, STORAGE_KEY } from '../../model'

afterEach(cleanup)
beforeEach(() => localStorage.removeItem(STORAGE_KEY))

describe('Presentation results', () => {
  it('orders tied results by candidate name and uses rounded ballots-cast percentages', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const poll = position.polls.find((item) => item.id === 'p-elder-2027-1')!
    poll.ballots = [
      { id: 'tie-1', selections: ['c-27-marcus'] },
      { id: 'tie-2', selections: ['c-27-marcus'] },
      { id: 'tie-3', selections: ['c-27-elaine'] },
      { id: 'tie-4', selections: ['c-27-elaine'] },
      { id: 'tie-5', selections: ['c-27-priya'] },
      { id: 'tie-6', selections: ['c-27-robert'] },
    ]
    state.activeSessionPollId = poll.id
    state.viewedPollIds[position.id] = poll.id
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))

    render(<StateProvider><PresentationView /></StateProvider>)

    const results = screen.getAllByRole('img').filter((result) => result.hasAttribute('aria-label'))
    expect(results.map((result) => result.getAttribute('aria-label'))).toEqual([
      'Elaine Brooks: 2 votes, 33% of ballots cast',
      'Marcus Hill: 2 votes, 33% of ballots cast',
      'Priya Nair: 1 votes, 17% of ballots cast',
      'Robert James: 1 votes, 17% of ballots cast',
      'Sofia Martinez: 0 votes, 0% of ballots cast',
    ])
    expect(results[0].querySelector('span')).toHaveStyle({ width: '33%' })
    expect(results[2].querySelector('span')).toHaveStyle({ width: '17%' })
    expect(screen.queryByText(/Advanced|Eliminated|Elected|Declined/)).not.toBeInTheDocument()
    expect(within(screen.getByText('Aggregate voting results · Revealed by administrator').parentElement!).getByText('Church Elder · Round 1')).toBeInTheDocument()
  })
})