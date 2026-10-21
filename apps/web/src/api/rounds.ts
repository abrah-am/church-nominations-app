export type VotingRoundCandidate = {
  id: string;
  name: string;
  sequence: number;
};

export type CandidateDecision = 'ADVANCED' | 'ELIMINATED' | 'ELECTED';

export type VotingRoundResultCandidate = VotingRoundCandidate & {
  votes: number;
  decision?: CandidateDecision | null;
  decisionReason?: string | null;
  decisionAt?: string | null;
  decisionBy?: string | null;
};

export type VotingRoundResult = {
  roundId: string;
  roundNumber: number;
  expectedVoterCount: number;
  ballotsCast: number;
  majorityThreshold: number;
  revealedAt: string;
  revealedBy: string;
  candidates: VotingRoundResultCandidate[];
};

export type VotingRoundProgress = {
  roundId: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  ballotsCast: number;
  expectedVoterCount: number;
};

export type CandidateDecisionRequest = {
  decision: CandidateDecision;
  reason?: string;
};

export type VotingRound = {
  id: string;
  roundNumber: number;
  status: string;
  selectionCount: number | null;
  candidates: VotingRoundCandidate[];
  expectedVoterCount?: number | null;
  accessToken?: string | null;
  closeReason?: string | null;
  resetCount?: number;
};

export type VotingRoundConfiguration = {
  candidateNames: string[];
  selectionCount: number;
};

export class RoundsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'RoundsApiError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

function authorizationHeader(credentials: string): string {
  const bytes = new TextEncoder().encode(credentials);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

async function request<T>(path: string, credentials: string, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorizationHeader(credentials),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const message = response.status === 401
      ? 'Your username or password was not accepted.'
      : `The request failed (HTTP ${response.status}).`;
    throw new RoundsApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function roundsPath(electionId: string, positionId: string): string {
  return `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/rounds`;
}

export function listVotingRounds(credentials: string, electionId: string, positionId: string): Promise<VotingRound[]> {
  return request<VotingRound[]>(roundsPath(electionId, positionId), credentials);
}

export function createVotingRound(
  credentials: string,
  electionId: string,
  positionId: string,
  configuration: VotingRoundConfiguration,
): Promise<VotingRound> {
  return request<VotingRound>(roundsPath(electionId, positionId), credentials, 'POST', configuration);
}

export function updateVotingRound(
  credentials: string,
  electionId: string,
  positionId: string,
  roundId: string,
  configuration: VotingRoundConfiguration,
): Promise<VotingRound> {
  return request<VotingRound>(`${roundsPath(electionId, positionId)}/${encodeURIComponent(roundId)}`, credentials, 'PUT', configuration);
}

function roundPath(electionId: string, positionId: string, roundId: string): string {
  return `${roundsPath(electionId, positionId)}/${encodeURIComponent(roundId)}`;
}

export function getVotingRoundResults(credentials: string, electionId: string, positionId: string, roundId: string): Promise<VotingRoundResult> {
  return request<VotingRoundResult>(`${roundPath(electionId, positionId, roundId)}/results`, credentials);
}

export function getVotingRoundProgress(credentials: string, electionId: string, positionId: string, roundId: string): Promise<VotingRoundProgress> {
  return request<VotingRoundProgress>(`${roundPath(electionId, positionId, roundId)}/progress`, credentials);
}

export function revealVotingRound(credentials: string, electionId: string, positionId: string, roundId: string): Promise<VotingRoundResult> {
  return request<VotingRoundResult>(`${roundPath(electionId, positionId, roundId)}/reveal`, credentials, 'POST');
}

export function saveCandidateDecision(
  credentials: string,
  electionId: string,
  positionId: string,
  roundId: string,
  candidateId: string,
  decision: CandidateDecisionRequest,
): Promise<VotingRoundResult | VotingRoundResultCandidate> {
  const path = `${roundPath(electionId, positionId, roundId)}/candidates/${encodeURIComponent(candidateId)}/decision`;
  return request<VotingRoundResult | VotingRoundResultCandidate>(path, credentials, 'PUT', decision);
}

export function undoCandidateDecision(
  credentials: string,
  electionId: string,
  positionId: string,
  roundId: string,
  candidateId: string,
): Promise<VotingRoundResult> {
  const path = `${roundPath(electionId, positionId, roundId)}/candidates/${encodeURIComponent(candidateId)}/decision/undo`;
  return request<VotingRoundResult>(path, credentials, 'POST', {});
}