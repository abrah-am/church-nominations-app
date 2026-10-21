import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App, { getCandidateRecommendation } from './App';

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

function eventStreamResponse(chunks: string[]) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(new TextEncoder().encode(chunk)));
    },
  });
  return { ok: true, status: 200, body };
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
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

describe('candidate decision recommendations', () => {
  it('recommends election for a strict-majority candidate in a single-opening position', () => {
    expect(getCandidateRecommendation(9, 9, 1, 0, 1, false, 6)).toContain('Suggested: Elect.');
  });

  it('leaves single-opening no-majority outcomes to the administrator', () => {
    expect(getCandidateRecommendation(8, 9, 1, 0, 0, false, 6)).toContain('administrator decides');
  });

  it('recommends election when multi-opening majority candidates fit remaining openings', () => {
    expect(getCandidateRecommendation(9, 9, 3, 1, 2, false, 6)).toContain('Suggested: Elect.');
  });

  it('recommends advancing majority candidates after a multi-selection round', () => {
    expect(getCandidateRecommendation(9, 9, 1, 0, 1, false, 2, 3)).toContain('Suggested: Advance.');
  });

  it('recommends a runoff when majority candidates exceed remaining openings', () => {
    expect(getCandidateRecommendation(9, 9, 3, 1, 3, false, 6)).toContain('one-choice runoff');
    expect(getCandidateRecommendation(8, 9, 3, 1, 3, false, 6)).toContain('Suggested: Eliminate.');
  });

  it('recommends eliminating the lowest candidate in a no-majority runoff', () => {
    expect(getCandidateRecommendation(4, 6, 2, 0, 0, true, 4)).toContain('lowest-vote candidate');
    expect(getCandidateRecommendation(5, 6, 2, 0, 0, true, 4)).toContain('Suggested: Advance.');
  });

  it('does not recommend another outcome once all openings are filled', () => {
    expect(getCandidateRecommendation(9, 9, 2, 2, 1, false, 6)).toContain('All openings are filled');
  });
});

describe('voting round navigation', () => {
  it('keeps multiple rounds collapsed while summaries and round actions remain accessible', async () => {
    const savedIntake = {
      id: 'intake-1',
      accessToken: 'share-token',
      nameLimit: 3,
      status: 'CLOSED',
      submissions: [],
      consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
    };
    const rounds = [
      {
        id: 'round-1', roundNumber: 1, status: 'CLOSED', selectionCount: 1,
        candidates: [{ id: 'candidate-1', name: 'Riley Chen', sequence: 1 }],
      },
      {
        id: 'round-2', roundNumber: 2, status: 'CLOSED', selectionCount: 1,
        candidates: [
          { id: 'candidate-2', name: 'Morgan Diaz', sequence: 1 },
          { id: 'candidate-3', name: 'Jordan Lee', sequence: 2 },
        ],
      },
      {
        id: 'round-3', roundNumber: 3, status: 'ACTIVE', selectionCount: 1,
        accessToken: 'active-round-token',
        candidates: [{ id: 'candidate-4', name: 'Taylor Kim', sequence: 1 }],
      },
    ];
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(savedIntake))
      .mockResolvedValueOnce(response(rounds))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response({}, 404));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    await screen.findByRole('heading', { name: 'Position 1 of 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Manage nominations' }));

    const roundList = await screen.findByRole('list', { name: 'Voting rounds' });
    const details = Array.from(roundList.querySelectorAll('.round-details'));
    const roundDisclosures = details.map((disclosure) => disclosure.querySelector('summary span:first-child'));
    expect(details).toHaveLength(3);
    details.forEach((disclosure) => {
      expect(disclosure).not.toHaveAttribute('open');
      expect(disclosure).toHaveAttribute('name', 'voting-rounds');
    });
    expect(details[0].querySelector('summary')).toHaveTextContent('Closed · 1 candidates');
    expect(details[1].querySelector('summary')).toHaveTextContent('Closed · 2 candidates');
    expect(details[2].querySelector('summary')).toHaveTextContent('Voting active now · 1 candidates');
    fireEvent.click(screen.getByRole('button', { name: 'Go to active round 3' }));
    expect(details[2]).toHaveAttribute('open');

    fireEvent.click(roundDisclosures[1] as HTMLElement);
    expect(details[1]).toHaveAttribute('open');
    expect(within(details[1] as HTMLElement).getByRole('button', { name: 'Reveal results' })).toBeInTheDocument();
    fireEvent.click(roundDisclosures[0] as HTMLElement);
    expect(details[0]).toHaveAttribute('open');
    expect(within(details[0] as HTMLElement).getByRole('button', { name: 'Reopen voting' })).toBeInTheDocument();
  });

  it('resets a closed round separately from reopen and requires fresh configuration before start', async () => {
    const savedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED',
      submissions: [], consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
    };
    const closedRound = {
      id: 'round-1', roundNumber: 1, status: 'CLOSED', selectionCount: 1,
      expectedVoterCount: 8, accessToken: 'old-token', closeReason: 'voter_limit', resetCount: 0,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
      ],
    };
    const resetRound = {
      ...closedRound, status: 'DRAFT', selectionCount: null, expectedVoterCount: null,
      accessToken: null, closeReason: null, resetCount: 1,
    };
    const reconfiguredRound = { ...resetRound, selectionCount: 1 };
    const results = {
      roundId: 'round-1', roundNumber: 1, expectedVoterCount: 8, ballotsCast: 7, majorityThreshold: 5,
      revealedAt: '2026-10-20T12:00:00Z', revealedBy: 'admin@example.com',
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1, votes: 5 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2, votes: 2 },
      ],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(savedIntake))
      .mockResolvedValueOnce(response([closedRound]))
      .mockResolvedValueOnce(response(results))
      .mockResolvedValueOnce(response(resetRound))
      .mockResolvedValueOnce(response([{ ...election, status: 'IN_PROGRESS' }]))
      .mockResolvedValueOnce(response({ ...election, status: 'IN_PROGRESS' }))
      .mockResolvedValueOnce(response(reconfiguredRound));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));
    await screen.findByRole('button', { name: 'Reset round' });

    fireEvent.click(screen.getByRole('button', { name: 'Reopen voting' }));
    expect(screen.getByRole('dialog', { name: 'Reopen voting for round 1?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reopen'))).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Reset round' }));
    expect(screen.getByRole('dialog', { name: 'Reset this round?' })).toHaveTextContent('permanently deletes ballots and current decisions');
    expect(screen.getByRole('dialog', { name: 'Reset this round?' })).toHaveTextContent('candidate roster stays in place');
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Reset this round?' })).getByRole('button', { name: 'Cancel' }));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reset'))).toBe(false);
    expect(screen.getByText('7 / 8')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reset round' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Reset this round?' })).getByRole('button', { name: 'Reset round' }));
    expect(await screen.findByText(/Round 1 reset\. Ballots and current decisions were permanently deleted; candidate roster preserved\. Reset count: 1\./)).toBeInTheDocument();
    const resetRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/round-1/reset'));
    expect(resetRequest?.[1]).toMatchObject({ method: 'POST' });
    expect(resetRequest?.[0]).not.toMatch(/\/reopen$/);
    expect(screen.queryByText('7 / 8')).not.toBeInTheDocument();
    expect(screen.queryByText('5 votes')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Riley ChenMorgan Diaz');
    expect(screen.getByText('Reset count: 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Number of selections allowed')).toHaveValue(null);
    expect(screen.getByRole('button', { name: 'Start voting' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Number of selections allowed'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update draft round' }));
    expect(await screen.findByText('Draft round configuration saved.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).endsWith('/round-1') && options?.method === 'PUT' && options.body === JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'], selectionCount: 1 }))).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Start voting' }));
    expect(screen.getByLabelText('Expected voter count')).toHaveValue(null);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Start voting for round 1?' })).getByRole('button', { name: 'Cancel' }));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reopen'))).toBe(false);
  });
});

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
    expect(screen.queryByText(/Voting is not available yet/)).not.toBeInTheDocument();
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

  it.each([
    { status: 'SETUP' as const, label: 'Setup', departmentName: 'Finance' },
    { status: 'IN_PROGRESS' as const, label: 'In progress', departmentName: 'Operations' },
    { status: 'COMPLETE' as const, label: 'Complete', departmentName: 'Governance' },
  ])('shows the $label election status consistently in list and detail', async ({ status, label, departmentName }) => {
    const statusElection = { ...election, id: `election-${status}`, departmentName, status };
    const elections = [statusElection];
    const fetchMock = signedInFetch([church], elections);
    fetchMock.mockResolvedValueOnce(response(statusElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();

    const accessibleStatusName = `Election status: ${label}`;
    expect(await screen.findByRole('group', { name: accessibleStatusName })).toHaveTextContent(label);
    expect(screen.queryByText('Voting is not available yet.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(departmentName) }));
    expect(await screen.findByRole('group', { name: accessibleStatusName })).toHaveTextContent(label);
  });

  it('refreshes election status after nomination intake starts and when returning to the list', async () => {
    const progressedElection = { ...election, status: 'IN_PROGRESS' as const };
    const openIntake = {
      id: 'intake-1',
      accessToken: 'share-token',
      nameLimit: 3,
      status: 'OPEN',
      submissions: [],
      consolidatedNames: null,
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response(openIntake, 201))
      .mockResolvedValueOnce(response([progressedElection]))
      .mockResolvedValueOnce(response(progressedElection))
      .mockResolvedValueOnce(eventStreamResponse([`event: intake\ndata: ${JSON.stringify(openIntake)}\n\n`]))
      .mockResolvedValueOnce(response([progressedElection]))
      .mockResolvedValueOnce(response(progressedElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Create intake' }));

    expect(await screen.findByRole('group', { name: 'Election status: In progress' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /All elections/ }));
    expect(await screen.findByRole('group', { name: 'Election status: In progress' })).toBeInTheDocument();
    const refreshCalls = fetchMock.mock.calls.slice(-2);
    expect(refreshCalls[0]?.[0]).toBe('http://localhost:8080/api/elections');
    expect(refreshCalls[1]?.[0]).toBe('http://localhost:8080/api/elections/election-1');
  });

  it('ignores a stale status response after opening election detail again', async () => {
    const progressedElection = { ...election, status: 'IN_PROGRESS' as const };
    let resolveStaleStatus!: (value: ReturnType<typeof response>) => void;
    const staleStatusResponse = new Promise<ReturnType<typeof response>>((resolve) => {
      resolveStaleStatus = resolve;
    });
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response([progressedElection]))
      .mockReturnValueOnce(staleStatusResponse)
      .mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(screen.getByRole('button', { name: /All elections/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    expect(await screen.findByRole('group', { name: 'Election status: Setup' })).toBeInTheDocument();

    resolveStaleStatus(response(progressedElection));
    await act(async () => { await staleStatusResponse; });
    expect(screen.getByRole('group', { name: 'Election status: Setup' })).toBeInTheDocument();
  });

  it('requires the exact position name and refreshes election state after deletion', async () => {
    const remainingElection = { ...election, positions: [] };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(undefined, 204))
      .mockResolvedValueOnce(response([remainingElection]))
      .mockResolvedValueOnce(response(remainingElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    await screen.findByRole('heading', { name: 'Position 1 of 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete position' }));

    expect(screen.getByRole('dialog')).toHaveTextContent('nominations and submissions, ballots, rounds, outcomes, and audit history');
    expect(screen.getByRole('dialog')).toHaveTextContent('Other positions and the parent election will remain.');
    const confirmButton = screen.getByRole('button', { name: 'Permanently delete position' });
    expect(confirmButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Type Director exactly to confirm'), { target: { value: 'director' } });
    expect(confirmButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Type Director exactly to confirm'), { target: { value: 'Director' } });
    expect(confirmButton).toBeEnabled();
    fireEvent.click(confirmButton);

    expect(await screen.findByRole('heading', { name: 'No positions configured' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit setup' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1');
    expect(fetchMock.mock.calls[4][1].method).toBe('DELETE');
    expect(fetchMock.mock.calls[5][0]).toBe('http://localhost:8080/api/elections');
    expect(fetchMock.mock.calls[6][0]).toBe('http://localhost:8080/api/elections/election-1');
  });

  it('cancels position deletion without making a delete request', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    await screen.findByRole('heading', { name: 'Position 1 of 2' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete position' }));
    fireEvent.change(screen.getByLabelText('Type Director exactly to confirm'), { target: { value: 'Director' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false);
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
      submissions: [
        { id: 'submission-1', name: 'Sam Lee' },
        { id: 'submission-2', name: 'sam lee' },
        { id: 'submission-3', name: 'Jordan Lee' },
      ],
      consolidatedNames: null,
    };
    const closedIntake = { ...openIntake, status: 'CLOSED' as const };
    const savedSnapshot = { candidateNames: ['Riley Chen', 'Morgan Diaz'] };
    const createdDraft = {
      id: 'round-1', roundNumber: 1, status: 'DRAFT', selectionCount: 2,
      candidates: [{ id: 'candidate-1', name: 'Riley Chen', sequence: 1 }, { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 }],
    };
    const updatedDraft = {
      ...createdDraft,
      selectionCount: 1,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
      ],
    };
    const activeRound = { ...updatedDraft, status: 'ACTIVE', expectedVoterCount: 16, accessToken: 'vote-token', closeReason: null };
    const revealedResults = {
      roundId: 'round-1', roundNumber: 1, expectedVoterCount: 16, ballotsCast: 15, majorityThreshold: 8,
      revealedAt: '2026-10-19T12:00:00Z', revealedBy: 'admin@example.com',
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1, votes: 9, decision: null, decisionReason: null },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2, votes: 6, decision: null, decisionReason: null },
      ],
    };
    const decidedResults = {
      ...revealedResults,
      candidates: [
        { ...revealedResults.candidates[0], decision: 'ADVANCED', decisionReason: 'Received a majority of votes.', decisionAt: '2026-10-19T12:15:00Z', decisionBy: 'admin@example.com' },
        revealedResults.candidates[1],
      ],
    };
    const eliminatedResults = {
      ...decidedResults,
      candidates: [
        decidedResults.candidates[0],
        { ...decidedResults.candidates[1], decision: 'ELIMINATED', decisionReason: 'Did not receive a majority.', decisionAt: '2026-10-19T12:16:00Z', decisionBy: 'admin@example.com' },
      ],
    };
    const undoneResults = {
      ...eliminatedResults,
      candidates: [decidedResults.candidates[0], revealedResults.candidates[1]],
    };
    const electedResults = {
      ...undoneResults,
      candidates: [
        undoneResults.candidates[0],
        { ...undoneResults.candidates[1], decision: 'ELECTED', decisionReason: 'Selected for the position.', decisionAt: '2026-10-19T12:17:00Z', decisionBy: 'admin@example.com' },
      ],
    };
    const fetchMock = signedInFetch([church], [election]);
    const intervalSpy = vi.spyOn(window, 'setInterval');
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response(openIntake, 201))
      .mockResolvedValueOnce(response([{ ...election, status: 'IN_PROGRESS' }]))
      .mockResolvedValueOnce(response({ ...election, status: 'IN_PROGRESS' }))
      .mockResolvedValueOnce(eventStreamResponse([`event: intake\ndata: ${JSON.stringify(openIntake)}\n\n`]))
      .mockResolvedValueOnce(response(closedIntake))
      .mockResolvedValueOnce(response(savedSnapshot))
      .mockResolvedValueOnce(response([]))
      .mockResolvedValueOnce(response({}, 500))
      .mockResolvedValueOnce(response(createdDraft, 201))
      .mockResolvedValueOnce(response(updatedDraft))
      .mockResolvedValueOnce(response(activeRound))
      .mockResolvedValueOnce(response({ roundId: 'round-1', status: 'ACTIVE', ballotsCast: 7, expectedVoterCount: 16 }))
      .mockResolvedValueOnce(response({ roundId: 'round-1', status: 'CLOSED', ballotsCast: 9, expectedVoterCount: 16 }))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response(revealedResults))
      .mockResolvedValueOnce(response(decidedResults))
      .mockResolvedValueOnce(response(eliminatedResults))
      .mockResolvedValueOnce(response(undoneResults))
      .mockResolvedValueOnce(response(electedResults))
      .mockResolvedValueOnce(response([{ ...election, status: 'IN_PROGRESS' }]))
      .mockResolvedValueOnce(response({ ...election, status: 'IN_PROGRESS' }))
      .mockResolvedValueOnce(response({
        id: 'round-2', roundNumber: 2, status: 'DRAFT', selectionCount: 1,
        candidates: [{ id: 'candidate-1-round-2', name: 'Riley Chen', sequence: 1 }],
      }, 201))
      .mockResolvedValueOnce(response(electedResults))
      .mockResolvedValueOnce(response(activeRound));
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
    expect(screen.getByText('Jordan Lee')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Anonymous submitted names' }).querySelectorAll('li')).toHaveLength(3);
    expect(screen.getByText(/Names only\. No visitor or device identity is shown/)).toBeInTheDocument();
    expect(screen.getByText('Anyone with this link can submit or update names until you close nominations.')).toBeInTheDocument();
    const nominationDisclosure = screen.getByRole('button', { name: /Nomination submissions.*Open · 3 submissions/ });
    expect(nominationDisclosure).toHaveAttribute('aria-expanded', 'true');
    expect(fetchMock.mock.calls[4][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations');
    expect(fetchMock.mock.calls[4][1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    const createRequest = fetchMock.mock.calls[5];
    expect(createRequest[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations');
    expect(createRequest[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ nameLimit: 3 }) });
    expect(createRequest[1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);

    fireEvent.click(screen.getByRole('button', { name: 'Close nominations' }));
    expect(await screen.findByRole('checkbox', { name: /I confirm this is the final candidate list/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nomination submissions.*Closed · 3 submissions/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('status')).toHaveTextContent('Nominations are closed. The public link is disabled and submissions are read-only. Review them, then refine and save the candidate list below.');
    expect(screen.queryByRole('list', { name: 'Anonymous submitted names' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Unique candidate list')).toHaveValue('Jordan Lee\nSam Lee');
    const consolidationDisclosure = screen.getByRole('button', { name: /Review and consolidate candidates/ });
    expect(consolidationDisclosure).toHaveAttribute('aria-expanded', 'true');
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/rounds'))).toBe(false);
    fireEvent.change(screen.getByLabelText('Unique candidate list'), { target: { value: 'Riley Chen\nRiley Chen\nMorgan Diaz' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /I confirm this is the final candidate list/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Save consolidation snapshot' }));

    const savedConsolidation = await screen.findByRole('button', { name: /Candidate consolidation.*2 candidates · Saved/ });
    expect(savedConsolidation).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Confirmed candidate list' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Unique candidate list')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /I confirm this is the final candidate list/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Save consolidation snapshot|Add candidate/i })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Voting round configuration' })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: 'Edit candidate list' })).toBeInTheDocument();
    const configurationDisclosure = screen.getAllByText(/Voting round configuration/)[0].closest('details');
    expect(configurationDisclosure).toHaveAttribute('open');
    const configurationSummary = configurationDisclosure?.querySelector('summary');
    fireEvent.click(configurationSummary as HTMLElement);
    expect(configurationDisclosure).not.toHaveAttribute('open');
    fireEvent.click(configurationSummary as HTMLElement);
    expect(configurationDisclosure).toHaveAttribute('open');
    expect(fetchMock.mock.calls[9][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/close');
    expect(fetchMock.mock.calls[9][1].method).toBe('POST');
    expect(fetchMock.mock.calls[10][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/consolidation');
    expect(fetchMock.mock.calls[10][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'] }),
    });

    expect(await screen.findByRole('heading', { name: 'Voting round configuration' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[11][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(fetchMock.mock.calls[11][1].method).toBe('GET');
    expect(screen.getByLabelText('Number of selections allowed')).toHaveValue(null);
            expect(screen.queryByText('Candidates for this round')).not.toBeInTheDocument();
            expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Riley ChenMorgan Diaz');
    fireEvent.change(screen.getByLabelText('Number of selections allowed'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create draft round' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500');
    expect(screen.getByRole('button', { name: 'Create draft round' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create draft round' }));
    expect(await screen.findByText('Draft round configuration saved.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[12][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(fetchMock.mock.calls[12][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'], selectionCount: 2 }) });
    expect(fetchMock.mock.calls[13][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(fetchMock.mock.calls[13][1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'], selectionCount: 2 }),
    });
            expect(screen.getByText('Draft round 1: allows 2 selections from 2 candidates.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Number of selections allowed'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update draft round' }));
            expect(await screen.findByText('Draft round 1: allows 1 selection from 2 candidates.')).toBeInTheDocument();
    const initialRoundDisclosure = screen.getAllByText('Round 1')[0].closest('details');
    expect(initialRoundDisclosure).not.toHaveAttribute('open');
    fireEvent.click(initialRoundDisclosure?.querySelector('summary') as HTMLElement);
    expect(initialRoundDisclosure).toHaveAttribute('open');
    expect(fetchMock.mock.calls[14][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1');
    expect(fetchMock.mock.calls[14][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'], selectionCount: 1 }),
    });

    fireEvent.click(screen.getByRole('button', { name: 'Start voting' }));
    expect(screen.getByRole('dialog', { name: 'Start voting for round 1?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Draft round 1: allows 1 selection from 2 candidates.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Start voting' }));
    const expectedVoterInput = screen.getByLabelText('Expected voter count');
    fireEvent.change(expectedVoterInput, { target: { value: '16' } });
    expect(screen.getByText(/automatically close after 15 ballots/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and start' }));
    expect(fetchMock.mock.calls[15][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/start');
    expect(fetchMock.mock.calls[15][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ expectedVoterCount: 16 }) });
    expect(await screen.findByText(/Voting is active\. Share the private ballot link/)).toBeInTheDocument();
    expect(await screen.findByText('Ballots submitted: 7 of 16 expected')).toBeInTheDocument();
    const progressMessage = screen.getByText('Ballots submitted: 7 of 16 expected').parentElement;
    expect(progressMessage).toHaveTextContent('not as verified people');
    expect(progressMessage).not.toHaveTextContent('Riley Chen');
    expect(progressMessage).not.toHaveTextContent('Morgan Diaz');
    expect(progressMessage).not.toHaveTextContent('votes');
    const pollingInterval = intervalSpy.mock.calls.find(([, delay]) => delay === 5000);
    expect(pollingInterval).toBeDefined();
    const pollAgain = pollingInterval?.[0] as () => void;
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      pollAgain();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    expect(screen.queryByText('Ballots submitted: 9 of 16 expected')).not.toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Reveal results' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/results'))).toBe(true);
    intervalSpy.mockRestore();
    expect(screen.queryByText(/Draft round 1:/)).not.toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Reveal the preceding round and mark candidates Advanced to continue.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Number of selections allowed')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create draft round' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Round 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Public voting link')).toHaveValue(`${window.location.origin}/vote/vote-token`);

    expect(screen.queryByLabelText('Number of selections allowed')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create draft round' })).not.toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Reveal the preceding round and mark candidates Advanced to continue.')).toBeInTheDocument();
    expect(screen.getAllByText('Closed')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Reveal results' })).toBeInTheDocument();
    expect(screen.queryByText('15 / 16')).not.toBeInTheDocument();
    expect(screen.queryByText('9 votes')).not.toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Reveal the preceding round and mark candidates Advanced to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create draft round' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal results' }));
    expect(screen.getByRole('dialog', { name: 'Reveal results for round 1?' })).toHaveTextContent('visible to administrators');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reveal' }));
    expect(await screen.findByText('Results for round 1 are revealed to administrators.')).toBeInTheDocument();
    expect(screen.getByText('15 / 16')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('9 votes')).toBeInTheDocument();
    expect(screen.getByText('6 votes')).toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Reveal the preceding round and mark candidates Advanced to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create draft round' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Riley Chen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Morgan Diaz')).not.toBeInTheDocument();
    expect(screen.queryByText(/voter|device token|ballot identity/i)).not.toBeInTheDocument();
    const decisionReason = screen.getAllByLabelText(/Reason/)[0];
    fireEvent.change(decisionReason, { target: { value: 'Received a majority of votes.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save decision' })[0]);
    expect(await screen.findByText('Candidate decision saved.')).toBeInTheDocument();
            expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Riley Chen');
            expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).not.toHaveTextContent('Morgan Diaz');
    expect(screen.getByLabelText('Number of selections allowed')).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/rounds') && options?.method === 'POST')).toHaveLength(2);

    const roundDisclosure = screen.getAllByText('Round 1')[0].closest('details');
    expect(roundDisclosure).toBeInTheDocument();
    const roundSummary = within(roundDisclosure as HTMLElement).getAllByText('Round 1')[0];
    expect(roundDisclosure).toHaveAttribute('open');
    fireEvent.click(roundSummary);
    expect(roundDisclosure).not.toHaveAttribute('open');
    fireEvent.click(roundSummary);
    expect(roundDisclosure).toHaveAttribute('open');
    const resultsSummary = screen.getAllByText(/Revealed results/)[0];
    const resultsDisclosure = resultsSummary.closest('details');
    expect(resultsDisclosure).toHaveAttribute('open');
    fireEvent.click(resultsSummary);
    expect(resultsDisclosure).not.toHaveAttribute('open');
    fireEvent.click(resultsSummary);

    fireEvent.change(screen.getAllByLabelText('Decision')[1], { target: { value: 'ELIMINATED' } });
    fireEvent.change(screen.getAllByLabelText(/Reason/)[1], { target: { value: 'Did not receive a majority.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save decision' })[1]);
    expect(await screen.findByText(/Did not receive a majority\./)).toBeInTheDocument();
    const aggregateCandidates = within(screen.getByRole('list', { name: 'Aggregate candidate votes for round 1' }));
    const eliminatedCandidateRow = aggregateCandidates.getByText('Morgan Diaz').closest('li');
    expect(eliminatedCandidateRow).toHaveClass('candidate-eliminated');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    expect(within(eliminatedCandidateRow as HTMLElement).queryByRole('combobox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('Candidate decision undone. Mark the candidate Advanced to include them in the next round.')).toBeInTheDocument();
            expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).not.toHaveTextContent('Morgan Diaz');
    expect(within(eliminatedCandidateRow as HTMLElement).getByLabelText('Decision')).toBeInTheDocument();

    fireEvent.change(screen.getAllByLabelText('Decision')[1], { target: { value: 'ELECTED' } });
    fireEvent.change(screen.getAllByLabelText(/Reason/)[1], { target: { value: 'Selected for the position.' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Save decision' })[1]);
    expect(screen.getByRole('dialog', { name: 'Confirm elected outcome' })).toHaveTextContent('Are you sure you want to mark Morgan Diaz as elected?');
    const electedDecisionUrl = 'http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/candidates/candidate-2/decision';
    expect(fetchMock.mock.calls.filter(([url, options]) => url === electedDecisionUrl && options?.method === 'PUT')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Confirm elected outcome' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url, options]) => url === electedDecisionUrl && options?.method === 'PUT')).toHaveLength(1);
    expect(screen.queryByRole('checkbox', { name: 'Morgan Diaz' })).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Save decision' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm elected' }));
    expect(await screen.findByText(/Selected for the position\./)).toBeInTheDocument();
    expect(aggregateCandidates.getByText('Morgan Diaz').closest('li')).toHaveClass('candidate-elected');
            expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Riley Chen');
            expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).not.toHaveTextContent('Morgan Diaz');
    expect(fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/rounds') && options?.method === 'POST')).toHaveLength(2);

    fireEvent.change(screen.getByLabelText('Number of selections allowed'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create draft round' }));
    expect(await screen.findByText('Draft round configuration saved.')).toBeInTheDocument();
    const nextRoundRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/rounds') && options?.method === 'POST' && options.body === JSON.stringify({ candidateNames: ['Riley Chen'], selectionCount: 1 }));
    expect(nextRoundRequest?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ candidateNames: ['Riley Chen'], selectionCount: 1 }) });
    fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save decision' }));
    expect(await screen.findByText('Candidate decision saved.')).toBeInTheDocument();
    const reasonlessDecisionRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/candidates/candidate-1/decision') && options?.body === JSON.stringify({ decision: 'ADVANCED' }));
    expect(reasonlessDecisionRequest?.[1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ decision: 'ADVANCED' }) });
    expect(screen.getByText((_, element) => element?.textContent?.startsWith('Current decision: ADVANCED: Received a majority of votes. By admin@example.com') ?? false)).toBeInTheDocument();
    expect(aggregateCandidates.getByText('Riley Chen').closest('li')).toHaveTextContent('By admin@example.com');
    const decisionRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/round-1/candidates/candidate-1/decision'));
    expect(decisionRequest?.[1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ decision: 'ADVANCED', reason: 'Received a majority of votes.' }) });
    const undoRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/candidates/candidate-2/decision/undo'));
    expect(undoRequest?.[1]).toMatchObject({ method: 'POST', body: '{}' });
    fireEvent.click(screen.getByRole('button', { name: 'Reopen voting' }));
    expect(screen.getByRole('dialog', { name: 'Reopen voting for round 1?' })).toHaveTextContent('overrides this round’s automatic ballot-count limit');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm reopen' }));
    expect(await screen.findByText('Round 1 is active again.')).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reveal'))).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reopen'))).toBe(true);
    expect(screen.queryByText('15 / 16')).not.toBeInTheDocument();
    expect(screen.queryByText('9 votes')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reveal results' })).not.toBeInTheDocument();
  });

  it('preserves consolidation edits and confirmation after a save failure so they can be retried', async () => {
    const closedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED',
      submissions: [{ id: 'submission-1', name: 'Riley Chen' }], consolidatedNames: null,
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(closedIntake))
      .mockResolvedValueOnce(response({}, 500))
      .mockResolvedValueOnce(response({ candidateNames: ['Riley Chen', 'Morgan Diaz'] }))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));

    const candidateList = await screen.findByLabelText('Unique candidate list');
    fireEvent.change(candidateList, { target: { value: 'Riley Chen\nMorgan Diaz' } });
    const confirmation = screen.getByRole('checkbox', { name: /I confirm this is the final candidate list/ });
    fireEvent.click(confirmation);
    fireEvent.click(screen.getByRole('button', { name: 'Save consolidation snapshot' }));

    const saveError = await screen.findByRole('alert');
    expect(saveError).toHaveTextContent('Your edits are still here; review them and retry.');
    expect(saveError).toHaveTextContent('HTTP 500');
    expect(candidateList).toHaveValue('Riley Chen\nMorgan Diaz');
    expect(confirmation).toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: 'Save consolidation snapshot' }));
    expect(await screen.findByRole('button', { name: /Candidate consolidation.*2 candidates · Saved/ })).toBeInTheDocument();
    expect(fetchMock.mock.calls[5][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'] }),
    });
    expect(fetchMock.mock.calls[6][1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'] }),
    });
  });

  it('recommends advancing majority candidates for a multi-selection round without auto-saving decisions', async () => {
    const savedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED',
      submissions: [{ id: 'submission-1', name: 'Riley Chen' }], consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
    };
    const round = {
      id: 'round-1', roundNumber: 1, status: 'CLOSED', selectionCount: 3,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
        { id: 'candidate-3', name: 'Alex Kim', sequence: 3 },
        { id: 'candidate-4', name: 'Zoe Patel', sequence: 4 },
      ],
    };
    const results = {
      roundId: 'round-1', roundNumber: 1, expectedVoterCount: 10, ballotsCast: 9, majorityThreshold: 5,
      revealedAt: '2026-10-19T12:00:00Z', revealedBy: 'admin@example.com',
      candidates: [
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2, votes: 4, decision: null },
        { id: 'candidate-4', name: 'Zoe Patel', sequence: 4, votes: 7, decision: null },
        { id: 'candidate-3', name: 'Alex Kim', sequence: 3, votes: 7, decision: null },
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1, votes: 2, decision: null },
      ],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(savedIntake))
      .mockResolvedValueOnce(response([round]))
      .mockResolvedValueOnce(response(results));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));
    const roundDetails = (await screen.findByRole('list', { name: 'Voting rounds' })).querySelector('details');
    fireEvent.click(roundDetails?.querySelector('summary') as HTMLElement);

    expect(await within(roundDetails as HTMLElement).findAllByText(/Suggested: Advance\./)).toHaveLength(2);
    const resultList = within(roundDetails as HTMLElement).getByRole('list', { name: 'Aggregate candidate votes for round 1' });
    expect(Array.from(resultList.querySelectorAll('.round-result-candidate-heading strong')).map((candidate) => candidate.textContent)).toEqual([
      'Alex Kim', 'Zoe Patel', 'Morgan Diaz', 'Riley Chen',
    ]);
    const decisionSelect = within(roundDetails as HTMLElement).getAllByLabelText('Decision')[0] as HTMLSelectElement;
    expect(Array.from(decisionSelect.options).map((option) => option.textContent)).toEqual(['Advanced', 'Eliminated', 'Elected']);
    fireEvent.change(decisionSelect, { target: { value: 'ELIMINATED' } });
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0);
  });

  it('shows an explicit empty state for a closed intake without submissions', async () => {
    const closedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED',
      submissions: [], consolidatedNames: null,
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockResolvedValueOnce(response(closedIntake));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));

    expect(await screen.findByText('Nominations are closed and no names were submitted. You can enter candidates manually in the list below to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Review and consolidate candidates/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByLabelText('Unique candidate list')).toBeInTheDocument();
    expect(screen.queryByLabelText('Anonymous submitted names')).not.toBeInTheDocument();
  });

  it('shows a loading state while the admin intake response is pending', async () => {
    let resolveIntake!: (value: ReturnType<typeof response>) => void;
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockImplementationOnce(() => new Promise((resolve) => {
      resolveIntake = resolve;
    }));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading nomination intake');
    await act(async () => {
      resolveIntake(response({
        id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', submissions: [], consolidatedNames: null,
      }));
    });
    expect(await screen.findByText('No names have been submitted yet.')).toBeInTheDocument();
  });

  it('streams authenticated intake snapshots across chunks and aborts when collapsed', async () => {
    const openIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN',
      submissions: [{ id: 'submission-1', name: 'Riley Chen' }], consolidatedNames: null,
    };
    let streamController!: ReadableStreamDefaultController<Uint8Array>;
    const streamResponse = {
      ok: true,
      status: 200,
      body: new ReadableStream<Uint8Array>({ start(controller) { streamController = controller; } }),
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(openIntake))
      .mockResolvedValueOnce(streamResponse);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Manage nominations' }));
    expect(await screen.findByText('Riley Chen')).toBeInTheDocument();

    const streamRequest = fetchMock.mock.calls[5];
    expect(streamRequest[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/stream');
    expect(streamRequest[0]).not.toContain('admin@example.com');
    expect(streamRequest[1]).toMatchObject({
      method: 'GET',
      headers: { Accept: 'text/event-stream', Authorization: `Basic ${btoa('admin@example.com:secret')}` },
    });
    expect(streamRequest[1].signal).toBeInstanceOf(AbortSignal);

    const updatedSnapshot = { ...openIntake, submissions: [...openIntake.submissions, { id: 'submission-2', name: 'Morgan Diaz' }] };
    const event = `event: intake\r\ndata: ${JSON.stringify(updatedSnapshot)}\r\n\r\n`;
    await act(async () => {
      streamController.enqueue(new TextEncoder().encode(event.slice(0, 17)));
      streamController.enqueue(new TextEncoder().encode(event.slice(17, 53)));
      streamController.enqueue(new TextEncoder().encode(event.slice(53)));
    });
    expect(await screen.findByText('Morgan Diaz')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Anonymous submitted names' }).querySelectorAll('li')).toHaveLength(2);

    const intakeDisclosure = screen.getByRole('button', { name: /Nomination submissions.*Open · 2 submissions/ });
    fireEvent.click(intakeDisclosure);
    await waitFor(() => expect(streamRequest[1].signal.aborted).toBe(true));
  });

  it('loads a private ballot, requires the exact choices, and allows the same profile to replace it', async () => {
    const poll = {
      departmentName: 'Finance',
      positionName: 'Director',
      selectionCount: 2,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
        { id: 'candidate-3', name: 'Jordan Lee', sequence: 3 },
      ],
      submittedCandidateIds: ['candidate-1'],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(poll))
      .mockResolvedValueOnce(response({ submitted: true }))
      .mockResolvedValueOnce(response({ submitted: true }));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.clear();
    window.history.pushState({}, '', '/vote/private-token');

    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.getByText('Finance')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Riley Chen' })).toBeChecked();
    expect(screen.getByRole('button', { name: 'Replace my ballot' })).toBeDisabled();
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();
    const votingDeviceToken = window.localStorage.getItem('church-nominations-voting-device-token');
    expect(votingDeviceToken).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(votingDeviceToken).not.toBe(window.localStorage.getItem('church-nominations-device-token'));
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/polls/private-token');
    expect(fetchMock.mock.calls[0][1].headers['X-Voting-Device-Token']).toBe(votingDeviceToken);
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Morgan Diaz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replace my ballot' }));
    expect(await screen.findByText('Ballot saved. You can replace your choices while voting is active.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/polls/private-token/ballot');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ candidateIds: ['candidate-1', 'candidate-2'] }) });
    expect(fetchMock.mock.calls[1][1].headers['X-Voting-Device-Token']).toBe(votingDeviceToken);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Riley Chen' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Jordan Lee' }));
    fireEvent.click(screen.getByRole('button', { name: 'Replace my ballot' }));
    expect(await screen.findByText('Ballot saved. You can replace your choices while voting is active.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ candidateIds: ['candidate-2', 'candidate-3'] }));
  });

  it('shows only the inactive-poll state for an unavailable private ballot', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({}, 404)));
    window.history.pushState({}, '', '/vote/inactive-token');

    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Poll is not active' })).toBeInTheDocument();
    expect(screen.getByText('Poll is not active.')).toBeInTheDocument();
    expect(screen.queryByText(/inactive-token|candidate|ballot link/i)).not.toBeInTheDocument();
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

    const addNameButton = screen.getByRole('button', { name: /Add another name/ });
    expect(addNameButton).toBeDisabled();
    expect(screen.getByLabelText('Name 1')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Avery Chen' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit names' }));
    expect(await screen.findByText(/Your names have been submitted\./)).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/nomination-intakes/public-token/submission');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ names: ['Avery Chen'] }) });
    expect(fetchMock.mock.calls[1][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);

    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Jordan Lee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit names' }));
    expect(await screen.findByText(/Your names have been submitted\./)).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][1].body).toBe(JSON.stringify({ names: ['Jordan Lee'] }));
    expect(fetchMock.mock.calls[2][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);

    cleanup();
    const reloadFetch = vi.fn().mockResolvedValue(response({ ...publicIntake, submittedNames: ['Jordan Lee'] }));
    vi.stubGlobal('fetch', reloadFetch);
    render(<App />);
    await screen.findByLabelText('Name 1');
    expect(reloadFetch.mock.calls[0][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);
  });

  it('disables adding names at the limit before and after saving all allowed names', async () => {
    const publicIntake = { departmentName: 'Finance', positionName: 'Director', nameLimit: 3, submittedNames: [] as string[] };
    const savedIntake = { ...publicIntake, submittedNames: ['Avery Chen', 'Jordan Lee', 'Sam Patel'] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(publicIntake))
      .mockResolvedValueOnce(response(savedIntake));
    vi.stubGlobal('fetch', fetchMock);
    window.localStorage.clear();
    window.history.pushState({}, '', '/nominate/public-token');

    render(<App />);
    await screen.findByRole('heading', { name: 'Director' });
    const addNameButton = screen.getByRole('button', { name: /Add another name/ });
    fireEvent.click(addNameButton);
    fireEvent.click(addNameButton);
    expect(screen.getByLabelText('Name 3')).toBeInTheDocument();
    expect(addNameButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Avery Chen' } });
    fireEvent.change(screen.getByLabelText('Name 2'), { target: { value: 'Jordan Lee' } });
    fireEvent.change(screen.getByLabelText('Name 3'), { target: { value: 'Sam Patel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit names' }));
    expect(await screen.findByText('Your names have been submitted. You can edit them until nominations close.')).toBeInTheDocument();
    expect(addNameButton).toBeDisabled();
    expect(screen.queryByLabelText('Name 4')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ names: savedIntake.submittedNames }));
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
