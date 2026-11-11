import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { useAdminElectionSnapshot, useMockElectionStore } from '../../data/mock-election-hooks'
import { ElectionRuleError } from '../../data/mock-election-store'

export function ElectionAdminPanel() {
  const store = useMockElectionStore()
  const snapshot = useAdminElectionSnapshot()
  const [nameLimit, setNameLimit] = useState(String(snapshot.nominationNameLimit))
  const [choiceCount, setChoiceCount] = useState(String(snapshot.choiceCount))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function run(action: () => void, successMessage = '') {
    setError('')
    setNotice('')
    try {
      action()
      setNotice(successMessage)
    } catch (reason) {
      setError(reason instanceof ElectionRuleError ? reason.message : 'The requested mock action could not be completed.')
    }
  }

  return (
    <section className="election-admin-panel" aria-labelledby="election-workflow-heading">
      <header>
        <p className="workspace-eyebrow">M4 · Shared mock election</p>
        <h2 id="election-workflow-heading">Nomination and first voting poll</h2>
        <p>Changes are in-memory for this app session and reset on refresh. No submitter identities or individual ballots are available to Admin.</p>
      </header>

      {error ? <p className="workflow-feedback workflow-error" role="alert">{error}</p> : null}
      {notice ? <p className="workflow-feedback" role="status">{notice}</p> : null}

      <section className="workflow-step" aria-labelledby="nomination-setup-heading">
        <div className="workflow-step-heading">
          <div>
            <h3 id="nomination-setup-heading">1. Nomination intake</h3>
            <p>Status: <strong>{snapshot.nominationStatus}</strong></p>
          </div>
        </div>
        {snapshot.nominationStatus === 'not-created' ? (
          <div className="workflow-controls">
            <label>
              Maximum names per participant
              <input
                type="number"
                min={1}
                value={nameLimit}
                onChange={(event) => setNameLimit(event.target.value)}
              />
            </label>
            <Button type="button" variant="outline" onClick={() => run(
              () => store.configureNominationLimit(Number(nameLimit)),
              'Nomination limit saved. No poll was created or opened.',
            )}>Save name limit</Button>
            <Button type="button" onClick={() => run(
              () => store.createNominationPoll(),
              'Nomination intake created as a draft.',
            )}>Create nomination intake</Button>
          </div>
        ) : null}
        {snapshot.nominationStatus === 'draft' ? (
          <Button type="button" onClick={() => run(
            () => store.openNominationPoll(),
            'Nomination intake is open.',
          )}>Open nomination intake</Button>
        ) : null}
        {snapshot.nominationStatus === 'open' ? (
          <div className="workflow-controls">
            <p>Up to {snapshot.nominationNameLimit} free-text names per participant. Submitted names are anonymous and non-editable until intake closes.</p>
            <Button
              type="button"
              variant="outline"
              aria-pressed={snapshot.presentation.nominationNamesVisible}
              onClick={() => run(() => store.setNominationRoomVisible(!snapshot.presentation.nominationNamesVisible))}
            >{snapshot.presentation.nominationNamesVisible ? 'Hide live names on Presentation' : 'Show live names on Presentation'}</Button>
            {snapshot.nominationSubmissions.length ? (
              <ul className="workflow-name-list" aria-label="Anonymous submitted names">
                {[...snapshot.nominationSubmissions].sort((left, right) =>
                  left.localeCompare(right, undefined, { sensitivity: 'base' }) || left.localeCompare(right),
                ).map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
              </ul>
            ) : <p>No names have been submitted yet.</p>}
            <Button type="button" onClick={() => run(
              () => store.closeNominationPoll(),
              'Nomination intake is closed. Review and consolidate the anonymous names.',
            )}>Close nomination intake</Button>
          </div>
        ) : null}
        {snapshot.nominationStatus === 'closed' ? (
          <div className="workflow-controls">
            <p>Review anonymous submissions. Correct spelling or remove duplicate/variant entries manually.</p>
            <NominationReviewEditor
              key={JSON.stringify(snapshot.reviewedNames)}
              names={snapshot.reviewedNames}
              onCorrect={(index, name) => run(
                () => store.correctReviewedName(index, name),
                'Spelling correction saved.',
              )}
              onRemove={(index) => run(
                () => store.removeReviewedName(index),
                'Name removed from the review roster; original submission history remains unchanged.',
              )}
              onConfirm={(names) => run(() => {
                names.forEach((name, index) => {
                  if (name !== snapshot.reviewedNames[index]) store.correctReviewedName(index, name)
                })
                store.confirmNomineeRoster()
              }, 'Nominee roster confirmed. Voting poll setup is now available.')}
            />
            <Button
              type="button"
              variant="outline"
              aria-pressed={snapshot.presentation.nominationNamesVisible}
              onClick={() => run(() => store.publishNominationList(!snapshot.presentation.nominationNamesVisible))}
            >{snapshot.presentation.nominationNamesVisible ? 'Hide published nomination list' : 'Publish nomination list'}</Button>
          </div>
        ) : null}
        {snapshot.nominationStatus === 'confirmed' ? (
          <div className="workflow-controls">
            <h4>Confirmed nominee roster</h4>
            <ul className="workflow-name-list">
              {snapshot.nomineeRoster.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}
            </ul>
            {snapshot.votingStatus !== 'open' && snapshot.votingStatus !== 'closed' ? (
              <Button
                type="button"
                variant="outline"
                aria-pressed={snapshot.presentation.nominationNamesVisible}
                onClick={() => run(() => store.publishNominationList(!snapshot.presentation.nominationNamesVisible))}
              >{snapshot.presentation.nominationNamesVisible ? 'Hide published nomination list' : 'Publish nomination list'}</Button>
            ) : <p>The nomination list was cleared when voting started.</p>}
          </div>
        ) : null}
      </section>

      <section className="workflow-step" aria-labelledby="voting-setup-heading">
        <div className="workflow-step-heading">
          <div>
            <h3 id="voting-setup-heading">2. First voting poll</h3>
            <p>Status: <strong>{snapshot.votingStatus}</strong></p>
          </div>
        </div>
        {snapshot.nominationStatus !== 'confirmed' ? (
          <p>Confirm the nominee roster before setting up voting.</p>
        ) : null}
        {snapshot.nominationStatus === 'confirmed' && snapshot.votingStatus === 'not-created' ? (
          <div className="workflow-controls">
            <label>
              Exact distinct choices per ballot
              <input
                type="number"
                min={1}
                max={snapshot.nomineeRoster.length}
                value={choiceCount}
                onChange={(event) => setChoiceCount(event.target.value)}
              />
            </label>
            <Button type="button" onClick={() => run(
              () => store.createVotingPoll(Number(choiceCount)),
              'First voting poll created as a draft from the confirmed roster.',
            )}>Create first voting poll</Button>
          </div>
        ) : null}
        {snapshot.votingStatus === 'draft' ? (
          <Button type="button" onClick={() => run(
            () => store.openVotingPoll(),
            'Voting poll is open. Presentation visibility is hidden until enabled.',
          )}>Open voting poll</Button>
        ) : null}
        {snapshot.votingStatus === 'open' || snapshot.votingStatus === 'closed' ? (
          <div className="workflow-controls">
            <p>{snapshot.choiceCount} exact choice{snapshot.choiceCount === 1 ? '' : 's'} · {[...snapshot.position.polls].reverse().find((poll) => poll.id.startsWith('m4-') && poll.type === 'voting')?.ballotsCast ?? 0} ballots cast</p>
            <Button
              type="button"
              variant="outline"
              aria-pressed={snapshot.presentation.resultsVisible}
              onClick={() => run(() => store.setResultsVisible(!snapshot.presentation.resultsVisible))}
            >{snapshot.presentation.resultsVisible ? 'Hide aggregate results' : 'Show aggregate results'}</Button>
            <Button
              type="button"
              variant="outline"
              aria-pressed={snapshot.presentation.participationVisible}
              onClick={() => run(() => store.setParticipationVisible(!snapshot.presentation.participationVisible))}
            >{snapshot.presentation.participationVisible ? 'Hide ballots-cast participation' : 'Show ballots-cast participation'}</Button>
            {snapshot.votingStatus === 'open' ? (
              <Button type="button" onClick={() => run(
                () => store.closeVotingPoll(),
                'Voting is closed. No new or replacement ballots are accepted.',
              )}>Close voting poll</Button>
            ) : <p>The first voting poll is closed. No further polls or decisions are part of this scope.</p>}
          </div>
        ) : null}
      </section>
    </section>
  )
}

function NominationReviewEditor({
  names,
  onCorrect,
  onRemove,
  onConfirm,
}: {
  names: readonly string[]
  onCorrect: (index: number, name: string) => void
  onRemove: (index: number) => void
  onConfirm: (names: readonly string[]) => void
}) {
  const [edits, setEdits] = useState(names)

  return (
    <>
      {edits.map((name, index) => (
        <div className="workflow-name-edit" key={`review-${index}`}>
          <label>
            Anonymous name {index + 1}
            <input
              value={name}
              onChange={(event) => setEdits((current) =>
                current.map((item, itemIndex) => itemIndex === index ? event.target.value : item),
              )}
            />
          </label>
          <Button type="button" variant="outline" onClick={() => onCorrect(index, name)}>
            Save correction
          </Button>
          <Button type="button" variant="outline" onClick={() => onRemove(index)}>
            Remove duplicate / variant
          </Button>
        </div>
      ))}
      <Button type="button" onClick={() => onConfirm(edits)}>Confirm nominee roster</Button>
    </>
  )
}
