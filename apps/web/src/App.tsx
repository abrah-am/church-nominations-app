import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
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
import NominationPresentationPage from './features/nominations/NominationPresentationPage';
import PublicVotingPage from './features/voting/PublicVotingPage';

type Screen = 'terms' | 'list' | 'detail' | 'form';
type Workspace = 'elections' | 'boards';

const demoElectionTerms = ['Elections 2026', 'Elections 2027'];

const electionStatusLabels: Record<Election['status'], string> = {
  SETUP: 'Setup',
  IN_PROGRESS: 'In progress',
  COMPLETE: 'Complete',
};

const positionProgressLabels: Record<string, string> = {
  NOT_STARTED: 'Not started',
  NOMINATIONS_OPEN: 'Nominations open',
  NOMINATIONS_CLOSED: 'Nominations closed',
  CONSOLIDATED: 'Consolidated',
  ROUND_DRAFT: 'Round configured',
  ROUND_ACTIVE: 'Voting active',
  ROUND_CLOSED_UNREVEALED: 'Round closed',
  RESULTS_REVEALED: 'Results revealed',
  CANDIDATES_ADVANCED: 'Candidates advanced',
  COMPLETE: 'Complete',
};

const inProgressPositionStates = new Set([
  'NOMINATIONS_OPEN',
  'NOMINATIONS_CLOSED',
  'CONSOLIDATED',
  'ROUND_DRAFT',
  'ROUND_ACTIVE',
  'ROUND_CLOSED_UNREVEALED',
  'RESULTS_REVEALED',
  'CANDIDATES_ADVANCED',
]);
const knownPositionStates = new Set(['NOT_STARTED', ...inProgressPositionStates, 'COMPLETE']);

const positionActionLabels: Record<string, string> = {
  SET_UP_NOMINATIONS: 'Set up nominations',
  CLOSE_NOMINATIONS: 'Close nominations',
  CONSOLIDATE_NOMINATIONS: 'Review and consolidate names',
  CONFIGURE_FIRST_ROUND: 'Configure first round',
  START_VOTING: 'Review and start voting',
  MONITOR_VOTING: 'Monitor voting',
  REVEAL_RESULTS: 'Reveal results',
  RECORD_CANDIDATE_DECISIONS: 'Record candidate decisions',
  CONFIGURE_NEXT_ROUND: 'Configure next round',
  COMPLETE: 'Position complete',
};

export { getCandidateRecommendation } from './features/elections/candidateRecommendations';

function App() {
  const routeMatch = window.location.pathname.match(/^\/nominate\/([^/]+)\/?$/);
  if (routeMatch) return <PublicNominationPage accessToken={decodeURIComponent(routeMatch[1])} />;
  const presentationRouteMatch = window.location.pathname.match(/^\/nomination-presentation\/([^/]+)\/?$/);
  if (presentationRouteMatch) return <NominationPresentationPage accessToken={decodeURIComponent(presentationRouteMatch[1])} />;
  const votingRouteMatch = window.location.pathname.match(/^\/vote\/([^/]+)\/?$/);
  if (votingRouteMatch) return <PublicVotingPage accessToken={decodeURIComponent(votingRouteMatch[1])} />;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const statusRefreshVersion = useRef(0);
  const [credentials, setCredentials] = useState<string | null>(null);
  const [account, setAccount] = useState<SafeAccount | null>(null);
  const [churches, setChurches] = useState<Church[]>([]);
  const [registrationMode, setRegistrationMode] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState('');
  const [loginError, setLoginError] = useState('');
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [collapsedElectionIds, setCollapsedElectionIds] = useState<Set<string>>(() => new Set());
  const initializedElectionAccordions = useRef(false);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedPositionIndex, setSelectedPositionIndex] = useState(0);
  const [positionDraftDirty, setPositionDraftDirty] = useState(false);
  const positionDraftDirtyRef = useRef(false);
  const [pendingPositionIndex, setPendingPositionIndex] = useState<number | null>(null);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const stayOnPositionButton = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const mainRegion = useRef<HTMLElement>(null);
  const positionSummary = useRef<HTMLDivElement>(null);
  const focusPositionAfterSwitch = useRef(false);
  const focusMainAfterNavigation = useRef(false);
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

  const reportPositionDraftState = useCallback((dirty: boolean) => {
    positionDraftDirtyRef.current = dirty;
    setPositionDraftDirty(dirty);
  }, []);

  useEffect(() => {
    if (elections.length === 0 || initializedElectionAccordions.current) return;
    initializedElectionAccordions.current = true;
    setCollapsedElectionIds(new Set(elections.slice(1).map((election) => election.id)));
  }, [elections]);

  function requestPositionChange(index: number) {
    if (index === selectedPositionIndex) return;
    if (positionDraftDirtyRef.current || positionDraftDirty) {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setPendingPositionIndex(index);
      return;
    }
    setSelectedPositionIndex(index);
  }

  function requestNavigation(action: () => void) {
    if (!positionDraftDirtyRef.current && !positionDraftDirty) {
      action();
      return;
    }
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setPendingNavigation(action);
  }

  function closeDraftDialog() {
    setPendingPositionIndex(null);
    setPendingNavigation(null);
    previousFocus.current?.focus();
  }

  function discardPositionDraftAndSwitch() {
    if (pendingPositionIndex === null && pendingNavigation === null) return;
    positionDraftDirtyRef.current = false;
    setPositionDraftDirty(false);
    if (pendingPositionIndex !== null) {
      focusPositionAfterSwitch.current = true;
      setSelectedPositionIndex(pendingPositionIndex);
    }
    if (pendingNavigation !== null) focusMainAfterNavigation.current = true;
    pendingNavigation?.();
    setPendingPositionIndex(null);
    setPendingNavigation(null);
  }

  useEffect(() => {
    if (pendingPositionIndex !== null || pendingNavigation !== null) stayOnPositionButton.current?.focus();
  }, [pendingPositionIndex, pendingNavigation]);
  useEffect(() => {
    if (focusPositionAfterSwitch.current) {
      focusPositionAfterSwitch.current = false;
      positionSummary.current?.focus();
    }
  }, [selectedPositionIndex]);

  useEffect(() => {
    if (focusMainAfterNavigation.current) {
      focusMainAfterNavigation.current = false;
      mainRegion.current?.focus();
    }
  }, [credentials, screen, workspace, boardScreen]);

  function handleDraftDialogKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDraftDialog();
      return;
    }
    if (event.key !== 'Tab') return;
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  function handleRequestError(error: unknown) {
    if ((error instanceof ElectionsApiError || error instanceof AuthApiError || error instanceof BoardsApiError) && error.status === 401) {
      statusRefreshVersion.current += 1;
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
      setSelectedTerm(null);
      if (currentChurches.length > 0) setScreen('terms');
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
      setSelectedTerm(null);
      setScreen('terms');
    } catch (error) {
      handleRequestError(error);
    } finally {
      setIsSaving(false);
    }
  }

  function performSignOut() {
    statusRefreshVersion.current += 1;
    setCredentials(null);
    setAccount(null);
    setChurches([]);
    setElections([]);
    setSelectedTerm(null);
    setCollapsedElectionIds(new Set());
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

  function signOut() {
    requestNavigation(performSignOut);
  }

  async function openElection(election: Election, positionId?: string) {
    if (!credentials) return;
    const requestVersion = ++statusRefreshVersion.current;
    const requestCredentials = credentials;
    setScreen('detail');
    setSelectedElection(null);
    setSelectedPositionIndex(0);
    setPageError('');
    setIsLoading(true);
    try {
      const openedElection = await getElection(requestCredentials, election.id);
      if (requestVersion !== statusRefreshVersion.current || credentials !== requestCredentials) return;
      setSelectedElection(openedElection);
      const positions = [...openedElection.positions].sort((a, b) => a.sequence - b.sequence);
      const targetPositionIndex = positionId ? positions.findIndex((position) => position.id === positionId) : -1;
      setSelectedPositionIndex(Math.max(0, targetPositionIndex));
    } catch (error) {
      if (requestVersion !== statusRefreshVersion.current || credentials !== requestCredentials) return;
      handleRequestError(error);
      setScreen('list');
    } finally {
      if (requestVersion === statusRefreshVersion.current) setIsLoading(false);
    }
  }

  const refreshElectionStatus = useCallback(async (electionId: string, refreshList = false) => {
    if (!credentials) return;
    const requestVersion = ++statusRefreshVersion.current;
    const requestCredentials = credentials;
    try {
      const [refreshedElections, refreshedElection] = refreshList
        ? await Promise.all([listElections(requestCredentials), getElection(requestCredentials, electionId)])
        : [null, await getElection(requestCredentials, electionId)] as const;
      if (requestVersion !== statusRefreshVersion.current || credentials !== requestCredentials) return;
      if (refreshedElections) setElections(refreshedElections);
      setSelectedElection((current) => current?.id === electionId ? refreshedElection : current);
    } catch (error) {
      if (requestVersion !== statusRefreshVersion.current || credentials !== requestCredentials) return;
      handleRequestError(error);
    }
  }, [credentials]);

  function returnToElectionList() {
    requestNavigation(() => {
      setScreen('list');
      setPageError('');
      if (selectedElection) void refreshElectionStatus(selectedElection.id, true);
    });
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
  const electionSummary = {
    total: elections.length,
    inProgress: elections.filter((election) => election.status === 'IN_PROGRESS').length,
    openings: elections.reduce((total, election) => total + election.positions.reduce((positionTotal, position) => positionTotal + position.openingCount, 0), 0),
    setup: elections.filter((election) => election.status === 'SETUP').length,
    complete: elections.filter((election) => election.status === 'COMPLETE').length,
    positionNotStarted: elections.reduce((total, election) => total + election.positions.filter((position) => position.progressStatus === 'NOT_STARTED').length, 0),
    positionInProgress: elections.reduce((total, election) => total + election.positions.filter((position) => inProgressPositionStates.has(position.progressStatus)).length, 0),
    positionComplete: elections.reduce((total, election) => total + election.positions.filter((position) => position.progressStatus === 'COMPLETE').length, 0),
    positionUnavailable: elections.reduce((total, election) => total + election.positions.filter((position) => !position.progressStatus || !knownPositionStates.has(position.progressStatus)).length, 0),
  };

  return (
    <main ref={mainRegion} tabIndex={-1} className={`app-shell container-xl${credentials ? '' : ' access-shell'}`}>
      {credentials ? (
        <header className="topbar">
          <a className="wordmark" href="/" aria-label="Church Nominations home" onClick={(event) => event.preventDefault()}>
            <span className="mark" aria-hidden="true">C</span>
            <span>Church Nominations</span>
          </a>
          <div className="topbar-tools">
            <span className="environment-label">LOCAL DEVELOPMENT</span>
            <button className="text-button" type="button" onClick={signOut}>Sign out</button>
          </div>
        </header>
      ) : (
        <header className="access-masthead">
          <p className="eyebrow">Church Nominations · Administrator access</p>
          <h1>One election, three connected experiences</h1>
          <p className="context">Sign in to manage your church elections</p>
        </header>
      )}

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
                : screen === 'terms' ? 'Administrator Workspace' : screen === 'detail' && selectedElection ? selectedElection.departmentName : screen === 'form' ? (isEditing ? 'Edit setup' : 'New election') : screen === 'list' && selectedTerm ? selectedTerm : churches[0]?.name ?? 'My churches'}</h1>
              <p className="intro workspace-account">{churches[0]?.name ? `${churches[0].name} · ` : ''}Administrator workspace{typeof account?.email === 'string' ? ` · ${account.email}` : ''}</p>
            </div>
            {workspace === 'elections' && screen === 'list' && <button className="primary-button create-button" type="button" onClick={openCreateForm}>＋ <span>Create election</span></button>}
          </div>

          <nav className="workspace-tabs" aria-label="Church workspace">
            <button type="button" aria-pressed={workspace === 'elections'} onClick={() => requestNavigation(() => { setWorkspace('elections'); setScreen('list'); setPageError(''); })}>Department elections</button>
            <button type="button" aria-pressed={workspace === 'boards'} onClick={() => requestNavigation(() => { void openBoardsWorkspace(); })}>Annual Boards</button>
          </nav>

          {workspace === 'boards' && <div className="setup-notice attendance-notice" role="note">
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
          {screen === 'terms' && (
            <section className="term-chooser" aria-labelledby="term-chooser-title">
              <div className="section-heading">
                <div>
                  <h2 id="term-chooser-title">Choose an election term</h2>
                  <p>Sample terms for this visual prototype. Terms are not stored by the election API.</p>
                </div>
              </div>
              <div className="term-options">
                {demoElectionTerms.map((term) => (
                  <button className="term-option" type="button" key={term} onClick={() => { setSelectedTerm(term); setScreen('list'); }}>
                    <span><strong>{term}</strong><small>Demo term · no backend association</small></span>
                    <span aria-hidden="true">→</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {screen === 'list' && (
            <section className="election-section" aria-labelledby="election-list-title">
              {selectedTerm && <div className="term-context">
                <button className="back-button" type="button" onClick={() => { setSelectedTerm(null); setScreen('terms'); }}>← <span>All terms</span></button>
                <span className="demo-badge">SAMPLE TERM</span>
                <p>Live election rows below are shown under this demo term for visual presentation only. The API does not associate elections with terms.</p>
              </div>}
              <section className="demo-link-panels" aria-label="Sample links, display only">
                <div className="demo-link-panel"><h3>Sample voting session link</h3><span className="demo-badge">DEMO LINK · NOT ACTIVE</span><code>sample://voting-session/example</code></div>
                <div className="demo-link-panel"><h3>Sample presentation link</h3><span className="demo-badge">DEMO LINK · NOT ACTIVE</span><code>sample://presentation/example</code></div>
              </section>
              <div className="section-heading">
                <div>
                  <h2 id="election-list-title">Department elections</h2>
                  <p>{elections.length} {elections.length === 1 ? 'election' : 'elections'}</p>
                </div>
              </div>
              <div className="overview-statuses" role="group" aria-label="Position status summary">
                <span className="overview-status-label">Position progress</span>
                <span className="status-count status-count-progress"><strong>{electionSummary.positionInProgress}</strong> in progress</span>
                <span className="status-count"><strong>{electionSummary.positionNotStarted}</strong> not started</span>
                <span className="status-count status-count-complete"><strong>{electionSummary.positionComplete}</strong> complete</span>
                {electionSummary.positionUnavailable > 0 && <span className="status-count">{electionSummary.positionUnavailable} unavailable</span>}
              </div>
              {isLoading ? <p className="state-message" role="status">Loading elections…</p> : elections.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-rule" aria-hidden="true" />
                  <h3>No elections configured</h3>
                  <p>Create an election to define its department, positions, and openings.</p>
                  <button className="secondary-button" type="button" onClick={openCreateForm}>Create first election</button>
                </div>
              ) : (
                <div className="accordion election-accordion">
                  {elections.map((election) => (
                      <section key={election.id} className="accordion-item election-overview-item">
                        <div className="election-accordion-header" id={`election-heading-${election.id}`}>
                          <button className="election-row" type="button" aria-label={`${election.departmentName}, ${election.positions.length} ${election.positions.length === 1 ? 'position' : 'positions'}, ${electionStatusLabels[election.status]}`} onClick={() => { const firstPosition = [...election.positions].sort((a, b) => a.sequence - b.sequence)[0]; void openElection(election, firstPosition?.id); }}>
                            <span className="election-row-copy">
                              <strong>{election.departmentName}</strong>
                              <span>{election.positions.length} {election.positions.length === 1 ? 'position' : 'positions'} · {election.positions.reduce((total, position) => total + position.openingCount, 0)} {election.positions.reduce((total, position) => total + position.openingCount, 0) === 1 ? 'opening' : 'openings'}</span>
                            </span>
                            <span className={`row-status row-status-${election.status.toLowerCase()}`} role="group" aria-label={`Election status: ${electionStatusLabels[election.status]}`}>{electionStatusLabels[election.status]}</span>
                            <span className="row-arrow" aria-hidden="true">→</span>
                          </button>
                          <button className={`election-accordion-toggle${collapsedElectionIds.has(election.id) ? ' collapsed' : ''}`} type="button" aria-label={`${collapsedElectionIds.has(election.id) ? 'Expand' : 'Collapse'} positions`} aria-expanded={!collapsedElectionIds.has(election.id)} aria-controls={`election-panel-${election.id}`} onClick={() => setCollapsedElectionIds((current) => {
                            const next = new Set(current);
                            if (next.has(election.id)) next.delete(election.id); else next.add(election.id);
                            return next;
                          })}>
                            <span aria-hidden="true">{collapsedElectionIds.has(election.id) ? '+' : '−'}</span>
                          </button>
                        </div>
                      <div id={`election-panel-${election.id}`} className={`accordion-collapse collapse${collapsedElectionIds.has(election.id) ? '' : ' show'}`} aria-labelledby={`election-heading-${election.id}`}>
                      {election.positions.length > 0 && (
                        <ul className="position-overview-list" aria-label={`${election.departmentName} positions`}>
                          {[...election.positions].sort((a, b) => a.sequence - b.sequence).map((position) => {
                            const statusLabel = positionProgressLabels[position.progressStatus] ?? 'Progress unavailable';
                            const actionLabel = positionActionLabels[position.nextAction] ?? 'Action unavailable';
                            const statusClass = position.progressStatus === 'NOT_STARTED'
                              ? 'position-status-setup'
                              : position.progressStatus === 'COMPLETE'
                                ? 'position-status-complete'
                                : inProgressPositionStates.has(position.progressStatus)
                                  ? 'position-status-progress'
                                  : 'position-status-unavailable';
                            return (
                              <li className="position-overview-row" key={position.id}>
                                <span className="position-overview-copy">
                                  <strong>{position.name}</strong>
                                  <span>{position.openingCount} {position.openingCount === 1 ? 'opening' : 'openings'}{position.roundNumber == null ? '' : ` · Round ${position.roundNumber}`}</span>
                                </span>
                                <span className={`position-overview-status ${statusClass}`}>{statusLabel}</span>
                                <button className="position-overview-action" type="button" aria-label={`${actionLabel}: ${position.name}`} onClick={(event) => { event.stopPropagation(); void openElection(election, position.id); }}>
                                  Configure Position<span aria-hidden="true"> →</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          )}

          {screen === 'detail' && (
            <section className="detail-section">
              <div className="detail-actions">
                <button className="back-button" type="button" onClick={returnToElectionList}>← <span>All elections</span></button>
                {selectedElection && selectedElection.positions.length > 0 && <button className="secondary-button" type="button" onClick={() => requestNavigation(() => { setPageError(''); setScreen('form'); })}>Configure Position</button>}
              </div>
              {isLoading || !selectedElection ? <p className="state-message" role="status">Loading election…</p> : (
                <>
                  <div className="detail-summary">
                    <div><span className="summary-label">Department</span><strong>{selectedElection.departmentName}</strong></div>
                    <div><span className="summary-label">Status</span><span className={`row-status row-status-${selectedElection.status.toLowerCase()}`} role="group" aria-live="polite" aria-label={`Election status: ${electionStatusLabels[selectedElection.status]}`}>
                      {electionStatusLabels[selectedElection.status]}
                    </span></div>
                    <div><span className="summary-label">Configured openings</span><strong>{selectedElection.positions.reduce((total, position) => total + position.openingCount, 0)}</strong></div>
                  </div>
                  <div className="overview-statuses detail-position-statuses" role="group" aria-label="Election position status summary">
                    <span className="overview-status-label">Position progress</span>
                    <span className="status-count status-count-progress"><strong>{selectedElection.positions.filter((position) => inProgressPositionStates.has(position.progressStatus)).length}</strong> in progress</span>
                    <span className="status-count"><strong>{selectedElection.positions.filter((position) => position.progressStatus === 'NOT_STARTED').length}</strong> not started</span>
                    <span className="status-count status-count-complete"><strong>{selectedElection.positions.filter((position) => position.progressStatus === 'COMPLETE').length}</strong> complete</span>
                    {selectedElection.positions.some((position) => !position.progressStatus || !knownPositionStates.has(position.progressStatus)) && <span className="status-count">{selectedElection.positions.filter((position) => !position.progressStatus || !knownPositionStates.has(position.progressStatus)).length} unavailable</span>}
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
                          <button className="secondary-button" type="button" onClick={() => requestNavigation(() => { setPageError(''); setScreen('form'); })}>Configure Position</button>
                        </div>
                      );
                    }
                    const statusLabel = position.progressStatus
                      ? positionProgressLabels[position.progressStatus] ?? position.progressStatus.replace(/_/g, ' ').toLowerCase()
                      : 'Progress unavailable';
                    const actionLabel = position.nextAction
                      ? positionActionLabels[position.nextAction] ?? position.nextAction.replace(/_/g, ' ').toLowerCase()
                      : 'Action unavailable';
                    return (
                      <>
                        <nav className="position-stepper" aria-label="Election positions">
                          <ol className="list-group list-group-flush">
                            {positions.map((item, index) => {
                              const itemStatus = item.progressStatus
                                ? positionProgressLabels[item.progressStatus] ?? item.progressStatus.replace(/_/g, ' ').toLowerCase()
                                : 'Progress unavailable';
                              const itemAction = item.nextAction
                                ? positionActionLabels[item.nextAction] ?? item.nextAction.replace(/_/g, ' ').toLowerCase()
                                : 'Action unavailable';
                              const current = index === selectedPositionIndex;
                              return (
                                <li key={item.id}>
                                  <button className={`list-group-item list-group-item-action position-stepper-item${current ? ' active' : ''}`} type="button" aria-current={current ? 'step' : undefined} aria-label={`Position ${index + 1} of ${positions.length}: ${item.name}, ${item.openingCount} ${item.openingCount === 1 ? 'opening' : 'openings'}, ${itemStatus}, next action: ${itemAction}${item.roundNumber == null ? '' : `, round ${item.roundNumber}`}${current ? ', current position' : ''}`} onClick={() => requestPositionChange(index)}>
                                    <span className="step-number">{index + 1}</span>
                                    <span className="step-copy">
                                      <strong>{item.name} · {item.openingCount} {item.openingCount === 1 ? 'opening' : 'openings'}</strong>
                                      <span>{itemStatus}{item.roundNumber == null ? '' : ` · Round ${item.roundNumber}`}</span>
                                      <span>Next: {itemAction}</span>
                                    </span>
                                    <span className={`badge rounded-pill position-status-${item.progressStatus === 'NOT_STARTED' ? 'setup' : item.progressStatus === 'COMPLETE' ? 'complete' : 'progress'}`}>{itemStatus}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ol>
                        </nav>
                        <div ref={positionSummary} tabIndex={-1} className="position-detail" aria-live="polite" aria-atomic="true" aria-label={`Current position: ${position.name}, ${position.openingCount} ${position.openingCount === 1 ? 'opening' : 'openings'}, ${statusLabel}, next action: ${actionLabel}${position.roundNumber == null ? '' : `, round ${position.roundNumber}`}`}>
                          <span className="sequence-number">{position.sequence}</span>
                          <div className="position-copy"><strong>{position.name}</strong><span>{position.openingCount} {position.openingCount === 1 ? 'opening' : 'openings'}</span></div>
                          <div className="position-progress"><strong>{statusLabel}{position.roundNumber == null ? '' : ` · Round ${position.roundNumber}`}</strong><span>Next action: {actionLabel}</span></div>
                        </div>
                        <div className="position-admin-actions">
                          <button className="danger-button" type="button" onClick={() => { setDeletePositionConfirmation(''); setDeletePositionOpen(true); }}>Delete position</button>
                        </div>
                        <nav className="position-navigation" aria-label="Election position sequence">
                          <button className="secondary-button" type="button" disabled={selectedPositionIndex === 0} onClick={() => requestPositionChange(selectedPositionIndex - 1)}>← <span>Previous position</span></button>
                          <button className="secondary-button" type="button" disabled={selectedPositionIndex === positions.length - 1} onClick={() => requestPositionChange(selectedPositionIndex + 1)}><span>Next position</span> →</button>
                        </nav>
                        <NominationAdminPanel
                          key={`${selectedElection.id}-${position.id}`}
                          credentials={credentials}
                          electionId={selectedElection.id}
                          positionId={position.id}
                          positionName={position.name}
                          openingCount={position.openingCount}
                          positionProgressStatus={position.progressStatus}
                          onLifecycleChange={() => { void refreshElectionStatus(selectedElection.id); }}
                          onDraftStateChange={reportPositionDraftState}
                        />
                        {(pendingPositionIndex !== null || pendingNavigation !== null) && (
                          <div className="dialog-backdrop">
                            <section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="position-draft-title" aria-describedby="position-draft-description" onKeyDown={handleDraftDialogKeyDown}>
                              <h3 id="position-draft-title">Unsaved changes</h3>
                              <p id="position-draft-description">This position has unsaved edits. Staying keeps them here; leaving requires discarding them.</p>
                              <div className="form-actions dialog-actions">
                                <button ref={stayOnPositionButton} className="secondary-button" type="button" onClick={closeDraftDialog}>Stay on this position</button>
                                <button className="danger-button" type="button" onClick={discardPositionDraftAndSwitch}>{pendingPositionIndex === null ? 'Discard changes and continue' : 'Discard changes and switch'}</button>
                              </div>
                            </section>
                          </div>
                        )}
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
