import { useEffect, useMemo, useState } from 'react'
import type { PositionReader, PositionQuery } from '../../data/position-reader'
import { PositionDataError } from '../../data/position-reader'
import { createInMemoryPositionReader } from '../../data/in-memory-position-reader'
import { getCurrentCandidateStatus } from '../../domain/position-summary'
import type { ActiveSessionSnapshot, PositionSnapshot } from '../../domain/types'
import { CandidatesView } from './candidates-view'
import { PollDetail } from './poll-detail'
import { PollHistory } from './poll-history'
import { PositionSummary } from './position-summary'
import { SessionToolbar } from './session-toolbar'

interface PositionWorkspaceProps {
  query: PositionQuery
  context: { church: string; term: string; department: string; position: string }
  reader?: PositionReader
  activeSessionOverride?: ActiveSessionSnapshot | null
}

type PositionLoadState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'error'; message: string }
  | { key: string; status: 'loaded'; snapshot: PositionSnapshot }

type SessionLoadState =
  | { key: string; status: 'loading' }
  | { key: string; status: 'error'; message: string }
  | { key: string; status: 'loaded'; activeSession: ActiveSessionSnapshot | null }

const defaultReader = createInMemoryPositionReader()

function queryKey(query: PositionQuery) {
  return `${query.churchId}:${query.termId}:${query.positionId}`
}

function sessionQueryKey(churchId: string, termId: string) {
  return `${churchId}:${termId}`
}

export function PositionWorkspace({
  query,
  context,
  reader = defaultReader,
  activeSessionOverride,
}: PositionWorkspaceProps) {
  const { churchId, termId, positionId } = query
  const key = queryKey({ churchId, termId, positionId })
  const activeSessionKey = sessionQueryKey(churchId, termId)
  const [positionAttempt, setPositionAttempt] = useState(0)
  const [sessionAttempt, setSessionAttempt] = useState(0)
  const positionRequestKey = `${key}:${positionAttempt}`
  const sessionRequestKey = `${activeSessionKey}:${sessionAttempt}`
  const [positionLoad, setPositionLoad] = useState<PositionLoadState>({
    key: positionRequestKey,
    status: 'loading',
  })
  const [sessionLoad, setSessionLoad] = useState<SessionLoadState>({
    key: sessionRequestKey,
    status: 'loading',
  })
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'polls' | 'candidates'>('polls')
  const [detailView, setDetailView] = useState<'record' | 'audit'>('record')
  useEffect(() => {
    let current = true
    void reader.getPosition({ churchId, termId, positionId }).then((snapshot) => {
      if (!current) return
      setPositionLoad({ key: positionRequestKey, status: 'loaded', snapshot })
      setSelectedPollId((selectedPollId) => selectedPollId
        && snapshot.polls.some((poll) => poll.id === selectedPollId)
        ? selectedPollId
        : snapshot.polls.find((poll) => poll.type === 'voting' && poll.status === 'Closed')?.id
          ?? snapshot.polls[0]?.id
          ?? null)
      setDetailView('record')
    }).catch((error: unknown) => {
      if (!current) return
      const message = error instanceof PositionDataError
        ? error.message
        : 'Position data could not be read. No other position or fixture was substituted.'
      setPositionLoad({ key: positionRequestKey, status: 'error', message })
    })
    return () => { current = false }
  }, [positionRequestKey, reader, churchId, termId, positionId])

  useEffect(() => {
    if (activeSessionOverride !== undefined) return
    let current = true
    void reader.getActiveSession({ churchId, termId }).then((activeSession) => {
      if (!current) return
      if (
        activeSession
        && (activeSession.churchId !== churchId || activeSession.termId !== termId)
      ) {
        throw new PositionDataError(
          'ACTIVE_SESSION_SCOPE_MISMATCH',
          'The active session is outside the requested church and term.',
        )
      }
      setSessionLoad({ key: sessionRequestKey, status: 'loaded', activeSession })
    }).catch((error: unknown) => {
      if (!current) return
      const message = error instanceof PositionDataError
        ? error.message
        : 'The active session could not be read. No other session or fixture was substituted.'
      setSessionLoad({ key: sessionRequestKey, status: 'error', message })
    })
    return () => { current = false }
  }, [sessionRequestKey, reader, churchId, termId, activeSessionOverride])

  const visiblePosition = positionLoad.key === positionRequestKey
    ? positionLoad
    : { key: positionRequestKey, status: 'loading' as const }
  const visibleSession = activeSessionOverride !== undefined
    ? { key: sessionRequestKey, status: 'loaded' as const, activeSession: activeSessionOverride }
    : sessionLoad.key === sessionRequestKey
      ? sessionLoad
      : { key: sessionRequestKey, status: 'loading' as const }
  const snapshot = visiblePosition.status === 'loaded' ? visiblePosition.snapshot : undefined
  const activeSession = visibleSession.status === 'loaded' ? visibleSession.activeSession : null
  const viewedPoll = snapshot?.polls.find((poll) => poll.id === selectedPollId)
  const summary = useMemo(() => snapshot && ({
    elected: snapshot.candidates.filter((candidate) =>
      getCurrentCandidateStatus(snapshot, candidate.id) === 'Elected',
    ).length,
  }), [snapshot])

  function selectPoll(pollId: string) {
    setSelectedPollId(pollId)
    setDetailView('record')
  }

  return (
    <div className="position-workspace">
      <header className="workspace-title">
        <div>
          <p className="workspace-eyebrow">Elections · Position workspace</p>
          <h1>Position workspace</h1>
        </div>
        {summary ? <p>{summary.elected} effective elected</p> : null}
      </header>
      {visiblePosition.status === 'loading' ? (
        <div className="workspace-loading" role="status" aria-label="Loading position workspace">
          <p>Loading {context.position} for {context.term}…</p>
          <div className="loading-skeleton" aria-label="Position summary loading" />
          <div className="loading-skeleton" aria-label="Poll history loading" />
          <div className="loading-skeleton" aria-label="Selected poll detail loading" />
        </div>
      ) : null}
      {visiblePosition.status === 'error' ? (
        <section className="workspace-error" role="alert">
          <h2>Position data unavailable</h2>
          <p>{visiblePosition.message}</p>
          <button type="button" onClick={() => setPositionAttempt((value) => value + 1)}>Retry position read</button>
        </section>
      ) : null}

      {snapshot ? <PositionSummary position={snapshot} /> : null}
      <SessionToolbar
        activeSession={activeSession}
        sessionState={visibleSession.status}
        {...(visibleSession.status === 'error' ? { sessionError: visibleSession.message } : {})}
        viewedPoll={viewedPoll}
        viewedPositionName={context.position}
        viewedPositionState={visiblePosition.status === 'loaded'
          ? 'loaded'
          : visiblePosition.status === 'error' ? 'error' : 'loading'}
        onRetrySessionRead={() => setSessionAttempt((value) => value + 1)}
      />

      {snapshot ? (
        <>
          <div className="workspace-view-switch" role="group" aria-label="Position views">
            <button type="button" aria-pressed={activeView === 'polls'} onClick={() => setActiveView('polls')}>Polls</button>
            <button type="button" aria-pressed={activeView === 'candidates'} onClick={() => setActiveView('candidates')}>Candidates</button>
          </div>
          {activeView === 'polls' ? (
            <div className="polls-layout">
              <PollHistory
                position={snapshot}
                activeSession={activeSession}
                viewedPollId={selectedPollId}
                onSelect={selectPoll}
              />
              <PollDetail
                position={snapshot}
                poll={viewedPoll}
                detailView={detailView}
                onDetailViewChange={setDetailView}
              />
            </div>
          ) : <CandidatesView position={snapshot} viewedPollId={selectedPollId} />}
        </>
      ) : null}
    </div>
  )
}
