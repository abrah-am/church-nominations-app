export type ElectionPosition = {
  id: string;
  name: string;
  openingCount: number;
  sequence: number;
};

export type Election = {
  id: string;
  departmentName: string;
  status: 'SETUP' | 'IN_PROGRESS' | 'COMPLETE';
  positions: ElectionPosition[];
};

export type ElectionConfiguration = {
  departmentName: string;
  positions: Array<{
    id?: string;
    name: string;
    openingCount: number;
  }>;
};

export class ElectionsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ElectionsApiError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

function authorizationHeader(credentials: string): string {
  const bytes = new TextEncoder().encode(credentials);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

async function request<T>(path: string, credentials: string, method = 'GET', body?: ElectionConfiguration): Promise<T> {
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
      : response.status === 404
        ? 'The requested election could not be found.'
        : `The request failed (HTTP ${response.status}).`;
    throw new ElectionsApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function listElections(credentials: string): Promise<Election[]> {
  return request<Election[]>('/api/elections', credentials);
}

export function getElection(credentials: string, id: string): Promise<Election> {
  return request<Election>(`/api/elections/${encodeURIComponent(id)}`, credentials);
}

export function createElection(credentials: string, configuration: ElectionConfiguration): Promise<Election> {
  return request<Election>('/api/elections', credentials, 'POST', configuration);
}

export function updateElection(credentials: string, id: string, configuration: ElectionConfiguration): Promise<Election> {
  return request<Election>(`/api/elections/${encodeURIComponent(id)}`, credentials, 'PUT', configuration);
}

export function deleteElectionPosition(credentials: string, electionId: string, positionId: string): Promise<void> {
  return request<void>(
    `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}`,
    credentials,
    'DELETE',
  );
}