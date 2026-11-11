import { useId, useState } from 'react'
import type { ExperiencePreview } from '@/data/experience-preview'
import { VoterBallot } from './voter-ballot'
import { VoterNomination } from './voter-nomination'
import { VoterStateLink } from './voter-state-link'

export type VoterPreviewState =
  | 'nomination'
  | 'voting'
  | 'confirmation'
  | 'waiting'
  | 'closed'

export interface VoterViewProps {
  preview: Readonly<ExperiencePreview>
  /** Initial local scenario only; never activates or changes a poll. */
  initialState?: VoterPreviewState
  /** Optional route-wrapper ownership; parsing/validation stays in the wrapper. */
  navigation?: {
    state: VoterPreviewState
    hrefForState: (state: VoterPreviewState) => string
  }
}

const states: { value: VoterPreviewState; label: string; heading: string }[] = [
  { value: 'nomination', label: 'Nomination', heading: 'Nomination preview' },
  { value: 'voting', label: 'Voting', heading: 'Participate in voting' },
  { value: 'confirmation', label: 'Confirmation', heading: 'Preview complete — nothing submitted' },
  { value: 'waiting', label: 'Waiting', heading: 'Nothing to submit right now' },
  { value: 'closed', label: 'Closed', heading: 'Thank you for participating' },
]

/**
 * Isolated M3 viewer. Local scenario changes unmount the ballot and discard
 * selections. Only explicit voter-safe fields are rendered, never the snapshot
 * as a whole (which also contains Admin-only data).
 */
export function VoterView({ preview, initialState = 'voting', navigation }: VoterViewProps) {
  const [localState, setState] = useState<VoterPreviewState>(initialState)
  const state = navigation?.state ?? localState
  const headingId = useId()
  const currentState = states.find((item) => item.value === state)!
  const hrefForState = navigation?.hrefForState ?? ((value: VoterPreviewState) => `?state=${value}`)
  const localNavigate = (value: VoterPreviewState) => navigation ? undefined : () => setState(value)

  return (
    <section aria-label="Voter preview" className="mx-auto w-full min-w-0 max-w-2xl space-y-6 p-4 text-foreground sm:p-6">
      <aside aria-label="Preview notice" className="space-y-2 rounded-xl border border-primary bg-secondary p-4">
        <p className="text-sm font-bold uppercase tracking-wide">Mock preview · no submission</p>
        <p className="text-sm">
          Nothing is submitted or saved. Choices exist only in this local view.
          Changing screens does not open, close, or change the shared poll.
        </p>
      </aside>

      <header className="min-w-0 space-y-2 break-words">
        <p className="text-sm text-muted-foreground">{preview.churchName} · {preview.termName}</p>
        <h1 className="text-2xl font-semibold">Participant preview</h1>
        <p>{preview.position.name} · {preview.position.openings} opening{preview.position.openings === 1 ? '' : 's'}</p>
        <p className="text-sm text-muted-foreground">
          Shared current poll: {preview.activePoll.title} · {preview.activePoll.status} (unchanged)
        </p>
      </header>

      <nav aria-label="Preview screens" className="flex flex-wrap gap-2">
        {states.map((item) => (
          <VoterStateLink
            key={item.value}
            href={hrefForState(item.value)}
            current={state === item.value}
            onLocalNavigate={localNavigate(item.value)}
          >
            {item.label}
          </VoterStateLink>
        ))}
      </nav>

      <section aria-labelledby={headingId} className="min-w-0 space-y-5 break-words rounded-xl border border-border bg-card p-4 sm:p-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {currentState.label} scenario · preview only
          </p>
          <h2 id={headingId} aria-live="polite" className="text-xl font-semibold">{currentState.heading}</h2>
        </div>

        {state === 'nomination' && <VoterNomination preview={preview} />}
        {state === 'voting' && (
          <VoterBallot
            key={preview.activePoll.id}
            preview={preview}
            confirmationHref={hrefForState('confirmation')}
            onPreviewComplete={localNavigate('confirmation')}
          />
        )}
        {state === 'confirmation' && (
          <div className="space-y-4">
            <p>This is a confirmation example, not a receipt. No nomination or ballot has been recorded.</p>
            <VoterStateLink href={hrefForState('voting')} onLocalNavigate={localNavigate('voting')}>
              Return to voting preview
            </VoterStateLink>
          </div>
        )}
        {state === 'waiting' && (
          <div className="space-y-2">
            <p className="font-medium">No active poll — waiting example</p>
            <p>Please follow the instructions shown by your meeting administrator.</p>
            <p className="text-sm text-muted-foreground">This scenario does not deactivate the shared current poll.</p>
          </div>
        )}
        {state === 'closed' && (
          <div className="space-y-2">
            <p className="font-medium">Poll closed — example</p>
            <p>This example shows a poll that is no longer accepting submissions. Results are not displayed here.</p>
            <p className="text-sm text-muted-foreground">The shared current poll remains unchanged.</p>
          </div>
        )}
      </section>
      <p className="text-sm text-muted-foreground">
        Private participant view: no voter identities, other submitters, individual ballots, or aggregate results are displayed.
      </p>
    </section>
  )
}
