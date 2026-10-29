import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App, { getCandidateRecommendation } from './App';
import type { NominationIntake } from './api/nominations';

const election = {
  id: 'election-1',
  departmentName: 'Finance',
  status: 'SETUP' as const,
  positions: [
    { id: 'position-2', name: 'Treasurer', openingCount: 2, sequence: 2, progressStatus: 'NOMINATIONS_OPEN', nextAction: 'CLOSE_NOMINATIONS', roundNumber: null },
    { id: 'position-1', name: 'Director', openingCount: 1, sequence: 1, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
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

async function signIn(email = 'admin@example.com', password = 'secret', selectDemoTerm = true) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  if (selectDemoTerm) {
    const termButton = await screen.findByRole('button', { name: /Elections 2026/ });
    fireEvent.click(termButton);
  }
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

describe('read-only nomination presentation', () => {
   it('loads an authoritative snapshot and stream without admin credentials', async () => {
    const presentation = {
      revealed: true,
      activeNames: ['Riley Chen'],
      events: [{
        id: 'event-1', entryId: 'entry-1', action: 'REMOVED', beforeName: 'Morgan Diaz', afterName: null,
        removalReason: 'DECLINED', reasonDetail: null, actorLabel: 'Administrator A1B2C3D4', occurredAt: '2026-10-25T12:00:00Z',
      }],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(presentation))
      .mockResolvedValueOnce(eventStreamResponse([`id: 4\nevent: snapshot\ndata: ${JSON.stringify(presentation)}\n\n`]));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/nomination-presentation/view-token');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Shared nominations' })).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'Current list' })).toHaveTextContent('Riley Chen');
    expect(screen.getByRole('list', { name: 'Confirmed changes' })).toHaveTextContent('Morgan Diaz removed');
    expect(screen.getByText(/Administrator/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenNthCalledWith(1, 'http://localhost:8080/api/nomination-presentations/view-token', expect.objectContaining({
      method: 'GET', cache: 'no-store', headers: { Accept: 'application/json' },
    }));
    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    expect(fetchMock).toHaveBeenNthCalledWith(2, 'http://localhost:8080/api/nomination-presentations/view-token/stream', expect.objectContaining({
      method: 'GET', cache: 'no-store', headers: { Accept: 'text/event-stream' },
    }));
    expect(fetchMock.mock.calls[1][1].headers).not.toHaveProperty('Authorization');
  });

  it('keeps the audience neutral before reveal and exposes no shared-list history', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ revealed: false, activeNames: [], events: [] })));
    window.history.pushState({}, '', '/nomination-presentation/neutral-token');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Nominations are not being shown' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Current list' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Confirmed changes' })).not.toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Continue: Treasurer' }));
    await screen.findByRole('heading', { name: 'Treasurer' });
    fireEvent.click(screen.getByRole('button', { name: 'Open nomination intake' }));

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
      .mockResolvedValueOnce(response({ ...election, status: 'IN_PROGRESS' }))
      .mockResolvedValueOnce(response(reconfiguredRound));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue: Treasurer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
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

  it('does not report zero profile submissions when an older API omits the profile count', async () => {
    const legacyIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN',
      submissions: [
        { id: 'submission-1', name: 'Jordan Lee' },
        { id: 'submission-2', name: 'Avery Chen' },
        { id: 'submission-3', name: 'avery chen' },
      ],
      consolidatedNames: null,
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockResolvedValueOnce(response(legacyIntake));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue: Treasurer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('The connected API did not provide this count. Restart or update the API, then reload nominations.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Open nomination intake' })).toBeInTheDocument();
    const submittedNames = screen.getByRole('list', { name: 'Submitted names' });
    expect(Array.from(submittedNames.querySelectorAll('li')).map((item) => item.textContent)).toEqual(['Avery Chen', 'avery chen', 'Jordan Lee']);
    expect(screen.queryByText('Submitted by')).not.toBeInTheDocument();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it('starts the profile count at zero when no names have been submitted yet', async () => {
    const emptyLegacyIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN',
      submissions: [],
      consolidatedNames: null,
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockResolvedValueOnce(response(emptyLegacyIntake));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue: Treasurer' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Open nomination intake' })).getByText('No names have been submitted yet.')).toBeInTheDocument();
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
    expect(screen.getByRole('heading', { name: 'Sign in to your church' })).toBeInTheDocument();
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
    await signIn('admin@example.com', 'secret', false);

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
    await signIn('admin@example.com', 'secret', false);
    fireEvent.change(await screen.findByLabelText('Church name'), { target: { value: 'Grace Church' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register church' }));

    expect(await screen.findByRole('heading', { name: 'Administrator Workspace' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Elections 2026/ }));
    expect(await screen.findByRole('heading', { name: 'Department elections' })).toBeInTheDocument();
    expect(screen.queryByText(/Voting is not available yet/)).not.toBeInTheDocument();
    expect(screen.getByText(/Grace Church.*Administrator workspace/)).toBeInTheDocument();
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
    await signIn('admin@example.com', 'secret', false);
    fireEvent.change(await screen.findByLabelText('Church name'), { target: { value: 'Grace Church' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register church' }));

    expect(await screen.findByRole('heading', { name: 'Grace Church' })).toBeInTheDocument();
    expect(screen.getByText(/Administrator workspace/)).toBeInTheDocument();
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

    expect(screen.getByRole('group', { name: 'Position status summary' })).toHaveTextContent('1 not started');
    expect(screen.getByRole('group', { name: 'Position status summary' })).toHaveTextContent('1 in progress');
    expect(screen.getByRole('list', { name: 'Finance positions' })).toHaveTextContent('Director1 openingNot startedStart');
    expect(screen.getByRole('list', { name: 'Finance positions' })).toHaveTextContent('Treasurer2 openingsIn progressContinue');

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

    expect(await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent(/Grace Church · Finance.*Director/);
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Election positions' })).not.toBeInTheDocument();
    expect(screen.queryByText('Next action: Set up nominations')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete position|Previous position|Next position/ })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:8080/api/elections/election-1');
  });

  it('shows the guided position workflow with the current task before intake setup', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Start: Director' }));

    expect(await screen.findByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Open nomination intake' })).toBeInTheDocument();
    const workflowTask = screen.getByRole('region', { name: 'Position workflow progress' });
    expect(within(workflowTask).getByText('Position workflow')).toBeInTheDocument();
    expect(within(workflowTask).getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(within(workflowTask).getByRole('heading', { name: 'Open nomination intake' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit election' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage nominations' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent(/All elections.*Grace Church · Finance.*Director/);
    expect(screen.getByRole('region', { name: 'Current election access shortcuts' })).toHaveTextContent('Nomination link not created');
    expect(screen.getByRole('button', { name: 'Copy nomination link' })).toBeDisabled();
    expect(within(screen.getByRole('region', { name: 'Current election access shortcuts' })).queryByRole('button', { name: 'Presentation' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Audience presentation' })).toHaveTextContent('Presentation display is off');
    expect(within(screen.getByRole('region', { name: 'Audience presentation' })).getByRole('button', { name: 'Presentation' })).toBeDisabled();
    expect(screen.getByText('Not open')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open nomination intake' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Maximum names per visitor')).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Election positions' })).not.toBeInTheDocument();
    const progress = screen.getByRole('region', { name: 'Position workflow progress' });
    expect(within(progress).getAllByRole('listitem').map((step) => step.querySelector('span:nth-child(2)')?.textContent)).toEqual([
      'Collect and review nominations',
      'Voting rounds',
      'Candidate decisions',
      'Position complete',
    ]);
    expect(within(progress).getByRole('listitem', { current: 'step' })).toHaveTextContent('Collect and review nominations');
    expect(within(progress).getByText('1 of 4')).toBeInTheDocument();
  });

  it('shows static demo terms and keeps all API elections visible under the selected term', async () => {
    const fetchMock = signedInFetch([church], [election]);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn('admin@example.com', 'secret', false);

    expect(await screen.findByRole('heading', { name: 'Administrator Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Sample terms for this visual prototype. Terms are not stored by the election API.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Elections 2026/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Elections 2027/ })).toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Elections 2027/ }));

    expect(await screen.findByRole('heading', { name: 'Elections 2027' })).toBeInTheDocument();
    expect(screen.getByText(/Live election rows below are shown under this demo term/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finance.*2 positions.*Edit/ })).toBeInTheDocument();
    expect(screen.getByText('Sample voting session link')).toBeInTheDocument();
    expect(screen.getByText('Sample presentation link')).toBeInTheDocument();
    expect(screen.getAllByText('DEMO LINK · NOT ACTIVE')).toHaveLength(2);
    expect(fetchMock.mock.calls.filter(([url]) => url === 'http://localhost:8080/api/elections')).toHaveLength(1);
  });

  it('collapses and expands position groups with the Bootstrap accordion control', async () => {
    vi.stubGlobal('fetch', signedInFetch([church], [election]));

    render(<App />);
    await signIn();

    const accordionToggle = screen.getByRole('button', { name: 'Collapse positions' });
    const accordionPanel = document.getElementById('election-panel-election-1');
    expect(accordionToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'Finance positions' })).toBeInTheDocument();
    fireEvent.click(accordionToggle);
    expect(accordionToggle).toHaveAttribute('aria-expanded', 'false');
    expect(accordionPanel).not.toHaveClass('show');
    fireEvent.click(screen.getByRole('button', { name: 'Expand positions' }));
    expect(screen.getByRole('button', { name: 'Collapse positions' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'Finance positions' })).toBeInTheDocument();
  });

  it('opens the selected position from its overview next action', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue: Treasurer' }));

    expect(await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent('Treasurer');
    expect(screen.getByRole('heading', { name: 'Treasurer' })).toBeInTheDocument();
  });

  it('shows zeroed overview and an empty state when no elections exist', async () => {
    vi.stubGlobal('fetch', signedInFetch([church], []));

    render(<App />);
    await signIn();

    expect(await screen.findByRole('heading', { name: 'No elections configured' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Position status summary' })).toHaveTextContent('0 in progress');
    expect(screen.getByRole('button', { name: 'Create first election' })).toBeInTheDocument();
  });

  it('counts unknown position progress as unavailable, not in progress', async () => {
    const unknownProgressElection = {
      ...election,
      positions: [{ ...election.positions[0], progressStatus: 'FUTURE_STATE' }],
    };
    vi.stubGlobal('fetch', signedInFetch([church], [unknownProgressElection]));

    render(<App />);
    await signIn();

    const positionSummary = await screen.findByRole('group', { name: 'Position status summary' });
    expect(positionSummary).toHaveTextContent('0 in progress');
    expect(positionSummary).toHaveTextContent('1 unavailable');
    expect(screen.getByRole('list', { name: 'Finance positions' })).toHaveTextContent('Progress unavailable');
  });

  it('reports election list loading and request errors without discarding the dashboard shell', async () => {
    let resolveElectionResponse: ((value: ReturnType<typeof response>) => void) | undefined;
    const pendingElections = new Promise<ReturnType<typeof response>>((resolve) => { resolveElectionResponse = resolve; });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(account))
      .mockResolvedValueOnce(response([church]))
      .mockReturnValueOnce(pendingElections);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'admin@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('button', { name: 'Checking access…' })).toBeDisabled();

    resolveElectionResponse?.(response({}, 500));
    expect(await screen.findByRole('alert')).toHaveTextContent('The request failed (HTTP 500).');
    expect(screen.getByRole('heading', { name: 'Sign in to your church' })).toBeInTheDocument();
  });

  it('keeps the election workflow usable when the API omits position progress fields', async () => {
    const legacyElection = {
      ...election,
      status: 'IN_PROGRESS' as const,
      positions: election.positions.map((position) => Object.fromEntries(
        Object.entries(position).filter(([key]) => !['progressStatus', 'nextAction', 'roundNumber'].includes(key)),
      )),
    };
    const fetchMock = signedInFetch([church], [legacyElection]);
    fetchMock.mockResolvedValueOnce(response(legacyElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));

    expect(await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent('Director');
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.queryByText('Progress unavailable')).not.toBeInTheDocument();
  });

  it.each([
    ['NOT_STARTED', 'Not started', 'SET_UP_NOMINATIONS', 'Set up nominations'],
    ['NOMINATIONS_OPEN', 'In progress', 'CLOSE_NOMINATIONS', 'Close nominations'],
    ['NOMINATIONS_CLOSED', 'In progress', 'CONSOLIDATE_NOMINATIONS', 'Review and consolidate names'],
    ['CONSOLIDATED', 'In progress', 'CONFIGURE_FIRST_ROUND', 'Configure first round'],
    ['ROUND_DRAFT', 'In progress', 'START_VOTING', 'Review and start voting'],
    ['ROUND_ACTIVE', 'In progress', 'MONITOR_VOTING', 'Monitor voting'],
    ['ROUND_CLOSED_UNREVEALED', 'In progress', 'REVEAL_RESULTS', 'Reveal results'],
    ['RESULTS_REVEALED', 'In progress', 'RECORD_CANDIDATE_DECISIONS', 'Record candidate decisions'],
    ['CANDIDATES_ADVANCED', 'In progress', 'CONFIGURE_NEXT_ROUND', 'Configure next round'],
    ['COMPLETE', 'Complete', 'COMPLETE', 'Position complete'],
  ])('shows %s status and its workflow entry action', async (progressStatus, _statusLabel, nextAction) => {
    const progressElection = {
      ...election,
      positions: [{ ...election.positions[1], openingCount: 2, progressStatus, nextAction, roundNumber: progressStatus.startsWith('ROUND_') || progressStatus === 'RESULTS_REVEALED' || progressStatus === 'CANDIDATES_ADVANCED' ? 2 : null }],
    };
    const fetchMock = signedInFetch([church], [progressElection]);
    fetchMock.mockResolvedValueOnce(response(progressElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    const row = screen.getByRole('listitem');
    const expectedStatus = progressStatus === 'NOT_STARTED' ? 'Not started' : progressStatus === 'COMPLETE' ? 'Complete' : 'In progress';
    expect(within(row).getByText(expectedStatus)).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: `${progressStatus === 'NOT_STARTED' ? 'Start' : progressStatus === 'COMPLETE' ? 'Review' : 'Continue'}: Director` })).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: `${progressStatus === 'NOT_STARTED' ? 'Start' : progressStatus === 'COMPLETE' ? 'Review' : 'Continue'}: Director` })).toHaveTextContent(progressStatus === 'NOT_STARTED' ? 'Start' : progressStatus === 'COMPLETE' ? 'Review' : 'Continue');
  });

  it('requires an explicit discard before returning to the election list with an unsaved intake setup draft', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response({}, 404))
      .mockResolvedValueOnce(response([election]))
      .mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    const nameLimit = await screen.findByLabelText('Maximum names per visitor');
    fireEvent.change(nameLimit, { target: { value: '4' } });
    await waitFor(() => expect(nameLimit).toHaveValue(4));
    fireEvent.blur(nameLimit);
    await waitFor(() => expect(screen.getByRole('button', { name: /All elections/ })).toBeInTheDocument());

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: /All elections/ }));
    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stay on this position' }));
    expect(screen.queryByRole('dialog', { name: 'Unsaved changes' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: /All elections/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes and continue' }));
    expect(await screen.findByRole('heading', { name: 'Department elections' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'POST')).toBe(false);
  });

  it.each([
    { status: 'SETUP' as const, label: 'Edit', departmentName: 'Finance' },
    { status: 'IN_PROGRESS' as const, label: 'In progress', departmentName: 'Operations' },
    { status: 'COMPLETE' as const, label: 'Complete', departmentName: 'Governance' },
  ])('shows the $label election status in the election list', async ({ status, label, departmentName }) => {
    const statusElection = { ...election, id: `election-${status}`, departmentName, status };
    const elections = [statusElection];
    const fetchMock = signedInFetch([church], elections);
    fetchMock.mockResolvedValueOnce(response(statusElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();

    if (status === 'SETUP') {
      const electionRow = await screen.findByRole('button', { name: /Finance, 2 positions, Edit/ });
      expect(electionRow).toHaveTextContent('Edit');
    } else {
      expect(await screen.findByRole('group', { name: `Election status: ${label}` })).toHaveTextContent(label);
    }
    expect(screen.queryByText('Voting is not available yet.')).not.toBeInTheDocument();
    if (status === 'SETUP') {
      expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    }
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
      .mockResolvedValueOnce(response(progressedElection))
      .mockResolvedValueOnce(eventStreamResponse([`event: intake\ndata: ${JSON.stringify(openIntake)}\n\n`]))
      .mockResolvedValueOnce(response([progressedElection]))
      .mockResolvedValueOnce(response(progressedElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Start: Director' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Create intake' }));

    expect(await screen.findByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy nomination link' })).toBeEnabled();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: /All elections/ }));
    expect(await screen.findByRole('heading', { name: 'Department elections' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Position status summary' })).toHaveTextContent('1 in progress');
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
      .mockResolvedValueOnce(response([progressedElection]))
      .mockReturnValueOnce(staleStatusResponse)
      .mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' });
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: /All elections/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    expect(await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent('Finance');

    resolveStaleStatus(response(progressedElection));
    await act(async () => { await staleStatusResponse; });
    expect(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent('Finance');
  });

  it('creates an election with positions in the configured management order', async () => {
    const created = {
      id: 'election-2',
      departmentName: 'Operations',
      status: 'SETUP' as const,
      positions: [
        { id: 'p-1', name: 'Assistant', openingCount: 2, sequence: 1, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
        { id: 'p-2', name: 'Director', openingCount: 1, sequence: 2, progressStatus: 'NOT_STARTED', nextAction: 'SET_UP_NOMINATIONS', roundNumber: null },
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

    await screen.findByRole('heading', { name: 'Assistant' });
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
    expect(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent('Assistant');
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

  it('keeps election editing controls out of the position workflow', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Start: Director' }));
    expect(await screen.findByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit election' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage nominations' })).not.toBeInTheDocument();
  });

  it('keeps the login screen visible with a clear message after a 401', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({}, 401));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn('admin@example.com', 'secret', false);

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

    expect(screen.getByRole('heading', { name: 'Sign in to your church' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument();
  });

  it('keeps nominations hidden until reveal, then saves one shared list', async () => {
    const openIntake = {
      id: 'intake-1',
      accessToken: 'share-token',
      nameLimit: 3,
      status: 'OPEN' as const,
      currentContributorCount: 2,
      listCreated: false,
      revealed: false,
      sharedListRevision: 0,
      submissions: [],
      consolidatedNames: null,
      sharedList: [],
      removedEntries: [],
    };
    const closedIntake = { ...openIntake, status: 'CLOSED' as const, listCreated: true,
      sharedListRevision: 1,
      sharedList: [
        { id: 'shared-1', name: 'Morgan Diaz', sequence: 1, active: true },
        { id: 'shared-2', name: 'Riley Chen', sequence: 2, active: true },
      ], consolidatedNames: ['Morgan Diaz', 'Riley Chen'] };
    const revealedIntake = {
      ...closedIntake,
      revealed: true,
      consolidatedNames: ['Morgan Diaz', 'Riley Chen'],
      sharedList: [
        { id: 'shared-1', name: 'Morgan Diaz', sequence: 1, active: true },
        { id: 'shared-2', name: 'Riley Chen', sequence: 2, active: true },
      ],
    };
    const savedSharedList = {
      ...revealedIntake,
      sharedListRevision: 2,
      consolidatedNames: ['Morgan Diaz Jr.', 'Riley Chen'],
      sharedList: [
        { id: 'shared-1', name: 'Morgan Diaz Jr.', sequence: 1, active: true },
        { id: 'shared-2', name: 'Riley Chen', sequence: 2, active: true },
      ],
    };
    const createdDraft = {
      id: 'round-1', roundNumber: 1, status: 'DRAFT', selectionCount: 2,
      nominationRevision: 2,
      candidates: [{ id: 'candidate-2', name: 'Morgan Diaz Jr.', sequence: 1 }, { id: 'candidate-1', name: 'Riley Chen', sequence: 2 }],
    };
    const updatedDraft = {
      ...createdDraft,
      selectionCount: 1,
      candidates: [
        { id: 'candidate-2', name: 'Morgan Diaz Jr.', sequence: 1 },
        { id: 'candidate-1', name: 'Riley Chen', sequence: 2 },
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
    let intakeState: NominationIntake = openIntake;
    let intakeExists = false;
    const workflowResponses = [
      response({}, 500), response(createdDraft, 201), response(updatedDraft), response(activeRound),
      response({}, 404), response(revealedResults), response(decidedResults), response(eliminatedResults),
      response(undoneResults), response(electedResults),
      response({ id: 'round-2', roundNumber: 2, status: 'DRAFT', selectionCount: 1, candidates: [{ id: 'candidate-1-round-2', name: 'Riley Chen', sequence: 1 }] }, 201),
      response(electedResults), response(activeRound),
    ];
    let workflowResponseIndex = 0;
    let progressPollCount = 0;
    const viewerLocation = { assign: vi.fn() };
    const viewerWindow = { location: viewerLocation, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(viewerWindow as unknown as Window);
    fetchMock.mockImplementation(async (url, options) => {
      if (String(url) === 'http://localhost:8080/api/elections/election-1' && (!options || options.method === 'GET')) {
        return response(workflowResponseIndex === 0 ? election : { ...election, status: 'IN_PROGRESS' });
      }
      if (String(url).endsWith('/round-1/progress')) {
        progressPollCount += 1;
        const progress = progressPollCount === 2
          ? { roundId: 'round-1', status: 'CLOSED', ballotsCast: 9, expectedVoterCount: 16 }
          : { roundId: 'round-1', status: 'ACTIVE', ballotsCast: 7, expectedVoterCount: 16 };
        return response(progress);
      }
      const requestUrl = String(url);
      const requestPath = requestUrl.replace('http://localhost:8080', '');
      const requestMethod = options?.method ?? 'GET';
      if (requestPath.endsWith('/nominations/stream')) {
        return eventStreamResponse([`event: intake\ndata: ${JSON.stringify(intakeState)}\n\n`]);
      }
      if (requestPath.endsWith('/nominations/close')) {
        intakeState = { ...closedIntake, listCreated: true };
        return response(intakeState);
      }
      if (requestPath.endsWith('/nominations/reveal')) {
        intakeState = revealedIntake;
        return response(intakeState);
      }
      if (requestPath.endsWith('/nominations/presentation') && requestMethod === 'POST') {
        return response({ accessToken: 'presentation-token', viewerPath: '/api/nomination-presentations/presentation-token', visible: true });
      }
      if (requestPath.endsWith('/positions/position-1/rounds') && requestMethod === 'GET') return response([]);
      if (requestPath.endsWith('/nominations/shared-list')) {
        intakeState = savedSharedList;
        return response(intakeState);
      }
      if (requestPath.endsWith('/nominations') && requestMethod === 'POST') {
        intakeExists = true;
        intakeState = openIntake;
        return response(intakeState, 201);
      }
      if (requestPath.endsWith('/nominations') && requestMethod === 'GET') {
        if (!intakeExists) return response({}, 404);
        return response(intakeState.status === 'OPEN' ? intakeState : closedIntake);
      }
      return workflowResponses[workflowResponseIndex++] ?? response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    fireEvent.change(await screen.findByLabelText('Maximum names per visitor'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create intake' }));

    expect(await screen.findByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(screen.getByText('Nomination link ready')).toBeInTheDocument();
    expect(screen.getByText('Anyone with this position-specific link can submit or revise names while intake is open. The presentation becomes available after nominations are revealed.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Public nomination link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy nomination link' })).toBeEnabled();
    expect(screen.queryByText('Sam Lee')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Submitted names' })).not.toBeInTheDocument();
    expect(screen.getByText('profile submissions')).toBeInTheDocument();
    expect(screen.getByText('Browser profiles with at least one current name submission. This is not a verified count of people.')).toBeInTheDocument();
    expect(screen.getByText('names allowed per profile')).toBeInTheDocument();
    const activeStage = document.querySelector('.workflow-stage-group.is-intake-open');
    expect(activeStage).not.toBeNull();
    expect(activeStage?.querySelector('.guided-workflow')).toBeInTheDocument();
    expect(activeStage?.querySelector('.intake-collection-view')).toBeInTheDocument();
    expect(activeStage?.querySelector('.workflow-presentation-control')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Names not yet submitted' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Current election access shortcuts' })).queryByRole('button', { name: 'Presentation' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Audience presentation' })).getByRole('button', { name: 'Presentation' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Copy nomination link' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not copy the link. Select and copy the share URL instead.');
    expect(screen.getByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(document.querySelector('.position-workflow-grid')).toHaveClass('is-intake-open');
    const loadIntakeRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/nominations') && options?.method === 'GET');
    expect(loadIntakeRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations');
    expect(loadIntakeRequest?.[1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    const createRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/nominations') && options?.method === 'POST');
    expect(createRequest).toBeDefined();
    const createCall = createRequest as [string, RequestInit];
    expect(createCall[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations');
    expect(createCall[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ nameLimit: 3 }) });
    expect(createCall[1].headers).toMatchObject({ Authorization: `Basic ${btoa('admin@example.com:secret')}` });

    fireEvent.click(screen.getByRole('button', { name: 'Close nominations' }));
    expect(screen.getByRole('dialog', { name: 'Close nominations?' })).toHaveTextContent('Submitted names will be available to admins; the presentation stays hidden until you reveal the list.');
    expect(screen.getByRole('button', { name: 'Keep intake open' })).toHaveFocus();
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Close nominations?' })).getByRole('button', { name: 'Close nominations' }));
    expect(await screen.findByRole('region', { name: 'Closed nomination review' })).toHaveTextContent('2 current profile submissions');
    expect(screen.getByRole('heading', { name: 'Review and consolidate names' })).toBeInTheDocument();
    expect(document.querySelector('.position-workflow-grid')).toHaveClass('is-intake-closed');
    expect(screen.queryByRole('complementary', { name: 'People on the ballot' })).not.toBeInTheDocument();
    const closedStatus = screen.getByText('Nominations are closed. Review the shared list; the presentation remains hidden until you reveal it.');
    expect(closedStatus).toHaveTextContent('Nominations are closed. Review the shared list; the presentation remains hidden until you reveal it.');
    expect(closedStatus).toHaveFocus();
    expect(screen.queryByRole('heading', { name: 'Manage nomination list' })).not.toBeInTheDocument();
    const closedSharedList = screen.getByRole('list', { name: 'Shared nomination list' });
    expect(within(closedSharedList).getByLabelText('Correct Morgan Diaz')).toHaveValue('Morgan Diaz');
    expect(within(closedSharedList).getByLabelText('Correct Riley Chen')).toHaveValue('Riley Chen');
    expect(screen.queryByRole('list', { name: 'Submitted names' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/rounds'))).toBe(true);
    expect(screen.getByRole('heading', { name: 'Shared nomination list' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Shared nomination list' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reveal results' }));
    const sharedList = await screen.findByRole('list', { name: 'Shared nomination list' });
    expect(within(sharedList).getByLabelText('Correct Morgan Diaz')).toHaveValue('Morgan Diaz');
    expect(within(sharedList).getByLabelText('Correct Riley Chen')).toHaveValue('Riley Chen');
    expect(screen.getByText('Correct Morgan Diaz')).toHaveClass('sr-only');
    expect(within(sharedList).getByRole('button', { name: 'Save Morgan Diaz' })).toBeVisible();
    expect(within(sharedList).getByRole('button', { name: 'Remove Morgan Diaz' })).toBeVisible();
    const morganRow = within(sharedList).getByLabelText('Correct Morgan Diaz').closest('li');
    expect(within(morganRow as HTMLElement).queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    fireEvent.change(within(morganRow as HTMLElement).getByLabelText('Correct Morgan Diaz'), { target: { value: 'Morgan Diaz Jr.' } });
    fireEvent.click(within(morganRow as HTMLElement).getByRole('button', { name: 'Save Morgan Diaz' }));
    expect(within(await screen.findByRole('list', { name: 'Shared nomination list' })).getByLabelText('Correct Morgan Diaz Jr.')).toHaveValue('Morgan Diaz Jr.');
    expect(screen.getByRole('heading', { name: 'Voting round configuration' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    const configurationDisclosure = screen.getAllByText(/Voting round configuration/)[0].closest('details');
    expect(configurationDisclosure).toHaveAttribute('open');
    const configurationSummary = configurationDisclosure?.querySelector('summary');
    fireEvent.click(configurationSummary as HTMLElement);
    expect(configurationDisclosure).not.toHaveAttribute('open');
    fireEvent.click(configurationSummary as HTMLElement);
    expect(configurationDisclosure).toHaveAttribute('open');
    const closeRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/close'));
    const revealRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/reveal'));
    const presentationRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/nominations/presentation') && options?.method === 'POST');
    const sharedListRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/shared-list'));
    expect(closeRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/close');
    expect(closeRequest?.[1].method).toBe('POST');
    expect(revealRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/reveal');
    expect(revealRequest?.[1].method).toBe('POST');
    expect(presentationRequest?.[1].method).toBe('POST');
    expect(viewerLocation.assign).toHaveBeenCalledWith('/nomination-presentation/presentation-token');
    expect(sharedListRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/shared-list');
    expect(sharedListRequest?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ expectedRevision: 1, entries: [
        { id: 'shared-1', name: 'Morgan Diaz Jr.', sequence: 1, active: true },
        { id: 'shared-2', name: 'Riley Chen', sequence: 2, active: true },
      ], removals: [] }),
    });

    expect(await screen.findByRole('heading', { name: 'Voting round configuration' })).toBeInTheDocument();
    const roundListRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/positions/position-1/rounds') && options?.method === 'GET');
    expect(roundListRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(roundListRequest?.[1].method).toBe('GET');
    expect(screen.getByLabelText('Number of selections allowed')).toHaveValue(null);
            expect(screen.queryByText('Candidates for this round')).not.toBeInTheDocument();
            expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Morgan Diaz Jr.Riley Chen');
    fireEvent.change(screen.getByLabelText('Number of selections allowed'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create draft round' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 500');
    expect(screen.getByRole('button', { name: 'Create draft round' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create draft round' }));
    expect(await screen.findByText('Draft round configuration saved.')).toBeInTheDocument();
    const createRoundRequests = fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/positions/position-1/rounds') && options?.method === 'POST');
    expect(createRoundRequests[0]?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(createRoundRequests[0]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ candidateNames: ['Morgan Diaz Jr.', 'Riley Chen'], selectionCount: 2 }) });
    expect(createRoundRequests[1]?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(createRoundRequests[1]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ candidateNames: ['Morgan Diaz Jr.', 'Riley Chen'], selectionCount: 2 }),
    });
            expect(screen.getByText('Draft round 1: allows 2 selections from 2 candidates.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Number of selections allowed'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update draft round' }));
            expect(await screen.findByText('Draft round 1: allows 1 selection from 2 candidates.')).toBeInTheDocument();
    const initialRoundDisclosure = screen.getAllByText('Round 1')[0].closest('details');
    expect(initialRoundDisclosure).not.toHaveAttribute('open');
    fireEvent.click(initialRoundDisclosure?.querySelector('summary') as HTMLElement);
    expect(initialRoundDisclosure).toHaveAttribute('open');
    const updateRoundRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/rounds/round-1') && options?.method === 'PUT');
    expect(updateRoundRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1');
    expect(updateRoundRequest?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Morgan Diaz Jr.', 'Riley Chen'], selectionCount: 1 }),
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
    const startRoundRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/rounds/round-1/start') && options?.method === 'POST');
    expect(startRoundRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/start');
    expect(startRoundRequest?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ expectedVoterCount: 16 }) });
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
    expect(screen.getByRole('heading', { name: 'Round 1' }).parentElement).toHaveTextContent('Closed');
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

  it('preserves shared-list edits after a save failure so they can be retried', async () => {
    const revealedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: true,
      currentContributorCount: 1, sharedListRevision: 2, submissions: [], consolidatedNames: ['Riley Chen'],
      sharedList: [{ id: 'shared-1', name: 'Riley Chen', sequence: 1, active: true }], removedEntries: [],
    };
    let updateAttempts = 0;
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      if (String(url) === 'http://localhost:8080/api/auth/me') return response(account);
      if (String(url) === 'http://localhost:8080/api/churches/my') return response([church]);
      if (String(url) === 'http://localhost:8080/api/elections') return response([election]);
      if (String(url) === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (String(url).endsWith('/nominations') && options?.method === 'POST') return response(revealedIntake, 201);
      if (String(url).endsWith('/nominations/stream')) return eventStreamResponse([`event: intake\ndata: ${JSON.stringify(revealedIntake)}\n\n`]);
      if (String(url).endsWith('/nominations') && options?.method === 'GET') return response(revealedIntake);
      if (String(url).endsWith('/nominations/shared-list')) {
        updateAttempts += 1;
        return updateAttempts === 1 ? response({}, 500) : response({
          ...revealedIntake,
          sharedListRevision: 3,
          sharedList: [{ id: 'shared-1', name: 'Riley Chen Updated', sequence: 1, active: true }],
          consolidatedNames: ['Riley Chen Updated'],
        });
      }
      if (String(url).endsWith('/rounds') && options?.method === 'GET') return response([]);
      if (String(url).endsWith('/rounds') && options?.method === 'POST') return response({}, 500);
      return String(url).includes('/api/elections/election-1') ? response(election) : response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    const activeList = await screen.findByRole('list', { name: 'Shared nomination list' });
    expect(within(activeList).getByLabelText('Correct Riley Chen')).toHaveValue('Riley Chen');
    const rileyRow = within(activeList).getByLabelText('Correct Riley Chen').closest('li');
    const candidateName = within(rileyRow as HTMLElement).getByLabelText('Correct Riley Chen');
    fireEvent.change(candidateName, { target: { value: 'Riley Chen Updated' } });
    fireEvent.click(within(rileyRow as HTMLElement).getByRole('button', { name: 'Save Riley Chen' }));

    const saveError = await screen.findByText('The request failed (HTTP 500).');
    expect(saveError).toHaveTextContent('The request failed (HTTP 500).');
    expect(candidateName).toHaveValue('Riley Chen Updated');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByLabelText('Correct Riley Chen Updated')).toHaveValue('Riley Chen Updated');
    const updateRequests = fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/nominations/shared-list'));
    expect(updateRequests).toHaveLength(2);
    expect(updateRequests[0][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ expectedRevision: 2, entries: [
      { id: 'shared-1', name: 'Riley Chen Updated', sequence: 1, active: true },
    ], removals: [] }) });
  });

  it('records a selected removal reason and restores with the current revision', async () => {
    const initialIntake: NominationIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: true,
      currentContributorCount: 1, sharedListRevision: 4, submissions: [], consolidatedNames: ['Riley Chen'],
      sharedList: [{ id: 'shared-1', name: 'Riley Chen', sequence: 1, active: true }], removedEntries: [], changeEvents: [],
    };
    const removedIntake: NominationIntake = {
      ...initialIntake, sharedListRevision: 5, consolidatedNames: [], sharedList: [],
      removedEntries: [{ auditEventId: 'removal-event-1', originalEntryId: 'shared-1', name: 'Riley Chen', sequence: 1,
        removedAt: '2026-10-25T12:00:00Z', removedBy: 'Administrator' }],
      changeEvents: [{ id: 'removal-event-1', entryId: 'shared-1', action: 'REMOVED', beforeName: 'Riley Chen', afterName: null,
        removalReason: 'DECLINED', reasonDetail: null, actorLabel: 'Administrator', occurredAt: '2026-10-25T12:00:00Z' }],
    };
    const restoredIntake: NominationIntake = { ...initialIntake, sharedListRevision: 6, changeEvents: [
      ...(removedIntake.changeEvents ?? []),
      { id: 'restore-event-1', entryId: 'shared-1', action: 'RESTORED', beforeName: null, afterName: 'Riley Chen',
        removalReason: null, reasonDetail: null, actorLabel: 'Administrator', occurredAt: '2026-10-25T12:05:00Z' },
    ] };
    let currentIntake: NominationIntake = initialIntake;
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      if (requestUrl === 'http://localhost:8080/api/auth/me') return response(account);
      if (requestUrl === 'http://localhost:8080/api/churches/my') return response([church]);
      if (requestUrl === 'http://localhost:8080/api/elections') return response([election]);
      if (requestUrl === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (requestUrl.endsWith('/nominations') && options?.method === 'GET') return response(currentIntake);
      if (requestUrl.endsWith('/nominations/stream')) return eventStreamResponse([]);
      if (requestUrl.endsWith('/nominations/shared-list') && options?.method === 'PUT') {
        currentIntake = removedIntake;
        return response(removedIntake);
      }
      if (requestUrl.endsWith('/nominations/shared-list/restore') && options?.method === 'POST') {
        currentIntake = restoredIntake;
        return response(restoredIntake);
      }
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') return response([]);
      return response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    const activeRow = within(await screen.findByRole('list', { name: 'Shared nomination list' }))
      .getByLabelText('Correct Riley Chen').closest('li');
    fireEvent.click(within(activeRow as HTMLElement).getByRole('button', { name: 'Remove Riley Chen' }));
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'DECLINED' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));

    await screen.findByText('Confirmed change history (1)');
    const updateRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/nominations/shared-list') && options?.method === 'PUT');
    expect(updateRequest?.[1]).toMatchObject({ method: 'PUT', body: JSON.stringify({
      expectedRevision: 4,
      entries: [],
      removals: [{ id: 'shared-1', reason: 'DECLINED' }],
    }) });
    expect(screen.getByText(/Riley Chen removed · DECLINED/)).toBeInTheDocument();

    const restoreButton = screen.getByRole('button', { name: 'Restore Riley Chen' });
    await waitFor(() => expect(restoreButton).toBeEnabled());
    fireEvent.click(restoreButton);
    await screen.findByText('Confirmed change history (2)');
    const restoreRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/nominations/shared-list/restore') && options?.method === 'POST');
    expect(restoreRequest?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ auditEventId: 'removal-event-1', expectedRevision: 5 }) });
    expect(within(screen.getByRole('list', { name: 'Shared nomination list' })).getByLabelText('Correct Riley Chen')).toHaveValue('Riley Chen');
  });

  it('keeps removed nominations audit-only when round 1 is active on restore refresh', async () => {
    const removedIntake: NominationIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 2, status: 'CLOSED', listCreated: true, revealed: true,
      currentContributorCount: 1, sharedListRevision: 2, submissions: [], consolidatedNames: [], sharedList: [],
      removedEntries: [{ auditEventId: 'removal-event-1', originalEntryId: 'shared-1', name: 'Riley Chen', sequence: 1,
        removedAt: '2026-10-25T12:00:00Z', removedBy: 'Administrator' }],
      changeEvents: [{ id: 'removal-event-1', entryId: 'shared-1', action: 'REMOVED', beforeName: 'Riley Chen', afterName: null,
        removalReason: 'DECLINED', reasonDetail: null, actorLabel: 'Administrator', occurredAt: '2026-10-25T12:00:00Z' }],
    };
    let roundsReads = 0;
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      if (requestUrl === 'http://localhost:8080/api/auth/me') return response(account);
      if (requestUrl === 'http://localhost:8080/api/churches/my') return response([church]);
      if (requestUrl === 'http://localhost:8080/api/elections') return response([election]);
      if (requestUrl === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (requestUrl.endsWith('/nominations') && options?.method === 'GET') return response(removedIntake);
      if (requestUrl.endsWith('/nominations/stream')) return eventStreamResponse([]);
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') {
        roundsReads += 1;
        return response(roundsReads === 1 ? [] : [{
          id: 'round-1', roundNumber: 1, status: 'ACTIVE', selectionCount: 1,
          candidates: [{ id: 'candidate-1', name: 'Jordan Lee', sequence: 1 }],
        }]);
      }
      return response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    const restoreButton = await screen.findByRole('button', { name: 'Restore Riley Chen' });
    await waitFor(() => expect(restoreButton).toBeEnabled());
    fireEvent.click(restoreButton);

    expect(await screen.findByText('The closed intake is read-only while voting is active. This name cannot be restored until the round closes.')).toBeInTheDocument();
    expect(roundsReads).toBe(2);
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).endsWith('/nominations/shared-list/restore') && options?.method === 'POST')).toBe(false);
    expect(screen.getByRole('button', { name: 'Restore Riley Chen' })).toBeDisabled();
  });

  it('traps focus in the removal dialog and restores focus when dismissed with Escape', async () => {
    const intake: NominationIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 2, status: 'CLOSED', listCreated: true, revealed: false,
      currentContributorCount: 1, sharedListRevision: 1, submissions: [], consolidatedNames: ['Riley Chen'],
      sharedList: [{ id: 'shared-1', name: 'Riley Chen', sequence: 1, active: true }], removedEntries: [], changeEvents: [],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      if (requestUrl === 'http://localhost:8080/api/auth/me') return response(account);
      if (requestUrl === 'http://localhost:8080/api/churches/my') return response([church]);
      if (requestUrl === 'http://localhost:8080/api/elections') return response([election]);
      if (requestUrl === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (requestUrl.endsWith('/nominations') && options?.method === 'GET') return response(intake);
      if (requestUrl.endsWith('/nominations/stream')) return eventStreamResponse([]);
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') return response([]);
      return response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    const removeButton = within(await screen.findByRole('list', { name: 'Shared nomination list' }))
      .getByRole('button', { name: 'Remove Riley Chen' });
    removeButton.focus();
    fireEvent.click(removeButton);
    const dialog = screen.getByRole('dialog', { name: 'Remove Riley Chen?' });
    const reason = within(dialog).getByLabelText('Reason');
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    const confirm = within(dialog).getByRole('button', { name: 'Confirm removal' });
    expect(reason).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(confirm).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(reason).toHaveFocus();
    fireEvent.change(reason, { target: { value: 'OTHER' } });
    const detail = within(dialog).getByLabelText('Details');
    expect(reason).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(detail).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(cancel).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(detail).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Remove Riley Chen?' })).not.toBeInTheDocument();
    expect(removeButton).toHaveFocus();
  });

  it('preserves fixed row sequence when correcting a name after removing another row', async () => {
    const initialIntake: NominationIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: false,
      currentContributorCount: 2, sharedListRevision: 2, submissions: [], consolidatedNames: ['Alex Kim', 'Riley Chen'],
      sharedList: [
        { id: 'shared-1', name: 'Alex Kim', sequence: 1, active: true },
        { id: 'shared-2', name: 'Morgan Diaz', sequence: 2, active: true },
        { id: 'shared-3', name: 'Riley Chen', sequence: 3, active: true },
      ], removedEntries: [], changeEvents: [],
    };
    const removedIntake: NominationIntake = {
      ...initialIntake, sharedListRevision: 3, consolidatedNames: ['Alex Kim', 'Riley Chen'],
      sharedList: [initialIntake.sharedList[0], initialIntake.sharedList[2]],
      removedEntries: [{ auditEventId: 'removal-event-1', originalEntryId: 'shared-2', name: 'Morgan Diaz', sequence: 2,
        removedAt: '2026-10-25T12:00:00Z', removedBy: 'Administrator' }],
    };
    const correctedIntake: NominationIntake = {
      ...removedIntake, sharedListRevision: 4, consolidatedNames: ['Alex Kim', 'Riley Chen Jr.'],
      sharedList: [removedIntake.sharedList[0], { ...removedIntake.sharedList[1], name: 'Riley Chen Jr.' }],
    };
    let currentIntake = initialIntake;
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      if (requestUrl === 'http://localhost:8080/api/auth/me') return response(account);
      if (requestUrl === 'http://localhost:8080/api/churches/my') return response([church]);
      if (requestUrl === 'http://localhost:8080/api/elections') return response([election]);
      if (requestUrl === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (requestUrl.endsWith('/nominations') && options?.method === 'GET') return response(currentIntake);
      if (requestUrl.endsWith('/nominations/stream')) return eventStreamResponse([]);
      if (requestUrl.endsWith('/nominations/shared-list') && options?.method === 'PUT') {
        const requestBody = JSON.parse(String(options.body)) as {
          entries: Array<{ id: string; sequence: number }>;
          removals: Array<{ id: string }>;
        };
        if (requestBody.removals.length > 0) currentIntake = removedIntake;
        else currentIntake = correctedIntake;
        return response(currentIntake);
      }
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') return response([]);
      return response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    const activeList = await screen.findByRole('list', { name: 'Shared nomination list' });
    const morganRow = within(activeList).getByLabelText('Correct Morgan Diaz').closest('li');
    fireEvent.click(within(morganRow as HTMLElement).getByRole('button', { name: 'Remove Morgan Diaz' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm removal' }));
    const rileyRow = within(await screen.findByRole('list', { name: 'Shared nomination list' }))
      .getByLabelText('Correct Riley Chen').closest('li');
    fireEvent.change(within(rileyRow as HTMLElement).getByLabelText('Correct Riley Chen'), { target: { value: 'Riley Chen Jr.' } });
    fireEvent.click(within(rileyRow as HTMLElement).getByRole('button', { name: 'Save Riley Chen' }));

    expect(await screen.findByLabelText('Correct Riley Chen Jr.')).toHaveValue('Riley Chen Jr.');
    const updateRequests = fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/nominations/shared-list') && options?.method === 'PUT');
    expect(updateRequests).toHaveLength(2);
    expect(updateRequests[1][1]).toMatchObject({ body: JSON.stringify({ expectedRevision: 3, entries: [
      { id: 'shared-1', name: 'Alex Kim', sequence: 1, active: true },
      { id: 'shared-3', name: 'Riley Chen Jr.', sequence: 3, active: true },
    ], removals: [] }) });
  });

  it('does not reveal nominations when the browser blocks the presentation tab', async () => {
    const closedIntake: NominationIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: false,
      currentContributorCount: 1, sharedListRevision: 0, submissions: [], consolidatedNames: ['Riley Chen'],
      sharedList: [{ id: 'shared-1', name: 'Riley Chen', sequence: 1, active: true }], removedEntries: [], changeEvents: [],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      if (requestUrl === 'http://localhost:8080/api/auth/me') return response(account);
      if (requestUrl === 'http://localhost:8080/api/churches/my') return response([church]);
      if (requestUrl === 'http://localhost:8080/api/elections') return response([election]);
      if (requestUrl === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (requestUrl.endsWith('/nominations') && options?.method === 'GET') return response(closedIntake);
      if (requestUrl.endsWith('/nominations/stream')) return eventStreamResponse([]);
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') return response([]);
      return response({}, 404);
    });
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Reveal results' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The browser blocked the presentation tab. Allow pop-ups, then reveal the list again.');
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/nominations/reveal'))).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/nominations/presentation'))).toBe(false);
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
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
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

  it('shows an empty shared list to admins before presentation reveal', async () => {
    const closedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: false,
      currentContributorCount: 0, sharedListRevision: 0, submissions: [], consolidatedNames: null, sharedList: [],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockResolvedValueOnce(response(closedIntake));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    expect(await screen.findByText('Nominations are closed. Review the shared list; the presentation remains hidden until you reveal it.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reveal results' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Shared nomination list' })).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start: Director' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    expect(screen.getByRole('status')).toHaveTextContent('Loading nomination intake');
    await act(async () => {
      resolveIntake(response({
        id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', revealed: false,
        currentContributorCount: 0, sharedListRevision: 0, submissions: [], consolidatedNames: null, sharedList: [],
      }));
    });
    expect(await screen.findByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Open nomination intake' })).getByText('No names have been submitted yet.')).toBeInTheDocument();
  });

  it('shows an admin intake load error with retry instead of offering to create another intake', async () => {
    const openIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', revealed: false,
      currentContributorCount: 0, sharedListRevision: 0, submissions: [], consolidatedNames: null, sharedList: [],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockRejectedValueOnce(new Error('Network unavailable'))
      .mockResolvedValueOnce(response(openIntake));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Start: Director' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.queryByRole('button', { name: 'Create intake' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading nominations' }));
    expect(await screen.findByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Create intake' })).not.toBeInTheDocument();
  });

  it('streams authenticated intake snapshots across chunks and aborts when leaving the workflow', async () => {
    const openIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', revealed: false,
      currentContributorCount: 1, sharedListRevision: 0, submissions: [], consolidatedNames: null, sharedList: [],
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start: Director' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Open nomination intake' }));
    expect(await screen.findByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    expect(screen.queryByText('Riley Chen')).not.toBeInTheDocument();

    const streamRequest = fetchMock.mock.calls[5];
    expect(streamRequest[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/stream');
    expect(streamRequest[0]).not.toContain('admin@example.com');
    expect(streamRequest[1]).toMatchObject({
      method: 'GET',
      headers: { Accept: 'text/event-stream', Authorization: `Basic ${btoa('admin@example.com:secret')}` },
    });
    expect(streamRequest[1].signal).toBeInstanceOf(AbortSignal);

    const updatedSnapshot = { ...openIntake, currentContributorCount: 2 };
    const event = `event: intake\r\ndata: ${JSON.stringify(updatedSnapshot)}\r\n\r\n`;
    await act(async () => {
      streamController.enqueue(new TextEncoder().encode(event.slice(0, 17)));
      streamController.enqueue(new TextEncoder().encode(event.slice(17, 53)));
      streamController.enqueue(new TextEncoder().encode(event.slice(53)));
    });
    expect(screen.queryByText('Morgan Diaz')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Submissions updated: 2 current profile submissions.');

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: /All elections/ }));
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
    expect(await screen.findByText('Your names were submitted. You can replace or withdraw them until nominations close.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/nomination-intakes/public-token/submission');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ names: ['Avery Chen'] }) });
    expect(fetchMock.mock.calls[1][1].headers['X-Nomination-Device-Token']).toBe(deviceToken);

    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Jordan Lee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit names' }));
    expect(await screen.findByText('Your names were submitted. You can replace or withdraw them until nominations close.')).toBeInTheDocument();
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
    expect(await screen.findByText('Your names were submitted. You can replace or withdraw them until nominations close.')).toBeInTheDocument();
    expect(addNameButton).toBeDisabled();
    expect(screen.queryByLabelText('Name 4')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[1][1].body).toBe(JSON.stringify({ names: savedIntake.submittedNames }));
  });

  it('withdraws the saved public list only after confirmation and clears saved and unsaved fields on success', async () => {
    const initialIntake = { departmentName: 'Finance', positionName: 'Director', nameLimit: 3, submittedNames: ['Avery Chen', 'Jordan Lee'] };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(initialIntake))
      .mockResolvedValueOnce(response({ submittedNames: [] }))
      .mockResolvedValueOnce(response({ submittedNames: ['New nominee'] }));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/nominate/public-token');

    render(<App />);
    await screen.findByRole('heading', { name: 'Director' });
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Edited locally' } });
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw all names' }));
    const dialog = screen.getByRole('dialog', { name: 'Withdraw your names?' });
    expect(dialog).toHaveTextContent('This removes every name currently saved by this browser profile from the intake. You can submit a new list while nominations remain open.');
    expect(screen.getByRole('button', { name: 'Keep my names' })).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw names' }));

    expect(await screen.findByText('Your names have been withdrawn. This profile has no names currently included. You may submit a new list while nominations are open.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name 1')).toHaveValue('');
    expect(screen.queryByLabelText('Name 2')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Withdraw all names' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ names: [] }) });

    const addNameButton = screen.getByRole('button', { name: /Add another name/ });
    expect(addNameButton).toBeEnabled();
    fireEvent.click(addNameButton);
    expect(screen.getByLabelText('Name 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Name 2')).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Name 2 added.');
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'New nominee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit names' }));
    expect(await screen.findByText('Your names were submitted. You can replace or withdraw them until nominations close.')).toBeInTheDocument();
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ names: ['New nominee'] }) });
  });

  it('preserves form fields when public withdrawal is cancelled or fails', async () => {
    const initialIntake = { departmentName: 'Finance', positionName: 'Director', nameLimit: 3, submittedNames: ['Avery Chen'] };
    const fetchMock = vi.fn().mockResolvedValueOnce(response(initialIntake)).mockResolvedValueOnce(response({}, 500));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/nominate/public-token');

    render(<App />);
    await screen.findByRole('heading', { name: 'Director' });
    fireEvent.change(screen.getByLabelText('Name 1'), { target: { value: 'Unsaved edit' } });
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw all names' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep my names' }));
    expect(screen.getByLabelText('Name 1')).toHaveValue('Unsaved edit');
    expect(screen.getByRole('button', { name: 'Withdraw all names' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Withdraw all names' }));
    fireEvent.click(screen.getByRole('button', { name: 'Withdraw names' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The request failed (HTTP 500).');
    expect(screen.getByLabelText('Name 1')).toHaveValue('Unsaved edit');
    expect(screen.getByRole('button', { name: 'Withdraw all names' })).toBeInTheDocument();
    expect(screen.queryByText(/Your names have been withdrawn/)).not.toBeInTheDocument();
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

  it('shows public intake load failures and allows retry', async () => {
    const intake = { departmentName: 'Finance', positionName: 'Director', nameLimit: 3, submittedNames: [] };
    const fetchMock = vi.fn().mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce(response(intake));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/nominate/retry-token');

    render(<App />);
    expect(await screen.findByRole('heading', { name: 'Could not load this form' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable');
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading form' }));
    expect(await screen.findByRole('heading', { name: 'Director' })).toBeInTheDocument();
  });
});
