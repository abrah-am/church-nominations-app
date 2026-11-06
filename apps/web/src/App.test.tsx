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
    const openElectionButtons = await screen.findAllByRole('button', { name: 'Open election' });
    fireEvent.click(openElectionButtons[0]);
  }
}

function signedInFetch(churches: unknown[], elections: unknown[]) {
  return vi.fn()
    .mockResolvedValueOnce(response(account))
    .mockResolvedValueOnce(response(churches))
    .mockResolvedValueOnce(response(elections));
}

async function waitForPositionHydration() {
	await screen.findByRole('region', { name: 'Election access' });
  await waitFor(() => expect(screen.queryByText('Loading nomination intake…')).not.toBeInTheDocument());
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
      intakeOpen: false,
      listCreated: true,
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
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ revealed: false, intakeOpen: false, listCreated: false, activeNames: [], events: [] })));
    window.history.pushState({}, '', '/nomination-presentation/neutral-token');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Nominations are not being shown' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Current list' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Confirmed changes' })).not.toBeInTheDocument();
  });
});

describe('voting round navigation', () => {
  it('shows private aggregate candidate totals live and keeps final totals after close', async () => {
    const savedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', revealed: true,
      submissions: [], consolidatedNames: ['Riley Chen', 'Morgan Diaz', 'Jordan Lee'],
      sharedList: [
        { id: 'shared-1', name: 'Riley Chen', sequence: 1, active: true },
        { id: 'shared-2', name: 'Morgan Diaz', sequence: 2, active: true },
        { id: 'shared-3', name: 'Jordan Lee', sequence: 3, active: true },
      ],
    };
    const activeRound = {
      id: 'round-1', roundNumber: 1, status: 'ACTIVE', selectionCount: 3,
      expectedVoterCount: 8, accessToken: 'active-token',
      candidates: [
        { id: 'candidate-riley', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-morgan', name: 'Morgan Diaz', sequence: 2 },
        { id: 'candidate-jordan', name: 'Jordan Lee', sequence: 3 },
      ],
    };
    const closedRound = { ...activeRound, status: 'CLOSED', accessToken: null };
    const zeroAggregate = {
      expectedVoterCount: 8, ballotsCast: 0, majorityThreshold: 5,
      candidates: [
        { id: 'candidate-riley', name: 'Riley Chen', votes: 0 },
        { id: 'candidate-morgan', name: 'Morgan Diaz', votes: 0 },
        { id: 'candidate-jordan', name: 'Jordan Lee', votes: 0 },
      ],
    };
    const firstAggregate = {
      ...zeroAggregate,
      ballotsCast: 2,
      candidates: [
        { id: 'candidate-riley', name: 'Riley Chen', votes: 3 },
        { id: 'candidate-morgan', name: 'Morgan Diaz', votes: 3 },
        { id: 'candidate-jordan', name: 'Jordan Lee', votes: 1 },
      ],
    };
    const updatedAggregate = {
      ...firstAggregate,
      candidates: [
        { id: 'candidate-riley', name: 'Riley Chen', votes: 4 },
        { id: 'candidate-morgan', name: 'Morgan Diaz', votes: 3 },
        { id: 'candidate-jordan', name: 'Jordan Lee', votes: 1 },
      ],
    };
    const finalAggregate = { ...updatedAggregate, ballotsCast: 3 };
    const fetchMock = signedInFetch([church], [election]);
    let progressPollCount = 0;
    let aggregatePollCount = 0;
    const intervalSpy = vi.spyOn(window, 'setInterval');
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      const requestPath = requestUrl.replace('http://localhost:8080', '');
      const requestMethod = options?.method ?? 'GET';
      if (requestPath === '/api/elections/election-1' && requestMethod === 'GET') return response(election);
      if (requestPath.endsWith('/nominations/stream')) return eventStreamResponse([`event: intake\ndata: ${JSON.stringify(savedIntake)}\n\n`]);
      if (requestPath.endsWith('/nominations') && requestMethod === 'GET') return response(savedIntake);
      if (requestPath.endsWith('/positions/position-2/rounds') && requestMethod === 'GET') return response([activeRound]);
      if (requestPath.endsWith('/round-1/progress')) {
        progressPollCount += 1;
        return response({ roundId: 'round-1', status: 'ACTIVE', ballotsCast: progressPollCount, expectedVoterCount: 8 });
      }
      if (requestPath.endsWith('/round-1/aggregate-results')) {
        aggregatePollCount += 1;
        return response(aggregatePollCount === 1 ? zeroAggregate : aggregatePollCount === 2 ? firstAggregate : aggregatePollCount === 3 ? updatedAggregate : finalAggregate);
      }
      if (requestPath.endsWith('/round-1/close') && requestMethod === 'POST') return response(closedRound);
      return response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await waitForPositionHydration();

    const results = await screen.findByRole('region', { name: 'Live aggregate candidate results' });
    expect(within(results).getByText('Riley Chen').parentElement).toHaveTextContent('0 votes · 0%');
    expect(within(results).getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow'))).toEqual(['0', '0', '0']);

    const pollingInterval = intervalSpy.mock.calls.find(([, delay]) => delay === 5000);
    expect(pollingInterval).toBeDefined();
    const pollAgain = pollingInterval?.[0] as () => void;
    await act(async () => {
      pollAgain();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });

    const candidateNames = Array.from(results.querySelectorAll('.round-result-candidate-heading strong')).map((node) => node.textContent);
    expect(candidateNames).toEqual(['Morgan Diaz', 'Riley Chen', 'Jordan Lee']);
    expect(within(results).getByText('Morgan Diaz').parentElement).toHaveTextContent('3 votes · 150%');
    expect(within(results).getByText('Riley Chen').parentElement).toHaveTextContent('3 votes · 150%');
    expect(within(results).getByText('Jordan Lee').parentElement).toHaveTextContent('1 vote · 50%');
    expect(within(results).getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow'))).toEqual(['100', '100', '50']);

    await act(async () => {
      pollAgain();
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    });
    expect(within(results).getByText('Riley Chen').parentElement).toHaveTextContent('4 votes · 200%');
    expect(results).not.toHaveTextContent(/device|user|choice|identity/i);
    expect(fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/round-1/aggregate-results')).every(([, options]) => Boolean(options?.headers?.Authorization))).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Close voting' }));
    const closedDecisions = await screen.findByRole('region', { name: 'Round 1 candidate decisions' });
    expect(within(closedDecisions).getByText('Riley Chen').parentElement).toHaveTextContent('4 votes · 133%');
    expect(within(closedDecisions).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reveal'))).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/close') && String(url).startsWith('http://localhost:8080/api/elections/'))).toBe(true);
    intervalSpy.mockRestore();
  });

  it('hides the active round row while preserving closed-round history and actions', async () => {
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
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await screen.findByRole('heading', { name: 'Treasurer' });
    await waitForPositionHydration();

    const roundList = await screen.findByRole('list', { name: 'Voting rounds' });
    const details = Array.from(roundList.querySelectorAll('.round-details'));
    const roundDisclosures = details.map((disclosure) => disclosure.querySelector('summary span:first-child'));
    expect(details).toHaveLength(2);
    details.forEach((disclosure) => {
      expect(disclosure).not.toHaveAttribute('open');
      expect(disclosure).toHaveAttribute('name', 'voting-rounds');
    });
    expect(details[0].querySelector('summary')).toHaveTextContent('Closed · 1 candidates');
    expect(details[1].querySelector('summary')).toHaveTextContent('Closed · 2 candidates');
    expect(screen.queryByText('Round 3')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Voting is active' })).toBeInTheDocument();
    expect(document.querySelector('.workflow-stage-group.is-voting-active')).toBeInTheDocument();
    expect(document.querySelector('.position-workflow-grid.is-voting-active')).toBeInTheDocument();
    expect(document.querySelector('.voting-round-configuration.is-voting-active .active-voting-card')).toBeInTheDocument();
    const processList = within(screen.getByRole('region', { name: 'Position workflow progress' })).getByRole('list');
    expect(processList).toHaveTextContent('Collect and review nominations');
    expect(processList).toHaveTextContent('Voting rounds');
    expect(processList).toHaveTextContent('Candidate decisions');
    expect(processList).toHaveTextContent('Position complete');
    expect(screen.queryByText(/^Details$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Closed nomination review' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel active voting' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close voting' })).toBeInTheDocument();

    fireEvent.click(roundDisclosures[1] as HTMLElement);
    expect(details[1]).toHaveAttribute('open');
    expect(within(details[1] as HTMLElement).queryByRole('button', { name: 'Reveal results' })).not.toBeInTheDocument();
    fireEvent.click(roundDisclosures[0] as HTMLElement);
    expect(details[0]).toHaveAttribute('open');
    expect(within(details[0] as HTMLElement).getByRole('button', { name: 'Reopen voting' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel active voting' }));
    const cancelDialog = screen.getByRole('dialog', { name: 'Cancel active voting?' });
    expect(cancelDialog).toHaveTextContent('permanently deletes ballots and current decisions');
    fireEvent.click(within(cancelDialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Cancel active voting?' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-3/reset'))).toBe(false);
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
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await waitForPositionHydration();
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
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Riley ChenMorgan Diaz');
    expect(screen.getByText('Reset count: 1')).toBeInTheDocument();
    expect(screen.getByLabelText('How many candidates can each ballot select?')).toHaveValue(null);
    expect(screen.getByRole('button', { name: 'Start Voting' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel and rebuild draft' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('How many candidates can each ballot select?'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Voting' }));
    expect(await screen.findByRole('dialog', { name: 'Start voting for round 1?' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).endsWith('/round-1') && options?.method === 'PUT' && options.body === JSON.stringify({ candidateNames: ['Riley Chen', 'Morgan Diaz'], selectionCount: 1 }))).toBe(true);
    expect(screen.getByLabelText('Expected voter count')).toHaveValue(null);
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Start voting for round 1?' })).getByRole('button', { name: 'Cancel' }));
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/reopen'))).toBe(false);
  });

  it('cancels active voting only after confirmation and returns to round setup', async () => {
    const savedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 2, status: 'CLOSED',
      submissions: [], consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
    };
    const activeRound = {
      id: 'round-1', roundNumber: 1, status: 'ACTIVE', selectionCount: 1,
      expectedVoterCount: 8, accessToken: 'active-token', resetCount: 0,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
      ],
    };
    const resetRound = {
      ...activeRound, status: 'DRAFT', selectionCount: null, expectedVoterCount: null,
      accessToken: null, resetCount: 1,
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(savedIntake))
      .mockResolvedValueOnce(response([activeRound]))
      .mockResolvedValueOnce(response({ roundId: 'round-1', status: 'ACTIVE', ballotsCast: 3, expectedVoterCount: 8 }))
      .mockResolvedValueOnce(response({ expectedVoterCount: 8, ballotsCast: 3, majorityThreshold: 2, candidates: [] }))
      .mockResolvedValueOnce(response(resetRound))
      .mockResolvedValueOnce(response({ ...election, status: 'IN_PROGRESS' }));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await waitForPositionHydration();
    expect(await screen.findByText('3 of 8 profile/link submissions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel active voting' }));
    const dialog = screen.getByRole('dialog', { name: 'Cancel active voting?' });
    expect(dialog).toHaveTextContent('permanently deletes ballots and current decisions');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel active voting' }));

    expect(await screen.findByText(/Voting cancelled\. Ballots and current decisions were permanently deleted/)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).endsWith('/round-1/reset') && options?.method === 'POST')).toBe(true);
    expect(screen.queryByText('3 of 8 profile/link submissions')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
  });

  it('shows an API error when active voting cancellation is rejected', async () => {
    const savedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 2, status: 'CLOSED',
      submissions: [], consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
    };
    const activeRound = {
      id: 'round-1', roundNumber: 1, status: 'ACTIVE', selectionCount: 1,
      expectedVoterCount: 8, accessToken: 'active-token', resetCount: 0,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
      ],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(savedIntake))
      .mockResolvedValueOnce(response([activeRound]))
      .mockResolvedValueOnce(response({ roundId: 'round-1', status: 'ACTIVE', ballotsCast: 3, expectedVoterCount: 8 }))
      .mockResolvedValueOnce(response({ expectedVoterCount: 8, ballotsCast: 3, majorityThreshold: 2, candidates: [] }))
      .mockResolvedValueOnce(response({}, 409));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await waitForPositionHydration();
    expect(await screen.findByText('3 of 8 profile/link submissions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel active voting' }));
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Cancel active voting?' }))
      .getByRole('button', { name: 'Cancel active voting' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The request failed (HTTP 409).');
    expect(screen.getByText('3 of 8 profile/link submissions')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Cancel active voting?' })).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await waitForPositionHydration();

    expect(await screen.findByText('Unavailable')).toBeInTheDocument();
    expect(screen.getByText('The connected API did not provide this count. Restart or update the API, then reload nominations.')).toBeInTheDocument();
    expect(screen.getByText('Share the nomination link, monitor profile submissions, and close intake when ready.')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Open nomination intake' })).getByRole('heading', { name: 'Nomination intake is open' })).toBeInTheDocument();
    const openIntakeView = screen.getByRole('region', { name: 'Open nomination intake' });
    const openNames = within(openIntakeView).getByRole('list', { name: 'Submitted nomination names' });
    expect(Array.from(openNames.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual([
      'Avery Chen', 'avery chen', 'Jordan Lee',
    ]);
    expect(within(openNames).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(openNames).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(within(openIntakeView).getByRole('button', { name: 'Close nomination intake' })).toBeEnabled();
    const presentationCard = screen.getByRole('article', { name: 'Audience presentation' });
    expect(within(presentationCard).getByRole('switch', { name: 'Show audience presentation' })).toBeEnabled();
    expect(within(presentationCard).getByText('When shown, incoming names appear on the room presentation only.')).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));
    await waitForPositionHydration();

    expect(await screen.findByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Unavailable')).not.toBeInTheDocument();
    expect(screen.queryByText('No names have been submitted yet.')).not.toBeInTheDocument();
  });

  it('keeps nomination progress current after reveal until the first voting round is drafted', async () => {
    const revealedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: true,
      currentContributorCount: 2, sharedListRevision: 0, submissions: [],
      consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
      sharedList: [
        { id: 'name-1', name: 'Riley Chen', sequence: 1, active: true },
        { id: 'name-2', name: 'Morgan Diaz', sequence: 2, active: true },
      ],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock
      .mockResolvedValueOnce(response(election))
      .mockResolvedValueOnce(response(revealedIntake))
      .mockResolvedValueOnce(response([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));

    expect(await screen.findByText('Review the confirmed list and configure how many names each ballot can select.')).toBeInTheDocument();
    const workflow = screen.getByRole('region', { name: 'Position workflow progress' });
    expect(within(workflow).getByRole('listitem', { current: 'step' })).toHaveTextContent('Voting rounds');
    expect(within(workflow).getByText('2 of 4')).toBeInTheDocument();
  });
});

describe('election administration', () => {
  it('restores current intake names and profile count after leaving and reopening a position', async () => {
    const activeElection = {
      ...election,
      positions: election.positions.map((position) => ({
        ...position,
        progressStatus: position.id === 'position-1' ? 'NOMINATIONS_OPEN' : position.progressStatus,
      })),
    };
    const openIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', revealed: false,
      currentContributorCount: 2, sharedListRevision: 0,
      submissions: [
        { id: 'submission-1', name: 'Riley Chen' },
        { id: 'submission-2', name: 'Morgan Diaz' },
      ], consolidatedNames: null, sharedList: [],
    };
    const fetchMock = signedInFetch([church], [activeElection]);
    fetchMock.mockImplementation((input) => {
      const requestUrl = String(input);
      if (requestUrl.endsWith('/api/elections')) return Promise.resolve(response([activeElection]));
      if (requestUrl.endsWith('/api/elections/election-1')) return Promise.resolve(response(activeElection));
      if (requestUrl.endsWith('/positions/position-1/nominations')) return Promise.resolve(response(openIntake));
      if (requestUrl.endsWith('/positions/position-1/nominations/stream')) return Promise.resolve(response({}, 404));
      return Promise.resolve(response({}, 404));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Director' }));
    await waitForPositionHydration();
    expect(within(screen.getByRole('region', { name: 'Position workflow progress' })).getByRole('listitem', { current: 'step' })).toHaveTextContent('Collect and review nominations');
    const firstOpenList = screen.getByRole('list', { name: 'Submitted nomination names' });
    expect(Array.from(firstOpenList.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual(['Morgan Diaz', 'Riley Chen']);
    expect(within(firstOpenList).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(firstOpenList).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    const presentationCard = screen.getByRole('article', { name: 'Audience presentation' });
    expect(within(presentationCard).getByRole('switch', { name: 'Show audience presentation' })).toBeEnabled();
    expect(within(presentationCard).getByText('When shown, incoming names appear on the room presentation only.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Election access' })).toContainElement(presentationCard);

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: 'Grace Church' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Director' }));

    expect(await screen.findByRole('region', { name: 'Open nomination intake' })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Position workflow progress' })).getByRole('listitem', { current: 'step' })).toHaveTextContent('Collect and review nominations');
    const reopenedOpenList = screen.getByRole('list', { name: 'Submitted nomination names' });
    expect(Array.from(reopenedOpenList.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual(['Morgan Diaz', 'Riley Chen']);
    expect(within(reopenedOpenList).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(reopenedOpenList).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Audience presentation' })).getByRole('switch', { name: 'Show audience presentation' })).toBeEnabled();
    expect(within(screen.getByRole('region', { name: 'Open nomination intake' }).querySelector('.intake-collection-metrics') as HTMLElement).getByText('2')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open nomination intake' })).not.toBeInTheDocument();
  });

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
    fireEvent.click(screen.getAllByRole('button', { name: 'Open election' })[0]);
    expect(await screen.findByRole('heading', { name: 'Elections 2026' })).toBeInTheDocument();
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
    await screen.findByRole('heading', { name: 'Elections 2026' });

    expect(screen.getByRole('list', { name: 'Finance positions' })).toHaveTextContent('Director1 openingStart nominations');
    expect(screen.getByRole('list', { name: 'Finance positions' })).toHaveTextContent('Treasurer2 openingsContinue election');

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

    expect(await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent(/Grace Church\s*\/\s*Elections 2026\s*\/\s*Finance\s*-\s*Director/);
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Election positions' })).not.toBeInTheDocument();
    expect(screen.queryByText('Next action: Set up nominations')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete position|Previous position|Next position/ })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:8080/api/elections/election-1');
  });

  it('shows direct nomination setup after the current intake is confirmed absent', async () => {
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockResolvedValueOnce(response(election)).mockResolvedValueOnce(response({}, 404));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));

    expect(await screen.findByRole('heading', { name: 'Director' })).toBeInTheDocument();
    await waitForPositionHydration();
    expect(screen.getByRole('heading', { name: 'Nomination intake' })).toBeInTheDocument();
    const workflowTask = screen.getByRole('region', { name: 'Position workflow progress' });
    expect(within(workflowTask).getByText('Position workflow')).toBeInTheDocument();
    expect(within(workflowTask).getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    expect(within(workflowTask).getByText('Set the name limit and create an intake link for this position.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit election' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Manage nominations' })).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent(/Grace Church\s*\/\s*Elections 2026\s*\/\s*Finance\s*-\s*Director/);
    const accessCards = screen.getByRole('region', { name: 'Election access' });
    expect(within(accessCards).getByRole('heading', { name: 'Participant session link' })).toBeInTheDocument();
    expect(within(accessCards).getByRole('heading', { name: 'Audience presentation' })).toBeInTheDocument();
    expect(within(accessCards).getByText(/A participant session link is not available until its phase opens/)).toBeInTheDocument();
    expect(within(accessCards).getByRole('switch', { name: 'Show audience presentation' })).toBeDisabled();
    expect(within(accessCards).getByRole('button', { name: 'Open presentation' })).toBeDisabled();
    expect(within(workflowTask).queryByText('Not open')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create intake' })).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum names per visitor')).toBeInTheDocument();
    const intakeSetup = screen.getByRole('region', { name: 'Nomination intake setup' });
    expect(within(intakeSetup).getByRole('heading', { name: 'Nomination intake' })).toBeInTheDocument();
    expect(within(intakeSetup).getByRole('heading', { name: 'Names not yet submitted' })).toBeInTheDocument();
    expect(within(intakeSetup).getByText('No candidates yet.')).toBeInTheDocument();
    expect(within(intakeSetup).getByText('1 opening')).toBeInTheDocument();
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
    expect(within(progress).getAllByRole('listitem')[0]).toHaveClass('is-current');
    expect(within(progress).getAllByRole('listitem')[1]).toHaveClass('is-upcoming');
    expect(document.querySelector('.intake-create')).toContainElement(screen.getByRole('button', { name: 'Create intake' }));
    expect(progress.contains(accessCards)).toBe(false);
    const workflowCard = document.querySelector('.workflow-stage-group');
    expect(workflowCard?.contains(screen.getByRole('complementary', { name: 'Names not yet submitted' }))).toBe(true);
    expect(within(accessCards).getAllByRole('article')).toHaveLength(2);
    expect(within(accessCards).getByRole('article', { name: 'Participant session link' })).toBeInTheDocument();
    expect(document.querySelector('.workflow-presentation-control')).toBeNull();
  });

  it('does not repeat the active voting state in a separate status badge', async () => {
    const activeElection = {
      ...election,
      positions: [{ ...election.positions[0], progressStatus: 'ROUND_ACTIVE' }],
    };
    const fetchMock = signedInFetch([church], [election]);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fetchMock.mockResolvedValueOnce(response(activeElection));
    fetchMock.mockResolvedValueOnce(response({}, 404));
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));

    const workflow = await screen.findByRole('region', { name: 'Position workflow progress' });
    expect(within(workflow).getByText('Track participation and review live aggregate totals.')).toBeInTheDocument();
    expect(within(workflow).queryByText('Voting open')).not.toBeInTheDocument();
    expect(within(workflow).getByRole('listitem', { current: 'step' })).toHaveTextContent('Voting rounds');
  });

  it('shows static demo terms and keeps all API elections visible under the selected term', async () => {
    const fetchMock = signedInFetch([church], [election]);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn('admin@example.com', 'secret', false);

    expect(await screen.findByRole('heading', { name: 'Administrator Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Sample terms for this visual prototype. Terms are not stored by the election API.')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(/Grace Church\s*\/\s*Election terms/);
    vi.stubGlobal('alert', vi.fn());
    fireEvent.click(screen.getByRole('button', { name: 'Add period' }));
    expect(window.alert).toHaveBeenCalledWith('Prototype only: add election period');
    expect(screen.getByText('Elections 2026')).toBeInTheDocument();
    expect(screen.getByText('Elections 2027')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Annual Boards' })).not.toBeInTheDocument();
    expect(screen.queryByText('Finance')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Open election' })[1]);

    expect(await screen.findByRole('heading', { name: 'Elections 2027' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Selected election term breadcrumb' })).toHaveTextContent(/Grace Church\s*\/\s*Elections 2027/);
    expect(screen.queryByRole('navigation', { name: 'Church workspace' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configure Positions' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Position status summary' })).not.toBeInTheDocument();
    expect(screen.getByText(/Live election rows below are shown under this demo term/)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Department elections' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finance.*2 positions.*Edit/ })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Expand positions' })).toHaveLength(1);
    expect(document.getElementById('election-panel-election-1')).not.toHaveClass('show');
    expect(screen.getByRole('heading', { name: 'Participant session link' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Audience presentation' })).toBeInTheDocument();
    expect(screen.queryByText('DEMO LINK · NOT ACTIVE')).not.toBeInTheDocument();
    const sampleAccess = screen.getByRole('region', { name: 'Sample links, display only' });
    expect(within(sampleAccess).getByRole('button', { name: 'Copy session link' })).toBeDisabled();
    expect(within(sampleAccess).getByRole('switch', { name: 'Show audience presentation' })).toBeChecked();
    expect(within(sampleAccess).getByRole('button', { name: 'Open presentation' })).toBeDisabled();
    fireEvent.click(within(sampleAccess).getByRole('switch', { name: 'Show audience presentation' }));
    expect(within(sampleAccess).getByText('Presentation display is off')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Grace Church' }));
    expect(await screen.findByRole('heading', { name: 'Administrator Workspace' })).toBeInTheDocument();
    expect(fetchMock.mock.calls.filter(([url]) => url === 'http://localhost:8080/api/elections')).toHaveLength(1);
  });

  it('uses prototype labels and primary continue action for a selected-term election in progress', async () => {
    const activeElection = {
      ...election,
      status: 'IN_PROGRESS' as const,
      positions: [{ ...election.positions[0], progressStatus: 'ROUND_ACTIVE' }],
    };
    const fetchMock = signedInFetch([church], [activeElection]);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();

    const electionHeader = screen.getByRole('button', { name: /Finance, 1 position, Edit/ });
    expect(electionHeader).toBeInTheDocument();
    const editStatus = screen.getByText('Edit', { selector: '.selected-term-election-edit' });
    expect(editStatus.parentElement).toHaveClass('election-accordion-header');
    expect(electionHeader).not.toContainElement(editStatus);
    expect(editStatus.nextElementSibling).toHaveClass('selected-term-election-arrow');
    const positionList = screen.getByRole('list', { name: 'Finance positions' });
    expect(positionList).toHaveTextContent('Treasurer2 openingsContinue election');
    expect(within(positionList).queryByText('In progress')).not.toBeInTheDocument();
    expect(within(positionList).getByRole('button', { name: 'Continue election: Treasurer' })).toHaveClass('position-overview-action-primary');
  });

  it('collapses and expands position groups with the Bootstrap accordion control', async () => {
    vi.stubGlobal('fetch', signedInFetch([church], [election]));

    render(<App />);
    await signIn();

    const accordionToggle = screen.getByRole('button', { name: 'Expand positions' });
    const accordionPanel = document.getElementById('election-panel-election-1');
    expect(accordionToggle).toHaveAttribute('aria-expanded', 'false');
    expect(accordionPanel).not.toHaveClass('show');
    fireEvent.click(accordionToggle);
    expect(screen.getByRole('button', { name: 'Collapse positions' })).toHaveAttribute('aria-expanded', 'true');
    expect(accordionPanel).toHaveClass('show');
    fireEvent.click(accordionToggle);
    expect(screen.getByRole('button', { name: 'Expand positions' })).toHaveAttribute('aria-expanded', 'false');
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
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));

    expect(await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' })).toHaveTextContent('Treasurer');
    expect(screen.getByRole('heading', { name: 'Treasurer' })).toBeInTheDocument();
  });

  it('shows zeroed overview and an empty state when no elections exist', async () => {
    vi.stubGlobal('fetch', signedInFetch([church], []));

    render(<App />);
    await signIn();

    expect(await screen.findByRole('heading', { name: 'No elections configured' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Position status summary' })).not.toBeInTheDocument();
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

    const positionList = await screen.findByRole('list', { name: 'Finance positions' });
    expect(positionList).toHaveTextContent('Action unavailable');
    expect(positionList.querySelector('.position-overview-status')).toBeNull();
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
    ['NOT_STARTED', 'Start nominations'],
    ['NOMINATIONS_OPEN', 'Continue election'],
    ['NOMINATIONS_CLOSED', 'Continue election'],
    ['CONSOLIDATED', 'Continue election'],
    ['ROUND_DRAFT', 'Continue election'],
    ['ROUND_ACTIVE', 'Continue election'],
    ['ROUND_CLOSED_UNREVEALED', 'Continue election'],
    ['RESULTS_REVEALED', 'Continue election'],
    ['CANDIDATES_ADVANCED', 'Continue election'],
    ['COMPLETE', 'Review results'],
  ])('shows %s with its workflow entry action', async (progressStatus, expectedAction) => {
    const progressElection = {
      ...election,
      positions: [{ ...election.positions[1], openingCount: 2, progressStatus, roundNumber: progressStatus.startsWith('ROUND_') || progressStatus === 'RESULTS_REVEALED' || progressStatus === 'CANDIDATES_ADVANCED' ? 2 : null }],
    };
    const fetchMock = signedInFetch([church], [progressElection]);
    fetchMock.mockResolvedValueOnce(response(progressElection));
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    const row = screen.getByRole('listitem');
    expect(within(row).queryByText(/^(Not started|In progress|Complete)$/)).not.toBeInTheDocument();
    const actionButton = within(row).getByRole('button', { name: `${expectedAction}: Director` });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent(expectedAction);
    expect(actionButton).not.toHaveTextContent('→');
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
    await waitForPositionHydration();
    const nameLimit = await screen.findByLabelText('Maximum names per visitor');
    const workflowCard = document.querySelector('.workflow-stage-group');
    expect(workflowCard).toContainElement(nameLimit.closest('form'));
    expect(document.querySelector('.position-workflow-main')).not.toContainElement(nameLimit.closest('form'));
    fireEvent.change(nameLimit, { target: { value: '4' } });
    await waitFor(() => expect(nameLimit).toHaveValue(4));
    fireEvent.blur(nameLimit);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Grace Church' })).toBeInTheDocument());

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: 'Grace Church' }));
    expect(await screen.findByRole('dialog', { name: 'Unsaved changes' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Stay on this position' }));
    expect(screen.queryByRole('dialog', { name: 'Unsaved changes' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Director' })).toBeInTheDocument();

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: 'Grace Church' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes and continue' }));
    expect(await screen.findByRole('heading', { name: 'Elections 2026' })).toBeInTheDocument();
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
      expect(electionRow).not.toHaveTextContent('Edit');
      expect(screen.getByText('Edit', { selector: '.selected-term-election-edit' })).toBeInTheDocument();
    } else if (status === 'IN_PROGRESS') {
      expect(await screen.findByRole('button', { name: /Operations, 2 positions, Edit/ })).not.toHaveTextContent('Edit');
      expect(screen.getByText('Edit', { selector: '.selected-term-election-edit' })).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));
    await waitForPositionHydration();
    fireEvent.click(await screen.findByRole('button', { name: 'Create intake' }));

    expect(await screen.findByRole('region', { name: 'Open nomination intake' })).toContainElement(await screen.findByRole('heading', { name: 'Nomination intake is open' }));
    expect(screen.getByRole('button', { name: 'Copy nomination link' })).toBeEnabled();
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: 'Grace Church' }));
    expect(await screen.findByRole('heading', { name: 'Elections 2026' })).toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Position status summary' })).not.toBeInTheDocument();
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
    let electionRequestCount = 0;
    fetchMock.mockImplementation((input) => {
      const requestUrl = String(input);
      if (requestUrl.endsWith('/api/elections')) return Promise.resolve(response([progressedElection]));
      if (requestUrl.endsWith('/api/elections/election-1')) {
        electionRequestCount += 1;
        return electionRequestCount === 2 ? staleStatusResponse : Promise.resolve(response(election));
      }
      if (requestUrl.endsWith('/positions/position-1/nominations')) return Promise.resolve(response({}, 404));
      return Promise.resolve(response({}, 404));
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    await screen.findByRole('navigation', { name: 'Election workflow breadcrumb' });
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: 'Grace Church' }));
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
    await screen.findByRole('heading', { name: 'Elections 2026' });
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
    await screen.findByRole('heading', { name: 'Elections 2026' });
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
    await screen.findByRole('heading', { name: 'Elections 2026' });
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));
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
    expect(screen.getByRole('heading', { name: 'Elections 2026' })).toBeInTheDocument();
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
      revealed: false,
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
    const advancedBothResults = {
      ...decidedResults,
      candidates: [
        decidedResults.candidates[0],
        { ...revealedResults.candidates[1], decision: 'ADVANCED', decisionReason: null, decisionAt: '2026-10-19T12:15:01Z', decisionBy: 'admin@example.com' },
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
      response({}, 500), response(createdDraft, 201), response(updatedDraft), response({}, 500), response(activeRound),
      response({}, 404), response(revealedResults), response(decidedResults), response(advancedBothResults),
      response(undoneResults), response(electedResults),
      response({ id: 'round-2', roundNumber: 2, status: 'DRAFT', selectionCount: 1, candidates: [{ id: 'candidate-1-round-2', name: 'Riley Chen', sequence: 1 }, { id: 'candidate-2-round-2', name: 'Morgan Diaz', sequence: 2 }] }, 201),
      response(electedResults), response(activeRound),
    ];
    let workflowResponseIndex = 0;
    let progressPollCount = 0;
    const viewerLocation = { assign: vi.fn() };
    const viewerWindow = { location: viewerLocation, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(viewerWindow as unknown as Window);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      const requestPath = requestUrl.replace('http://localhost:8080', '');
      const requestMethod = options?.method ?? 'GET';
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
      if (String(url).endsWith('/round-1/aggregate-results')) {
        return response({
          expectedVoterCount: 16,
          ballotsCast: progressPollCount === 2 ? 9 : 7,
          majorityThreshold: 8,
          candidates: [
            { id: 'candidate-1', name: 'Riley Chen', votes: progressPollCount === 2 ? 9 : 7 },
            { id: 'candidate-2', name: 'Morgan Diaz Jr.', votes: 6 },
          ],
        });
      }
      if (requestPath.endsWith('/positions/position-1/rounds') && requestMethod === 'POST') {
        const requestedNames = JSON.parse(String(options?.body ?? '{}')).candidateNames as string[];
        if (requestedNames[0] === 'Riley Chen' && requestedNames[1] === 'Morgan Diaz') {
          return response({ id: 'round-2', roundNumber: 2, status: 'DRAFT', selectionCount: 1, candidates: [
            { id: 'candidate-1-round-2', name: 'Riley Chen', sequence: 1 },
            { id: 'candidate-2-round-2', name: 'Morgan Diaz', sequence: 2 },
          ] }, 201);
        }
      }
      if (requestPath.endsWith('/rounds/round-2/start') && requestMethod === 'POST') {
        return response({ id: 'round-2', roundNumber: 2, status: 'ACTIVE', selectionCount: 1, expectedVoterCount: 16, accessToken: 'round-2-token', candidates: [
          { id: 'candidate-1-round-2', name: 'Riley Chen', sequence: 1 },
          { id: 'candidate-2-round-2', name: 'Morgan Diaz Jr.', sequence: 2 },
        ] });
      }
      if (requestPath.endsWith('/round-2/progress')) return response({ roundId: 'round-2', status: 'ACTIVE', ballotsCast: 0, expectedVoterCount: 16 });
      if (requestPath.endsWith('/round-2/aggregate-results')) return response({ expectedVoterCount: 16, ballotsCast: 0, majorityThreshold: 9, candidates: [
        { id: 'candidate-1-round-2', name: 'Riley Chen', votes: 0 },
        { id: 'candidate-2-round-2', name: 'Morgan Diaz Jr.', votes: 0 },
      ] });
      if (String(url).endsWith('/round-1/results')) return response(revealedResults);
      if (requestPath.endsWith('/round-1/candidates/candidate-1/decision')) return response(decidedResults);
      if (requestPath.endsWith('/round-1/candidates/candidate-2/decision')) return response(advancedBothResults);
      if (requestPath.endsWith('/nominations/stream')) {
        return eventStreamResponse([`event: intake\ndata: ${JSON.stringify(intakeState)}\n\n`]);
      }
      if (requestPath.endsWith('/nominations/close')) {
        intakeState = { ...closedIntake, listCreated: true };
        return response(intakeState);
      }
      if (requestPath.endsWith('/nominations/reveal')) {
        intakeState = { ...savedSharedList, revealed: true };
        return response(intakeState);
      }
      if (requestPath.endsWith('/nominations/presentation') && requestMethod === 'POST') {
        return response({ accessToken: 'presentation-token', viewerPath: '/api/nomination-presentations/presentation-token', visible: true });
      }
      if (requestPath.endsWith('/nominations/presentation/hide') && requestMethod === 'POST') return response(null);
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
    await waitForPositionHydration();
    fireEvent.change(await screen.findByLabelText('Maximum names per visitor'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create intake' }));

    expect(await screen.findByRole('region', { name: 'Open nomination intake' })).toContainElement(await screen.findByRole('heading', { name: 'Nomination intake is open' }));
    const participantCard = screen.getByRole('article', { name: 'Participant session link' });
    expect(participantCard.querySelectorAll('code')).toHaveLength(1);
    expect(participantCard.querySelector('code')).toHaveTextContent('/nominate/share-token');
    expect(within(participantCard).queryByText('Nomination link', { selector: 'strong' })).not.toBeInTheDocument();
    expect(screen.getByText('Anyone with this position-specific link can submit or revise names while intake is open.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Public nomination link')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy nomination link' })).toBeEnabled();
    expect(screen.queryByText('Sam Lee')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Submitted names' })).not.toBeInTheDocument();
    expect(screen.getByText('profile submissions')).toBeInTheDocument();
    expect(screen.getByText('profile submissions')).toBeInTheDocument();
    expect(screen.getByText('names allowed per profile')).toBeInTheDocument();
    const intakeView = screen.getByRole('region', { name: 'Open nomination intake' });
    const activeStage = document.querySelector('.workflow-stage-group.is-intake-open');
    expect(activeStage).not.toBeNull();
    expect(activeStage?.querySelector('.guided-workflow')).toBeInTheDocument();
    expect(activeStage?.querySelector('.intake-collection-view')).toBeInTheDocument();
    expect(activeStage?.querySelector('.workflow-presentation-control')).toBeNull();
    const presentationCard = screen.getByRole('article', { name: 'Audience presentation' });
    expect(within(presentationCard).getByRole('switch', { name: 'Show audience presentation' })).toBeEnabled();
    expect(within(presentationCard).getByText('When shown, incoming names appear on the room presentation only.')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Names not yet submitted' })).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Current election access shortcuts' })).not.toBeInTheDocument();
    expect(within(intakeView).queryByRole('button', { name: 'Broadcast list' })).not.toBeInTheDocument();
    expect(within(presentationCard).getByRole('button', { name: 'Open presentation' })).toBeEnabled();
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

    fireEvent.click(screen.getByRole('button', { name: 'Close nomination intake' }));
    expect(screen.getByRole('dialog', { name: 'Close nominations?' })).toHaveTextContent('You can review and consolidate submitted names before confirming the list.');
    expect(screen.getByRole('button', { name: 'Keep intake open' })).toHaveFocus();
    fireEvent.click(within(screen.getByRole('dialog', { name: 'Close nominations?' })).getByRole('button', { name: 'Close nominations' }));
    expect(await screen.findByRole('region', { name: 'Closed nomination review' })).toHaveTextContent('2 current profile submissions');
    expect(within(screen.getByRole('region', { name: 'Position workflow progress' })).getByText('Review proposed names, correct spellings, remove duplicates, then confirm the consolidated list.')).toBeInTheDocument();
    expect(document.querySelector('.position-workflow-grid')).toHaveClass('is-intake-closed');
    expect(screen.queryByRole('complementary', { name: 'People on the ballot' })).not.toBeInTheDocument();
    const closedStatus = screen.getByText('Nominations are closed. Review and consolidate the names, then confirm the list.');
    expect(closedStatus).toHaveTextContent('Nominations are closed. Review and consolidate the names, then confirm the list.');
    expect(closedStatus).toHaveFocus();
    expect(screen.queryByRole('heading', { name: 'Manage nomination list' })).not.toBeInTheDocument();
    const closedSharedList = screen.getByRole('list', { name: 'Shared nomination list' });
    expect(within(closedSharedList).getByLabelText('Correct Morgan Diaz')).toHaveValue('Morgan Diaz');
    expect(within(closedSharedList).getByLabelText('Correct Riley Chen')).toHaveValue('Riley Chen');
    expect(screen.queryByRole('list', { name: 'Submitted names' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/rounds'))).toBe(true);
    expect(within(screen.getByRole('region', { name: 'Position workflow progress' })).getByText('Review proposed names, correct spellings, remove duplicates, then confirm the consolidated list.')).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Shared nomination list' })).toBeInTheDocument();
    const sharedList = screen.getByRole('list', { name: 'Shared nomination list' });
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
    fireEvent.click(screen.getByRole('button', { name: 'Confirm consolidated list' }));
    expect(await screen.findByRole('list', { name: 'Confirmed consolidated list' })).toHaveTextContent('Morgan Diaz Jr.');
    expect(await screen.findByRole('button', { name: 'Prepare round 1' })).toBeInTheDocument();
    expect(viewerLocation.assign).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Prepare round 1' }));
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toHaveFocus();
    expect(document.querySelector('.workflow-stage-group')).toHaveClass('is-intake-closed', 'is-round-setup-primary');
    expect(document.querySelector('.voting-round-configuration')).toHaveClass('is-first-round-setup');
    expect(screen.getByRole('list', { name: 'Confirmed consolidated list' })).toHaveTextContent('Morgan Diaz Jr.');
    expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Morgan Diaz Jr.Riley Chen');
    expect(screen.queryByRole('button', { name: 'Prepare round 1' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Voting' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Round 1 setup' }).closest('.voting-round-configuration')).toHaveClass('is-first-round-setup');
    const closeRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/close'));
    const revealRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/reveal'));
    const presentationRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/nominations/presentation') && options?.method === 'POST');
    const sharedListRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/shared-list'));
    expect(closeRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/close');
    expect(closeRequest?.[1].method).toBe('POST');
    expect(revealRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/reveal');
    expect(revealRequest?.[1].method).toBe('POST');
    expect(presentationRequest).toBeUndefined();
    expect(viewerLocation.assign).not.toHaveBeenCalled();
    const revealedPresentationCard = screen.getByRole('article', { name: 'Audience presentation' });
    const presentationSwitch = within(revealedPresentationCard).getByRole('switch', { name: 'Show audience presentation' });
    expect(presentationSwitch).not.toBeChecked();
    fireEvent.click(presentationSwitch);
    expect(await within(revealedPresentationCard).findByText('Presentation display is on')).toBeInTheDocument();
    expect(presentationSwitch).toBeChecked();
    fireEvent.click(presentationSwitch);
    expect(await within(revealedPresentationCard).findByText('Presentation display is off')).toBeInTheDocument();
    const hidePresentationRequest = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/nominations/presentation/hide'));
    expect(hidePresentationRequest?.[1].method).toBe('POST');
    expect(sharedListRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/shared-list');
    expect(sharedListRequest?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ expectedRevision: 1, entries: [
        { id: 'shared-1', name: 'Morgan Diaz Jr.', sequence: 1, active: true },
        { id: 'shared-2', name: 'Riley Chen', sequence: 2, active: true },
      ], removals: [] }),
    });

    expect(await screen.findByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'People on the ballot' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Round 1 candidate roster' })).not.toBeInTheDocument();
    const roundListRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/positions/position-1/rounds') && options?.method === 'GET');
    expect(roundListRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(roundListRequest?.[1].method).toBe('GET');
    expect(screen.getByLabelText('How many candidates can each ballot select?')).toHaveValue(2);
            expect(screen.queryByText('Candidates for this round')).not.toBeInTheDocument();
            expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Morgan Diaz Jr.Riley Chen');
    fireEvent.change(screen.getByLabelText('How many candidates can each ballot select?'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Voting' }));

    expect(await screen.findByText('The request failed (HTTP 500).', { selector: '[role="alert"]' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Morgan Diaz Jr.Riley Chen');
    expect(screen.getByLabelText('How many candidates can each ballot select?')).toHaveValue(1);
    expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Voting' })).toBeEnabled();
    fireEvent.change(screen.getByLabelText('How many candidates can each ballot select?'), { target: { value: '2' } });
    fireEvent.click(screen.getByRole('button', { name: 'Start Voting' }));
    expect(await screen.findByRole('dialog', { name: 'Start voting for round 1?' })).toBeInTheDocument();
    const createRoundRequests = fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/positions/position-1/rounds') && options?.method === 'POST');
    expect(createRoundRequests[0]?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(createRoundRequests[0]?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ candidateNames: ['Morgan Diaz Jr.', 'Riley Chen'], selectionCount: 1 }) });
    expect(createRoundRequests[1]?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(createRoundRequests[1]?.[1]).toMatchObject({
      method: 'POST',
      body: JSON.stringify({ candidateNames: ['Morgan Diaz Jr.', 'Riley Chen'], selectionCount: 2 }),
    });
              expect(screen.getByRole('button', { name: 'Start Voting' })).toBeEnabled();
              expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('How many candidates can each ballot select?'), { target: { value: '1' } });
              fireEvent.click(screen.getByRole('button', { name: 'Start Voting' }));
              expect(await screen.findByRole('dialog', { name: 'Start voting for round 1?' })).toBeInTheDocument();
              expect(screen.getByLabelText('How many candidates can each ballot select?')).toHaveValue(1);
    const updateRoundRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/rounds/round-1') && options?.method === 'PUT');
    expect(updateRoundRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1');
    expect(updateRoundRequest?.[1]).toMatchObject({
      method: 'PUT',
      body: JSON.stringify({ candidateNames: ['Morgan Diaz Jr.', 'Riley Chen'], selectionCount: 1 }),
    });

    expect(screen.getByRole('dialog', { name: 'Start voting for round 1?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Expected voter count')).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(screen.getByRole('button', { name: 'Confirm and start' })).toHaveFocus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(screen.getByLabelText('Expected voter count')).toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    expect(screen.getByLabelText('How many candidates can each ballot select?')).toHaveValue(1);
    expect(screen.getByRole('button', { name: 'Start Voting' })).toHaveFocus();

    fireEvent.click(screen.getByRole('button', { name: 'Start Voting' }));
    const expectedVoterInput = screen.getByLabelText('Expected voter count');
    fireEvent.change(expectedVoterInput, { target: { value: '16' } });
    expect(screen.queryByText(/automatically close after/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and start' }));
    expect(await within(screen.getByRole('dialog', { name: 'Start voting for round 1?' })).findByRole('alert')).toHaveTextContent('The request failed (HTTP 500).');
    expect(screen.getByLabelText('Expected voter count')).toHaveValue(16);
    expect(screen.getByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and start' }));
    const startRoundRequest = fetchMock.mock.calls.find(([url, options]) => String(url).endsWith('/rounds/round-1/start') && options?.method === 'POST');
    expect(startRoundRequest?.[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/start');
    expect(startRoundRequest?.[1]).toMatchObject({ method: 'POST', body: JSON.stringify({ expectedVoterCount: 16 }) });
    expect(await screen.findByRole('heading', { name: 'Voting is active' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Closed nomination review' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Voting rounds' })).not.toBeInTheDocument();
    expect(await screen.findByText('7 of 16 profile/link submissions')).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();
    const progressMessage = screen.getByText('7 of 16 profile/link submissions').parentElement;
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
    expect(screen.queryByText('9 of 16 profile/link submissions')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reveal results' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/round-1/results'))).toBe(true);
    intervalSpy.mockRestore();
    expect(screen.queryByText(/Draft round 1:/)).not.toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Mark at least two candidates Advanced in the closed round to continue.')).toBeInTheDocument();
    expect(screen.queryByLabelText('How many names can each ballot select?')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save round setup' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Round 1 · Candidate decisions' })).toBeInTheDocument();
    const roundOneDecisions = screen.getByRole('region', { name: 'Round 1 candidate decisions' });
    expect(roundOneDecisions).toBeInTheDocument();
    expect(document.querySelector('.position-workflow-main')).toContainElement(roundOneDecisions);
    expect(screen.queryByText('Voting round configuration', { selector: 'h3' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Public voting link')).not.toBeInTheDocument();
    const currentRoundDecisions = screen.getByRole('region', { name: 'Round 1 candidate decisions' });

    expect(screen.queryByLabelText('How many names can each ballot select?')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save round setup' })).not.toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Mark at least two candidates Advanced in the closed round to continue.')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Round 1 candidate decisions' })).toBeInTheDocument();
    expect(document.querySelector('#round-round-1.round-details')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reveal results' })).not.toBeInTheDocument();
    expect(within(currentRoundDecisions).getAllByText('9 votes · 60%')).toHaveLength(1);
    expect(within(currentRoundDecisions).getAllByText('6 votes · 40%')).toHaveLength(1);
    expect(within(currentRoundDecisions).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('No candidates are ready for the next round. Mark at least two candidates Advanced in the closed round to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save round setup' })).not.toBeInTheDocument();
    expect(within(currentRoundDecisions).getByRole('group', { name: 'Decision for Riley Chen' })).toBeInTheDocument();
    expect(within(currentRoundDecisions).getByRole('group', { name: 'Decision for Morgan Diaz' })).toBeInTheDocument();
    expect(within(currentRoundDecisions).getAllByText('9 votes · 60%')).toHaveLength(1);
    expect(within(currentRoundDecisions).getAllByText('6 votes · 40%')).toHaveLength(1);
    expect(screen.getByText('No candidates are ready for the next round. Mark at least two candidates Advanced in the closed round to continue.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save round setup' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Riley Chen')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Morgan Diaz')).not.toBeInTheDocument();
    expect(screen.queryByText(/voter identity|device token|ballot identity/i)).not.toBeInTheDocument();
        const rileyDecision = screen.getByRole('group', { name: 'Decision for Riley Chen' });
        const morganDecision = screen.getByRole('group', { name: 'Decision for Morgan Diaz' });
        expect(within(rileyDecision).getByRole('button', { name: 'Elect', pressed: false })).toBeInTheDocument();
        expect(within(rileyDecision).getByRole('button', { name: 'Advance', pressed: false })).toBeInTheDocument();
        expect(within(rileyDecision).getByRole('button', { name: 'Eliminate', pressed: false })).toBeInTheDocument();
        fireEvent.click(within(rileyDecision).getByRole('button', { name: 'Advance' }));
        fireEvent.click(within(morganDecision).getByRole('button', { name: 'Advance' }));
        fireEvent.click(screen.getByRole('button', { name: 'Save decisions' }));
        expect(await screen.findByText('Candidate decisions saved.')).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Round 1 candidate decisions' })).not.toBeInTheDocument();
        expect(screen.getByText('Review the candidates marked Advance and configure the next round.')).toBeInTheDocument();
        expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Riley Chen');
        expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Morgan Diaz');
        expect(screen.getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Riley ChenMorgan Diaz');
        expect(screen.queryByRole('region', { name: 'Round 1 candidate decisions' })).not.toBeInTheDocument();
        expect(screen.queryByText('Candidate decisions saved.')).not.toBeInTheDocument();
        const nextRoundReview = screen.getByRole('region', { name: 'Round 2 candidate review' });
        expect(within(nextRoundReview).getByRole('list', { name: 'Candidates advancing to this round' })).toHaveTextContent('Riley ChenMorgan Diaz');
        expect(within(nextRoundReview).getByRole('button', { name: 'Edit list' })).toBeInTheDocument();
        expect(within(nextRoundReview).getByRole('button', { name: 'Prepare round 2' })).toBeInTheDocument();
        expect(screen.queryByLabelText('How many candidates can each ballot select?')).not.toBeInTheDocument();
        fireEvent.click(within(nextRoundReview).getByRole('button', { name: 'Edit list' }));
        expect(within(nextRoundReview).getByRole('list', { name: 'Edit advancing candidates' })).toBeInTheDocument();
        expect(within(nextRoundReview).getByRole('button', { name: 'Save list' })).toBeInTheDocument();
        fireEvent.click(within(nextRoundReview).getByRole('button', { name: 'Save list' }));
        expect(screen.getByRole('region', { name: 'Round 2 candidate review' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Prepare round 2' }));
        expect(screen.getByRole('heading', { name: 'Round 2 setup' })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Round 2 candidate review' })).not.toBeInTheDocument();
        expect(screen.getByLabelText('How many candidates can each ballot select?')).toHaveValue(2);
        expect(screen.getByRole('button', { name: 'Save round setup' })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Closed nomination review' })).not.toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('How many names can each ballot select?'), { target: { value: '1' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save round setup' }));
        expect(await screen.findByRole('button', { name: 'Start voting' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Start voting' }));
        expect(await screen.findByRole('dialog', { name: 'Start voting for round 2?' })).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Expected voter count'), { target: { value: '16' } });
        fireEvent.click(screen.getByRole('button', { name: 'Confirm and start' }));
        expect(await screen.findByRole('region', { name: 'Round 2 active voting' })).toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Round 1 candidate decisions' })).not.toBeInTheDocument();
        expect(screen.queryByRole('region', { name: 'Closed nomination review' })).not.toBeInTheDocument();
        expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Voting is active' })).toBeInTheDocument();
        expect(fetchMock.mock.calls.filter(([url, options]) => String(url).endsWith('/rounds') && options?.method === 'POST')).toHaveLength(3);
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
    await waitForPositionHydration();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit consolidated list' }));
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
    await waitForPositionHydration();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit consolidated list' }));
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
    await waitForPositionHydration();

    const restoreButton = await screen.findByRole('button', { name: 'Restore Riley Chen' });
    await waitFor(() => expect(restoreButton).toBeEnabled());
    fireEvent.click(restoreButton);

    expect(await screen.findByRole('heading', { name: 'Voting is active' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Restore Riley Chen' })).not.toBeInTheDocument();
    expect(screen.queryByText('The closed intake is read-only while voting is active. This name cannot be restored until the round closes.')).not.toBeInTheDocument();
    expect(roundsReads).toBe(2);
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).endsWith('/nominations/shared-list/restore') && options?.method === 'POST')).toBe(false);
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
    await waitForPositionHydration();
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
    await waitForPositionHydration();
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

  it('reloads a round 1 draft into focused setup and cancels back to the confirmed list', async () => {
    const revealedIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'CLOSED', listCreated: true, revealed: true,
      currentContributorCount: 2, sharedListRevision: 4, submissions: [], consolidatedNames: ['Riley Chen', 'Morgan Diaz'],
      sharedList: [
        { id: 'shared-1', name: 'Riley Chen', sequence: 1, active: true },
        { id: 'shared-2', name: 'Morgan Diaz', sequence: 2, active: true },
      ], removedEntries: [], changeEvents: [],
    };
    const draft = {
      id: 'round-1', roundNumber: 1, status: 'DRAFT', selectionCount: 1, nominationRevision: 4,
      candidates: [
        { id: 'candidate-1', name: 'Riley Chen', sequence: 1 },
        { id: 'candidate-2', name: 'Morgan Diaz', sequence: 2 },
      ],
    };
    const fetchMock = signedInFetch([church], [election]);
    fetchMock.mockImplementation(async (url, options) => {
      const requestUrl = String(url);
      if (requestUrl === 'http://localhost:8080/api/auth/me') return response(account);
      if (requestUrl === 'http://localhost:8080/api/churches/my') return response([church]);
      if (requestUrl === 'http://localhost:8080/api/elections') return response([election]);
      if (requestUrl === 'http://localhost:8080/api/elections/election-1') return response(election);
      if (requestUrl.endsWith('/nominations') && options?.method === 'GET') return response(revealedIntake);
      if (requestUrl.endsWith('/nominations/stream')) return eventStreamResponse([`event: intake\ndata: ${JSON.stringify(revealedIntake)}\n\n`]);
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') return response([draft]);
      if (requestUrl.endsWith('/rounds/round-1') && options?.method === 'DELETE') return response(null);
      return response({}, 404);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: 'Continue election: Treasurer' }));

    expect(await screen.findByRole('heading', { name: 'Round 1 setup' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Candidates in this poll' })).toHaveTextContent('Riley ChenMorgan Diaz');
    expect(screen.queryByRole('list', { name: 'Confirmed consolidated list' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel and rebuild draft' }));

    expect(await screen.findByRole('button', { name: 'Prepare round 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Prepare round 1' })).toHaveFocus();
    expect(screen.getByRole('list', { name: 'Confirmed consolidated list' })).toHaveTextContent('Riley ChenMorgan Diaz');
    expect(screen.queryByRole('heading', { name: 'Round 1 setup' })).not.toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, options]) => String(url).endsWith('/rounds/round-1') && options?.method === 'DELETE')).toBe(true);
  });

  it('confirms nominations without opening a presentation tab', async () => {
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
      if (requestUrl.endsWith('/nominations/reveal')) return response({ ...closedIntake, revealed: true });
      if (requestUrl.endsWith('/rounds') && options?.method === 'GET') return response([]);
      return response({}, 404);
    });
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.stubGlobal('fetch', fetchMock);

    render(<App />);
    await signIn();
    fireEvent.click(await screen.findByRole('button', { name: /Finance/ }));
    await waitForPositionHydration();
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm consolidated list' }));

    expect(await screen.findByRole('button', { name: 'Prepare round 1' })).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'Confirmed consolidated list' })).toHaveTextContent('Riley Chen');
    expect(fetchMock.mock.calls.some(([url]) => String(url).endsWith('/nominations/reveal'))).toBe(true);
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
    await waitForPositionHydration();
    const roundOneDecisions = await screen.findByRole('region', { name: 'Round 1 candidate decisions' });
    expect(await within(roundOneDecisions).findAllByText(/Suggested: Advance\./)).toHaveLength(2);
    const resultList = within(roundOneDecisions).getByRole('list', { name: 'Aggregate candidate votes for round 1' });
    expect(Array.from(resultList.querySelectorAll('.round-result-candidate-heading strong')).map((candidate) => candidate.textContent)).toEqual([
      'Alex Kim', 'Zoe Patel', 'Morgan Diaz', 'Riley Chen',
    ]);
    const decisionGroup = within(roundOneDecisions).getByRole('group', { name: 'Decision for Alex Kim' });
    expect(within(decisionGroup).getByRole('button', { name: 'Elect' })).toBeInTheDocument();
    expect(within(decisionGroup).getByRole('button', { name: 'Advance' })).toBeInTheDocument();
    expect(within(decisionGroup).getByRole('button', { name: 'Eliminate' })).toBeInTheDocument();
    fireEvent.click(within(decisionGroup).getByRole('button', { name: 'Eliminate' }));
    expect(fetchMock.mock.calls.filter(([, options]) => options?.method === 'PUT')).toHaveLength(0);
    expect(within(roundOneDecisions).getByRole('button', { name: 'Save decisions' })).toBeInTheDocument();
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
    await waitForPositionHydration();

    expect(await screen.findByText('Nominations are closed. Review and consolidate the names, then confirm the list.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm consolidated list' })).toBeInTheDocument();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));

    expect(await screen.findByRole('region', { name: 'Election access' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Loading nomination intake');
    await act(async () => {
      resolveIntake(response({
        id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', revealed: false,
        currentContributorCount: 0, sharedListRevision: 0, submissions: [], consolidatedNames: null, sharedList: [],
      }));
    });
    expect(await screen.findByRole('region', { name: 'Open nomination intake' })).toContainElement(await screen.findByRole('heading', { name: 'Nomination intake is open' }));
    const intakeView = screen.getByRole('region', { name: 'Open nomination intake' });
    expect(intakeView.querySelector('.intake-collection-metrics')).toHaveTextContent('0');
    expect(intakeView.querySelector('.intake-collection-metrics')).toHaveTextContent('profile submissions');
    expect(intakeView.querySelector('.intake-collection-metrics')).toHaveTextContent('3');
    expect(intakeView.querySelector('.intake-collection-metrics')).toHaveTextContent('names allowed per profile');
    expect(screen.queryByRole('list', { name: 'Submitted names' })).not.toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: 'Audience presentation' })).getByRole('switch', { name: 'Show audience presentation' })).toBeEnabled();
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));
    await waitForPositionHydration();

    expect(await screen.findByRole('alert')).toHaveTextContent('Network unavailable');
    expect(screen.queryByRole('button', { name: 'Create intake' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading nominations' }));
    expect(await screen.findByRole('region', { name: 'Open nomination intake' })).toContainElement(await screen.findByRole('heading', { name: 'Nomination intake is open' }));
    expect(screen.queryByRole('button', { name: 'Create intake' })).not.toBeInTheDocument();
  });

  it('streams authenticated intake snapshots across chunks and aborts when leaving the workflow', async () => {
    const openIntake = {
      id: 'intake-1', accessToken: 'share-token', nameLimit: 3, status: 'OPEN', revealed: false,
      currentContributorCount: 1, sharedListRevision: 0,
      submissions: [{ id: 'submission-1', name: 'Riley Chen' }], consolidatedNames: null, sharedList: [],
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
    fireEvent.click(await screen.findByRole('button', { name: 'Start nominations: Director' }));
    await waitForPositionHydration();
    expect(await screen.findByRole('region', { name: 'Open nomination intake' })).toContainElement(await screen.findByRole('heading', { name: 'Nomination intake is open' }));
    expect(screen.queryByRole('list', { name: 'Submitted names' })).not.toBeInTheDocument();
    const streamedOpenNames = screen.getByRole('list', { name: 'Submitted nomination names' });
    expect(streamedOpenNames).toHaveTextContent('Riley Chen');
    expect(within(streamedOpenNames).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(streamedOpenNames).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();

    const streamRequest = fetchMock.mock.calls[5];
    expect(streamRequest[0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/nominations/stream');
    expect(streamRequest[0]).not.toContain('admin@example.com');
    expect(streamRequest[1]).toMatchObject({
      method: 'GET',
      headers: { Accept: 'text/event-stream', Authorization: `Basic ${btoa('admin@example.com:secret')}` },
    });
    expect(streamRequest[1].signal).toBeInstanceOf(AbortSignal);

    const updatedSnapshot = {
      ...openIntake,
      currentContributorCount: 2,
      submissions: [
        { id: 'submission-1', name: 'Riley Chen' },
        { id: 'submission-2', name: 'Morgan Diaz' },
      ],
    };
    const event = `event: intake\r\ndata: ${JSON.stringify(updatedSnapshot)}\r\n\r\n`;
    await act(async () => {
      streamController.enqueue(new TextEncoder().encode(event.slice(0, 17)));
      streamController.enqueue(new TextEncoder().encode(event.slice(17, 53)));
      streamController.enqueue(new TextEncoder().encode(event.slice(53)));
    });
    const updatedOpenNames = screen.getByRole('list', { name: 'Submitted nomination names' });
    expect(Array.from(updatedOpenNames.querySelectorAll('li')).map((item) => item.textContent?.trim())).toEqual(['Morgan Diaz', 'Riley Chen']);
    expect(within(updatedOpenNames).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(updatedOpenNames).queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Open nomination intake' }).querySelector('.intake-collection-metrics')).toHaveTextContent('2');
    expect(screen.queryByText(/Submissions updated:/)).not.toBeInTheDocument();

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Election workflow breadcrumb' })).getByRole('button', { name: 'Grace Church' }));
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

  it('clears a published participant list after the server hides it', async () => {
    vi.useFakeTimers();
    const published = {
      departmentName: 'Finance', positionName: 'Director', nameLimit: 3,
      intakeOpen: false, listPublished: true, submittedNames: [], publishedNames: ['Avery Chen'],
    };
    const hidden = { ...published, listPublished: false, publishedNames: [] };
    const fetchMock = vi.fn().mockResolvedValueOnce(response(published)).mockResolvedValueOnce(response(hidden));
    vi.stubGlobal('fetch', fetchMock);
    window.history.pushState({}, '', '/nominate/published-token');

    render(<App />);
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole('list', { name: 'Confirmed consolidated list' })).toHaveTextContent('Avery Chen');
    await act(async () => {
      vi.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    expect(screen.getByRole('heading', { name: 'Nominations are closed' })).toBeInTheDocument();
    expect(screen.queryByText('Avery Chen')).not.toBeInTheDocument();
    vi.useRealTimers();
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
