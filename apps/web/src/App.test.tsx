import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const election = {
  id: 'election-1',
  departmentName: 'Finance',
  status: 'SETUP' as const,
  positions: [
    { id: 'position-2', name: 'Treasurer', openingCount: 2, sequence: 2 },
    { id: 'position-1', name: 'Director', openingCount: 1, sequence: 1 },
  ],
};
const account = { id: 'account-1', email: 'admin@example.com' };
const church = { id: 'church-1', name: 'Grace Church' };

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) };
}

afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

async function signIn(email = 'admin@example.com', password = 'secret') {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
}

function signedInFetch(churches: unknown[], elections: unknown[]) {
  return vi.fn()
    .mockResolvedValueOnce(response(account))
    .mockResolvedValueOnce(response(churches))
    .mockResolvedValueOnce(response(elections));
}

describe('election administration', () => {
  it('registers an account without authenticating or requesting election data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(account, 201));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secure-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Account created. Sign in');
    expect(screen.queryByText('Use 8 to 72 characters for your password.')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/auth/register');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@example.com', password: 'secure-password-123' }),
    });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(screen.getByRole('heading', { name: 'Election setup' })).toBeInTheDocument();
  });

  it('shows password requirements and explains registration validation errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ error: 'validation_failed', message: 'Request body is invalid' }, 400));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Create an account' }));
    const passwordInput = screen.getByLabelText('Password');
    expect(passwordInput).toHaveAttribute('minlength', '8');
    expect(passwordInput).toHaveAttribute('maxlength', '72');
    expect(screen.getByText('Use 8 to 72 characters for your password.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secure-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Use a valid email and a password between 8 and 72 characters.');
  });

  it('validates sign-in and prompts for a church without requesting elections', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(account))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();

    expect(await screen.findByRole('heading', { name: 'Register your church' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/auth/me');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/churches/my');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    expect(fetchMock.mock.calls.some(([url]) => url === 'http://localhost:8080/api/elections')).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => url === 'http://localhost:8080/api/boards')).toBe(false);
  });

  it('creates a church, refreshes membership, then loads election setup', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(account))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(church, 201))
      .mockResolvedValueOnce(response([church]))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.change(await screen.findByLabelText('Church name'), { target: { value: 'Grace Church' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register church' }));

    expect(await screen.findByRole('heading', { name: 'Department elections' })).toBeInTheDocument();
    expect(screen.getByText(/Setup and nominations/)).toBeInTheDocument();
    expect(screen.queryByText(/Voting and nominations are not available yet/)).not.toBeInTheDocument();
    expect(screen.getByText(/Current church: Grace Church/)).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:8080/api/churches');
    expect(fetchMock.mock.calls[2][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ name: 'Grace Church' }),
    });
    expect(fetchMock.mock.calls[2][1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:8080/api/churches/my');
    expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:8080/api/elections');
  });

  it('keeps a successfully created church when refreshing membership fails', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(account))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response(church, 201))
      .mockResolvedValueOnce(response({}, 500));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.change(await screen.findByLabelText('Church name'), { target: { value: 'Grace Church' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register church' }));

    expect(await screen.findByRole('heading', { name: 'My churches' })).toBeInTheDocument();
    expect(screen.getByText(/Current church: Grace Church/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Register church' })).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('HTTP 500');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('authenticates with Basic credentials and manages positions in configured order', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    await screen.findByRole('heading', { name: 'Department elections' });

    const meRequest = fetchMock.mock.calls[0];
    expect(meRequest[0]).toBe('http://localhost:8080/api/auth/me');
    expect(meRequest[1].headers).toEqual({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Basic ${btoa('admin@example.com:secret')}`,
    });
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/churches/my');
    expect(fetchMock.mock.calls[2][0]).toBe('http://localhost:8080/api/elections');
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));

    expect(await screen.findByRole('heading', { name: 'Position 1 of 2' })).toBeInTheDocument();
    expect(await screen.findByText('Director')).toBeInTheDocument();
    expect(screen.queryByText('Treasurer')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Previous position/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Next position/ }));
    expect(await screen.findByRole('heading', { name: 'Position 2 of 2' })).toBeInTheDocument();
    expect(await screen.findByText('Treasurer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Next position/ })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Previous position/ }));
    expect(await screen.findByRole('heading', { name: 'Position 1 of 2' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:8080/api/elections/election-1');
  });

  it('creates an election with positions in the configured management order', async () => {
    const created = {
      id: 'election-2',
      departmentName: 'Operations',
      status: 'SETUP' as const,
      positions: [
        { id: 'p-1', name: 'Assistant', openingCount: 2, sequence: 1 },
        { id: 'p-2', name: 'Director', openingCount: 1, sequence: 2 },
      ],
    };
    const fetchMock = signedInFetch([church], []);
    fetchMock.mockResolvedValueOnce(response(created));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Create first election' }));
    fireEvent.change(screen.getByLabelText('Department name'), { target: { value: 'Operations' } });
    fireEvent.change(screen.getAllByLabelText('Position name')[0], { target: { value: 'Director' } });
    fireEvent.click(screen.getByRole('button', { name: /Add position/ }));
    fireEvent.change(screen.getAllByLabelText('Position name')[1], { target: { value: 'Assistant' } });
    fireEvent.change(screen.getAllByLabelText('Openings')[1], { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move Assistant up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create election' }));

    await screen.findByRole('heading', { name: 'Position 1 of 2' });
    const createRequest = fetchMock.mock.calls[3];
    expect(createRequest[0]).toBe('http://localhost:8080/api/elections');
    expect(createRequest[1].method).toBe('POST');
    expect(JSON.parse(createRequest[1].body)).toEqual({
      departmentName: 'Operations',
      positions: [
        { name: 'Assistant', openingCount: 2 },
        { name: 'Director', openingCount: 1 },
      ],
    });
    expect(createRequest[1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    expect(await screen.findByText('Assistant')).toBeInTheDocument();
  });

  it('creates an annual board with a named roster only after selecting that workspace', async () => {
    const board = {
      id: 'board-2026',
      year: 2026,
      members: [{ id: 'member-1', name: 'Jordan Lee' }, { id: 'member-2', name: 'Avery Chen' }],
      sessions: [],
    };
    const fetchMock = signedInFetch([church], []);
    fetchMock.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response(board, 201));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    await screen.findByRole('heading', { name: 'Department elections' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls.some(([url]) => url === 'http://localhost:8080/api/boards')).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: 'Annual Boards' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Create first board' }));
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '2026' } });
    fireEvent.change(screen.getByLabelText('Member 1 name'), { target: { value: 'Jordan Lee' } });
    fireEvent.click(screen.getByRole('button', { name: /Add member/ }));
    fireEvent.change(screen.getByLabelText('Member 2 name'), { target: { value: 'Avery Chen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create board' }));

    expect(await screen.findByRole('heading', { name: '2026 Annual Board' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:8080/api/boards');
    expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:8080/api/boards');
    expect(fetchMock.mock.calls[4][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ year: 2026, members: [{ name: 'Jordan Lee' }, { name: 'Avery Chen' }] }),
    });
  });

  it('creates a dated session and saves the selected member attendance', async () => {
    const board = { id: 'board-2026', year: 2026, members: [{ id: 'member-1', name: 'Jordan Lee' }], sessions: [] };
    const session = { id: 'session-1', sessionDate: '2026-10-16', attendedMemberIds: [] as string[] };
    const savedSession = { ...session, attendedMemberIds: ['member-1'] };
    const fetchMock = signedInFetch([church], []);
    fetchMock
      .mockResolvedValueOnce(response([board]))
      .mockResolvedValueOnce(response(board))
      .mockResolvedValueOnce(response(session, 201))
      .mockResolvedValueOnce(response(savedSession));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    await screen.findByRole('heading', { name: 'Department elections' });
    fireEvent.click(screen.getByRole('button', { name: 'Annual Boards' }));
    fireEvent.click(await screen.findByRole('button', { name: /2026 Annual Board/ }));
    await screen.findByRole('heading', { name: 'Board roster' });
    fireEvent.change(screen.getByLabelText('Session date'), { target: { value: '2026-10-16' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add session' }));
    fireEvent.click(await screen.findByLabelText('Jordan Lee'));
    fireEvent.click(screen.getByRole('button', { name: 'Save attendance' }));

    expect(await screen.findByText('1 attended')).toBeInTheDocument();
    expect(fetchMock.mock.calls[5][0]).toBe('http://localhost:8080/api/boards/board-2026/sessions');
    expect(fetchMock.mock.calls[5][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ sessionDate: '2026-10-16' }),
    });
    expect(fetchMock.mock.calls[6][0]).toBe('http://localhost:8080/api/boards/board-2026/sessions/session-1/attendance');
    expect(fetchMock.mock.calls[6][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ attendedMemberIds: ['member-1'] }),
    });
  });

  it('preserves separate unsaved attendance drafts when switching sessions', async () => {
    const board = {
      id: 'board-2026',
      year: 2026,
      members: [{ id: 'member-1', name: 'Jordan Lee' }],
      sessions: [
        { id: 'session-1', sessionDate: '2026-10-09', attendedMemberIds: ['member-1'] },
        { id: 'session-2', sessionDate: '2026-10-16', attendedMemberIds: [] as string[] },
      ],
    };
    const savedSession = { ...board.sessions[0], attendedMemberIds: [] as string[] };
    const fetchMock = signedInFetch([church], []);
    fetchMock
      .mockResolvedValueOnce(response([board]))
      .mockResolvedValueOnce(response(board))
      .mockResolvedValueOnce(response(savedSession));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    await screen.findByRole('heading', { name: 'Department elections' });
    fireEvent.click(screen.getByRole('button', { name: 'Annual Boards' }));
    fireEvent.click(await screen.findByRole('button', { name: /2026 Annual Board/ }));
    const attendee = await screen.findByRole('checkbox', { name: 'Jordan Lee' });
    expect(attendee).toBeChecked();

    fireEvent.click(attendee);
    fireEvent.click(screen.getByRole('button', { name: /2026-10-16/ }));
    fireEvent.click(attendee);
    expect(attendee).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: /2026-10-09/ }));
    expect(attendee).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Save attendance' }));

    await screen.findByText('0 attended');
    expect(fetchMock.mock.calls[5][0]).toBe('http://localhost:8080/api/boards/board-2026/sessions/session-1/attendance');
    expect(fetchMock.mock.calls[5][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ attendedMemberIds: [] }),
    });
  });

  it('updates an existing election configuration', async () => {
    const updated = {
      ...election,
      departmentName: 'Finance Committee',
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockResolvedValueOnce(response(updated));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Edit setup' }));
    fireEvent.change(screen.getByLabelText('Department name'), { target: { value: 'Finance Committee' } });
    fireEvent.change(screen.getAllByLabelText('Position name')[0], { target: { value: 'Senior Director' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move Treasurer up' }));
    fireEvent.click(screen.getByRole('button', { name: /Add position/ }));
    fireEvent.change(screen.getAllByLabelText('Position name')[2], { target: { value: 'Secretary' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Finance Committee' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:8080/api/elections/election-1');
    expect(fetchMock.mock.calls[4][1].method).toBe('PUT');
    expect(JSON.parse(fetchMock.mock.calls[4][1].body)).toEqual({
      departmentName: 'Finance Committee',
      positions: [
        { id: 'position-2', name: 'Treasurer', openingCount: 2 },
        { id: 'position-1', name: 'Senior Director', openingCount: 1 },
        { name: 'Secretary', openingCount: 1 },
      ],
    });
  });

  it('keeps the login screen visible with a clear message after a 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({}, 401));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();

    expect(await screen.findByRole('alert')).toHaveTextContent('Sign-in failed. Check your email and password.');
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('communicates a missing election and clears access on logout', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response({}, 404));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The requested election could not be found.');
    expect(screen.getByRole('heading', { name: 'Department elections' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(screen.getByRole('heading', { name: 'Election setup' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('creates and closes an intake, then explicitly saves a unique consolidation snapshot', async () => {
    const openIntake = {
      id: 'intake-1',
      accessToken: 'share-token',
      nameLimit: 3,
      status: 'OPEN' as const,
      submissions: [{ id: 'submission-1', name: 'Sam Lee' }, { id: 'submission-2', name: 'sam lee' }],
      consolidatedNames: null,
    };
    const closedIntake = { ...openIntake, status: 'CLOSED' as const };
    const savedSnapshot = { candidateNames: ['Riley Chen', 'Morgan Diaz'] };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response(openIntake, 201))
      .mockResolvedValueOnce(response(closedIntake))
      .mockResolvedValueOnce(response(savedSnapshot));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));
    fireEvent.change(await screen.findByLabelText('Maximum names per visitor'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create intake' }));

    expect(await screen.findByLabelText('Share link')).toHaveValue(`${window.location.origin}/nominate/share-token`);
    expect(screen.getByText('Sam Lee')).toBeInTheDocument();
    expect(screen.getByText('sam lee')).toBeInTheDocument();
    expect(screen.getByText(/Names only\. No visitor or device identity is shown/)).toBeInTheDocument();
    expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations');
    expect(fetchMock.mock.calls[4][1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    const createRequest = fetchMock.mock.calls[5];
    expect(createRequest[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations');
    expect(createRequest[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ nameLimit: 3 }) });
    expect(createRequest[1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);

    fireEvent.click(screen.getByRole('button', { name: 'Close nominations' }));
    expect(await screen.findByRole('checkbox', { name: /I confirm this is the final candidate list/ })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Unique candidate list'), { target: { value: 'Riley Chen\nRiley Chen\nMorgan Diaz' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /I confirm this is the final candidate list/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save consolidation snapshot' }));

    expect(await screen.findByText('Consolidation snapshot saved with 2 candidates.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[6][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/close');
    expect(fetchMock.mock.calls[6][1].method).toBe('POST');
    expect(fetchMock.mock.calls[7][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/consolidation');
    expect(fetchMock.mock.calls[7][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'] }),
    });
  });

  it('serves the public nomination form without login, edits names, enforces limits, and reuses the profile token', async () => {
    const publicIntake = { departmentName: 'Finance', positionName: 'Director', nameLimit: 1, submittedNames: [] as string[] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(publicIntake))
      .mockResolvedValueOnce(response({ ...publicIntake, submittedNames: ['Avery Chen'] }))
      .mockResolvedValueOnce(response({ ...publicIntake, submittedNames: ['Jordan Lee'] }));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.clear();
    window.history.pushState({}, '', '/nominate/public-token');

    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    expect(screen.queryByText(/device token|browser profile/i)).not.toBeInTheDocument();
    const deviceToken = window.localStorage.getItem('church-nominations-device-token');
    expect(deviceToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/nomination-intakes/public-token');
    expect(fetchMock.mock.calls[0][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/api/auth/'))).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: /Add another name/ }));
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Avery Chen' } });
    fireEvent.change(screen.getByLabelText('Name 2'), { target: { value: 'Jordan Lee' } });
    expect(screen.getByRole('alert')).toHaveTextContent('You can submit up to 1 name.');
    expect(screen.getByRole('button', { name: 'Save my names' })).toBeDisabled();
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Save my names' }));
    expect(await screen.findByText(/Your names have been saved\./)).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/nomination-intakes/public-token/submission');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ names: ['Avery Chen'] }) });
    expect(fetchMock.mock.calls[1][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);

    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Jordan Lee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save my names' }));
    expect(await screen.findByText(/Your names have been saved\./)).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ names: ['Jordan Lee'] }));
    expect(fetchMock.mock.calls[2][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);

    cleanup();
    const reloadFetch = vi.fn().mockResolvedValue(response({ ...publicIntake, submittedNames: ['Jordan Lee'] }));
    vi.stubGlobal('fetch', reloadFetch);
    render(<App />);
    await screen.findByLabelText('Name 1');
    expect(reloadFetch.mock.calls[0][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);
  });

  it('shows unavailable and closed states for public intake links', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(response({}, 410));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/nominate/missing-token');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'This link is unavailable' })).toBeInTheDocument();

    cleanup();
    window.history.pushState({}, '', '/nominate/closed-token');
    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Nominations are closed' })).toBeInTheDocument();
  });
});
