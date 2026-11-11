import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ExperiencePreview } from '@/data/experience-preview'
import { VoterStateLink } from './voter-state-link'

interface VoterBallotProps {
  preview: Readonly<ExperiencePreview>
  confirmationHref: string
  onPreviewComplete: (() => void) | undefined
}

export function VoterBallot({ preview, confirmationHref, onPreviewComplete }: VoterBallotProps) {
  const [selected, setSelected] = useState<string[]>([])
  const inputGroup = useId()
  const { activePoll: poll, choiceCount } = preview
  const candidates = poll.sourceCandidateIds.map((id) => ({
    id,
    name: poll.candidateNames[id] ?? preview.position.candidates.find((candidate) => candidate.id === id)?.name,
  })).filter((candidate): candidate is { id: string; name: string } => Boolean(candidate.name))
  const available = poll.type === 'voting' && poll.status === 'Open'
    && choiceCount > 0 && candidates.length >= choiceCount
  const validSelection = selected.length === choiceCount
    && selected.every((id) => candidates.some((candidate) => candidate.id === id))

  if (!available) {
    return <p>No selectable ballot is available in this snapshot. Nothing can be submitted.</p>
  }

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id)
      if (choiceCount === 1) return [id]
      return current.length < choiceCount ? [...current, id] : current
    })
  }

  return (
    <div className="space-y-5">
      <p className="font-medium">{poll.title}</p>
      <fieldset className="min-w-0 space-y-3">
        <legend className="mb-3 text-sm">
          Select exactly {choiceCount} candidate{choiceCount === 1 ? '' : 's'} to preview confirmation.
        </legend>
        {candidates.map((candidate) => (
          <label
            key={candidate.id}
            className="flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-checked:border-primary has-checked:bg-secondary focus-within:ring-2 focus-within:ring-ring"
          >
            <input
              type={choiceCount === 1 ? 'radio' : 'checkbox'}
              name={inputGroup}
              checked={selected.includes(candidate.id)}
              disabled={choiceCount > 1 && !selected.includes(candidate.id) && selected.length >= choiceCount}
              onChange={() => toggle(candidate.id)}
              className="size-5 shrink-0 accent-primary"
            />
            <span className="min-w-0 break-words">{candidate.name}</span>
          </label>
        ))}
      </fieldset>
      <p role="status" className="text-sm text-muted-foreground">{selected.length} of {choiceCount} selected · local only</p>
      <VoterStateLink
        href={confirmationHref}
        disabled={!validSelection}
        onLocalNavigate={onPreviewComplete}
      >
        Preview confirmation — do not submit
      </VoterStateLink>
      <Button type="button" variant="ghost" className="min-h-11" disabled={selected.length === 0} onClick={() => setSelected([])}>
        Clear local selection
      </Button>
      <p className="text-sm text-muted-foreground">Selections are discarded when you leave this screen. No ballot is created.</p>
    </div>
  )
}
