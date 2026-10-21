import { FormEvent, useEffect, useState } from 'react';
import {
  getNominationDeviceToken,
  getPublicNominationIntake,
  NominationsApiError,
  PublicNominationIntake,
  savePublicNominationSubmission,
} from '../../api/nominations';

export default function PublicNominationPage({ accessToken }: { accessToken: string }) {
  const [deviceToken] = useState(getNominationDeviceToken);
  const [intake, setIntake] = useState<PublicNominationIntake | null>(null);
  const [names, setNames] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getPublicNominationIntake(accessToken, deviceToken).then((loaded) => {
      if (!isCurrent) return;
      setIntake(loaded);
      setNames(loaded.submittedNames.length > 0 ? loaded.submittedNames : ['']);
    }).catch((requestError: unknown) => {
      if (!isCurrent) return;
      if (requestError instanceof NominationsApiError && requestError.status === 404) setUnavailable(true);
      else if (requestError instanceof NominationsApiError && requestError.status === 410) setClosed(true);
      else setError(requestError instanceof Error ? requestError.message : 'Could not load this nomination intake.');
    }).finally(() => {
      if (isCurrent) setIsLoading(false);
    });
    return () => { isCurrent = false; };
  }, [accessToken, deviceToken]);

  const enteredNames = names.map((name) => name.trim()).filter(Boolean);
  const exceedsLimit = Boolean(intake && enteredNames.length > intake.nameLimit);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intake || exceedsLimit || enteredNames.length === 0) return;
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await savePublicNominationSubmission(accessToken, deviceToken, enteredNames);
      setIntake(updated);
      setNames(updated.submittedNames.length > 0 ? updated.submittedNames : ['']);
      setSaved(true);
    } catch (requestError) {
      if (requestError instanceof NominationsApiError && requestError.status === 410) setClosed(true);
      else setError(requestError instanceof Error ? requestError.message : 'Could not save your names. Please try again.');
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
        <span className="environment-label">NOMINATION INTAKE</span>
      </header>
      <section className="public-nomination" aria-labelledby="public-nomination-title">
        {isLoading ? <p className="state-message" role="status">Loading nomination form…</p> : unavailable ? (
          <div className="public-state"><p className="eyebrow">Nomination intake</p><h1 id="public-nomination-title">This link is unavailable</h1><p className="intro">The nomination intake may have been removed or the link may be incorrect.</p></div>
        ) : closed ? (
          <div className="public-state"><p className="eyebrow">Nomination intake</p><h1 id="public-nomination-title">Nominations are closed</h1><p className="intro">This intake is no longer accepting changes.</p></div>
        ) : intake && (
          <>
            <div className="public-state">
              <p className="eyebrow">Anonymous nomination</p>
              <h1 id="public-nomination-title">{intake.positionName}</h1>
              <p className="intro">{intake.departmentName}</p>
              <p className="public-instructions">Enter up to {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'} you would like to suggest. Your submitted names can be edited while this intake is open.</p>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
            <form className="public-nomination-form" onSubmit={submit}>
              <div className="positions-form-heading"><div><h2>Your names</h2><p>{enteredNames.length} of {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'}</p></div></div>
              <ol className="member-editor-list">
                {names.map((name, index) => (
                  <li className="member-editor" key={index}>
                    <div className="field-group"><label htmlFor={`public-name-${index}`}>Name {index + 1}</label><input id={`public-name-${index}`} value={name} maxLength={160} onChange={(event) => { setSaved(false); setNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); }} /></div>
                    <button className="remove-button" type="button" disabled={names.length === 1} onClick={() => { setSaved(false); setNames((current) => current.filter((_, itemIndex) => itemIndex !== index)); }}>Remove</button>
                  </li>
                ))}
              </ol>
              <button className="add-button" type="button" disabled={names.length >= intake.nameLimit} onClick={() => setNames((current) => current.length < intake.nameLimit ? [...current, ''] : current)}>＋ <span>Add another name</span></button>
              {exceedsLimit && <p className="error-message limit-feedback" role="alert">You can submit up to {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'}. Remove a name to continue.</p>}
              <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving || enteredNames.length === 0 || exceedsLimit}>{isSaving ? 'Submitting…' : 'Submit names'}</button></div>
              {saved && <p className="state-message" role="status">Your names have been submitted. You can edit them until nominations close.</p>}
            </form>
          </>
        )}
      </section>
      <footer className="page-footer"><span>Private by design</span><span className="footer-divider" aria-hidden="true" /><span>Anonymous suggestions</span></footer>
    </main>
  );
}