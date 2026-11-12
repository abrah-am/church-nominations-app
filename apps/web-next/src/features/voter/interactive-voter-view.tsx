import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { useMockElectionStore, useVoterElectionSnapshot } from '../../data/mock-election-hooks'
import { ElectionRuleError } from '../../data/mock-election-store'

export function InteractiveVoterView() {
  const store = useMockElectionStore()
  const snapshot = useVoterElectionSnapshot()
  const [names, setNames] = useState([''])
  const [selected, setSelected] = useState<readonly string[]>(snapshot.ownBallot)
  const [step, setStep] = useState<'select' | 'review'>('select')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  function submitNames() {
    setError('')
    try {
      store.submitNomination(names)
      setMessage('Your nomination was submitted and is final for this poll.')
    } catch (reason) {
      setError(reason instanceof ElectionRuleError ? reason.message : 'Your nomination could not be submitted.')
    }
  }

  function submitBallot() {
    setError('')
    try {
      store.submitBallot(selected)
      setMessage('Your ballot is confirmed. You may replace it while this same poll remains open.')
      setStep('select')
    } catch (reason) {
      setError(reason instanceof ElectionRuleError ? reason.message : 'Your ballot could not be submitted.')
    }
  }

  function toggleCandidate(id: string) {
    if (snapshot.choiceCount === 1) {
      setSelected([id])
      return
    }
    setSelected((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : current.length < snapshot.choiceCount ? [...current, id] : current)
  }

  const nominationActive = snapshot.nominationStatus === 'open'
  const votingActive = snapshot.votingStatus === 'open'
  const ownBallotNames = snapshot.ownBallot.map((id) =>
    snapshot.candidates.find((candidate) => candidate.id === id)?.name,
  ).filter((name): name is string => Boolean(name))

  return (
    <section className="interactive-view voter-interactive-view" aria-labelledby="voter-heading">
      <header>
        <p className="workspace-eyebrow">{snapshot.churchName} · {snapshot.termName}</p>
        <h1 id="voter-heading">Participant ballot</h1>
        <p>{snapshot.positionName} · {snapshot.openings} opening{snapshot.openings === 1 ? '' : 's'}</p>
      </header>
      <p className="mock-session-note">Synthetic participant session · separate from Admin's viewed context. Mock data resets on refresh.</p>
      {error ? <p className="workflow-feedback workflow-error" role="alert">{error}</p> : null}
      {message ? <p className="workflow-feedback" role="status">{message}</p> : null}

      {nominationActive ? (
        <section className="workflow-step" aria-labelledby="voter-nomination-heading">
          <h2 id="voter-nomination-heading">Nomination intake is open</h2>
          <p>Submit up to {snapshot.nominationNameLimit} free-text names once. Submission is final.</p>
          {snapshot.ownNominationSubmitted ? (
            <section aria-label="Your own submitted names">
              <h3>Your submitted names</h3>
              <ul className="workflow-name-list">{snapshot.ownNominationNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
              <p>This submission cannot be edited or submitted again.</p>
            </section>
          ) : (
            <div className="workflow-controls">
              {names.map((name, index) => (
                <label key={`nomination-input-${index}`}>
                  Name {index + 1}
                  <input
                    value={name}
                    onChange={(event) => setNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                  />
                </label>
              ))}
              {names.length < snapshot.nominationNameLimit ? (
                <Button type="button" variant="outline" onClick={() => setNames((current) => [...current, ''])}>Add another name</Button>
              ) : null}
              <Button type="button" onClick={submitNames}>Submit nominations</Button>
            </div>
          )}
        </section>
      ) : (
        <section className="workflow-step" aria-labelledby="voter-nomination-waiting">
          <h2 id="voter-nomination-waiting">Nomination status: {snapshot.nominationStatus}</h2>
          {snapshot.ownNominationSubmitted ? (
            <section aria-label="Your own submitted names">
              <h3>Your submitted names</h3>
              <ul className="workflow-name-list">{snapshot.ownNominationNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
              <p>Your submission is final.</p>
            </section>
          ) : <p>No nomination is accepting submissions. Your nomination history is not available in this participant session.</p>}
          {snapshot.publishedNomineeNames.length > 0 ? (
            <section aria-label="Published nomination list">
              <h3>Published nomination list</h3>
              <ul className="workflow-name-list">{snapshot.publishedNomineeNames.map((name, index) => <li key={`${name}-${index}`}>{name}</li>)}</ul>
            </section>
          ) : null}
        </section>
      )}

      {votingActive ? (
        <section className="workflow-step" aria-labelledby="voter-ballot-heading">
          <h2 id="voter-ballot-heading">Voting poll is open</h2>
          <p>{snapshot.pollTitle} · Select exactly {snapshot.choiceCount} distinct candidate{snapshot.choiceCount === 1 ? '' : 's'}.</p>
          {step === 'select' ? (
            <div className="workflow-controls">
              <fieldset className="interactive-choice-list">
                <legend>Your private ballot</legend>
                {snapshot.candidates.map((candidate) => (
                  <label key={candidate.id} className="interactive-choice">
                    <input
                      type={snapshot.choiceCount === 1 ? 'radio' : 'checkbox'}
                      name="current-ballot"
                      checked={selected.includes(candidate.id)}
                      disabled={snapshot.choiceCount > 1 && selected.length >= snapshot.choiceCount && !selected.includes(candidate.id)}
                      onChange={() => toggleCandidate(candidate.id)}
                    />
                    <span>{candidate.name}</span>
                  </label>
                ))}
              </fieldset>
              <p role="status">{selected.length} of {snapshot.choiceCount} selected</p>
              {snapshot.ownBallot.length > 0 ? (
                <p>Your ballot is currently submitted. Changes can be submitted as a replacement while this poll remains open.</p>
              ) : null}
              <Button type="button" disabled={selected.length !== snapshot.choiceCount} onClick={() => { setError(''); setStep('review') }}>
                Review ballot
              </Button>
            </div>
          ) : (
            <div className="workflow-controls">
              <h3>Review your ballot</h3>
              <ul className="workflow-name-list">{selected.map((id) => {
                const candidate = snapshot.candidates.find((item) => item.id === id)
                return candidate ? <li key={id}>{candidate.name}</li> : null
              })}</ul>
              <p>Only your selection is shown here. No other ballots or participant identities are available.</p>
              <Button type="button" variant="outline" onClick={() => setStep('select')}>Change selection</Button>
              <Button type="button" onClick={submitBallot}>{snapshot.ownBallot.length ? 'Confirm ballot replacement' : 'Confirm and submit ballot'}</Button>
            </div>
          )}
        </section>
      ) : (
        <section className="workflow-step" aria-labelledby="voter-poll-waiting">
          <h2 id="voter-poll-waiting">{snapshot.votingStatus === 'closed' ? 'Voting is closed' : 'Waiting for an active poll'}</h2>
          <p>{snapshot.votingStatus === 'closed'
            ? 'No new ballot or replacement can be submitted after poll closure.'
            : 'There is no active voting poll. Please follow the meeting administrator’s instructions.'}</p>
          {snapshot.ownBallot.length ? <p>Your ballot was recorded while the poll was open. Individual ballot details are not shown in this closed state.</p> : null}
        </section>
      )}

      <p className="privacy-note">Private participant view: only your own nomination names and your own ballot review are shown. No other participants, identities, or individual ballots are displayed.</p>
      {ownBallotNames.length > 0 && snapshot.votingStatus === 'open' && snapshot.ownBallot.length > 0 ? (
        <p className="visually-hidden">Your current ballot contains {ownBallotNames.join(', ')}.</p>
      ) : null}
    </section>
  )
}
