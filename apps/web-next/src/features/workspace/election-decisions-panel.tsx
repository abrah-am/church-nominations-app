import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { useAdminElectionSnapshot, useMockElectionStore } from '../../data/mock-election-hooks'
import { ElectionRuleError } from '../../data/mock-election-store'
import { getMajorityGuidance, type ElectionDecisionStatus } from '../../domain/election-decisions'
import {
  getCurrentCandidateDecisionEvent,
  getOpeningSummaries,
  getPollResults,
} from '../../domain/position-summary'
import type { CandidateResponseStatus, PositionPollSummary } from '../../domain/types'

type DraftDecision = { status: '' | ElectionDecisionStatus; openingId: string }

function isDecided(poll: PositionPollSummary, snapshot: ReturnType<typeof useAdminElectionSnapshot>) {
  return poll.recordedDecisions.length > 0
    || snapshot.position.decisions.some((event) => event.pollId === poll.id)
}

export function ElectionDecisionsPanel() {
  const store = useMockElectionStore()
  const snapshot = useAdminElectionSnapshot()
  const closedPolls = snapshot.position.polls.filter((poll) =>
    poll.type === 'voting' && poll.status === 'Closed',
  )
  const [selectedPollId, setSelectedPollId] = useState('')
  const selectedPoll = closedPolls.find((poll) => poll.id === selectedPollId)
    ?? closedPolls.find((poll) => !isDecided(poll, snapshot))
    ?? closedPolls[0]
  const [draftsByPoll, setDraftsByPoll] = useState<Record<string, Record<string, DraftDecision>>>({})
  const [decisionConfirmed, setDecisionConfirmed] = useState(false)
  const [rostersByPoll, setRostersByPoll] = useState<Record<string, string[]>>({})
  const [choiceCountsByPoll, setChoiceCountsByPoll] = useState<Record<string, number>>({})
  const [rosterConfirmed, setRosterConfirmed] = useState(false)
  const [responseSelections, setResponseSelections] = useState<Record<string, CandidateResponseStatus | ''>>({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const names = new Map(snapshot.position.candidates.map((candidate) => [candidate.id, candidate.name]))
  const openings = getOpeningSummaries(snapshot.position)
  const availableOpenings = openings.filter((opening) => !opening.electedCandidate)
  const currentDrafts = selectedPoll
    ? draftsByPoll[selectedPoll.id] ?? Object.fromEntries(
        selectedPoll.sourceCandidateIds.map((candidateId) => [
          candidateId,
          { status: '', openingId: '' } satisfies DraftDecision,
        ]),
      )
    : {}
  const selectedDecisions = selectedPoll
    ? selectedPoll.sourceCandidateIds.flatMap((candidateId) => {
        const draft = currentDrafts[candidateId]
        return draft?.status
          ? [{ candidateId, status: draft.status, ...(draft.status === 'Elected' ? { openingId: draft.openingId } : {}) }]
          : []
      })
    : []
  const savedDecisions = selectedPoll
    ? snapshot.position.decisions.filter((event) => event.pollId === selectedPoll.id)
    : []
  const advancedIds = savedDecisions
    .filter((event) => event.status === 'Advanced')
    .map((event) => event.candidateId)
  const nextRoster = selectedPoll
    ? rostersByPoll[selectedPoll.id] ?? advancedIds
    : []
  const nextChoiceCount = selectedPoll
    ? choiceCountsByPoll[selectedPoll.id] ?? selectedPoll.choiceCount ?? snapshot.choiceCount
    : 1
  const hasFollowingVotingPoll = selectedPoll
    ? snapshot.position.polls.some((poll) =>
        poll.type === 'voting' && poll.number > selectedPoll.number,
      )
    : false

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

  function updateDecision(candidateId: string, update: Partial<DraftDecision>) {
    if (!selectedPoll) return
    setDecisionConfirmed(false)
    setDraftsByPoll((current) => ({
      ...current,
      [selectedPoll.id]: {
        ...(current[selectedPoll.id] ?? currentDrafts),
        [candidateId]: {
          ...(currentDrafts[candidateId] ?? { status: '', openingId: '' }),
          ...update,
        },
      },
    }))
  }

  function recordResponse(
    candidateId: string,
    openingId: string,
    decisionEventId: string,
    status: CandidateResponseStatus,
  ) {
    run(() => store.recordCandidateResponse({
      candidateId,
      openingId,
      decisionEventId,
      status,
    }), `${status} response recorded. Prior poll and decision history remain unchanged.`)
  }

  return (
    <section className="election-admin-panel decision-admin-panel" aria-labelledby="decision-workflow-heading">
      <header>
        <p className="workspace-eyebrow">M5a · Admin decisions</p>
        <h2 id="decision-workflow-heading">Results, decisions, and candidate responses</h2>
        <p>Aggregate results and guidance are separate from saved decisions. All changes are append-only in this shared in-memory mock.</p>
      </header>

      {error ? <p className="workflow-feedback workflow-error" role="alert">{error}</p> : null}
      {notice ? <p className="workflow-feedback" role="status">{notice}</p> : null}

      <section className="workflow-step" aria-labelledby="closed-results-heading">
        <div className="workflow-step-heading">
          <div>
            <h3 id="closed-results-heading">Closed poll results and Admin decisions</h3>
            <p>Majority is strict (&gt;50% of ballots cast) and is guidance only.</p>
          </div>
        </div>
        {!closedPolls.length ? <p>No closed voting poll is available for decision review.</p> : (
          <>
            <label className="decision-poll-select">
              Closed poll
              <select
                value={selectedPoll?.id ?? ''}
                onChange={(event) => {
                  setSelectedPollId(event.target.value)
                  setDecisionConfirmed(false)
                  setRosterConfirmed(false)
                }}
              >
                {closedPolls.map((poll) => <option key={poll.id} value={poll.id}>{poll.title}</option>)}
              </select>
            </label>
            {selectedPoll ? (
              <>
                <PollAggregateTable poll={selectedPoll} />
                {isDecided(selectedPoll, snapshot) ? (
                  <section aria-label="Saved candidate decisions" className="decision-status-list">
                    <h4>Saved decisions (history)</h4>
                    <ul>
                      {selectedPoll.sourceCandidateIds.map((candidateId) => {
                        const event = savedDecisions.find((item) => item.candidateId === candidateId)
                        const legacy = selectedPoll.recordedDecisions.find((item) => item.candidateId === candidateId)
                        const status = event?.status ?? legacy?.status
                        return (
                          <li key={candidateId}>
                            <span>{names.get(candidateId) ?? selectedPoll.candidateNames[candidateId] ?? 'Unknown candidate'}</span>
                            <strong>{status === 'Declined' ? 'Declined (Legacy)' : status ?? 'No saved decision'}</strong>
                          </li>
                        )
                      })}
                    </ul>
                    {selectedPoll.recordedDecisions.some((item) => item.status === 'Declined')
                      ? <p>Legacy Declined values remain historical decisions; they are not candidate responses.</p>
                      : null}
                  </section>
                ) : (
                  <section aria-labelledby="decision-entry-heading" className="decision-entry">
                    <h4 id="decision-entry-heading">Record one explicit decision per candidate</h4>
                    <div className="decision-candidate-list">
                      {selectedPoll.sourceCandidateIds.map((candidateId) => {
                        const draft = currentDrafts[candidateId] ?? { status: '', openingId: '' }
                        return (
                          <div className="decision-candidate-row" key={candidateId}>
                            <strong>{selectedPoll.candidateNames[candidateId] ?? names.get(candidateId) ?? 'Unknown candidate'}</strong>
                            <label>
                              Decision
                              <select
                                aria-label={`${selectedPoll.candidateNames[candidateId] ?? names.get(candidateId) ?? 'Candidate'} decision`}
                                value={draft.status}
                                onChange={(event) => updateDecision(candidateId, {
                                  status: event.target.value as DraftDecision['status'],
                                  openingId: '',
                                })}
                              >
                                <option value="">Choose a decision</option>
                                <option value="Elected">Elected</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Eliminated">Eliminated</option>
                              </select>
                            </label>
                            {draft.status === 'Elected' ? (
                              <label>
                                Opening
                                <select
                                  aria-label={`${selectedPoll.candidateNames[candidateId] ?? names.get(candidateId) ?? 'Candidate'} opening`}
                                  value={draft.openingId}
                                  onChange={(event) => updateDecision(candidateId, { openingId: event.target.value })}
                                >
                                  <option value="">Choose an available opening</option>
                                  {availableOpenings.map((opening) => (
                                    <option key={opening.openingId} value={opening.openingId}>
                                      Opening {opening.number}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                    <label className="decision-confirmation">
                      <input
                        type="checkbox"
                        checked={decisionConfirmed}
                        onChange={(event) => setDecisionConfirmed(event.target.checked)}
                      />
                      I reviewed and explicitly confirm these candidate decisions.
                    </label>
                    <Button
                      type="button"
                      disabled={!decisionConfirmed}
                      onClick={() => {
                        setSelectedPollId(selectedPoll.id)
                        run(() => store.recordCandidateDecisions(selectedPoll.id, selectedDecisions), 'Candidate decisions saved. No poll was created.')
                      }}
                    >Save confirmed decisions</Button>
                  </section>
                )}
              </>
            ) : null}
          </>
        )}
      </section>

      {selectedPoll && advancedIds.length > 0 && !hasFollowingVotingPoll
        && !snapshot.position.polls.some((poll) => poll.sourcePollId === selectedPoll.id) ? (
        <section className="workflow-step" aria-labelledby="next-poll-heading">
          <h3 id="next-poll-heading">Create Next Poll</h3>
          <p>Advanced candidates are preselected. Review the roster; creating a draft is a separate confirmed action.</p>
          <fieldset className="next-poll-roster">
            <legend>Review Advanced candidates</legend>
            {advancedIds.map((candidateId) => {
              const checkedIds = rostersByPoll[selectedPoll.id] ?? advancedIds
              return (
                <label key={candidateId}>
                  <input
                    type="checkbox"
                    checked={checkedIds.includes(candidateId)}
                    onChange={(event) => {
                      setRosterConfirmed(false)
                      setRostersByPoll((current) => ({
                        ...current,
                        [selectedPoll.id]: event.target.checked
                          ? [...checkedIds, candidateId]
                          : checkedIds.filter((id) => id !== candidateId),
                      }))
                    }}
                  />
                  {names.get(candidateId) ?? selectedPoll.candidateNames[candidateId] ?? 'Unknown candidate'}
                </label>
              )
            })}
          </fieldset>
          <label className="next-poll-choice-count">
            Exact distinct choices per ballot
            <input
              type="number"
              min={1}
              max={nextRoster.length}
              value={nextChoiceCount}
              onChange={(event) => setChoiceCountsByPoll((current) => ({
                ...current,
                [selectedPoll.id]: Number(event.target.value),
              }))}
            />
          </label>
          <label className="decision-confirmation">
            <input
              type="checkbox"
              checked={rosterConfirmed}
              onChange={(event) => setRosterConfirmed(event.target.checked)}
            />
            I reviewed and confirm this next-poll roster.
          </label>
          <Button
            type="button"
            disabled={!rosterConfirmed
              || !nextRoster.length
              || nextChoiceCount < 1
              || nextChoiceCount > nextRoster.length}
            onClick={() => run(
              () => store.createNextPoll(selectedPoll.id, nextRoster, nextChoiceCount),
              'Next poll created as a fresh draft with zero votes.',
            )}
          >Confirm and create next poll</Button>
        </section>
      ) : null}

      <section className="workflow-step" aria-labelledby="candidate-responses-heading">
        <h3 id="candidate-responses-heading">Opening responses</h3>
        <p>Only an Accepted response fills an opening. Each response belongs to its specific Elected decision.</p>
        {openings.map((opening) => {
          const candidate = opening.electedCandidate
          const decision = candidate
            ? getCurrentCandidateDecisionEvent(snapshot.position, candidate.id)
            : undefined
          const latest = opening.latestResponse
          const displayStatus = opening.filled
            ? 'Filled · Accepted'
            : latest?.status === 'Declined'
              ? 'Vacancy · Declined'
              : latest?.status ?? (candidate ? 'Awaiting Acceptance' : 'Unfilled')
          return (
            <article className="opening-response-card" key={opening.openingId}>
              <div>
                <h4>Opening {opening.number}</h4>
                <p>{candidate?.name ?? 'No Elected candidate'} · <strong>{displayStatus}</strong></p>
              </div>
              {opening.responseHistory.length ? (
                <details>
                  <summary>Response history ({opening.responseHistory.length})</summary>
                  <ol>
                    {opening.responseHistory.map((event) => (
                      <li key={event.id}>
                        {names.get(event.candidateId) ?? event.candidateId}: {event.status}
                        <time dateTime={event.respondedAt}>{event.respondedAt}</time>
                      </li>
                    ))}
                  </ol>
                </details>
              ) : null}
              {candidate && decision && !latest ? (
                <div className="workflow-controls">
                  <label>
                    Candidate response for {candidate.name}
                    <select
                      value={responseSelections[decision.id] ?? ''}
                      onChange={(event) => setResponseSelections((current) => ({
                        ...current,
                        [decision.id]: event.target.value as CandidateResponseStatus | '',
                      }))}
                    >
                      <option value="">Choose Accepted or Declined</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </label>
                  <Button
                    type="button"
                    disabled={!responseSelections[decision.id]}
                    onClick={() => recordResponse(
                      candidate.id,
                      opening.openingId,
                      decision.id,
                      responseSelections[decision.id] as CandidateResponseStatus,
                    )}
                  >Record candidate response</Button>
                </div>
              ) : null}
            </article>
          )
        })}
      </section>
    </section>
  )
}

function PollAggregateTable({ poll }: { poll: PositionPollSummary }) {
  const guidance = getMajorityGuidance(poll)
  const qualified = new Set(guidance.qualifiedCandidateIds)
  const results = getPollResults(poll)
  return (
    <section aria-label={`${poll.title} aggregate results`}>
      <p className="majority-guidance">
        {guidance.ballotsCast} ballots cast · strict majority requires {guidance.requiredVotes} vote{guidance.requiredVotes === 1 ? '' : 's'}.
        {guidance.qualifiedCandidateIds.length
          ? ` Qualified for Admin review: ${guidance.qualifiedCandidateIds.map((id) => poll.candidateNames[id] ?? id).join(', ')}.`
          : ' No candidate reached strict-majority qualification.'}
        {' '}This indicator never records an Elected outcome.
      </p>
      <table className="result-table">
        <caption className="visually-hidden">Aggregate results and majority guidance for {poll.title}</caption>
        <thead>
          <tr><th scope="col">Candidate</th><th scope="col">Votes · share of ballots cast</th><th scope="col">Majority guidance</th></tr>
        </thead>
        <tbody>
          {results.map((result) => (
            <tr key={result.candidateId}>
              <th scope="row">{result.name}</th>
              <td><span>{result.votes} {result.votes === 1 ? 'vote' : 'votes'} · {result.percentage}%</span></td>
              <td>{qualified.has(result.candidateId) ? 'Qualified' : 'Not qualified'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
