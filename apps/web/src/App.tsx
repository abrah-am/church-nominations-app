import { FormEvent, useState } from 'react';
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
  deleteElectionPosition,
  getElection,
  listElections,
  updateElection,
} from './api/elections';
import { AccessGate } from './features/auth/AccessGate';
import { BoardScreen, BoardsWorkspace } from './features/boards/BoardsWorkspace';
import { ElectionForm } from './features/elections/ElectionForm';
import NominationAdminPanel from './features/nominations/NominationAdminPanel';
import PublicNominationPage from './features/nominations/PublicNominationPage';
import PublicVotingPage from './features/voting/PublicVotingPage';

type Screen = 'list' | 'detail' | 'form';
type Workspace = 'elections' | 'boards';

export { getCandidateRecommendation } from './features/elections/candidateRecommendations';

function App() {
  const routeMatch = window.location.pathname.match(/^\/nominate\/([^/]+)\/?$/);
  if (routeMatch) return <PublicNominationPage accessToken={decodeURIComponent(routeMatch[1])} />;
  const votingRouteMatch = window.location.pathname.match(/^\/vote\/([^/]+)\/?$/);
  if (votingRouteMatch) return <PublicVotingPage accessToken={decodeURIComponent(votingRouteMatch[1])} />;
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
  const [deletePositionOpen, setDeletePositionOpen] = useState(false);
  const [deletePositionConfirmation, setDeletePositionConfirmation] = useState('');
  const [screen, setScreen] = useState<Screen>('list');
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingPosition, setIsDeletingPosition] = useState(false);
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

  async function deleteSelectedPosition(position: Election['positions'][number]) {
    if (!credentials || !selectedElection || deletePositionConfirmation !== position.name) return;
    setIsDeletingPosition(true);
    setPageError('');
    try {
      await deleteElectionPosition(credentials, selectedElection.id, position.id);
      const [refreshedElections, refreshedElection] = await Promise.all([
        listElections(credentials),
        getElection(credentials, selectedElection.id),
      ]);
      setElections(refreshedElections);
      setSelectedElection(refreshedElection);
      setSelectedPositionIndex((index) => Math.min(index, Math.max(0, refreshedElection.positions.length - 1)));
      setDeletePositionOpen(false);
      setDeletePositionConfirmation('');
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsDeletingPosition(false);
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

      {!credentials || churches.length === 0 ? (
        <AccessGate
          hasCredentials={Boolean(credentials)}
          hasChurch={churches.length > 0}
          registrationMode={registrationMode}
          registrationSuccess={registrationSuccess}
          loginError={loginError}
          pageError={pageError}
          isLoading={isLoading}
          isSaving={isSaving}
          onSignIn={signIn}
          onSignUp={signUp}
          onSubmitChurch={submitChurch}
          onToggleRegistration={() => { setRegistrationMode((mode) => !mode); setLoginError(''); setRegistrationSuccess(''); }}
        />
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
                {selectedElection && selectedElection.positions.length > 0 && <button className="secondary-button" type="button" onClick={() => { setPageError(''); setScreen('form'); }}>Edit setup</button>}
              </div>
              {isLoading || !selectedElection ? <p className="state-message" role="status">Loading election…</p> : (
                <>
                  <div className="detail-summary">
                    <div><span className="summary-label">Department</span><strong>{selectedElection.departmentName}</strong></div>
                    <div><span className="summary-label">Status</span><span className="row-status">Setup</span></div>
                    <div><span className="summary-label">Configured openings</span><strong>{selectedElection.positions.reduce((total, position) => total + position.openingCount, 0)}</strong></div>
                  </div>
                  <div className="section-heading position-heading">
                    <div><h2>{selectedElection.positions.length === 0 ? 'No positions configured' : `Position ${selectedPositionIndex + 1} of ${selectedElection.positions.length}`}</h2><p>Manage positions in configured order</p></div>
                  </div>
                  {(() => {
                    const positions = [...selectedElection.positions].sort((a, b) => a.sequence - b.sequence);
                    const position = positions[selectedPositionIndex];
                    if (!position) {
                      return (
                        <div className="empty-state position-empty-state">
                          <span className="empty-rule" aria-hidden="true" />
                          <h3>This election has no positions</h3>
                          <p>The election remains available. Add a position to continue.</p>
                          <button className="secondary-button" type="button" onClick={() => { setPageError(''); setScreen('form'); }}>Edit setup</button>
                        </div>
                      );
                    }
                    return (
                      <>
                        <div className="position-detail" aria-live="polite">
                          <span className="sequence-number">{position.sequence}</span>
                          <div className="position-copy"><strong>{position.name}</strong><span>{position.openingCount} {position.openingCount === 1 ? 'opening' : 'openings'}</span></div>
                        </div>
                        <div className="position-admin-actions">
                          <button className="danger-button" type="button" onClick={() => { setDeletePositionConfirmation(''); setDeletePositionOpen(true); }}>Delete position</button>
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
                          openingCount={position.openingCount}
                        />
                        {deletePositionOpen && (
                          <div className="dialog-backdrop">
                            <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-position-title" aria-describedby="delete-position-description">
                              <h3 id="delete-position-title">Delete {position.name}?</h3>
                              <p id="delete-position-description">This permanently deletes this position&apos;s nominations and submissions, ballots, rounds, outcomes, and audit history. This position&apos;s election history will be unrecoverable. Other positions and the parent election will remain.</p>
                              <form onSubmit={(event) => { event.preventDefault(); void deleteSelectedPosition(position); }}>
                                <label htmlFor="delete-position-name">Type {position.name} exactly to confirm</label>
                                <input id="delete-position-name" value={deletePositionConfirmation} onChange={(event) => setDeletePositionConfirmation(event.target.value)} autoComplete="off" autoFocus />
                                <div className="form-actions dialog-actions">
                                  <button className="secondary-button" type="button" disabled={isDeletingPosition} onClick={() => { setDeletePositionOpen(false); setDeletePositionConfirmation(''); }}>Cancel</button>
                                  <button className="danger-button" type="submit" disabled={isDeletingPosition || deletePositionConfirmation !== position.name}>{isDeletingPosition ? 'Deleting…' : 'Permanently delete position'}</button>
                                </div>
                              </form>
                            </section>
                          </div>
                        )}
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

export default App;
