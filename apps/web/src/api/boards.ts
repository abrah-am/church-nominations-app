export type BoardMember = {
  id: string;
  name: string;
};

export type BoardSession = {
  id: string;
  sessionDate: string;
  attendedMemberIds: string[];
};

export type AnnualBoard = {
  id: string;
  year: number;
  members: BoardMember[];
  sessions: BoardSession[];
};

export type BoardRequest = {
  year: number;
  members: Array<{ name: string }>;
};

export type BoardSessionRequest = {
  sessionDate: string;
};

export type AttendanceRequest = {
  attendedMemberIds: string[];
};

export class BoardsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'BoardsApiError';
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
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const message = response.status === 401
      ? 'Your username or password was not accepted.'
      : response.status === 404
        ? 'The requested annual board could not be found.'
        : `The request failed (HTTP ${response.status}).`;
    throw new BoardsApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listBoards(credentials: string): Promise<AnnualBoard[]> {
  return request<AnnualBoard[]>('/api/boards', credentials);
}

export function createBoard(credentials: string, board: BoardRequest): Promise<AnnualBoard> {
  return request<AnnualBoard>('/api/boards', credentials, 'POST', board);
}

export function getBoard(credentials: string, id: string): Promise<AnnualBoard> {
  return request<AnnualBoard>(`/api/boards/${encodeURIComponent(id)}`, credentials);
}

export function createBoardSession(credentials: string, id: string, session: BoardSessionRequest): Promise<BoardSession> {
  return request<BoardSession>(`/api/boards/${encodeURIComponent(id)}/sessions`, credentials, 'POST', session);
}

export function updateSessionAttendance(
  credentials: string,
  boardId: string,
  sessionId: string,
  attendance: AttendanceRequest,
): Promise<BoardSession> {
  return request<BoardSession>(
    `/api/boards/${encodeURIComponent(boardId)}/sessions/${encodeURIComponent(sessionId)}/attendance`,
    credentials,
    'PUT',
    attendance,
  );
}