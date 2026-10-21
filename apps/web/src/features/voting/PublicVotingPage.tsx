import { FormEvent, useEffect, useState } from 'react';
import {
  getPublicPoll,
  getVotingDeviceToken,
  submitPublicBallot,
  VotingApiError,
} from '../../api/voting';

export default function PublicVotingPage({ accessToken }: { accessToken: string }) {
  const [deviceToken] = useState(getVotingDeviceToken);
  const [poll, setPoll] = useState<Awaited<ReturnType<typeof getPublicPoll>> | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getPublicPoll(accessToken, deviceToken).then((loaded) => {
      if (!isCurrent) return;
      setPoll(loaded);
      const previousChoices = [...new Set(loaded.submittedCandidateIds)]
        .filter((candidateId) => loaded.candidates.some((candidate) => candidate.id === candidateId));
      setSelectedCandidateIds(previousChoices);
      setHasSubmitted(previousChoices.length > 0);
    }).catch((requestError: unknown) => {
      if (!isCurrent) return;
      if (requestError instanceof VotingApiError && requestError.status === 404) setIsInactive(true);
      else setError('Could not load this ballot. Please try again.');
    }).finally(() => {
      if (isCurrent) setIsLoading(false);
    });
    return () => { isCurrent = false; };
  }, [accessToken, deviceToken]);

  async function submitBallot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!poll || selectedCandidateIds.length !== poll.selectionCount) return;
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      await submitPublicBallot(accessToken, deviceToken, selectedCandidateIds);
      setHasSubmitted(true);
      setSaved(true);
    } catch (requestError) {
      if (requestError instanceof VotingApiError && requestError.status === 404) {
        setIsInactive(true);
        setPoll(null);
      } else setError('Could not save this ballot. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="app-shell public-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Church Nominations home" onClick={(event) => event.preventDefault()}>
          <span className="mark" aria-hidden="true">C</span><span>Church Nominations</span>
        </a>
        <span className="environment-label">PRIVATE BALLOT</span>
      </header>
      <section className="public-nomination" aria-labelledby="public-voting-title">
        {isLoading ? <p className="state-message" role="status">Loading ballot…</p> : isInactive ? (
          <div className="public-state"><p className="eyebrow">Private ballot</p><h1 id="public-voting-title">Poll is not active</h1><p className="intro">Poll is not active.</p></div>
        ) : poll && (
          <>
            <div className="public-state">
              <p className="eyebrow">Private ballot</p>
              <h1 id="public-voting-title">{poll.positionName}</h1>
              <p className="intro">{poll.departmentName}</p>
              <p className="public-instructions">Select exactly {poll.selectionCount} {poll.selectionCount === 1 ? 'candidate' : 'candidates'}. Your choices are private.</p>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
            <form className="public-ballot-form" onSubmit={submitBallot}>
              <fieldset className="round-candidates public-ballot-candidates" disabled={isSaving}>
                <legend>Choose your candidates</legend>
                {poll.candidates.map((candidate) => (
                  <label key={candidate.id}>
                    <input
                      type="checkbox"
                      checked={selectedCandidateIds.includes(candidate.id)}
                      onChange={(event) => {
                        setSaved(false);
                        setSelectedCandidateIds((current) => event.target.checked
                          ? [...current, candidate.id]
                          : current.filter((candidateId) => candidateId !== candidate.id));
                      }}
                    />
                    <span>{candidate.name}</span>
                  </label>
                ))}
              </fieldset>
              <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving || selectedCandidateIds.length !== poll.selectionCount}>{isSaving ? 'Saving…' : hasSubmitted ? 'Replace my ballot' : 'Submit private ballot'}</button></div>
              {saved && <p className="state-message" role="status">Ballot saved. You can replace your choices while voting is active.</p>}
            </form>
          </>
        )}
        {error && !isLoading && !poll && !isInactive && <p className="error-message" role="alert">{error}</p>}
      </section>
      <footer className="page-footer"><span>Private by design</span><span className="footer-divider" aria-hidden="true" /><span>Private ballot</span></footer>
    </main>
  );
}