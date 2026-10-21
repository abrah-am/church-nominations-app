import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeVotingRound, getPublicPoll, getVotingDeviceToken, reopenVotingRound, resetVotingRound, startVotingRound, submitPublicBallot } from './voting';

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) };
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('private ballot API', () => {
  it('starts, closes, reopens, and resets rounds through separate authenticated action endpoints', async () => {
    const activeRound = { id: 'round-1', roundNumber: 1, status: 'ACTIVE', selectionCount: 1, candidates: [], expectedVoterCount: 16, accessToken: 'public-token', closeReason: null };
    const closedRound = { ...activeRound, status: 'CLOSED' };
    const resetRound = { ...closedRound, status: 'DRAFT', selectionCount: null, expectedVoterCount: null, accessToken: null, closeReason: null, resetCount: 1 };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response(activeRound))
      .mockResolvedValueOnce(response(closedRound))
      .mockResolvedValueOnce(response(activeRound))
      .mockResolvedValueOnce(response(resetRound));
    vi.stubGlobal('fetch', fetchMock);

    await startVotingRound('admin@example.com:secret', 'election/1', 'position 2', 'round/3', 16);
    await closeVotingRound('admin@example.com:secret', 'election/1', 'position 2', 'round/3');
    await reopenVotingRound('admin@example.com:secret', 'election/1', 'position 2', 'round/3');
    await expect(resetVotingRound('admin@example.com:secret', 'election/1', 'position 2', 'round/3')).resolves.toEqual(resetRound);

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/elections/election%2F1/positions/position%202/rounds/round%2F3/start');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST', body: JSON.stringify({ expectedVoterCount: 16 }) });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/close$/);
    expect(fetchMock.mock.calls[1][1].body).toBeUndefined();
    expect(fetchMock.mock.calls[2][0]).toMatch(/\/reopen$/);
    expect(fetchMock.mock.calls[3][0]).toBe('http://localhost:8080/api/elections/election%2F1/positions/position%202/rounds/round%2F3/reset');
    expect(fetchMock.mock.calls[3][1].method).toBe('POST');
    expect(fetchMock.mock.calls[3][1]).not.toHaveProperty('body');
    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe(`Basic ${btoa('admin@example.com:secret')}`);
  });

  it('uses only the voting profile header for public poll reads and ballot replacement', async () => {
    const poll = { departmentName: 'Finance', positionName: 'Director', selectionCount: 1, candidates: [], submittedCandidateIds: [] };
    const fetchMock = vi.fn().mockResolvedValueOnce(response(poll)).mockResolvedValueOnce(response({ submitted: true }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPublicPoll('public/token', 'profile-uuid')).resolves.toEqual(poll);
    await expect(submitPublicBallot('public/token', 'profile-uuid', ['candidate-1'])).resolves.toEqual({ submitted: true });

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/polls/public%2Ftoken');
    expect(fetchMock.mock.calls[0][1].headers).toMatchObject({ 'X-Voting-Device-Token': 'profile-uuid' });
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
    expect(fetchMock.mock.calls[1][0]).toBe('http://localhost:8080/api/polls/public%2Ftoken/ballot');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PUT', body: JSON.stringify({ candidateIds: ['candidate-1'] }) });
  });

  it('keeps the voting profile UUID separate and persistent', async () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (bytes: Uint8Array) => bytes,
      randomUUID: vi.fn().mockReturnValue('persistent-voting-profile'),
    });

    expect(getVotingDeviceToken()).toBe('persistent-voting-profile');
    expect(getVotingDeviceToken()).toBe('persistent-voting-profile');
    expect(window.localStorage.getItem('church-nominations-voting-device-token')).toBe('persistent-voting-profile');
    expect(window.localStorage.getItem('church-nominations-device-token')).toBeNull();
  });
});