import type { ExperiencePreview } from '@/data/experience-preview'

export function VoterNomination({ preview }: { preview: Readonly<ExperiencePreview> }) {
  const nominationPoll = preview.position.polls.find((poll) => poll.type === 'nomination')
  const remaining = Math.max(0, preview.nominationNameLimit - preview.voterOwnSubmittedNames.length)

  return (
    <div className="space-y-4">
      {nominationPoll && (
        <p className="text-sm text-muted-foreground">
          Nomination example context: {nominationPoll.title} · {nominationPoll.status}
        </p>
      )}
      <p>
        Up to {preview.nominationNameLimit} names per participant.
        {' '}{remaining} remaining in this mock example.
      </p>
      <section aria-label="Your own submitted names" className="space-y-3 rounded-lg bg-muted p-4">
        <h3 className="font-semibold">Your own submitted names · mock snapshot</h3>
        {preview.voterOwnSubmittedNames.length > 0 ? (
          <ul className="list-inside list-disc space-y-2">
            {preview.voterOwnSubmittedNames.map((name, index) => <li key={index}>{name}</li>)}
          </ul>
        ) : <p>No names submitted in this mock snapshot.</p>}
      </section>
      <p className="text-sm text-muted-foreground">
        Read-only nomination example. Name entry and submission are not enabled.
        Other participants’ nominations are never displayed here.
      </p>
    </div>
  )
}
