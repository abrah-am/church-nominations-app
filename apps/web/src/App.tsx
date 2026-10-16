import { FormEvent, useEffect, useState } from 'react';
import {
  AuthApiError,
  Church,
  SafeAccount,
  createChurch,
  getCurrentAccount,
  getMyChurches,
  registerAccount,
} from './api/auth';
import {
  AnnualBoard,
  BoardsApiError,
  BoardSession,
  createBoard,
  createBoardSession,
  getBoard,
  listBoards,
  updateSessionAttendance,
} from './api/boards';
import {
  createElection,
  Election,
  ElectionConfiguration,
  ElectionsApiError,
  getElection,
  listElections,
  updateElection,
} from './api/elections';
import {
  closeNominationIntake,
  createNominationIntake,
  getNominationDeviceToken,
  getNominationIntake,
  getPublicNominationIntake,
  NominationIntake,
  NominationsApiError,
  PublicNominationIntake,
  saveNominationConsolidation,
  savePublicNominationSubmission,
} from './api/nominations';

type Screen = 'list' | 'detail' | 'form';
type Workspace = 'elections' | 'boards';
type BoardScreen = 'list' | 'create' | 'detail';
type FormPosition = { id?: string; name: string; openingCount: string };

function App() {
  const routeMatch = window.location.pathname.match(/^\/nominate\/([^/]+)\/?$/);
  if (routeMatch) return <PublicNominationPage accessToken={decodeURIComponent(routeMatch[1])} />;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const [credentials, setCredentials] = useState<string | null>(null);
  const [account, setAccount] = useState<SafeAccount | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [loginError, setLoginError] = useState('');
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedPositionIndex, setSelectedPositionIndex] = useState(0);
  const [screen, setScreen] = useState<Screen>('list');
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace>('elections');
  const [boards, setBoards] = useState<AnnualBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<AnnualBoard | null>(null);
  const [boardScreen, setBoardScreen] = useState<BoardScreen>('list');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendanceIds, setAttendanceIds] = useState<string[]>([]);
  const [attendanceDrafts, setAttendanceDrafts] = useState<Record<string, string[]>>({});

  function handleRequestError(error: unknown) {
    if ((error instanceof ElectionsApiError || error instanceof AuthApiError || error instanceof BoardsApiError) && error.status === 401) {
      setCredentials(null);
      setAccount(null);
      setChurches([]);
      setElections([]);
      setSelectedElection(null);
      setBoards([]);
      setSelectedBoard(null);
      setSelectedSessionId(null);
      setAttendanceIds([]);
      setAttendanceDrafts({});
      setWorkspace('elections');
      setScreen('list');
      setBoardScreen('list');
      setLoginError('Your session is no longer authorized. Sign in again.');
      return;
    }
    setPageError(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
  }

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const candidateCredentials = `${email}:${password}`;
    setIsLoading(true);
    setLoginError('');
    setRegistrationSuccess('');
    try {
      const currentAccount = await getCurrentAccount(candidateCredentials);
      const currentChurches = await getMyChurches(candidateCredentials);
      const currentElections = currentChurches.length > 0
        ? await listElections(candidateCredentials)
        : [];
      setCredentials(candidateCredentials);
      setAccount(currentAccount);
      setChurches(currentChurches);
      setElections(currentElections);
    } catch (error) {
      setLoginError(error instanceof ElectionsApiError && error.status === 401
        ? 'Sign-in failed. Check your email and password.'
        : error instanceof AuthApiError && error.status === 401
          ? 'Sign-in failed. Check your email and password.'
        : error instanceof Error ? error.message : 'Could not sign in. Check that the API is available.');
    } finally {
      setIsLoading(false);
    }
  }

  async function signUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    setIsLoading(true);
    setLoginError('');
    setRegistrationSuccess('');
    try {
      await registerAccount({ email, password });
      form.reset();
      setRegistrationSuccess('Account created. Sign in with your new credentials to continue.');
      setRegistrationMode(false);
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : 'Could not create your account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitChurch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!credentials) return;
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('churchName') ?? '').trim();
    setPageError('');
    setIsSaving(true);
    try {
      const createdChurch = await createChurch(credentials, { name });
      setChurches([createdChurch]);
      const myChurches = await getMyChurches(credentials);
      setChurches(myChurches.length > 0 ? myChurches : [createdChurch]);
      setElections(await listElections(credentials));
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSaving(false);
    }
  }

  function signOut() {
    setCredentials(null);
    setAccount(null);
    setChurches([]);
    setElections([]);
    setSelectedElection(null);
    setBoards([]);
    setSelectedBoard(null);
    setSelectedSessionId(null);
    setAttendanceIds([]);
    setAttendanceDrafts({});
    setWorkspace('elections');
    setBoardScreen('list');
    setPageError('');
    setLoginError('');
    setScreen('list');
  }

  async function openElection(election: Election) {
    if (!credentials) return;
    setScreen('detail');
    setSelectedElection(null);
    setSelectedPositionIndex(0);
    setPageError('');
    setIsLoading(true);
    try {
      setSelectedElection(await getElection(credentials, election.id));
      setSelectedPositionIndex(0);
    } catch (error) {
      handleRequestError(error);
      setScreen('list');
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateForm() {
    setPageError('');
    setSelectedElection(null);
    setScreen('form');
  }

  async function saveConfiguration(configuration: ElectionConfiguration) {
    if (!credentials) return;
    setIsSaving(true);
    setPageError('');
    try {
      const saved = selectedElection
        ? await updateElection(credentials, selectedElection.id, configuration)
        : await createElection(credentials, configuration);
      setSelectedElection(saved);
      setSelectedPositionIndex(0);
      setElections((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
      setScreen('detail');
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function openBoardsWorkspace() {
    if (!credentials) return;
    setWorkspace('boards');
    setBoardScreen('list');
    setSelectedBoard(null);
    setSelectedSessionId(null);
    setAttendanceIds([]);
    setAttendanceDrafts({});
    setPageError('');
    setIsLoading(true);
    try {
      setBoards(await listBoards(credentials));
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function openBoard(board: AnnualBoard) {
    if (!credentials) return;
    setBoardScreen('detail');
    setSelectedBoard(null);
    setPageError('');
    setIsLoading(true);
    try {
      const fullBoard = await getBoard(credentials, board.id);
      setSelectedBoard(fullBoard);
      const firstSession = fullBoard.sessions[0];
      setAttendanceDrafts(Object.fromEntries(fullBoard.sessions.map((session) => [session.id, session.attendedMemberIds])));
      setSelectedSessionId(firstSession?.id ?? null);
      setAttendanceIds(firstSession ? firstSession.attendedMemberIds : []);
    } catch (error) {
      handleRequestError(error);
      setBoardScreen('list');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveBoard(year: number, memberNames: string[]) {
    if (!credentials) return;
    setIsSaving(true);
    setPageError('');
    try {
      const created = await createBoard(credentials, { year, members: memberNames.map((name) => ({ name })) });
      setBoards((current) => [created, ...current.filter((board) => board.id !== created.id)]);
      setSelectedBoard(created);
      setSelectedSessionId(null);
      setAttendanceIds([]);
      setAttendanceDrafts({});
      setBoardScreen('detail');
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveBoardSession(sessionDate: string) {
    if (!credentials || !selectedBoard) return;
    setIsSaving(true);
    setPageError('');
    try {
      const session = await createBoardSession(credentials, selectedBoard.id, { sessionDate });
      const updated = { ...selectedBoard, sessions: [...selectedBoard.sessions, session] };
      setSelectedBoard(updated);
      setBoards((current) => current.map((board) => board.id === updated.id ? updated : board));
      setSelectedSessionId(session.id);
      setAttendanceIds(session.attendedMemberIds);
      setAttendanceDrafts((current) => ({ ...current, [session.id]: session.attendedMemberIds }));
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAttendance() {
    if (!credentials || !selectedBoard || !selectedSessionId) return;
    setIsSaving(true);
    setPageError('');
    try {
      const savedSession = await updateSessionAttendance(credentials, selectedBoard.id, selectedSessionId, {
        attendedMemberIds: attendanceIds,
      });
      const updated = {
        ...selectedBoard,
        sessions: selectedBoard.sessions.map((session) => session.id === savedSession.id ? savedSession : session),
      };
      setSelectedBoard(updated);
      setBoards((current) => current.map((board) => board.id === updated.id ? updated : board));
      setAttendanceIds(savedSession.attendedMemberIds);
      setAttendanceDrafts((current) => ({ ...current, [savedSession.id]: savedSession.attendedMemberIds }));
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSaving(false);
    }
  }

  function selectSession(session: BoardSession) {
    setSelectedSessionId(session.id);
    setAttendanceIds(attendanceDrafts[session.id] ?? session.attendedMemberIds);
  }

  function toggleAttendance(memberId: string, checked: boolean) {
    setAttendanceIds((current) => checked
      ? current.includes(memberId) ? current : [...current, memberId]
      : current.filter((id) => id !== memberId));
    if (selectedSessionId) {
      setAttendanceDrafts((current) => {
        const currentDraft = current[selectedSessionId] ?? [];
        return {
          ...current,
          [selectedSessionId]: checked
            ? currentDraft.includes(memberId) ? currentDraft : [...currentDraft, memberId]
            : currentDraft.filter((id) => id !== memberId),
        };
      });
    }
  }

  const isEditing = screen === 'form' && selectedElection !== null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Church Nominations home" onClick={(event) => event.preventDefault()}>
          <span className="mark" aria-hidden="true">C</span>
          <span>Church Nominations</span>
        </a>
        <div className="topbar-tools">
          <span className="environment-label">LOCAL DEVELOPMENT</span>
          {credentials && <button className="text-button" type="button" onClick={signOut}>Sign out</button>}
        </div>
      </header>

      {!credentials ? (
        <section className="login-view" aria-labelledby="login-title">
          <div className="login-heading">
            <p className="eyebrow">Church administrator access</p>
            <h1 id="login-title">{registrationMode ? 'Create your account' : 'Election setup'}</h1>
            <p className="intro">{registrationMode ? 'Create an account to get started.' : 'Sign in to configure your church elections.'}</p>
          </div>
          <form className="login-form" onSubmit={registrationMode ? signUp : signIn}>
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete={registrationMode ? 'new-password' : 'current-password'} required minLength={registrationMode ? 8 : undefined} maxLength={registrationMode ? 72 : undefined} />
            {registrationMode && <p className="form-note">Use 8 to 72 characters for your password.</p>}
            {loginError && <p className="error-message" role="alert">{loginError}</p>}
            <button className="primary-button" type="submit" disabled={isLoading}>
              {isLoading ? (registrationMode ? 'Creating account…' : 'Checking access…') : registrationMode ? 'Create account' : 'Sign in'}
            </button>
            {registrationSuccess && <p className="state-message" role="status">{registrationSuccess}</p>}
            <button className="text-button" type="button" onClick={() => { setRegistrationMode((mode) => !mode); setLoginError(''); setRegistrationSuccess(''); }}>
              {registrationMode ? 'Already have an account? Sign in' : 'Create an account'}
            </button>
            <p className="form-note">Credentials are held in memory only for this session.</p>
          </form>
        </section>
      ) : churches.length === 0 ? (
        <section className="login-view" aria-labelledby="church-title">
          <div className="login-heading">
            <p className="eyebrow">Church administration</p>
            <h1 id="church-title">Register your church</h1>
            <p className="intro">Your account is ready. Add a church to begin election setup.</p>
          </div>
          {pageError && <p className="error-message page-error" role="alert">{pageError}</p>}
          <form className="login-form" onSubmit={submitChurch}>
            <label htmlFor="church-name">Church name</label>
            <input id="church-name" name="churchName" required maxLength={160} />
            <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Registering…' : 'Register church'}</button>
          </form>
        </section>
      ) : (
        <>
          <div className="workspace-heading">
            <div>
              <p className="eyebrow">{workspace === 'boards' ? 'Church governance' : 'Election administration'}</p>
              <h1>{workspace === 'boards'
                ? boardScreen === 'detail' && selectedBoard ? `${selectedBoard.year} Annual Board` : boardScreen === 'create' ? 'New Annual Board' : 'Annual Boards'
                : screen === 'detail' && selectedElection ? selectedElection.departmentName : screen === 'form' ? (isEditing ? 'Edit setup' : 'New election') : 'My churches'}</h1>
              <p className="intro">Current church: {churches[0]?.name ?? 'Church'}{typeof account?.email === 'string' ? ` · ${account.email}` : ''}</p>
            </div>
            {workspace === 'elections' && screen === 'list' && <button className="primary-button create-button" type="button" onClick={openCreateForm}>＋ <span>Create election</span></button>}
          </div>

          <nav className="workspace-tabs" aria-label="Church workspace">
            <button type="button" aria-pressed={workspace === 'elections'} onClick={() => { setWorkspace('elections'); setScreen('list'); setPageError(''); }}>Department elections</button>
            <button type="button" aria-pressed={workspace === 'boards'} onClick={openBoardsWorkspace}>Annual Boards</button>
          </nav>

          {workspace === 'elections' ? <div className="setup-notice" role="note">
            <span className="notice-mark" aria-hidden="true">i</span>
            <span><strong>Setup and nominations</strong> · Voting is not available yet.</span>
          </div> : <div className="setup-notice attendance-notice" role="note">
            <span className="notice-mark" aria-hidden="true">i</span>
            <span><strong>Attendance records only</strong> · This does not collect ballots or voting choices. Board members do not need passwords.</span>
          </div>}

          {pageError && <p className="error-message page-error" role="alert">{pageError}</p>}

          {workspace === 'boards' ? (
            <BoardsWorkspace
              boards={boards}
              selectedBoard={selectedBoard}
              selectedSessionId={selectedSessionId}
              attendanceIds={attendanceIds}
              boardScreen={boardScreen}
              isLoading={isLoading}
              isSaving={isSaving}
              onCreate={() => { setPageError(''); setBoardScreen('create'); }}
              onOpen={openBoard}
              onBack={() => { setBoardScreen('list'); setSelectedBoard(null); setAttendanceDrafts({}); setPageError(''); }}
              onSaveBoard={saveBoard}
              onSaveSession={saveBoardSession}
              onSelectSession={selectSession}
              onToggleAttendance={toggleAttendance}
              onSaveAttendance={saveAttendance}
            />
          ) : <>
          {screen === 'list' && (
            <section className="election-section" aria-labelledby="election-list-title">
              <div className="section-heading">
                <div>
                  <h2 id="election-list-title">Department elections</h2>
                  <p>{elections.length} {elections.length === 1 ? 'election' : 'elections'}</p>
                </div>
              </div>
              {isLoading ? <p className="state-message" role="status">Loading elections…</p> : elections.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-rule" aria-hidden="true" />
                  <h3>No elections configured</h3>
                  <p>Create an election to define its department, positions, and openings.</p>
                  <button className="secondary-button" type="button" onClick={openCreateForm}>Create first election</button>
                </div>
              ) : (
                <ul className="election-list">
                  {elections.map((election) => (
                    <li key={election.id}>
                      <button className="election-row" type="button" onClick={() => openElection(election)}>
                        <span className="election-row-copy">
                          <strong>{election.departmentName}</strong>
                          <span>{election.positions.length} {election.positions.length === 1 ? 'position' : 'positions'} · {election.positions.reduce((total, position) => total + position.openingCount, 0)} openings</span>
                        </span>
                        <span className="row-status">Setup</span>
                        <span className="row-arrow" aria-hidden="true">→</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {screen === 'detail' && (
            <section className="detail-section">
              <div className="detail-actions">
                <button className="back-button" type="button" onClick={() => { setScreen('list'); setPageError(''); }}>← <span>All elections</span></button>
                {selectedElection && <button className="secondary-button" type="button" onClick={() => { setPageError(''); setScreen('form'); }}>Edit setup</button>}
              </div>
              {isLoading || !selectedElection ? <p className="state-message" role="status">Loading election…</p> : (
                <>
                  <div className="detail-summary">
                    <div><span className="summary-label">Department</span><strong>{selectedElection.departmentName}</strong></div>
                    <div><span className="summary-label">Status</span><span className="row-status">Setup</span></div>
                    <div><span className="summary-label">Configured openings</span><strong>{selectedElection.positions.reduce((total, position) => total + position.openingCount, 0)}</strong></div>
                  </div>
                  <div className="section-heading position-heading">
                    <div><h2>Position {selectedPositionIndex + 1} of {selectedElection.positions.length}</h2><p>Manage positions in configured order</p></div>
                  </div>
                  {(() => {
                    const positions = [...selectedElection.positions].sort((a, b) => a.sequence - b.sequence);
                    const position = positions[selectedPositionIndex];
                    return (
                      <>
                        <div className="position-detail" aria-live="polite">
                          <span className="sequence-number">{position.sequence}</span>
                          <div className="position-copy"><strong>{position.name}</strong><span>{position.openingCount} {position.openingCount === 1 ? 'opening' : 'openings'}</span></div>
                        </div>
                        <nav className="position-navigation" aria-label="Election position sequence">
                          <button className="secondary-button" type="button" disabled={selectedPositionIndex === 0} onClick={() => setSelectedPositionIndex((index) => index - 1)}>← <span>Previous position</span></button>
                          <button className="secondary-button" type="button" disabled={selectedPositionIndex === positions.length - 1} onClick={() => setSelectedPositionIndex((index) => index + 1)}><span>Next position</span> →</button>
                        </nav>
                        <NominationAdminPanel
                          key={`${selectedElection.id}-${position.id}`}
                          credentials={credentials}
                          electionId={selectedElection.id}
                          positionId={position.id}
                          positionName={position.name}
                        />
                      </>
                    );
                  })()}
                </>
              )}
            </section>
          )}

          {screen === 'form' && (
            <section className="form-section">
              <button className="back-button" type="button" onClick={() => { setScreen(isEditing ? 'detail' : 'list'); setPageError(''); }}>← <span>Cancel</span></button>
              <ElectionForm
                key={selectedElection?.id ?? 'new-election'}
                initialElection={selectedElection}
                isSaving={isSaving}
                onSave={saveConfiguration}
              />
            </section>
          )}
          </>}
        </>
      )}

      <footer className="page-footer"><span>Private by design</span><span className="footer-divider" aria-hidden="true" /><span>Local environment</span></footer>
    </main>
  );
}

type NominationAdminPanelProps = {
  credentials: string;
  electionId: string;
  positionId: string;
  positionName: string;
};

function NominationAdminPanel({ credentials, electionId, positionId, positionName }: NominationAdminPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [intake, setIntake] = useState<NominationIntake | null>(null);
  const [nameLimit, setNameLimit] = useState('5');
  const [candidateDraft, setCandidateDraft] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function loadIntake() {
    setIsExpanded(true);
    setIsLoading(true);
    setError('');
    try {
      const loaded = await getNominationIntake(credentials, electionId, positionId);
      setIntake(loaded);
      setCandidateDraft((loaded.consolidatedNames ?? uniqueNames(loaded.submissions.map((submission) => submission.name))).join('\n'));
    } catch (requestError) {
      if (requestError instanceof NominationsApiError && requestError.status === 404) {
        setIntake(null);
      } else {
        setError(requestError instanceof Error ? requestError.message : 'Could not load nomination intake.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const created = await createNominationIntake(credentials, electionId, positionId, Number(nameLimit));
      setIntake(created);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not create nomination intake.');
    } finally {
      setIsLoading(false);
    }
  }

  async function closeIntake() {
    setIsLoading(true);
    setError('');
    try {
      const closed = await closeNominationIntake(credentials, electionId, positionId);
      setIntake(closed);
      setCandidateDraft((closed.consolidatedNames ?? uniqueNames(closed.submissions.map((submission) => submission.name))).join('\n'));
      setConfirmed(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not close nomination intake.');
    } finally {
      setIsLoading(false);
    }
  }

  async function saveConsolidation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intake || intake.status !== 'CLOSED' || !confirmed) return;
    const candidateNames = uniqueNames(candidateDraft.split('\n'));
    if (candidateNames.length === 0) {
      setError('Add at least one candidate name before saving the snapshot.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const saved = await saveNominationConsolidation(credentials, electionId, positionId, candidateNames);
      setIntake((current) => current ? { ...current, consolidatedNames: saved.candidateNames } : current);
      setCandidateDraft(saved.candidateNames.join('\n'));
      setConfirmed(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not save the consolidation snapshot.');
    } finally {
      setIsLoading(false);
    }
  }

  async function copyShareUrl() {
    if (!intake) return;
    const shareUrl = `${window.location.origin}/nominate/${encodeURIComponent(intake.accessToken)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
    } catch {
      setError('Could not copy the link. Select and copy the share URL instead.');
    }
  }

  return (
    <section className="nomination-admin" aria-labelledby="nomination-admin-title">
      <div className="section-heading">
        <div><h2 id="nomination-admin-title">Nomination intake</h2><p>Collect anonymous name suggestions for {positionName}.</p></div>
        {!isExpanded && <button className="secondary-button" type="button" onClick={loadIntake}>Manage nominations</button>}
      </div>
      {isExpanded && isLoading && <p className="state-message" role="status">Loading nomination intake…</p>}
      {error && <p className="error-message" role="alert">{error}</p>}
      {isExpanded && !isLoading && !intake && (
        <form className="intake-create" onSubmit={createIntake}>
          <label htmlFor="nomination-name-limit">Maximum names per visitor</label>
          <div className="intake-controls">
            <input id="nomination-name-limit" type="number" min="1" step="1" value={nameLimit} onChange={(event) => setNameLimit(event.target.value)} required />
            <button className="primary-button" type="submit" disabled={isLoading}>Create intake</button>
          </div>
        </form>
      )}
      {isExpanded && !isLoading && intake && (
        <div className="intake-content">
          <div className="detail-summary intake-summary">
            <div><span className="summary-label">Intake status</span><span className={`row-status ${intake.status === 'CLOSED' ? 'closed-status' : ''}`}>{intake.status === 'OPEN' ? 'Open' : 'Closed'}</span></div>
            <div><span className="summary-label">Name limit</span><strong>{intake.nameLimit}</strong></div>
            <div><span className="summary-label">Suggestions</span><strong>{intake.submissions.length}</strong></div>
          </div>
          {intake.status === 'OPEN' ? (
            <>
              <label className="share-label" htmlFor="nomination-share-url">Share link</label>
              <div className="intake-controls share-controls">
                <input id="nomination-share-url" value={`${window.location.origin}/nominate/${encodeURIComponent(intake.accessToken)}`} readOnly onFocus={(event) => event.currentTarget.select()} />
                <button className="secondary-button" type="button" onClick={copyShareUrl}>{copied ? 'Copied' : 'Copy link'}</button>
              </div>
              <div className="section-heading nomination-submissions-heading"><div><h3>Submitted names</h3><p>Names only. No visitor or device identity is shown.</p></div></div>
              {intake.submissions.length === 0 ? <p className="state-message">No names have been submitted yet.</p> : (
                <ul className="member-list" aria-label="Anonymous submitted names">
                  {intake.submissions.map((submission) => <li key={submission.id}>{submission.name}</li>)}
                </ul>
              )}
              <div className="form-actions"><button className="secondary-button" type="button" disabled={isLoading} onClick={closeIntake}>Close nominations</button></div>
            </>
          ) : (
            <>
              <div className="section-heading nomination-submissions-heading"><div><h3>Submitted names</h3><p>Anonymous submissions remain available for review.</p></div></div>
              <ul className="member-list" aria-label="Anonymous submitted names">
                {intake.submissions.map((submission) => <li key={submission.id}>{submission.name}</li>)}
              </ul>
              <form className="consolidation-form" onSubmit={saveConsolidation}>
                <label htmlFor="consolidated-candidates">Unique candidate list</label>
                <p className="form-note">Edit the final names, one per line. Duplicate entries are removed when saved.</p>
                <textarea id="consolidated-candidates" rows={Math.max(4, Math.min(10, candidateDraft.split('\n').length))} value={candidateDraft} onChange={(event) => { setCandidateDraft(event.target.value); setConfirmed(false); }} />
                <label className="confirmation-label"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> <span>I confirm this is the final candidate list to save as the consolidation snapshot.</span></label>
                <div className="form-actions"><button className="primary-button" type="submit" disabled={isLoading || !confirmed}>{isLoading ? 'Saving…' : 'Save consolidation snapshot'}</button></div>
              </form>
              {intake.consolidatedNames && <p className="state-message" role="status">Consolidation snapshot saved with {intake.consolidatedNames.length} {intake.consolidatedNames.length === 1 ? 'candidate' : 'candidates'}.</p>}
            </>
          )}
        </div>
      )}
    </section>
  );
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map((name) => name.trim()).filter((name) => {
    const key = name.toLocaleLowerCase();
    if (!name || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function PublicNominationPage({ accessToken }: { accessToken: string }) {
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
              <button className="add-button" type="button" disabled={enteredNames.length >= intake.nameLimit} onClick={() => setNames((current) => [...current, ''])}>＋ <span>Add another name</span></button>
              {exceedsLimit && <p className="error-message limit-feedback" role="alert">You can submit up to {intake.nameLimit} {intake.nameLimit === 1 ? 'name' : 'names'}. Remove a name to continue.</p>}
              <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving || enteredNames.length === 0 || exceedsLimit}>{isSaving ? 'Saving…' : 'Save my names'}</button></div>
              {saved && <p className="state-message" role="status">Your names have been saved. You can edit them until nominations close.</p>}
            </form>
          </>
        )}
      </section>
      <footer className="page-footer"><span>Private by design</span><span className="footer-divider" aria-hidden="true" /><span>Anonymous suggestions</span></footer>
    </main>
  );
}

type BoardsWorkspaceProps = {
  boards: AnnualBoard[];
  selectedBoard: AnnualBoard | null;
  selectedSessionId: string | null;
  attendanceIds: string[];
  boardScreen: BoardScreen;
  isLoading: boolean;
  isSaving: boolean;
  onCreate: () => void;
  onOpen: (board: AnnualBoard) => void;
  onBack: () => void;
  onSaveBoard: (year: number, memberNames: string[]) => void;
  onSaveSession: (sessionDate: string) => void;
  onSelectSession: (session: BoardSession) => void;
  onToggleAttendance: (memberId: string, checked: boolean) => void;
  onSaveAttendance: () => void;
};

function BoardsWorkspace({
  boards,
  selectedBoard,
  selectedSessionId,
  attendanceIds,
  boardScreen,
  isLoading,
  isSaving,
  onCreate,
  onOpen,
  onBack,
  onSaveBoard,
  onSaveSession,
  onSelectSession,
  onToggleAttendance,
  onSaveAttendance,
}: BoardsWorkspaceProps) {
  const selectedSession = selectedBoard?.sessions.find((session) => session.id === selectedSessionId) ?? null;

  return (
    <>
      {boardScreen === 'list' && (
        <section className="election-section" aria-labelledby="board-list-title">
          <div className="section-heading">
            <div><h2 id="board-list-title">Annual Boards</h2><p>{boards.length} {boards.length === 1 ? 'board' : 'boards'}</p></div>
            <button className="secondary-button" type="button" onClick={onCreate}>＋ <span>Create board</span></button>
          </div>
          {isLoading ? <p className="state-message" role="status">Loading annual boards…</p> : boards.length === 0 ? (
            <div className="empty-state">
              <span className="empty-rule" aria-hidden="true" />
              <h3>No annual boards yet</h3>
              <p>Create a board roster for a year, then record dated meeting attendance.</p>
              <button className="secondary-button" type="button" onClick={onCreate}>Create first board</button>
            </div>
          ) : (
            <ul className="election-list">
              {boards.map((board) => (
                <li key={board.id}>
                  <button className="election-row" type="button" onClick={() => onOpen(board)}>
                    <span className="election-row-copy">
                      <strong>{board.year} Annual Board</strong>
                      <span>{board.members.length} {board.members.length === 1 ? 'member' : 'members'} · {board.sessions.length} {board.sessions.length === 1 ? 'session' : 'sessions'}</span>
                    </span>
                    <span className="row-status">Roster</span>
                    <span className="row-arrow" aria-hidden="true">→</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {boardScreen === 'create' && (
        <section className="form-section">
          <button className="back-button" type="button" onClick={onBack}>← <span>All annual boards</span></button>
          <BoardCreateForm isSaving={isSaving} onSave={onSaveBoard} />
        </section>
      )}

      {boardScreen === 'detail' && (
        <section className="detail-section" aria-label="Annual board details">
          <div className="detail-actions">
            <button className="back-button" type="button" onClick={onBack}>← <span>All annual boards</span></button>
          </div>
          {isLoading || !selectedBoard ? <p className="state-message" role="status">Loading board…</p> : (
            <>
              <div className="detail-summary">
                <div><span className="summary-label">Board year</span><strong>{selectedBoard.year}</strong></div>
                <div><span className="summary-label">Roster</span><strong>{selectedBoard.members.length} {selectedBoard.members.length === 1 ? 'member' : 'members'}</strong></div>
                <div><span className="summary-label">Recorded sessions</span><strong>{selectedBoard.sessions.length}</strong></div>
              </div>
              <div className="board-detail-grid">
                <div>
                  <div className="section-heading position-heading"><div><h2>Board roster</h2><p>Names only; no member credentials are collected.</p></div></div>
                  <ul className="member-list">
                    {selectedBoard.members.map((member) => <li key={member.id}>{member.name}</li>)}
                  </ul>
                </div>
                <div>
                  <div className="section-heading position-heading"><div><h2>Sessions</h2><p>Record meeting dates and attendance.</p></div></div>
                  <form className="session-create" onSubmit={(event) => {
                    event.preventDefault();
                    const formData = new FormData(event.currentTarget);
                    const sessionDate = String(formData.get('sessionDate') ?? '');
                    if (sessionDate) {
                      onSaveSession(sessionDate);
                      event.currentTarget.reset();
                    }
                  }}>
                    <label htmlFor="board-session-date">Session date</label>
                    <div className="session-date-controls">
                      <input id="board-session-date" name="sessionDate" type="date" required />
                      <button className="secondary-button" type="submit" disabled={isSaving}>{isSaving ? 'Adding…' : 'Add session'}</button>
                    </div>
                  </form>
                  {selectedBoard.sessions.length > 0 && (
                    <ul className="session-list" aria-label="Board sessions">
                      {selectedBoard.sessions.map((session) => (
                        <li key={session.id}>
                          <button type="button" aria-pressed={session.id === selectedSessionId} disabled={isSaving} onClick={() => onSelectSession(session)}>
                            <span>{session.sessionDate}</span>
                            <span>{session.attendedMemberIds.length} attended</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              {selectedSession ? (
                <form className="attendance-editor" onSubmit={(event) => { event.preventDefault(); onSaveAttendance(); }}>
                  <div className="section-heading"><div><h2>Attendance for {selectedSession.sessionDate}</h2><p>Mark who attended this session. This is not a ballot or vote.</p></div></div>
                  <ul className="attendance-list">
                    {selectedBoard.members.map((member) => (
                      <li key={member.id}>
                        <label>
                          <input
                            type="checkbox"
                            checked={attendanceIds.includes(member.id)}
                            disabled={isSaving}
                            onChange={(event) => onToggleAttendance(member.id, event.target.checked)}
                          />
                          <span>{member.name}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save attendance'}</button></div>
                </form>
              ) : <p className="state-message">Add a session to record attendance.</p>}
            </>
          )}
        </section>
      )}
    </>
  );
}

type BoardCreateFormProps = {
  isSaving: boolean;
  onSave: (year: number, memberNames: string[]) => void;
};

function BoardCreateForm({ isSaving, onSave }: BoardCreateFormProps) {
  const [memberNames, setMemberNames] = useState(['']);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const year = Number(formData.get('year'));
    const names = memberNames.map((name) => name.trim());
    if (names.length > 0 && names.every(Boolean)) onSave(year, names);
  }

  return (
    <form className="election-form" onSubmit={submit}>
      <div className="form-intro">
        <p className="eyebrow">Annual roster</p>
        <h2>Create an annual board</h2>
        <p>Add the board year and the names of its members. Member passwords are not requested.</p>
      </div>
      <label htmlFor="board-year">Year</label>
      <input id="board-year" name="year" type="number" min="1900" max="9999" defaultValue={new Date().getFullYear()} required />
      <div className="positions-form-heading"><div><h3>Members</h3><p>At least one member is required.</p></div></div>
      <ol className="member-editor-list">
        {memberNames.map((name, index) => (
          <li className="member-editor" key={index}>
            <div className="field-group">
              <label htmlFor={`board-member-${index}`}>Member {index + 1} name</label>
              <input id={`board-member-${index}`} value={name} onChange={(event) => setMemberNames((current) => current.map((member, memberIndex) => memberIndex === index ? event.target.value : member))} required maxLength={160} />
            </div>
            <button className="remove-button" type="button" disabled={memberNames.length === 1} onClick={() => setMemberNames((current) => current.filter((_, memberIndex) => memberIndex !== index))}>Remove</button>
          </li>
        ))}
      </ol>
      <button className="add-button" type="button" onClick={() => setMemberNames((current) => [...current, ''])}>＋ <span>Add member</span></button>
      <div className="form-actions"><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Creating…' : 'Create board'}</button></div>
    </form>
  );
}

type ElectionFormProps = {
  initialElection: Election | null;
  isSaving: boolean;
  onSave: (configuration: ElectionConfiguration) => void;
};

function ElectionForm({ initialElection, isSaving, onSave }: ElectionFormProps) {
  const [departmentName, setDepartmentName] = useState(initialElection?.departmentName ?? '');
  const [positions, setPositions] = useState<FormPosition[]>(initialElection
    ? [...initialElection.positions].sort((a, b) => a.sequence - b.sequence).map(({ id, name, openingCount }) => ({ id, name, openingCount: String(openingCount) }))
    : [{ name: '', openingCount: '1' }]);

  function updatePosition(index: number, field: keyof FormPosition, value: string) {
    setPositions((current) => current.map((position, positionIndex) => positionIndex === index ? { ...position, [field]: value } : position));
  }

  function movePosition(index: number, offset: number) {
    setPositions((current) => {
      const next = [...current];
      const target = index + offset;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      departmentName: departmentName.trim(),
      positions: positions.map((position) => ({
        ...(position.id !== undefined ? { id: position.id } : {}),
        name: position.name.trim(),
        openingCount: Number(position.openingCount),
      })),
    });
  }

  return (
    <form className="election-form" onSubmit={submit}>
      <div className="form-intro">
        <p className="eyebrow">Configuration</p>
        <h2>{initialElection ? 'Update election setup' : 'Configure an election'}</h2>
        <p>Set the department and add positions in the order they will be managed.</p>
      </div>
      <label htmlFor="department-name">Department name</label>
      <input id="department-name" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} required maxLength={120} />
      <div className="positions-form-heading">
        <div><h3>Positions</h3><p>The first position is first to manage.</p></div>
      </div>
      <ol className="position-editor-list">
        {positions.map((position, index) => (
          <li className="position-editor" key={index}>
            <div className="editor-title"><span className="sequence-number">{index + 1}</span><strong>Position {index + 1}</strong></div>
            <div className="editor-fields">
              <div className="field-group">
                <label htmlFor={`position-name-${index}`}>Position name</label>
                <input id={`position-name-${index}`} value={position.name} onChange={(event) => updatePosition(index, 'name', event.target.value)} required maxLength={120} />
              </div>
              <div className="field-group opening-field">
                <label htmlFor={`opening-count-${index}`}>Openings</label>
                <input id={`opening-count-${index}`} type="number" min="1" step="1" inputMode="numeric" value={position.openingCount} onChange={(event) => updatePosition(index, 'openingCount', event.target.value)} required />
              </div>
            </div>
            <div className="position-controls">
              <button type="button" className="icon-button" aria-label={`Move ${position.name || `position ${index + 1}`} up`} disabled={index === 0} onClick={() => movePosition(index, -1)}>↑</button>
              <button type="button" className="icon-button" aria-label={`Move ${position.name || `position ${index + 1}`} down`} disabled={index === positions.length - 1} onClick={() => movePosition(index, 1)}>↓</button>
              <button type="button" className="remove-button" disabled={positions.length === 1} onClick={() => setPositions((current) => current.filter((_, positionIndex) => positionIndex !== index))}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
      <button className="add-button" type="button" onClick={() => setPositions((current) => [...current, { name: '', openingCount: '1' }])}>＋ <span>Add position</span></button>
      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : initialElection ? 'Save changes' : 'Create election'}</button>
      </div>
    </form>
  );
}

export default App;
