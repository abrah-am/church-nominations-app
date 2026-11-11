import { useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { createInMemoryPositionReader } from '../../data/in-memory-position-reader'
import { mockChurchContexts, type ViewingContextSelection } from '../../data/mock-admin-context'
import { useAdminElectionSnapshot } from '../../data/mock-election-hooks'
import { getActiveSession } from '../../data/mock-election-store'
import { ElectionAdminPanel } from './election-admin-panel'
import { PositionWorkspace } from './position-workspace'

function findLabel<T extends { id: string; label: string }>(items: readonly T[], id: string | null) {
  return items.find((item) => item.id === id)?.label
}

export function WorkspaceRoute() {
  const selection = useOutletContext<ViewingContextSelection>()
  const election = useAdminElectionSnapshot()
  const church = mockChurchContexts.find((item) => item.id === selection.churchId)
  const term = church?.terms.find((item) => item.id === selection.termId)
  const department = term?.departments.find((item) => item.id === selection.departmentId)
  const selectedPosition = department?.positions.find((item) => item.id === selection.positionId)
  const isWorkflowPosition = selection.positionId === election.position.id
  const activeSession = getActiveSession(election)
  const isWorkflowScope = selection.churchId === election.position.churchId
    && selection.termId === election.position.termId
  const reader = useMemo(() => {
    if (!isWorkflowPosition) return undefined
    return createInMemoryPositionReader([election.position])
  }, [election.position, isWorkflowPosition])

  if (!selection.churchId || !selection.termId || !selection.positionId) {
    return (
      <section className="workspace-error" role="alert">
        <h1>Position context unavailable</h1>
        <p>Select a Church, Term, and Position context to request its read-only workspace. No other context was substituted.</p>
      </section>
    )
  }

  return (
    <>
      {isWorkflowPosition ? <ElectionAdminPanel /> : null}
      <PositionWorkspace
        query={{ churchId: selection.churchId, termId: selection.termId, positionId: selection.positionId }}
        context={{
          church: church?.label ?? selection.churchId,
          term: term?.label ?? selection.termId,
          department: findLabel(term?.departments ?? [], selection.departmentId) ?? selection.departmentId ?? 'Unavailable',
          position: selectedPosition?.label ?? selection.positionId,
        }}
        {...(reader ? { reader } : {})}
        {...(isWorkflowScope ? { activeSessionOverride: activeSession } : {})}
      />
    </>
  )
}
