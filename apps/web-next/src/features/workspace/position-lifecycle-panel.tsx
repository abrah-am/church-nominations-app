import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { useAdminElectionSnapshot, useMockElectionStore } from '../../data/mock-election-hooks'
import { ElectionRuleError } from '../../data/mock-election-store'
import {
  canReopenPosition,
  getFinalizationBlockers,
  getOpeningSummaries,
  getPositionLifecycle,
} from '../../domain/position-summary'
import { getDirectReplacementRecommendation, getHistoricalReplacementNames } from '../../domain/replacement-rules'

export function PositionLifecyclePanel() {
  const store = useMockElectionStore()
  const snapshot = useAdminElectionSnapshot()
  const [finalizeConfirmed, setFinalizeConfirmed] = useState(false)
  const [reopenConfirmed, setReopenConfirmed] = useState(false)
  const [inviteConfirmed, setInviteConfirmed] = useState<Record<string, boolean>>({})
  const [tieConfirmed, setTieConfirmed] = useState<Record<string, boolean>>({})
  const [manualConfirmed, setManualConfirmed] = useState<Record<string, boolean>>({})
  const [selectedNames, setSelectedNames] = useState<Record<string, string[]>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [choiceCounts, setChoiceCounts] = useState<Record<string, number>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const openings = getOpeningSummaries(snapshot.position)
  const blockers = getFinalizationBlockers(snapshot.position)
  const votingDraftOrOpen = snapshot.votingStatus === 'open'
    || snapshot.votingStatus === 'draft'
    || snapshot.position.polls.some((poll) => poll.type === 'voting' && (poll.status === 'Open' || poll.status === 'Draft'))
  const historicalNames = getHistoricalReplacementNames(snapshot.position)
  const finalized = getPositionLifecycle(snapshot.position) === 'Finalized'

  function run(action: () => void, successMessage: string) {
    setError('')
    setNotice('')
    try {
      action()
      setNotice(successMessage)
    } catch (reason) {
      setError(reason instanceof ElectionRuleError
        ? reason.message
        : 'The requested mock action could not be completed.')
    }
  }

  return (
    <section className="election-admin-panel" aria-labelledby="lifecycle-heading">
      <header>
        <p className="workspace-eyebrow">M5b · Position lifecycle</p>
        <h2 id="lifecycle-heading">Finalization, reopen, and replacement</h2>
        <p>Lifecycle changes are explicit and audited. Recommendations never send an invitation or create a poll by themselves.</p>
      </header>
      {error ? <p className="workflow-feedback workflow-error" role="alert">{error}</p> : null}
      {notice ? <p className="workflow-feedback" role="status">{notice}</p> : null}

      <section className="workflow-step" aria-labelledby="finalization-heading">
        <h3 id="finalization-heading">Position lifecycle</h3>
        <p>Current lifecycle: <strong>{getPositionLifecycle(snapshot.position)}</strong></p>
        {finalized ? (
          <div className="workflow-controls">
            <p>Reopen preserves prior polls, decisions, responses, and results. It does not create or start a poll.</p>
            <label className="decision-confirmation">
              <input type="checkbox" checked={reopenConfirmed} onChange={(event) => setReopenConfirmed(event.target.checked)} />
              I confirm reopening this finalized position.
            </label>
            <Button
              type="button"
              disabled={!reopenConfirmed || !canReopenPosition(snapshot.position)}
              onClick={() => run(() => store.reopenPosition(), 'Position reopened. No poll was created or started.')}
            >Reopen position</Button>
          </div>
        ) : (
          <div className="workflow-controls">
            {blockers.length ? (
              <ul aria-label="Finalization requirements">
                {blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
              </ul>
            ) : <p>All openings are Accepted and no poll is open.</p>}
            <label className="decision-confirmation">
              <input
                type="checkbox"
                checked={finalizeConfirmed}
                onChange={(event) => setFinalizeConfirmed(event.target.checked)}
              />
              I confirm finalizing this position.
            </label>
            <Button
              type="button"
              disabled={!finalizeConfirmed || blockers.length > 0 || snapshot.votingStatus === 'open'}
              onClick={() => run(
                () => store.finalizePosition(),
                'Position finalized. Participant activity is neutral, and Presentation publication is unchanged.',
              )}
            >Finalize position</Button>
          </div>
        )}
      </section>

      {openings.filter((opening) => opening.condition === 'Vacancy').map((opening) => {
        const recommendation = getDirectReplacementRecommendation(snapshot.position, opening.openingId)
        const names = selectedNames[opening.openingId] ?? []
        const choiceCount = choiceCounts[opening.openingId] ?? 1
        return (
          <section className="workflow-step" key={opening.openingId} aria-labelledby={`replacement-${opening.openingId}`}>
            <h3 id={`replacement-${opening.openingId}`}>Opening {opening.number} replacement</h3>
            <p>{opening.electedCandidate?.name ?? 'No candidate'} declined. The prior decision and poll remain unchanged.</p>
            <p>{recommendation.reason}</p>
            {recommendation.ranked.length ? (
              <ol aria-label={`Ranked recommendations for opening ${opening.number}`}>
                {recommendation.ranked.map((candidate) => (
                  <li key={candidate.candidateId}>{candidate.name} · {candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'}</li>
                ))}
              </ol>
            ) : null}
            {recommendation.outcome === 'unique' ? (
              <div className="workflow-controls">
                <label className="decision-confirmation">
                  <input
                    type="checkbox"
                    checked={inviteConfirmed[opening.openingId] ?? false}
                    onChange={(event) => setInviteConfirmed((current) => ({ ...current, [opening.openingId]: event.target.checked }))}
                  />
                  I explicitly invite the recommended candidate. This does not create a poll.
                </label>
                <Button
                  type="button"
                  disabled={!inviteConfirmed[opening.openingId]}
                  onClick={() => run(
                    () => store.inviteReplacement(opening.openingId, recommendation.candidateIds[0]!),
                    'Replacement invitation recorded. No offer was sent automatically.',
                  )}
                >Invite recommended candidate</Button>
              </div>
            ) : null}
            {recommendation.outcome === 'tie' ? (
              <div className="workflow-controls">
                <p>Tie-break candidates: {recommendation.candidateIds.map((id) => recommendation.ranked.find((candidate) => candidate.candidateId === id)?.name ?? id).join(', ')}.</p>
                <label className="decision-confirmation">
                  <input
                    type="checkbox"
                    checked={tieConfirmed[opening.openingId] ?? false}
                    onChange={(event) => setTieConfirmed((current) => ({ ...current, [opening.openingId]: event.target.checked }))}
                  />
                  I confirm a fresh tie-break draft containing only the tied candidates.
                </label>
                <Button
                  type="button"
                  disabled={!tieConfirmed[opening.openingId] || votingDraftOrOpen}
                  onClick={() => run(
                    () => store.createTieBreakPoll(opening.openingId),
                    'Tie-break draft created with zero votes. It was not opened.',
                  )}
                >Create tie-break draft</Button>
                {votingDraftOrOpen ? <p>Close or finish the current voting poll before creating another.</p> : null}
              </div>
            ) : null}

            <div className="workflow-controls">
              <h4>Manual replacement roster</h4>
              {historicalNames.length ? (
                <>
                  <fieldset>
                    <legend>Historical names for this position</legend>
                    {historicalNames.map((name) => (
                      <label key={`${opening.openingId}-${name}`}>
                        <input
                          type="checkbox"
                          checked={names.includes(name)}
                          onChange={(event) => {
                            setManualConfirmed((current) => ({ ...current, [opening.openingId]: false }))
                            setSelectedNames((current) => ({
                              ...current,
                              [opening.openingId]: event.target.checked
                                ? [...names, name]
                                : names.filter((item) => item !== name),
                            }))
                          }}
                        />
                        {name}
                      </label>
                    ))}
                  </fieldset>
                  <label>
                    Audited reason
                    <textarea
                      value={reasons[opening.openingId] ?? ''}
                      onChange={(event) => {
                        setManualConfirmed((current) => ({ ...current, [opening.openingId]: false }))
                        setReasons((current) => ({ ...current, [opening.openingId]: event.target.value }))
                      }}
                    />
                  </label>
                  <label>
                    Exact distinct choices per ballot
                    <input
                      type="number"
                      min={1}
                      max={Math.max(names.length, 1)}
                      value={choiceCount}
                      onChange={(event) => setChoiceCounts((current) => ({
                        ...current,
                        [opening.openingId]: Number(event.target.value),
                      }))}
                    />
                  </label>
                  <label className="decision-confirmation">
                    <input
                      type="checkbox"
                      checked={manualConfirmed[opening.openingId] ?? false}
                      onChange={(event) => setManualConfirmed((current) => ({ ...current, [opening.openingId]: event.target.checked }))}
                    />
                    I confirm this unfiltered historical roster and reason.
                  </label>
                  <Button
                    type="button"
                    disabled={!manualConfirmed[opening.openingId] || !names.length || !(reasons[opening.openingId] ?? '').trim() || votingDraftOrOpen}
                    onClick={() => run(
                      () => store.createManualReplacementPoll(
                        opening.openingId,
                        names,
                        choiceCount,
                        reasons[opening.openingId] ?? '',
                      ),
                      'Replacement draft created with zero votes. Prior records were not changed.',
                    )}
                  >Create replacement draft</Button>
                </>
              ) : (
                <p>No historical names exist for this position. Vacancy remains until a candidate source is separately approved. No empty poll will be created.</p>
              )}
            </div>
          </section>
        )
      })}
    </section>
  )
}
