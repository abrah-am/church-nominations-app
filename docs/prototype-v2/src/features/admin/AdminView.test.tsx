import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminView from './AdminView'
import PresentationView from '../presentation/PresentationView'
import VoterView from '../voter/VoterView'
import { StateProvider } from '../../state/StateProvider'
import { createInitialState, STORAGE_KEY } from '../../model'

afterEach(cleanup)
beforeEach(() => localStorage.removeItem('church-nominations-polls-prototype-v2'))

function renderAdmin() {
  return render(<StateProvider><AdminView /></StateProvider>)
}

describe('Election Position Workspace', () => {
  it('shows live aggregate results for an open poll using ballots cast', () => {
    renderAdmin()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText(/ballots cast · live admin totals/)).toBeInTheDocument()
    const marcusResult = screen.getByRole('img', { name: 'Marcus Hill: 3 votes, 75% of ballots cast' })
    const priyaResult = screen.getByRole('img', { name: 'Priya Nair: 1 votes, 25% of ballots cast' })
    expect(marcusResult).toBeInTheDocument()
    expect(marcusResult.querySelector('span')).toHaveStyle({ width: '75%' })
    expect(marcusResult).toHaveClass('result-track')
    expect(priyaResult).toBeInTheDocument()
    expect(priyaResult.querySelector('span')).toHaveStyle({ width: '25%' })
    expect(document.querySelector('.result-name')).toBeInTheDocument()
    expect(document.querySelector('.result-track')).toBeInTheDocument()
    expect(screen.queryByText(/individual selections/i)).not.toBeInTheDocument()
  })

  it('keeps final results admin-only when voting closes until explicitly revealed', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { unmount } = renderAdmin()
    fireEvent.click(screen.getByRole('button', { name: 'Close voting' }))
    expect(screen.getByText(/final admin totals/)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Marcus Hill: 3 votes, 75% of ballots cast' })).toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    const closedPoll = saved.positions.find((item) => item.id === 'elder-2027')!.polls.find((poll) => poll.id === 'p-elder-2027-2')!
    expect(closedPoll.status).toBe('Closed')
    expect(closedPoll.revealedAt).toBeUndefined()

    unmount()
    render(<StateProvider><PresentationView /></StateProvider>)
    expect(screen.getByText(/Voting is closed\. Results will appear here only after the administrator reveals them\./)).toBeInTheDocument()
    expect(screen.queryByText('Aggregate voting results · Revealed by administrator')).not.toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('combines closed-round results and decisions with sorted totals, response controls, and separate audit history', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const poll = position.polls.find((item) => item.id === 'p-elder-2027-1')!
    poll.decisions[0].outcomes['c-27-elaine'] = 'Elected'
    poll.decisions[0].outcomes['c-27-marcus'] = 'Advanced'
    poll.decisions[0].outcomes['c-27-priya'] = 'Eliminated'
    position.decisions = position.decisions.filter((event) => event.pollId !== poll.id)
    position.decisions.push(
      { id: 'test-elaine-elected', candidateId: 'c-27-elaine', pollId: poll.id, status: 'Elected', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'Elected.' },
      { id: 'test-marcus-advanced', candidateId: 'c-27-marcus', pollId: poll.id, status: 'Advanced', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'Advanced.' },
      { id: 'test-priya-eliminated', candidateId: 'c-27-priya', pollId: poll.id, status: 'Eliminated', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'Eliminated.' },
    )
    poll.ballots = [
      { id: 'sort-elaine-1', selections: ['c-27-elaine'] }, { id: 'sort-elaine-2', selections: ['c-27-elaine'] },
      { id: 'sort-marcus-1', selections: ['c-27-marcus'] }, { id: 'sort-marcus-2', selections: ['c-27-marcus'] },
      { id: 'sort-priya-1', selections: ['c-27-priya'] }, { id: 'sort-priya-2', selections: ['c-27-priya'] },
      { id: 'sort-robert-1', selections: ['c-27-robert'] }, { id: 'sort-sofia-1', selections: ['c-27-sofia'] },
    ]
    position.responseEvents = [{ id: 'accepted-elaine', candidateId: 'c-27-elaine', openingId: `${position.id}:opening:1`, status: 'Accepted', respondedAt: '2026-10-27T12:00:00.000Z', recordedBy: 'Jordan Lee', note: '' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Position poll history' })).getByRole('button', { name: /Round 1/ }))

    expect(screen.getByRole('tab', { name: 'Results & decisions' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Audit' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Results' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Decisions' })).not.toBeInTheDocument()
    const candidateNames = Array.from(document.querySelectorAll('.closed-round-result .result-name > span')).map((node) => node.textContent)
    expect(candidateNames).toEqual(['Elaine Brooks', 'Marcus Hill', 'Priya Nair', 'Robert James', 'Sofia Martinez'])
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(within(screen.getByText('Marcus Hill').closest('.closed-round-row')!).getByText('2 votes · 25%')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Marcus Hill: 2 votes, 25% of ballots cast' }).querySelector('span')).toHaveStyle({ width: '25%' })

    const elaineRow = document.querySelectorAll('.closed-round-row')[0] as HTMLElement
    expect(within(elaineRow).getByText(/Candidate response:/)).toHaveTextContent('Accepted')
    expect(within(elaineRow).queryByRole('button', { name: 'Record acceptance' })).not.toBeInTheDocument()
    const marcusRow = document.querySelectorAll('.closed-round-row')[1] as HTMLElement
    expect(within(marcusRow).queryByText(/Candidate response:/)).not.toBeInTheDocument()
    expect(within(marcusRow).queryByRole('button', { name: /Record/ })).not.toBeInTheDocument()
    expect(within(marcusRow).getByLabelText('Election decision')).not.toHaveTextContent('Accepted')
    expect(within(marcusRow).getByLabelText('Election decision')).not.toHaveTextContent('Declined')

    fireEvent.click(screen.getByRole('tab', { name: 'Audit' }))
    expect(screen.getByRole('heading', { name: 'Decision revisions' })).toBeInTheDocument()
    expect(screen.getByText('Revision 1')).toBeInTheDocument()
    expect(screen.getByText('Elaine Brooks: Elected')).toBeInTheDocument()
  })

  it('shows the selected closed poll decision when the candidate is elected in a later round', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const selectedPoll = position.polls.find((poll) => poll.id === 'p-elder-2027-1')!
    const laterPoll = position.polls.find((poll) => poll.id === 'p-elder-2027-2')!
    position.decisions = position.decisions.filter((event) => event.candidateId !== 'c-27-marcus')
    position.decisions.push(
      { id: 'selected-marcus-advanced', candidateId: 'c-27-marcus', pollId: selectedPoll.id, status: 'Advanced', decidedAt: '2026-10-25T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'Advanced.' },
      { id: 'later-marcus-elected', candidateId: 'c-27-marcus', pollId: laterPoll.id, status: 'Elected', decidedAt: '2026-10-26T16:15:00.000Z', decidedBy: 'Jordan Lee', note: 'Elected.' },
    )
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Position poll history' })).getByRole('button', { name: /Round 1/ }))

    const marcusRow = Array.from(document.querySelectorAll('.closed-round-row')).find((row) => row.textContent?.includes('Marcus Hill')) as HTMLElement
    expect(within(marcusRow).getByLabelText('Election decision')).toHaveValue('Advanced')
    expect(within(marcusRow).queryByText(/Candidate response:/)).not.toBeInTheDocument()
    expect(within(marcusRow).queryByRole('button', { name: /Record/ })).not.toBeInTheDocument()
  })

  it('saves closed-round decisions as audited revisions without changing ballots or tallies', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    position.polls[2].status = 'Closed'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    const pollBefore = structuredClone(position.polls[2])
    fireEvent.change(screen.getAllByLabelText('Election decision')[0], { target: { value: 'Advanced' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save decision revision' }))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    const savedPosition = saved.positions.find((item) => item.id === position.id)!
    const savedPoll = savedPosition.polls.find((item) => item.id === 'p-elder-2027-2')!
    expect(savedPoll.ballots).toEqual(pollBefore.ballots)
    expect(savedPoll.ballots.flatMap((ballot) => ballot.selections)).toEqual(pollBefore.ballots.flatMap((ballot) => ballot.selections))
    expect(savedPoll.decisions).toHaveLength(pollBefore.decisions.length + 1)
    expect(savedPosition.decisions).toContainEqual(expect.objectContaining({ pollId: savedPoll.id, candidateId: 'c-27-marcus', status: 'Advanced' }))
    expect(saved.audit.at(-1)?.action).toBe('Decision revision saved')
  })

  it('offers response actions only for elected candidates and appends response events without reopening a finalized position', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    position.lifecycleEvents = [{ id: 'finalized', status: 'Finalized', at: '2026-10-28T12:00:00.000Z', actor: 'Jordan Lee', detail: 'Complete.' }]
    position.responseEvents = [{ id: 'accepted-elaine', candidateId: 'c-27-elaine', openingId: `${position.id}:opening:1`, status: 'Accepted', respondedAt: '2026-10-27T12:00:00.000Z', recordedBy: 'Jordan Lee', note: '' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Position poll history' })).getByRole('button', { name: /Round 1/ }))
    const electedRow = document.querySelectorAll('.closed-round-row')[0] as HTMLElement
    expect(within(electedRow).getByRole('button', { name: 'Record later decline' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Record acceptance' })).not.toBeInTheDocument()
    const nonElectedRow = document.querySelectorAll('.closed-round-row')[1] as HTMLElement
    expect(within(nonElectedRow).queryByRole('button', { name: /Record/ })).not.toBeInTheDocument()
    fireEvent.click(within(electedRow).getByRole('button', { name: 'Record later decline' }))
    fireEvent.click(within(screen.getByRole('alertdialog', { name: 'Record later decline?' })).getByRole('button', { name: 'Record later decline' }))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    const savedPosition = saved.positions.find((item) => item.id === position.id)!
    expect(savedPosition.responseEvents.map((event) => event.status)).toEqual(['Accepted', 'Declined'])
    expect(savedPosition.lifecycleEvents.at(-1)?.status).toBe('Finalized')
    expect(savedPosition.decisions.find((event) => event.candidateId === 'c-27-elaine')?.status).toBe('Elected')
  })

  it('keeps the active session separate when viewing a historical poll', () => {
    renderAdmin()
    const navigator = screen.getByRole('navigation', { name: 'Position poll history' })
    fireEvent.click(within(navigator).getByRole('button', { name: /Round 1/ }))
    expect(screen.getByText('Church Elder · Round 2 · Open')).toBeInTheDocument()
    expect(screen.getByText('Historical view · session unchanged')).toBeInTheDocument()
    expect(within(navigator).getByRole('button', { name: /Round 1/ })).toHaveAttribute('aria-current', 'page')
  })

  it('presents the current position-wide roster in a separate Candidates view', () => {
    renderAdmin()
    fireEvent.click(screen.getByRole('tab', { name: /Candidates/ }))
    expect(screen.getByRole('heading', { name: 'Current candidates' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Position-wide candidates' })).getByText('Elaine Brooks')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Position completion summary' })).getByText('Election decision: Elected · Elaine Brooks')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Position poll history' })).not.toBeInTheDocument()
  })

  it('shows candidate names in the approved nomination roster rows', () => {
    const state = structuredClone(createInitialState())
    state.viewedPollIds['elder-2027'] = 'p-elder-2027-nomination-1'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    const roster = document.querySelector('.approved-roster')
    expect(roster).toBeInTheDocument()
    const names = Array.from((roster as HTMLElement).querySelectorAll('.approved-candidate-name')).map((node) => node.textContent)
    expect(names).toEqual(['Elaine Brooks', 'Marcus Hill', 'Priya Nair', 'Robert James', 'Sofia Martinez'])
    expect(within(roster as HTMLElement).getAllByText(/\d nominations?/)).toHaveLength(5)
    expect(within(roster as HTMLElement).queryAllByRole('checkbox')).toHaveLength(0)
    expect(within(roster as HTMLElement).queryAllByRole('textbox')).toHaveLength(0)
    expect(roster).toHaveClass('approved-roster')
    expect(roster).not.toHaveClass('consolidation-roster')
    expect((roster as HTMLElement).querySelector('.candidate-edit-row')).not.toHaveClass('consolidation-roster')
  })

  it('shows original intake names anonymously and keeps exact duplicates as separate submissions', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const poll = position.polls.find((item) => item.type === 'nomination')!
    poll.status = 'Open'
    poll.nominationSubmissions = [
      { id: 'anon-1', name: 'Taylor Reed', submittedAt: '2026-10-20T12:15:00.000Z' },
      { id: 'anon-2', name: 'Taylor Reed', submittedAt: '2026-10-20T12:20:00.000Z' },
    ]
    state.viewedPollIds[position.id] = poll.id
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    const submittedNames = within(screen.getByRole('list', { name: 'Anonymous submitted names' }).parentElement!).getAllByText('Taylor Reed')
    expect(submittedNames).toHaveLength(2)
    expect(screen.queryByText(/submitted by|submitter:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/profile|identity-linked/i)).not.toBeInTheDocument()
  })

  it('requires explicit approval of the final candidate-name snapshot and preserves the roster on cancel', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const poll = position.polls.find((item) => item.type === 'nomination')!
    poll.status = 'Closed'
    poll.sourceCandidateIds = []
    poll.candidateNames = {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    const navigator = screen.getByRole('navigation', { name: 'Position poll history' })
    fireEvent.click(within(navigator).getByRole('button', { name: /Nomination 1/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Approve candidate roster' }))
    const review = screen.getByRole('alertdialog', { name: 'Approve candidate names?' })
    for (const candidate of position.candidates) expect(within(review).getByText(candidate.name)).toBeInTheDocument()
    fireEvent.click(within(review).getByRole('button', { name: 'Cancel' }))
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    let savedPosition = saved.positions.find((item) => item.id === position.id)!
    expect(savedPosition.polls.find((item) => item.id === poll.id)?.status).toBe('Closed')
    expect(savedPosition.polls.find((item) => item.id === poll.id)?.sourceCandidateIds).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Approve candidate roster' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirm roster approval' }))
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    savedPosition = saved.positions.find((item) => item.id === position.id)!
    const approvedPoll = savedPosition.polls.find((item) => item.id === poll.id)!
    expect(approvedPoll.status).toBe('Approved')
    expect(approvedPoll.sourceCandidateIds).toEqual(position.candidates.map((candidate) => candidate.id))
    expect(approvedPoll.candidateNames).toEqual(Object.fromEntries(position.candidates.map((candidate) => [candidate.id, candidate.name])))
    expect(approvedPoll.nominationSubmissions).toEqual(poll.nominationSubmissions)
    expect(savedPosition.candidates.map((candidate) => candidate.sourceSubmissionIds)).toEqual(position.candidates.map((candidate) => candidate.sourceSubmissionIds))
  })

  it('blocks blank or whitespace candidate names from approval and removes misleading approved status controls', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    position.polls.find((item) => item.type === 'nomination')!.status = 'Closed'
    position.candidates[0].name = '   '
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Position poll history' })).getByRole('button', { name: /Nomination 1/ }))
    expect(screen.getByText('Every candidate must have a non-blank name before roster approval.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Approve candidate roster' })).toBeDisabled()
    expect(screen.getAllByRole('checkbox', { name: /for consolidation/ })).toHaveLength(position.candidates.length)

    const approvedState = structuredClone(createInitialState())
    approvedState.viewedPollIds['elder-2027'] = 'p-elder-2027-nomination-1'
    localStorage.setItem(STORAGE_KEY, JSON.stringify(approvedState))
    cleanup()
    renderAdmin()
    const roster = document.querySelector<HTMLElement>('.approved-roster')!
    expect(roster).toBeInTheDocument()
    expect(roster.querySelector('.candidate-edit-row')).not.toHaveClass('consolidation-roster')
    expect(within(roster).queryAllByRole('checkbox')).toHaveLength(0)
    expect(within(roster).queryAllByRole('textbox')).toHaveLength(0)
    expect(within(roster).queryByText('Pending')).not.toBeInTheDocument()
    expect(within(roster).getAllByText('2 nominations')).toHaveLength(2)
  })

  it('preserves original text and source mappings through correction, merge, exclusion, and approval disclosure', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const poll = position.polls.find((item) => item.type === 'nomination')!
    poll.status = 'Closed'
    const originalSubmissions = structuredClone(poll.nominationSubmissions)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Position poll history' })).getByRole('button', { name: /Nomination 1/ }))
    fireEvent.change(screen.getByRole('textbox', { name: 'Candidate name Elaine Brooks' }), { target: { value: 'Elaine B. Brooks' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Elaine B. Brooks for consolidation' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select Marcus Hill for consolidation' }))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    fireEvent.click(screen.getByRole('button', { name: 'Consolidate 2 selected' }))
    fireEvent.click(within(screen.getByRole('textbox', { name: 'Candidate name Priya Nair' }).closest('.candidate-edit-row') as HTMLElement).getByRole('button', { name: 'Exclude' }))
    fireEvent.click(screen.getByText('Anonymous original submissions and consolidation history'))
    expect(screen.getAllByText('Current candidate: Elaine B. Brooks')).toHaveLength(3)
    expect(screen.getAllByText('No current candidate (excluded)').length).toBeGreaterThan(0)
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    const savedPosition = saved.positions.find((item) => item.id === position.id)!
    expect(savedPosition.polls.find((item) => item.id === poll.id)?.nominationSubmissions).toEqual(originalSubmissions)
    expect(savedPosition.candidates.find((candidate) => candidate.id === 'c-27-elaine')?.sourceSubmissionIds).toEqual(['s-27-1', 's-27-2', 's-27-3'])
    expect(savedPosition.candidates.some((candidate) => candidate.id === 'c-27-priya')).toBe(false)
    expect(saved.audit.some((entry) => entry.action === 'Nomination candidate name corrected')).toBe(true)
    expect(saved.audit.some((entry) => entry.action === 'Nomination candidates consolidated')).toBe(true)
    expect(saved.audit.some((entry) => entry.action === 'Nomination candidate excluded')).toBe(true)
    vi.restoreAllMocks()
  })

  it('carries approved candidate-name snapshots into a voting draft and the voter ballot', () => {
    const state = structuredClone(createInitialState())
    const position = state.positions.find((item) => item.id === 'elder-2027')!
    const approvedPoll = position.polls.find((item) => item.type === 'nomination')!
    approvedPoll.candidateNames['c-27-marcus'] = 'Marcus Snapshot'
    approvedPoll.sourceCandidateIds = ['c-27-marcus', 'c-27-priya']
    approvedPoll.candidateNames['c-27-priya'] = 'Priya Snapshot'
    approvedPoll.status = 'Approved'
    position.candidates = position.candidates.filter((candidate) => approvedPoll.sourceCandidateIds.includes(candidate.id))
    position.decisions = []
    approvedPoll.decisions = []
    state.viewedPollIds[position.id] = approvedPoll.id
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    renderAdmin()
    fireEvent.click(screen.getByRole('button', { name: 'Create voting round from approved roster' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create voting draft' }))
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!) as ReturnType<typeof createInitialState>
    const draft = saved.positions.find((item) => item.id === position.id)!.polls.at(-1)!
    expect(draft.candidateNames).toEqual({ 'c-27-marcus': 'Marcus Snapshot', 'c-27-priya': 'Priya Snapshot' })
    expect(draft.sourceCandidateIds).toEqual(['c-27-marcus', 'c-27-priya'])
    draft.status = 'Open'
    saved.activeSessionPollId = draft.id
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    cleanup()
    render(<StateProvider><VoterView /></StateProvider>)
    expect(screen.getByRole('radio', { name: /Marcus Snapshot/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Priya Snapshot/ })).toBeInTheDocument()
    expect(screen.queryByText('Marcus Hill')).not.toBeInTheDocument()
  })
})
