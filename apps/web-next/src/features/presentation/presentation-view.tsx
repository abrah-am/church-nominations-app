import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getPollResults } from '../../domain/position-summary'
import type { ExperiencePreview } from '../../data/experience-preview'

export type PresentationResultsVisibility = 'hidden' | 'visible'

interface PresentationViewProps {
  preview: ExperiencePreview
  resultsVisibility: PresentationResultsVisibility
}

export function PresentationView({ preview, resultsVisibility }: PresentationViewProps) {
  const [participationVisible, setParticipationVisible] = useState(false)
  const resultsVisible = resultsVisibility === 'visible'
  const { activePoll, activeSession, churchName, position, termName } = preview
  const results = getPollResults(activePoll)
  const isVotingPoll = activePoll.type === 'voting'

  return (
    <div className="min-h-screen bg-[#102a35] text-[#f6f7f3]">
      <a
        className="sr-only rounded-md bg-white px-4 py-2 text-[#102a35] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-10"
        href="#presentation-content"
      >
        Skip to presentation
      </a>
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-5 sm:px-8 sm:py-8 lg:px-14 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-white/15 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9c5c5]">
              {churchName} <span aria-hidden="true">·</span> {termName}
            </p>
            <h1 className="mt-3 break-words text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {position.name}
            </h1>
            <p className="mt-3 break-words text-base text-[#c5d2d2] sm:text-lg">
              {position.openings} {position.openings === 1 ? 'opening' : 'openings'}
              <span aria-hidden="true"> · </span>
              {activePoll.type === 'voting' ? 'Voting' : 'Nomination'} poll {activePoll.number}
              <span aria-hidden="true"> · </span>
              {activePoll.title}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8cb5a7]/50 bg-[#284b49] px-4 py-2 text-sm font-semibold text-[#d5f0df]">
              <span className="size-2 rounded-full bg-[#9fe0b0]" aria-hidden="true" />
              Active session · {activeSession.status}
            </span>
            <span className="rounded-full border border-[#e7c77b]/40 bg-[#55472b] px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#f8e6b5]">
              Mock preview
            </span>
          </div>
        </header>

        <div
          id="presentation-content"
          tabIndex={-1}
          className="grid flex-1 content-center gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.38fr)] lg:gap-12 lg:py-12"
        >
          <section aria-labelledby="poll-display-heading" className="min-w-0">
            <div className="mb-7 flex flex-col gap-4 border-b border-white/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9c5c5]">
                  {resultsVisible ? 'Aggregate results · mock view' : 'Meeting display'}
                </p>
                <h2 id="poll-display-heading" className="mt-2 break-words text-2xl font-semibold sm:text-3xl">
                  {resultsVisible ? activePoll.title : 'Please follow the meeting instructions'}
                </h2>
              </div>
              <span className="shrink-0 text-sm font-medium text-[#c5d2d2]">
                Poll status: {activeSession.status}
              </span>
            </div>

            {resultsVisible && isVotingPoll ? (
              <div aria-live="polite" className="space-y-7">
                <p className="max-w-3xl text-lg leading-relaxed text-[#d8e1de] sm:text-xl">
                  Current aggregate results for this poll. Percentages are calculated from ballots cast.
                </p>
                <ol aria-label="Aggregate candidate results" className="space-y-6">
                  {results.map((result) => (
                    <li key={result.candidateId} className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="break-words text-lg font-semibold sm:text-2xl">{result.name}</span>
                        <span className="shrink-0 text-base font-semibold tabular-nums text-[#d5f0df] sm:text-xl">
                          {result.votes} {result.votes === 1 ? 'vote' : 'votes'}
                          <span className="px-2 text-[#a9c5c5]" aria-hidden="true">·</span>
                          {result.percentage}%
                        </span>
                      </div>
                      <div
                        aria-label={`${result.name}: ${result.votes} votes, ${result.percentage}% of ballots cast`}
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={result.percentage}
                        className="h-3 overflow-hidden rounded-full bg-white/15 sm:h-4"
                        role="progressbar"
                      >
                        <div
                          className="h-full rounded-full bg-[#a8d7b6] transition-[width]"
                          style={{ width: `${result.percentage}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <div
                aria-live="polite"
                className="flex min-h-56 flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-8 sm:min-h-72 sm:px-10"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a9c5c5]">
                  {resultsVisible ? 'Results unavailable' : 'Results are hidden'}
                </span>
                <h3 className="mt-4 max-w-3xl break-words text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
                  {resultsVisible
                    ? 'Aggregate results are not available for this poll.'
                    : 'Please wait for the next instruction.'}
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#c5d2d2] sm:text-lg">
                  {resultsVisible
                    ? 'This mock preview shows aggregate results only for voting polls.'
                    : 'Your ballot is private. This display does not show results or individual ballot information.'}
                </p>
              </div>
            )}
          </section>

          <aside aria-labelledby="preview-controls-heading" className="min-w-0">
            <div className="rounded-2xl border border-white/15 bg-[#183641] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a9c5c5]">
                View-only controls
              </p>
              <h2 id="preview-controls-heading" className="mt-2 text-xl font-semibold">
                Mock preview
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#c5d2d2]">
                Switch layouts for review. These controls do not publish results, change the session, or save settings.
              </p>
              <div className="mt-5 grid gap-3">
                <Link
                  aria-current={!resultsVisible ? 'page' : undefined}
                  className="min-h-11 rounded-lg border border-white/25 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b5e3c2] aria-[current=page]:border-[#a8d7b6] aria-[current=page]:bg-[#284b49]"
                  to="/presentation/preview?results=hidden"
                >
                  Preview hidden-results layout
                </Link>
                <Link
                  aria-current={resultsVisible ? 'page' : undefined}
                  className="min-h-11 rounded-lg border border-white/25 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b5e3c2] aria-[current=page]:border-[#a8d7b6] aria-[current=page]:bg-[#284b49]"
                  to="/presentation/preview?results=visible"
                >
                  Preview visible-results layout
                </Link>
              </div>

              {resultsVisible && isVotingPoll ? (
                <div className="mt-6 border-t border-white/15 pt-5">
                  <button
                    type="button"
                    aria-pressed={participationVisible}
                    className="min-h-11 w-full rounded-lg border border-white/25 px-4 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b5e3c2] aria-pressed:border-[#a8d7b6] aria-pressed:bg-[#284b49]"
                    onClick={() => setParticipationVisible((visible) => !visible)}
                  >
                    {participationVisible ? 'Hide' : 'Preview'} ballots-cast count
                  </button>
                  {participationVisible ? (
                    <p className="mt-4 text-sm text-[#c5d2d2]">
                      <strong className="mr-2 text-2xl tabular-nums text-white">{activePoll.ballotsCast}</strong>
                      ballots cast in this poll
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-[#a9c5c5]">
              Aggregate-only display. No individual ballots or voter identities are shown.
            </p>
          </aside>
        </div>

        <footer className="flex flex-col gap-2 border-t border-white/15 pt-4 text-xs text-[#a9c5c5] sm:flex-row sm:items-center sm:justify-between">
          <span>{churchName} · {termName}</span>
          <span>Mock display · No publication or session changes</span>
        </footer>
      </div>
    </div>
  )
}
