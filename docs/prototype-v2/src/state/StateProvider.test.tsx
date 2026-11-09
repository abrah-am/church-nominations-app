import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { now, type CandidateDecisionEvent, type Poll, type Submission } from '../model'
import { StateProvider, usePrototypeState } from './StateProvider'

afterEach(cleanup)
beforeEach(() => localStorage.removeItem('church-nominations-polls-prototype-v2'))

function Probe({ withNomination = false }: { withNomination?: boolean }) {
  const { state, position, sessionPosition, sessionPoll, setPosition, activateSession, selectPoll, openPollAndActivate, appendDecisionEvents, updatePosition, updatePositionDetails, addDepartment, addPosition, updateChurch, updateTerm, addPoll, submitNomination: saveNomination } = usePrototypeState()
  const createAndSubmitNomination = () => {
    const poll: Poll = { id: 'test-nomination-poll', type: 'nomination', number: 1, title: 'Elder nominations', createdAt: now(), sourceCandidateIds: [], candidateNames: {}, choiceCount: 0, maxNamesPerParticipant: 3, status: 'Open', openedAt: now(), ballots: [], decisions: [], nominationSubmissions: [] }
    addPoll('treasurer', poll)
    const submittedAt = now()
    const submissions: Submission[] = [
      { id: 'test-submission-1', name: 'Taylor Reed', submittedAt },
      { id: 'test-submission-2', name: 'Jordan Ellis', submittedAt },
      { id: 'test-submission-3', name: 'Sam Rivera', submittedAt },
    ]
    saveNomination('treasurer', poll.id, submissions)
  }
  const appendDecision = () => { const event: CandidateDecisionEvent = { id: 'decision-revision-test', candidateId: 'c-27-elaine', pollId: 'p-elder-2027-2', status: 'Declined', decidedAt: now(), decidedBy: 'Test Admin', note: 'Later decline', supersedesEventId: 'decision-27-elaine-elected' }; appendDecisionEvents('elder-2027', [event]) }
  const resolveCrossPositionConflict = () => {
    const poll: Poll = { id: 'treasurer-voting-test', type: 'voting', number: 1, title: 'Treasurer Round 1', createdAt: now(), sourceCandidateIds: [], candidateNames: {}, choiceCount: 1, status: 'Draft', ballots: [], decisions: [] }
    addPoll('treasurer', poll)
    openPollAndActivate('treasurer', poll.id, false)
    openPollAndActivate('treasurer', poll.id, true)
  }
  return <><span>{position.phase}</span><span data-testid="session-position">{sessionPosition.id}</span><span data-testid="session-poll">{sessionPoll?.id}</span><button onClick={() => updatePosition(position.id, (item) => ({ ...item, participationVisible: true }))}>Show total</button><span>{String(position.participationVisible)}</span><button onClick={() => setPosition('treasurer')}>Browse another position</button><button onClick={() => activateSession('treasurer')}>Activate another position</button><button onClick={() => updatePositionDetails('elder', { name: 'Lead Elder', openings: 3, departmentId: 'dept-2026-board' })}>Edit historical position</button><button onClick={() => { updateChurch('church-riverside', { name: 'Riverside SDA' }); updateTerm('term-2027', { name: '2027 Board' }) }}>Edit church and term</button><button onClick={() => { const departmentId = addDepartment({ termId: 'term-2027', name: 'Community Care' }); addPosition({ termId: 'term-2027', departmentId, name: 'Coordinator', openings: 2 }) }}>Add department and position</button>{withNomination && <button onClick={createAndSubmitNomination}>Create nomination and submit</button>}<button onClick={() => selectPoll('elder-2027', 'p-elder-2027-1')}>View historical poll</button><button onClick={() => openPollAndActivate('elder-2027', 'p-elder-2027-1', false)}>Open poll without resolving</button><button onClick={() => openPollAndActivate('elder-2027', 'p-elder-2027-1', true)}>Resolve conflict and open poll</button><button onClick={resolveCrossPositionConflict}>Resolve conflict across positions</button><button onClick={appendDecision}>Append decision revision</button><span data-testid="selected-position">{state.selectedPositionId}</span><span data-testid="viewed-poll">{state.viewedPollIds?.['elder-2027']}</span><span data-testid="active-poll">{state.activeSessionPollId}</span><span data-testid="elder-poll-count">{state.positions.find((item) => item.id === 'elder')?.polls.length}</span><span data-testid="elder-name">{state.positions.find((item) => item.id === 'elder')?.name}</span><span data-testid="new-position">{state.positions.find((item) => item.name === 'Coordinator')?.openings}</span><span data-testid="new-structure-term">{state.departments.find((item) => item.name === 'Community Care')?.termId}</span><span data-testid="church-name">{state.churches[0].name}</span><span data-testid="term-name">{state.terms.find((item) => item.id === 'term-2027')?.name}</span><span data-testid="nomination-record">{state.positions.find((item) => item.id === 'treasurer')?.polls.find((poll) => poll.id === 'test-nomination-poll')?.nominationSubmissions?.[0]?.name}</span><span data-testid="submission-archive-count">{state.positions.find((item) => item.id === 'treasurer')?.submissions.length}</span><span data-testid="historical-ballots">{state.positions.find((item) => item.id === 'elder-2027')?.polls.find((poll) => poll.id === 'p-elder-2027-1')?.ballots.length}</span><span data-testid="decision-event-count">{state.positions.find((item) => item.id === 'elder-2027')?.decisions.length}</span><span data-testid="elder-active-poll-status">{state.positions.find((item) => item.id === 'elder-2027')?.polls.find((poll) => poll.id === 'p-elder-2027-2')?.status}</span></>
}

describe('shared prototype state', () => {
  it('persists control changes in browser-local storage', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByText('Show total'))
    expect(screen.getByText('true')).toBeInTheDocument()
    expect(localStorage.getItem('church-nominations-polls-prototype-v2')).toContain('"participationVisible":true')
  })
  it('keeps admin browsing separate from the active voter session', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByText('Browse another position'))
    expect(screen.getByTestId('selected-position')).toHaveTextContent('treasurer')
    expect(screen.getByTestId('session-position')).toHaveTextContent('elder-2027')
  })
  it('updates admin church and term context when opening a historical position without switching the session', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Browse another position' }))
    expect(screen.getByTestId('selected-position')).toHaveTextContent('treasurer')
    expect(screen.getByTestId('session-position')).toHaveTextContent('elder-2027')
  })
  it('changes the shared session only when explicitly activated and preserves poll records on position edits', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Activate another position' }))
    expect(screen.getByTestId('session-position')).toHaveTextContent('treasurer')
    fireEvent.click(screen.getByRole('button', { name: 'Edit historical position' }))
    expect(screen.getByTestId('elder-name')).toHaveTextContent('Lead Elder')
    expect(screen.getByTestId('elder-poll-count')).toHaveTextContent('1')
  })
  it('creates term-owned departments and positions and edits church and term details', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Edit church and term' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add department and position' }))
    expect(screen.getByTestId('church-name')).toHaveTextContent('Riverside SDA')
    expect(screen.getByTestId('term-name')).toHaveTextContent('2027 Board')
    expect(screen.getByTestId('new-position')).toHaveTextContent('2')
    expect(screen.getByTestId('new-structure-term')).toHaveTextContent('term-2027')
  })
  it('stores a batch of names as separate nomination records on the poll and position archive', () => {
    render(<StateProvider><Probe withNomination /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Create nomination and submit' }))
    expect(screen.getByTestId('nomination-record')).toHaveTextContent('Taylor Reed')
    expect(screen.getByTestId('submission-archive-count')).toHaveTextContent('3')
  })
  it('keeps historical poll selection separate from the active session and requires conflict resolution before activation', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'View historical poll' }))
    expect(screen.getByTestId('viewed-poll')).toHaveTextContent('p-elder-2027-1')
    expect(screen.getByTestId('active-poll')).toHaveTextContent('p-elder-2027-2')
    fireEvent.click(screen.getByRole('button', { name: 'Open poll without resolving' }))
    expect(screen.getByTestId('active-poll')).toHaveTextContent('p-elder-2027-2')
    fireEvent.click(screen.getByRole('button', { name: 'Resolve conflict and open poll' }))
    expect(screen.getByTestId('active-poll')).toHaveTextContent('p-elder-2027-1')
    expect(screen.getByTestId('viewed-poll')).toHaveTextContent('p-elder-2027-1')
  })
  it('appends a decision revision without changing historical ballots', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Append decision revision' }))
    expect(screen.getByTestId('decision-event-count')).toHaveTextContent('6')
    expect(screen.getByTestId('historical-ballots')).toHaveTextContent('8')
  })
  it('keeps new poll drafts in admin view only until explicit open and detects open polls across positions', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'View historical poll' }))
    expect(screen.getByTestId('active-poll')).toHaveTextContent('p-elder-2027-2')
    fireEvent.click(screen.getByRole('button', { name: 'Open poll without resolving' }))
    expect(screen.getByTestId('active-poll')).toHaveTextContent('p-elder-2027-2')
    fireEvent.click(screen.getByRole('button', { name: 'Resolve conflict and open poll' }))
    expect(screen.getByTestId('active-poll')).toHaveTextContent('p-elder-2027-1')
  })
  it('resolves an open-poll conflict across positions only after explicit confirmation', () => {
    render(<StateProvider><Probe /></StateProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'Resolve conflict across positions' }))
    expect(screen.getByTestId('active-poll')).toHaveTextContent('treasurer-voting-test')
    expect(screen.getByTestId('elder-active-poll-status')).toHaveTextContent('Closed')
  })
})