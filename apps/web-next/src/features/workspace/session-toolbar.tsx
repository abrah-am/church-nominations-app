import { useState } from 'react'
import type { ActiveSessionSnapshot, PositionSnapshot } from '../../domain/types'

type MockPreview = 'qr' | 'participant' | 'presentation'
type CopyText = (text: string) => Promise<void>

interface SessionToolbarProps {
  activeSession: ActiveSessionSnapshot | null
  sessionState: 'loading' | 'error' | 'loaded'
  sessionError?: string
  viewedPoll: PositionSnapshot['polls'][number] | undefined
  viewedPositionName: string
  viewedPositionState: 'loading' | 'error' | 'loaded'
  onRetrySessionRead: () => void
  copyText?: CopyText
}

export function SessionToolbar({
  activeSession,
  sessionState,
  sessionError,
  viewedPoll,
  viewedPositionName,
  viewedPositionState,
  onRetrySessionRead,
  copyText,
}: SessionToolbarProps) {
  const [preview, setPreview] = useState<MockPreview | null>(null)
  const [copyMessage, setCopyMessage] = useState('')
  const active = activeSession

  async function copyMockReference() {
    const write = copyText ?? (async (text: string) => {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable')
      await navigator.clipboard.writeText(text)
    })
    try {
      await write('MOCK ONLY — no participant access link')
      setCopyMessage('Mock-only text copied. It is not an access link.')
    } catch {
      setCopyMessage('Could not copy the mock-only text. No link was copied.')
    }
  }

  return (
    <section className="session-toolbar" aria-labelledby="session-toolbar-heading">
      <div className="session-toolbar-heading">
        <div>
          <p className="workspace-eyebrow">Separate from administrator viewing</p>
          <h2 id="session-toolbar-heading">Active participant session</h2>
        </div>
        <span className="mock-label">MOCK ONLY</span>
      </div>
      <div className="session-identities">
        <p><strong>Active session:</strong> {sessionState === 'loading'
          ? 'Loading active session…'
          : sessionState === 'error'
            ? 'Unavailable'
            : active
          ? `${active.positionName} · ${active.pollTitle.replace(`${active.positionName} · `, '')} · ${active.status}`
          : 'No active participant session'}</p>
        <p><strong>Viewed poll:</strong> {viewedPoll
          ? `${viewedPoll.title} · ${viewedPoll.status}`
          : viewedPositionState === 'loading'
            ? `Loading ${viewedPositionName} poll view…`
            : viewedPositionState === 'error'
              ? `Unavailable · ${viewedPositionName}`
              : 'No poll selected'}</p>
      </div>
      {sessionState === 'error' ? (
        <div className="session-read-error" role="alert">
          <p>{sessionError ?? 'The active session could not be read.'}</p>
          <button type="button" onClick={onRetrySessionRead}>Retry active session read</button>
        </div>
      ) : null}
      {sessionState === 'loaded' && activeSession ? (
        <div className="mock-actions" aria-label="Mock-only previews">
          <button type="button" onClick={() => void copyMockReference()}>Copy MOCK reference</button>
          <button type="button" onClick={() => { setPreview('qr'); setCopyMessage('') }}>QR MOCK preview</button>
          <button type="button" onClick={() => { setPreview('participant'); setCopyMessage('') }}>Participant MOCK preview</button>
          <button type="button" onClick={() => { setPreview('presentation'); setCopyMessage('') }}>Presentation MOCK preview</button>
        </div>
      ) : null}
      {copyMessage ? <p role="status" className="mock-feedback">{copyMessage}</p> : null}
      {preview ? (
        <div className="mock-preview" role="status">
          <p><strong>MOCK ONLY · {preview === 'qr' ? 'QR' : preview} preview</strong></p>
          <p>This informational preview does not create a QR code, access link, viewer, or publication.</p>
          {sessionState === 'loaded' && active ? <p>Active session remains {active.positionName} · {active.pollTitle.replace(`${active.positionName} · `, '')} · {active.status}.</p> : null}
          <button type="button" className="text-button" onClick={() => setPreview(null)}>Dismiss mock preview</button>
        </div>
      ) : null}
    </section>
  )
}
