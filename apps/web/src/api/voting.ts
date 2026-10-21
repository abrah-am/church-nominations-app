import { VotingRound } from './rounds';

export type PublicPoll = {
  departmentName: string;
  positionName: string;
  selectionCount: number;
  candidates: VotingRound['candidates'];
  submittedCandidateIds: string[];
};

export type BallotSubmission = { submitted: true };

export class VotingApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'VotingApiError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const deviceTokenStorageKey = 'church-nominations-voting-device-token';

function authorizationHeader(credentials: string): string {
  const bytes = new TextEncoder().encode(credentials);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

async function adminRequest<T>(path: string, credentials: string, method: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorizationHeader(credentials),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const message = response.status === 401
      ? 'Your username or password was not accepted.'
      : `The request failed (HTTP ${response.status}).`;
    throw new VotingApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function roundActionPath(electionId: string, positionId: string, roundId: string, action: string): string {
  return `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/rounds/${encodeURIComponent(roundId)}/${action}`;
}

export function startVotingRound(
  credentials: string,
  electionId: string,
  positionId: string,
  roundId: string,
  expectedVoterCount: number,
): Promise<VotingRound> {
  return adminRequest<VotingRound>(roundActionPath(electionId, positionId, roundId, 'start'), credentials, 'POST', { expectedVoterCount });
}

export function closeVotingRound(credentials: string, electionId: string, positionId: string, roundId: string): Promise<VotingRound> {
  return adminRequest<VotingRound>(roundActionPath(electionId, positionId, roundId, 'close'), credentials, 'POST');
}

export function reopenVotingRound(credentials: string, electionId: string, positionId: string, roundId: string): Promise<VotingRound> {
  return adminRequest<VotingRound>(roundActionPath(electionId, positionId, roundId, 'reopen'), credentials, 'POST');
}

export function resetVotingRound(credentials: string, electionId: string, positionId: string, roundId: string): Promise<VotingRound> {
  return adminRequest<VotingRound>(roundActionPath(electionId, positionId, roundId, 'reset'), credentials, 'POST');
}

async function publicRequest<T>(path: string, deviceToken: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Voting-Device-Token': deviceToken,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const message = response.status === 404
      ? 'This poll is not active.'
      : `The request failed (HTTP ${response.status}).`;
    throw new VotingApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getVotingDeviceToken(): string {
  const existingToken = window.localStorage.getItem(deviceTokenStorageKey);
  if (existingToken) return existingToken;

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  const token = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  window.localStorage.setItem(deviceTokenStorageKey, token);
  return token;
}

export function getPublicPoll(accessToken: string, deviceToken: string): Promise<PublicPoll> {
  return publicRequest<PublicPoll>(`/api/polls/${encodeURIComponent(accessToken)}`, deviceToken);
}

export function submitPublicBallot(accessToken: string, deviceToken: string, candidateIds: string[]): Promise<BallotSubmission> {
  return publicRequest<BallotSubmission>(
    `/api/polls/${encodeURIComponent(accessToken)}/ballot`,
    deviceToken,
    'PUT',
    { candidateIds },
  );
}