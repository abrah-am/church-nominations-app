import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createInitialState, id, migrateState, now, STORAGE_KEY, type AppState, type AuditEntry, type CandidateDecisionEvent, type Church, type Department, type ElectionTerm, type Poll, type Position, type Submission } from '../model'

interface StateContextValue {
  state: AppState; position: Position; sessionPosition: Position; sessionPoll: Poll | undefined; setPosition: (positionId: string) => void; activateSession: (positionId: string) => void
  selectPoll: (positionId: string, pollId: string) => void
  openPollAndActivate: (positionId: string, pollId: string, closeExisting: boolean) => { ok: boolean; conflictPoll?: Poll }
  selectChurch: (churchId: string) => void; selectTerm: (termId: string) => void
  updatePosition: (positionId: string, update: (position: Position) => Position) => void
  addPoll: (positionId: string, poll: Poll) => void; updatePoll: (positionId: string, pollId: string, update: (poll: Poll) => Poll) => void
  submitNomination: (positionId: string, pollId: string, submissions: Submission[]) => void
  appendDecisionEvents: (positionId: string, events: CandidateDecisionEvent[]) => void
  addChurch: (church: Omit<Church, 'id'>) => string; updateChurch: (churchId: string, update: Partial<Church>) => void
  addTerm: (term: Omit<ElectionTerm, 'id'>) => string; updateTerm: (termId: string, update: Partial<ElectionTerm>) => void
  addDepartment: (department: Omit<Department, 'id' | 'order'>) => string; updateDepartment: (departmentId: string, update: Partial<Department>) => void
  addPosition: (position: Pick<Position, 'termId' | 'departmentId' | 'name' | 'openings'>) => string; updatePositionDetails: (positionId: string, update: Pick<Position, 'name' | 'openings' | 'departmentId'>) => void
  addAudit: (entry: Omit<AuditEntry, 'id' | 'at'>) => void; reset: () => void
}
const StateContext = createContext<StateContextValue | null>(null)

function readState(): AppState {
  try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? migrateState(JSON.parse(saved) as Partial<AppState>) : createInitialState() }
  catch { return createInitialState() }
}

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(readState)
  const stateRef = useRef(state)
  useEffect(() => {
    const channel = new BroadcastChannel('church-nominations-prototype-v2')
    const accept = (next: AppState) => { stateRef.current = next; setState(next) }
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY && event.newValue) accept(JSON.parse(event.newValue) as AppState) }
    channel.onmessage = (event: MessageEvent<AppState>) => accept(event.data)
    window.addEventListener('storage', onStorage)
    return () => { channel.close(); window.removeEventListener('storage', onStorage) }
  }, [])
  const commit = (updater: (current: AppState) => AppState) => {
    const next = updater(stateRef.current)
    stateRef.current = next
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    const channel = new BroadcastChannel('church-nominations-prototype-v2')
    channel.postMessage(next)
    channel.close()
  }
  const value = useMemo<StateContextValue>(() => ({
    state,
    position: state.positions.find((position) => position.id === state.selectedPositionId) ?? state.positions[0],
    sessionPosition: state.positions.find((position) => position.id === state.activeSessionPositionId) ?? state.positions[0],
    sessionPoll: state.positions.find((position) => position.id === state.activeSessionPositionId)?.polls.find((poll) => poll.id === state.activeSessionPollId),
    setPosition: (positionId) => commit((current) => {
      const position = current.positions.find((item) => item.id === positionId)
      const term = position ? current.terms.find((item) => item.id === position.termId) : undefined
      return { ...current, selectedPositionId: positionId, ...(term ? { selectedChurchId: term.churchId, selectedTermId: term.id } : {}) }
    }),
    activateSession: (positionId) => commit((current) => ({ ...current, activeSessionPositionId: positionId })),
    selectPoll: (positionId, pollId) => commit((current) => ({ ...current, viewedPollIds: { ...current.viewedPollIds, [positionId]: pollId } })),
    openPollAndActivate: (positionId, pollId, closeExisting) => {
      const currentPosition = stateRef.current.positions.find((item) => item.id === positionId)
      const targetPoll = currentPosition?.polls.find((poll) => poll.id === pollId)
      if (!currentPosition || !targetPoll) return { ok: false }
      const openPollOwner = stateRef.current.positions.find((position) => position.polls.some((poll) => poll.status === 'Open' && poll.id !== pollId))
      const openPoll = openPollOwner?.polls.find((poll) => poll.status === 'Open' && poll.id !== pollId)
      if (openPoll && !closeExisting) return { ok: false, conflictPoll: openPoll }
      commit((current) => ({ ...current, activeSessionPositionId: positionId, activeSessionPollId: pollId, viewedPollIds: { ...current.viewedPollIds, [positionId]: pollId }, positions: current.positions.map((position) => ({ ...position, ...(position.id === positionId ? { phase: targetPoll.type === 'nomination' ? 'intake' : 'open' } : {}), polls: position.polls.map((poll) => poll.id === openPoll?.id ? { ...poll, status: 'Closed', closedAt: now() } : position.id === positionId && poll.id === pollId ? { ...poll, status: 'Open', openedAt: poll.openedAt ?? now() } : poll) })) }))
      return { ok: true }
    },
    selectChurch: (churchId) => commit((current) => ({ ...current, selectedChurchId: churchId, selectedTermId: current.terms.find((term) => term.churchId === churchId)?.id ?? '' })),
    selectTerm: (termId) => commit((current) => ({ ...current, selectedTermId: termId })),
    updatePosition: (positionId, update) => commit((current) => ({ ...current, positions: current.positions.map((position) => position.id === positionId ? update(position) : position) })),
    addPoll: (positionId, poll) => commit((current) => ({ ...current, positions: current.positions.map((position) => position.id === positionId ? { ...position, polls: [...position.polls, poll] } : position) })),
    updatePoll: (positionId, pollId, update) => commit((current) => ({ ...current, positions: current.positions.map((position) => position.id === positionId ? { ...position, polls: position.polls.map((poll) => poll.id === pollId ? update(poll) : poll) } : position) })),
    submitNomination: (positionId, pollId, submissions) => commit((current) => ({ ...current, positions: current.positions.map((position) => position.id === positionId ? { ...position, submissions: [...position.submissions, ...submissions], polls: position.polls.map((poll) => poll.id === pollId && poll.type === 'nomination' ? { ...poll, nominationSubmissions: [...(poll.nominationSubmissions ?? []), ...submissions] } : poll) } : position) })),
    appendDecisionEvents: (positionId, events) => commit((current) => ({ ...current, positions: current.positions.map((position) => position.id === positionId ? { ...position, decisions: [...(position.decisions ?? []), ...events] } : position) })),
    addChurch: (church) => { const churchId = id(); commit((current) => ({ ...current, churches: [...current.churches, { ...church, id: churchId }], selectedChurchId: churchId, selectedTermId: '' })); return churchId },
    updateChurch: (churchId, update) => commit((current) => ({ ...current, churches: current.churches.map((church) => church.id === churchId ? { ...church, ...update } : church) })),
    addTerm: (term) => { const termId = id(); commit((current) => ({ ...current, terms: [...current.terms, { ...term, id: termId }], selectedTermId: termId })); return termId },
    updateTerm: (termId, update) => commit((current) => ({ ...current, terms: current.terms.map((term) => term.id === termId ? { ...term, ...update } : term) })),
    addDepartment: (department) => { const departmentId = id(); commit((current) => ({ ...current, departments: [...current.departments, { ...department, id: departmentId, order: current.departments.filter((item) => item.termId === department.termId).length }] })); return departmentId },
    updateDepartment: (departmentId, update) => commit((current) => ({ ...current, departments: current.departments.map((department) => department.id === departmentId ? { ...department, ...update } : department) })),
    addPosition: (position) => { const positionId = id(); commit((current) => ({ ...current, positions: [...current.positions, { ...position, id: positionId, phase: 'intake', submissions: [], candidates: [], polls: [], decisions: [], lifecycleEvents: [], responseEvents: [], invitationEvents: [], participationVisible: false }] })); return positionId },
    updatePositionDetails: (positionId, update) => commit((current) => ({ ...current, positions: current.positions.map((position) => position.id === positionId ? { ...position, ...update } : position) })),
    addAudit: (entry) => commit((current) => ({ ...current, audit: [...current.audit, { ...entry, id: id(), at: now() }] })),
    reset: () => { localStorage.removeItem(STORAGE_KEY); commit(() => createInitialState()) },
  }), [state])
  return <StateContext.Provider value={value}>{children}</StateContext.Provider>
}

export function usePrototypeState() {
  const value = useContext(StateContext)
  if (!value) throw new Error('usePrototypeState must be used within StateProvider')
  return value
}
