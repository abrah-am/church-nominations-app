import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVotingRound, getVotingRoundProgress, getVotingRoundResults, listVotingRounds, revealVotingRound, saveCandidateDecision, undoCandidateDecision, updateVotingRound } from './rounds';

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('voting rounds API', () => {
  it('loads rounds using the authenticated position collection endpoint', async () => {
    const rounds = [{ id: 'round-1', roundNumber: 1, status: 'DRAFT', selectionCount: 1, candidates: [] }];
    const fetchMock = vi.fn().mockResolvedValue(response(rounds));
    vi.stubGlobal('fetch', fetchMock);

    await expect(listVotingRounds('admin@example.com:secret', 'election/1', 'position 2')).resolves.toEqual(rounds);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election%2F1/positions/position%202/rounds');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa('admin@example.com:secret')}`,
      },
    });
  });

  it('creates and updates rounds with the approved configuration body', async () => {
    const draft = { id: 'round-1', roundNumber: 1, status: 'DRAFT', selectionCount: 2, candidates: [] };
    const fetchMock = vi.fn().mockResolvedValueOnce(response(draft, 201)).mockResolvedValueOnce(response(draft));
    vi.stubGlobal('fetch', fetchMock);
    const configuration = { candidateNames: ['Riley Chen', 'Morgan Diaz'], selectionCount: 2 };

    await createVotingRound('admin@example.com:secret', 'election-1', 'position-1', configuration);
    await updateVotingRound('admin@example.com:secret', 'election-1', 'position-1', 'round/1', configuration);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify(configuration) });
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round%2F1');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify(configuration) });
  });

  it('loads results only through the authenticated explicit results endpoint', async () => {
    const results = { roundId: 'round/1', roundNumber: 1, expectedVoterCount: 12, ballotsCast: 11, majorityThreshold: 6, revealedAt: '2026-10-19T12:00:00Z', revealedBy: 'admin@example.com', candidates: [] };
    const fetchMock = vi.fn().mockResolvedValueOnce(response({}, 404)).mockResolvedValueOnce(response(results));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getVotingRoundResults('admin@example.com:secret', 'election-1', 'position-1', 'round/1'))
      .rejects.toMatchObject({ status: 404 });
    await expect(getVotingRoundResults('admin@example.com:secret', 'election-1', 'position-1', 'round/1')).resolves.toEqual(results);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round%2F1/results');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'GET', headers: { Authorization: `Basic ${btoa('admin@example.com:secret')}` } });
  });

  it('loads safe active-round progress through its authenticated endpoint', async () => {
    const progress = { roundId: 'round-1', status: 'ACTIVE' as const, ballotsCast: 4, expectedVoterCount: 12 };
    const fetchMock = vi.fn().mockResolvedValue(response(progress));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getVotingRoundProgress('admin@example.com:secret', 'election-1', 'position-1', 'round-1')).resolves.toEqual(progress);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/progress');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'GET', headers: { Authorization: `Basic ${btoa('admin@example.com:secret')}` } });
  });

  it('reveals a round and saves candidate decisions with a reason', async () => {
    const results = { roundId: 'round-1', roundNumber: 1, expectedVoterCount: 12, ballotsCast: 11, majorityThreshold: 6, revealedAt: '2026-10-19T12:00:00Z', revealedBy: 'admin@example.com', candidates: [] };
    const fetchMock = vi.fn().mockResolvedValueOnce(response(results)).mockResolvedValueOnce(response(results));
    vi.stubGlobal('fetch', fetchMock);

    await expect(revealVotingRound('admin@example.com:secret', 'election-1', 'position-1', 'round-1')).resolves.toEqual(results);
    await expect(saveCandidateDecision('admin@example.com:secret', 'election-1', 'position-1', 'round-1', 'candidate/1', {
      decision: 'ADVANCED',
      reason: 'Received a majority of votes.',
    })).resolves.toEqual(results);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/reveal');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('body');
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/elections/election-1/positions/position-1/rounds/round-1/candidates/candidate%2F1/decision');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ decision: 'ADVANCED', reason: 'Received a majority of votes.' }) });
  });

  it('undoes an eliminated candidate decision with an empty JSON body', async () => {
    const results = { roundId: 'round-1', roundNumber: 1, expectedVoterCount: 12, ballotsCast: 11, majorityThreshold: 6, revealedAt: '2026-10-19T12:00:00Z', revealedBy: 'admin@example.com', candidates: [] };
    const fetchMock = vi.fn().mockResolvedValue(response(results));
    vi.stubGlobal('fetch', fetchMock);

    await expect(undoCandidateDecision('admin@example.com:secret', 'election/1', 'position 2', 'round/3', 'candidate/4')).resolves.toEqual(results);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election%2F1/positions/position%202/rounds/round%2F3/candidates/candidate%2F4/decision/undo');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      body: '{}',
      headers: { Authorization: `Basic ${btoa('admin@example.com:secret')}` },
    });
  });
});