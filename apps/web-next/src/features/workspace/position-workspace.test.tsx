import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { createInMemoryPositionReader } from '../../data/in-memory-position-reader'
import { createActiveSessionFixtures, createPositionFixtures } from '../../data/position-fixtures'
import type { PositionReader } from '../../data/position-reader'
import type { PositionSnapshot } from '../../domain/types'
import { PositionWorkspace } from './position-workspace'
import { SessionToolbar } from './session-toolbar'

const query = {
  churchId: 'church-riverside',
  termId: 'term-riverside-2027',
  positionId: 'position-riverside-elder',
}
const context = {
  church: 'Riverside Seventh-day Adventist Church',
  term: '2027 Church Board',
  department: 'Ministry',
  position: 'Church Elder',
}

function renderWorkspace(reader?: PositionReader) {
  return render(<PositionWorkspace query={query} context={context} {...(reader ? { reader } : {})} />)
}

function expectParagraphContaining(text: string) {
  expect(screen.getByText((_, element) =>
    element?.tagName === 'P' && Boolean(element.textContent?.includes(text)),
  )).toBeInTheDocument()
}

describe('read-only Position Workspace', () => {
  it('keeps the active Round 2 session unchanged while navigating viewed history and Candidates', async () => {
    const user = userEvent.setup()
    renderWorkspace()

    expect(await screen.findByText(/1 effective elected/i)).toBeInTheDocument()
    expect(screen.getByText('Lifecycle')).toBeInTheDocument()
    expect(screen.getByText('Lifecycle').parentElement).toHaveTextContent('In Progress')
    expect(screen.getByText('0', { selector: 'dd' })).toBeInTheDocument()
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')
    expectParagraphContaining('Viewed poll: Church Elder · Round 1 · Closed')

    await user.click(screen.getByRole('button', { name: /Nomination Poll 1/ }))
    expectParagraphContaining('Viewed poll: Church Elder · Nomination Poll 1 · Approved')
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')

    await user.click(screen.getByRole('button', { name: 'Candidates' }))
    expect(screen.getByRole('heading', { name: 'Candidates' })).toBeInTheDocument()
    expectParagraphContaining('Viewed poll: Church Elder · Nomination Poll 1 · Approved')
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')
    const candidateRows = screen.getAllByRole('row')
    expect(candidateRows.find((row) => row.textContent?.includes('Sofia Martinez')))
      .toHaveTextContent('Legacy recorded decision value; not a response.')
    expect(candidateRows.find((row) => row.textContent?.includes('Elaine Brooks'))).toHaveTextContent('Awaiting response')

    await user.click(screen.getByRole('button', { name: 'Polls' }))
    await user.click(screen.getByRole('button', { name: /Round 2/ }))
    expect(screen.getByText(/4 ballots cast · aggregate counts only/)).toBeInTheDocument()
    expect(screen.getByText('MOCK admin snapshot · not live backend data')).toBeInTheDocument()
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')
  })

  it('shows historical aggregate results, recorded decisions, and collapsed nomination traceability', async () => {
    const user = userEvent.setup()
    renderWorkspace()
    await screen.findByRole('heading', { name: 'Church Elder · Round 1' })

    const detail = screen.getByRole('region', { name: 'Aggregate results and recorded decisions' })
    expect(within(detail).getByText('8 ballots cast · aggregate counts only')).toBeInTheDocument()
    expect(within(detail).getByText('Elaine Brooks')).toBeInTheDocument()
    expect(within(detail).getByText(/38%/)).toBeInTheDocument()
    expect(within(detail).getByText('Legacy recorded decision value; not a response.')).toBeInTheDocument()
    expect(screen.queryByText(/voter|individual ballot|ballot choice/i)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Nomination Poll 1/ }))
    expect(screen.getByRole('heading', { name: 'Approved nomination roster' })).toBeInTheDocument()
    const disclosure = screen.getByText(/Original nomination traceability \(7 submissions\)/)
    expect(disclosure.parentElement).not.toHaveAttribute('open')
    await user.click(disclosure)
    expect(screen.getByText('Elain Brooks')).toBeInTheDocument()
    expect(screen.getByText('Priya N.')).toBeInTheDocument()
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')
  })

  it('keeps Audit separate from aggregate results and decisions', async () => {
    const user = userEvent.setup()
    renderWorkspace()
    await screen.findByText('8 ballots cast · aggregate counts only')

    await user.click(screen.getByRole('button', { name: 'Audit' }))
    expect(screen.getByRole('heading', { name: 'Audit' })).toBeInTheDocument()
    expect(screen.getByText(/No audit entries are included in this mock snapshot/)).toBeInTheDocument()
    expect(screen.queryByText('8 ballots cast · aggregate counts only')).not.toBeInTheDocument()
  })

  it('renders draft treatment without implying a session and preserves historical name snapshots', async () => {
    const user = userEvent.setup()
    const position = createPositionFixtures()[0]!
    const roundOne = position.polls.find((poll) => poll.id === 'p-elder-2027-1')!
    roundOne.candidateNames['c-27-elaine'] = 'Historical Elaine Snapshot'
    position.polls.push({
      ...structuredClone(roundOne),
      id: 'p-elder-2027-draft',
      title: 'Church Elder · Draft snapshot',
      number: 3,
      status: 'Draft',
      sourceCandidateIds: [],
      candidateNames: {},
      aggregateVotes: {},
      ballotsCast: 0,
      recordedDecisions: [],
    })
    const reader = createInMemoryPositionReader([position])
    renderWorkspace(reader)

    await screen.findByRole('heading', { name: 'Church Elder · Round 1' })
    await user.click(screen.getByRole('button', { name: 'Candidates' }))
    const candidates = screen.getByRole('region', { name: 'Candidates' })
    const elaineRow = within(candidates).getAllByRole('row')
      .find((row) => row.textContent?.includes('Elaine Brooks'))
    expect(elaineRow).toHaveTextContent('Historical Elaine Snapshot')
    expect(elaineRow).toHaveTextContent('Current effective status')
    expect(elaineRow).toHaveTextContent('Elected')

    await user.click(screen.getByRole('button', { name: 'Polls' }))
    const draftPoll = screen.getByRole('button', { name: /Draft snapshot/ })
    draftPoll.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByText('Draft snapshot · no results or candidate roster are present.')).toBeInTheDocument()
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')
    expect(screen.queryByRole('button', { name: /activate|create poll|record decision/i })).not.toBeInTheDocument()
  })

  it('renders no-context-substitution loading and recoverable error states', async () => {
    let rejectRead: (error: Error) => void = () => undefined
    const pendingReader: PositionReader = {
      getPosition: () => new Promise((_resolve, reject) => { rejectRead = reject }),
      getActiveSession: async () => null,
    }
    renderWorkspace(pendingReader)
    expect(screen.getByRole('status', { name: 'Loading position workspace' })).toHaveTextContent('Loading Church Elder')
    expect(screen.queryByText('Candidate One')).not.toBeInTheDocument()

    rejectRead(new Error('Read failed'))
    expect(await screen.findByRole('heading', { name: 'Position data unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/No other position or fixture was substituted/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry position read' })).toBeInTheDocument()
  })

  it('keeps the independent active-session toolbar available when position data fails', async () => {
    const activeSession = createActiveSessionFixtures()[0]!.session
    const reader: PositionReader = {
      getPosition: async () => { throw new Error('position unavailable') },
      getActiveSession: async () => activeSession,
    }
    renderWorkspace(reader)

    expect(await screen.findByRole('heading', { name: 'Position data unavailable' })).toBeInTheDocument()
    expectParagraphContaining('Active session: Church Elder · Round 2 · Open')
    expectParagraphContaining('Viewed poll: Unavailable · Church Elder')
    expect(screen.queryByRole('button', { name: 'Retry active session read' })).not.toBeInTheDocument()
  })

  it('reports an active-session read failure without treating it as no active session', async () => {
    const reader: PositionReader = {
      getPosition: async () => createPositionFixtures()[0]!,
      getActiveSession: async () => { throw new Error('session unavailable') },
    }
    renderWorkspace(reader)

    expect(await screen.findByRole('heading', { name: 'Church Elder' })).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('active session could not be read')
    expectParagraphContaining('Active session: Unavailable')
    expect(screen.getByRole('button', { name: 'Retry active session read' })).toBeInTheDocument()
    expectParagraphContaining('Viewed poll: Church Elder · Round 1 · Closed')
  })

  it('shows explicit empty polls/candidates and no-session state without inventing substitutes', async () => {
    const snapshots = createPositionFixtures()
    const empty = snapshots[0]!
    empty.polls = []
    empty.candidates = []
    empty.decisions = []
    const reader = createInMemoryPositionReader([empty], [])
    renderWorkspace(reader)

    expect(await screen.findByText('No active participant session')).toBeInTheDocument()
    expect(screen.getByText('No polls in this position.')).toBeInTheDocument()
    expect(screen.queryByText(/No candidates in this position/)).not.toBeInTheDocument()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Candidates' }))
    expect(screen.getByText('No candidates in this position.')).toBeInTheDocument()
  })
})

describe('MOCK-only session affordances', () => {
  it('surfaces clipboard failure and preview affordances never change session identity', async () => {
    const user = userEvent.setup()
    const position: PositionSnapshot = createPositionFixtures()[0]!
    const activeSession = createActiveSessionFixtures()[0]!.session
    const viewedPoll = position.polls.find((poll) => poll.id === 'p-elder-2027-1')
    const failedCopy = vi.fn(async () => { throw new Error('clipboard denied') })
    render(
      <SessionToolbar
        activeSession={activeSession}
        sessionState="loaded"
        viewedPoll={viewedPoll}
        viewedPositionName="Church Elder"
        viewedPositionState="loaded"
        onRetrySessionRead={vi.fn()}
        copyText={failedCopy}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy MOCK reference' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Could not copy the mock-only text')
    expect(failedCopy).toHaveBeenCalledWith('MOCK ONLY — no participant access link')

    await user.click(screen.getByRole('button', { name: 'QR MOCK preview' }))
    expect(screen.getByText(/does not create a QR code, access link, viewer, or publication/)).toBeInTheDocument()
    expect(screen.getByText((_, element) =>
      element?.tagName === 'P' && Boolean(element.textContent?.includes('Active session remains Church Elder · Round 2 · Open')),
    )).toBeInTheDocument()
    expect(screen.getByText((_, element) =>
      element?.tagName === 'P' && Boolean(element.textContent?.includes('Viewed poll: Church Elder · Round 1 · Closed')),
    )).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /participant|presentation/i })).not.toBeInTheDocument()
  })

  it('keeps session unchanged for mock copy and each informational preview', async () => {
    const user = userEvent.setup()
    const position = createPositionFixtures()[0]!
    const activeSession = createActiveSessionFixtures()[0]!.session
    const viewedPoll = position.polls.find((poll) => poll.id === 'p-elder-2027-1')
    const successfulCopy = vi.fn(async () => undefined)
    render(
      <SessionToolbar
        activeSession={activeSession}
        sessionState="loaded"
        viewedPoll={viewedPoll}
        viewedPositionName="Church Elder"
        viewedPositionState="loaded"
        onRetrySessionRead={vi.fn()}
        copyText={successfulCopy}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Copy MOCK reference' }))
    expect(await screen.findByText('Mock-only text copied. It is not an access link.')).toBeInTheDocument()
    for (const label of ['Participant MOCK preview', 'Presentation MOCK preview']) {
      await user.click(screen.getByRole('button', { name: label }))
      expect(screen.getByText((_, element) =>
        element?.tagName === 'P' && Boolean(element.textContent?.includes('Active session remains Church Elder · Round 2 · Open')),
      )).toBeInTheDocument()
      expect(screen.getByText((_, element) =>
        element?.tagName === 'P' && Boolean(element.textContent?.includes('Viewed poll: Church Elder · Round 1 · Closed')),
      )).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Dismiss mock preview' }))
    }
  })
})
