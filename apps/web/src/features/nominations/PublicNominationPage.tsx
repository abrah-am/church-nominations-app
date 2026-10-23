import { FormEvent, useEffect, useRef, useState } from 'react';
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
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [nameFieldAnnouncement, setNameFieldAnnouncement] = useState('');
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [focusNameIndex, setFocusNameIndex] = useState<number | null>(null);
  const withdrawActionRef = useRef<HTMLButtonElement>(null);
  const keepNamesRef = useRef<HTMLButtonElement>(null);
  const withdrawConfirmRef = useRef<HTMLButtonElement>(null);
  const nameInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

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
  }, [accessToken, deviceToken, loadAttempt]);

  function retryLoad() {
    setError('');
    setIsLoading(true);
    setLoadAttempt((attempt) => attempt + 1);
  }

  useEffect(() => {
    if (!withdrawDialogOpen) return;
    const trigger = withdrawActionRef.current;
    keepNamesRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setWithdrawDialogOpen(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const controls = [keepNamesRef.current, withdrawConfirmRef.current].filter((control): control is HTMLButtonElement => Boolean(control));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [withdrawDialogOpen]);

  useEffect(() => {
    if (focusNameIndex === null) return;
    const input = nameInputRefs.current[focusNameIndex];
    input?.focus();
    input?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
    setFocusNameIndex(null);
  }, [focusNameIndex, names.length]);

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
      setIntake((current) => current ? { ...current, submittedNames: updated.submittedNames } : current);
      setNames(updated.submittedNames.length > 0 ? updated.submittedNames : ['']);
      setSaved(true);
      setWithdrawn(false);
    } catch (requestError) {
      if (requestError instanceof NominationsApiError && requestError.status === 410) setClosed(true);
      else setError(requestError instanceof Error ? requestError.message : 'Could not save your names. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function withdrawNames() {
    if (!intake || intake.submittedNames.length === 0 || isSaving) return;
    setIsSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await savePublicNominationSubmission(accessToken, deviceToken, []);
      setIntake((current) => current ? { ...current, submittedNames: updated.submittedNames } : current);
      setNames(['']);
      setWithdrawn(true);
      setWithdrawDialogOpen(false);
    } catch (requestError) {
      if (requestError instanceof NominationsApiError && requestError.status === 410) {
        setClosed(true);
        setWithdrawDialogOpen(false);
      }
      else setError(requestError instanceof Error ? requestError.message : 'Your names were not withdrawn. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  function addName() {
    if (!intake || names.length >= intake.nameLimit) return;
    const newNameIndex = names.length;
    setWithdrawn(false);
    setNameFieldAnnouncement(`Name ${newNameIndex + 1} added.`);
    setNames((current) => current.length < intake.nameLimit ? [...current, ''] : current);
    setFocusNameIndex(newNameIndex);
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
          <div className="public-state"><p className="eyebrow">Nomination intake</p><h1 id="public-nomination-title">This link is unavailable</h1><p className="intro">The nomination intake may have been removed or this link may be incorrect.</p></div>
        ) : closed ? (
          <div className="public-state"><p className="eyebrow">Nomination intake</p><h1 id="public-nomination-title">Nominations are closed</h1><p className="intro">This intake is no longer accepting changes. Any names saved before it closed remain available to the administrator for review.</p></div>
        ) : error && !intake ? (
          <div className="public-state">
            <p className="eyebrow">Nomination intake</p>
            <h1 id="public-nomination-title">Could not load this form</h1>
            <p className="error-message" role="alert">{error}</p>
            <button className="secondary-button" type="button" onClick={retryLoad}>Retry loading form</button>
          </div>
        ) : intake && (
          <>
            <div className="public-state">
              <p className="eyebrow">Anonymous nomination</p>
              <h1 id="public-nomination-title">{intake.positionName}</h1>
              <p className="intro">{intake.departmentName}</p>
              <p className="public-instructions">Enter up to {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'} you would like to suggest. You can replace or withdraw your list until nominations close.</p>
            </div>
            {error && <p className="error-message" role="alert">{error}</p>}
            <form className="public-nomination-form" onSubmit={submit}>
              <div className="positions-form-heading"><div><h2>Your names</h2><p>{enteredNames.length} of {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'}</p></div></div>
              <ol className="member-editor-list">
                {names.map((name, index) => (
                  <li className="member-editor" key={index}>
                    <div className="field-group"><label htmlFor={`public-name-${index}`}>Name {index + 1}</label><input ref={(element) => { nameInputRefs.current[index] = element; }} id={`public-name-${index}`} value={name} maxLength={160} onChange={(event) => { setSaved(false); setWithdrawn(false); setNameFieldAnnouncement(''); setNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); }} /></div>
                    <button className="remove-button" type="button" disabled={names.length === 1} onClick={() => { setSaved(false); setWithdrawn(false); setNames((current) => current.filter((_, itemIndex) => itemIndex !== index)); }}>Remove</button>
                  </li>
                ))}
              </ol>
              <button className="add-button" type="button" disabled={names.length >= intake.nameLimit} onClick={addName}>＋ <span>Add another name</span></button>
              {nameFieldAnnouncement && <p className="state-message" role="status" aria-live="polite">{nameFieldAnnouncement}</p>}
              {exceedsLimit && <p className="error-message limit-feedback" role="alert">You can submit up to {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'}. Remove a name to continue.</p>}
              <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving || enteredNames.length === 0 || exceedsLimit}>{isSaving ? 'Submitting…' : 'Submit names'}</button></div>
              {intake.submittedNames.length > 0 && <div className="withdraw-actions"><button ref={withdrawActionRef} className="danger-button" type="button" disabled={isSaving} onClick={() => setWithdrawDialogOpen(true)}>Withdraw all names</button></div>}
              {saved && <p className="state-message" role="status">Your names were submitted. You can replace or withdraw them until nominations close.</p>}
              {withdrawn && <p className="state-message" role="status">Your names have been withdrawn. This profile has no names currently included. You may submit a new list while nominations are open.</p>}
            </form>
          </>
        )}
      </section>
      {withdrawDialogOpen && intake && (
        <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setWithdrawDialogOpen(false); }}>
          <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="withdraw-names-title" aria-describedby="withdraw-names-description">
            <h3 id="withdraw-names-title">Withdraw your names?</h3>
            <p id="withdraw-names-description">This removes every name currently saved by this browser profile from the intake. You can submit a new list while nominations remain open.</p>
            {isSaving && <p role="status">Withdrawing names…</p>}
            <div className="dialog-actions">
              <button ref={keepNamesRef} className="secondary-button" type="button" disabled={isSaving} onClick={() => setWithdrawDialogOpen(false)}>Keep my names</button>
              <button ref={withdrawConfirmRef} className="danger-button" type="button" disabled={isSaving} onClick={() => { void withdrawNames(); }}>Withdraw names</button>
            </div>
          </section>
        </div>
      )}
      <footer className="page-footer"><span>Private by design</span><span className="footer-divider" aria-hidden="true" /><span>Anonymous suggestions</span></footer>
    </main>
  );
}