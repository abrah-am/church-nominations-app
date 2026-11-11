import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createExperiencePreview } from '@/data/experience-preview'
import { VoterView, type VoterPreviewState } from './voter-view'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const stateNames: VoterPreviewState[] = ['nomination', 'voting', 'confirmation', 'waiting', 'closed']

function freezeDeep(value: unknown): void {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep)
    Object.freeze(value)
  }
}

describe('M3 voter preview', () => {
  it('navigates all local states without changing the shared current poll', async () => {
    const user = userEvent.setup()
    const preview = createExperiencePreview()
    render(<VoterView preview={preview} />)

    expect(screen.getByRole('heading', { name: 'Participate in voting' })).toBeVisible()
    const nav = screen.getByRole('navigation', { name: 'Preview screens' })
    for (const [label, heading] of [
      ['Nomination', 'Nomination preview'],
      ['Confirmation', 'Preview complete — nothing submitted'],
      ['Waiting', 'Nothing to submit right now'],
      ['Closed', 'Thank you for participating'],
      ['Voting', 'Participate in voting'],
    ] as const) {
      await user.click(within(nav).getByRole('link', { name: label }))
      expect(screen.getByRole('heading', { name: heading })).toBeVisible()
      expect(within(nav).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
      expect(screen.getByText(`Shared current poll: ${preview.activePoll.title} · ${preview.activePoll.status} (unchanged)`)).toBeVisible()
      expect(screen.getByText('Mock preview · no submission')).toBeVisible()
    }
    expect(preview.activePoll.number).toBe(2)
    expect(preview.activePoll.status).toBe('Open')
  })

  it('supports wrapper-owned query-state links without owning routing', () => {
    const preview = createExperiencePreview()
    const hrefForState = (state: VoterPreviewState) => `/voter/preview?state=${state}`
    const { rerender } = render(
      <MemoryRouter>
        <VoterView preview={preview} navigation={{ state: 'waiting', hrefForState }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Nothing to submit right now' })).toBeVisible()
    for (const state of stateNames) {
      const link = screen.getByRole('link', { name: new RegExp(`^${state}$`, 'i') })
      expect(link).toHaveAttribute('href', hrefForState(state))
    }
    rerender(
      <MemoryRouter>
        <VoterView preview={preview} navigation={{ state: 'confirmation', hrefForState }} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Preview complete — nothing submitted' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Return to voting preview' })).toHaveAttribute('href', hrefForState('voting'))
  })

  it('uses only the current Round 2 roster, enforces one choice, and discards local selections', async () => {
    const user = userEvent.setup()
    const preview = createExperiencePreview()
    render(<VoterView preview={preview} />)
    const options = screen.getAllByRole('radio')
    expect(options).toHaveLength(preview.activePoll.sourceCandidateIds.length)
    for (const id of preview.activePoll.sourceCandidateIds) {
      expect(screen.getByRole('radio', { name: preview.activePoll.candidateNames[id]! })).not.toBeChecked()
    }
    expect(screen.queryByText('Elaine Brooks')).not.toBeInTheDocument()
    expect(screen.queryByText('Robert James')).not.toBeInTheDocument()
    const continueLink = screen.getByText('Preview confirmation — do not submit')
    expect(continueLink).toHaveAttribute('aria-disabled', 'true')
    expect(continueLink).not.toHaveAttribute('href')
    await user.click(continueLink)
    expect(screen.getByRole('heading', { name: 'Participate in voting' })).toBeVisible()

    await user.click(options[0]!)
    await user.click(options[1]!)
    expect(options[0]).not.toBeChecked()
    expect(options[1]).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('1 of 1 selected · local only')
    await user.click(screen.getByRole('link', { name: 'Preview confirmation — do not submit' }))
    expect(screen.getByText(/not a receipt/)).toBeVisible()
    expect(screen.queryByText(preview.activePoll.candidateNames[preview.activePoll.sourceCandidateIds[1]!]!)).not.toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Return to voting preview' }))
    screen.getAllByRole('radio').forEach((input) => expect(input).not.toBeChecked())
    expect(screen.getByText('Preview confirmation — do not submit')).toHaveAttribute('aria-disabled', 'true')
  })

  it('enforces a shared multi-choice limit without hardcoding it', async () => {
    const user = userEvent.setup()
    const preview = createExperiencePreview()
    preview.choiceCount = 2
    preview.activePoll.sourceCandidateIds.push('c-27-elaine')
    preview.activePoll.candidateNames['c-27-elaine'] = 'Snapshot candidate name'
    render(<VoterView preview={preview} />)
    const options = screen.getAllByRole('checkbox')
    expect(screen.getByRole('checkbox', { name: 'Snapshot candidate name' })).toBeVisible()
    await user.click(options[0]!)
    expect(screen.getByText('Preview confirmation — do not submit')).toHaveAttribute('aria-disabled', 'true')
    await user.click(options[1]!)
    expect(options[2]).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('2 of 2 selected')
    expect(screen.getByRole('link', { name: 'Preview confirmation — do not submit' })).toBeVisible()
    await user.click(options[0]!)
    expect(options[2]).toBeEnabled()
    expect(screen.getByText('Preview confirmation — do not submit')).toHaveAttribute('aria-disabled', 'true')
    await user.click(screen.getByRole('button', { name: 'Clear local selection' }))
    expect(screen.getByRole('status')).toHaveTextContent('0 of 2 selected')
  })

  it('supports keyboard selection and navigation with native controls', async () => {
    const user = userEvent.setup()
    render(<VoterView preview={createExperiencePreview()} />)
    const votingLink = screen.getByRole('link', { name: 'Voting' })
    votingLink.focus()
    await user.keyboard('{Enter}')
    const option = screen.getAllByRole('radio')[0]!
    option.focus()
    await user.keyboard(' ')
    expect(option).toBeChecked()
    const continueLink = screen.getByRole('link', { name: 'Preview confirmation — do not submit' })
    continueLink.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'Preview complete — nothing submitted' })).toBeVisible()
  })

  it('derives nomination names and limits only from the shared own-name snapshot', () => {
    const preview = createExperiencePreview()
    preview.churchName = 'Shared church'
    preview.termName = 'Shared term'
    preview.position.name = 'Shared position'
    preview.nominationNameLimit = 3
    preview.voterOwnSubmittedNames = ['Own example name']
    render(<VoterView preview={preview} initialState="nomination" />)
    expect(screen.getByText('Shared church · Shared term')).toBeVisible()
    expect(screen.getByText(/Shared position · 2 openings/)).toBeVisible()
    expect(screen.getByText(/Up to 3 names per participant. 2 remaining/)).toBeVisible()
    const ownNames = screen.getByRole('region', { name: 'Your own submitted names' })
    expect(within(ownNames).getAllByRole('listitem')).toHaveLength(1)
    expect(within(ownNames).getByText('Own example name')).toBeVisible()
    expect(screen.queryByText('Elaine Brooks')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit/i })).not.toBeInTheDocument()
  })

  it('handles empty and exhausted own-name examples without exposing other nominations', () => {
    const preview = createExperiencePreview()
    preview.voterOwnSubmittedNames = []
    const { rerender } = render(<VoterView preview={preview} initialState="nomination" />)
    expect(screen.getByText('No names submitted in this mock snapshot.')).toBeVisible()
    preview.nominationNameLimit = 1
    preview.voterOwnSubmittedNames = ['Own example name']
    rerender(<VoterView preview={preview} initialState="nomination" />)
    expect(screen.getByText(/0 remaining in this mock example/)).toBeVisible()
  })

  it.each(['Closed', 'Draft', 'Approved'] as const)('does not offer a selectable ballot for a %s snapshot', (status) => {
    const preview = createExperiencePreview()
    preview.activePoll.status = status
    render(<VoterView preview={preview} />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.getByText(/No selectable ballot/)).toBeVisible()
  })

  it('has no network, storage, submission, or mutation side effects across all views', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn(() => { throw new Error('Network forbidden') })
    const xhrMock = vi.fn(() => { throw new Error('Network forbidden') })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('XMLHttpRequest', xhrMock)
    const storageSpies = (['getItem', 'setItem', 'removeItem', 'clear'] as const).map((method) =>
      vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('Storage forbidden') }),
    )
    const preview = createExperiencePreview()
    const before = structuredClone(preview)
    freezeDeep(preview)
    const { container } = render(<VoterView preview={preview} />)
    await user.click(screen.getAllByRole('radio')[0]!)
    await user.click(screen.getByRole('link', { name: 'Preview confirmation — do not submit' }))
    for (const state of stateNames) {
      await user.click(screen.getByRole('link', { name: new RegExp(`^${state}$`, 'i') }))
    }
    expect(container.querySelector('form')).toBeNull()
    expect(container.querySelector('[type="submit"]')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(xhrMock).not.toHaveBeenCalled()
    storageSpies.forEach((spy) => expect(spy).not.toHaveBeenCalled())
    expect(preview).toEqual(before)
  })

  it('never renders Admin aggregates, nomination traceability, identities, or recorded decisions', async () => {
    const user = userEvent.setup()
    const preview = createExperiencePreview()
    // Poison Admin-only fields: no voter scenario may project them.
    for (const poll of preview.position.polls) {
      poll.ballotsCast = 987654
      poll.aggregateVotes = { 'private-candidate-id': 876543 }
      poll.nominationSubmissions = [{
        id: 'private-submission-id', name: 'OTHER SUBMITTER NAME', submittedAt: 'PRIVATE TIMESTAMP',
      }]
      poll.auditEntries = [{
        id: 'private-audit-id', action: 'PRIVATE ACTION', at: 'PRIVATE TIMESTAMP',
        detail: 'PRIVATE VOTER IDENTITY / INDIVIDUAL BALLOT',
      }]
      poll.recordedDecisions = [{ candidateId: 'private-decision-id', status: 'Eliminated' }]
    }
    render(<VoterView preview={preview} />)
    for (const state of stateNames) {
      await user.click(screen.getByRole('link', { name: new RegExp(`^${state}$`, 'i') }))
      for (const forbidden of [
        '987654', '876543', 'private-', 'OTHER SUBMITTER NAME', 'PRIVATE TIMESTAMP',
        'PRIVATE ACTION', 'PRIVATE VOTER IDENTITY', 'INDIVIDUAL BALLOT', 'Eliminated',
        'Elain Brooks', 'Priya N.', 'Sofia Martinez', 'Robert James',
      ]) {
        expect(screen.getByRole('region', { name: 'Voter preview' }).textContent).not.toContain(forbidden)
      }
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    }
  })
})
