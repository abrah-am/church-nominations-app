export type NominationSubmission = {
  id: string;
  name: string;
};

export type NominationIntake = {
  id: string;
  accessToken: string;
  nameLimit: number;
  status: 'OPEN' | 'CLOSED';
  submissions: NominationSubmission[];
  consolidatedNames: string[] | null;
};

export type PublicNominationIntake = {
  departmentName: string;
  positionName: string;
  nameLimit: number;
  submittedNames: string[];
};

export class NominationsApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'NominationsApiError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const deviceTokenStorageKey = 'church-nominations-device-token';

function authorizationHeader(credentials: string): string {
  const bytes = new TextEncoder().encode(credentials);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

async function request<T>(path: string, headers: Record<string, string>, method = 'GET', body?: unknown): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const message = response.status === 404
      ? 'This nomination intake is unavailable.'
      : response.status === 410
        ? 'This nomination intake is closed.'
        : `The request failed (HTTP ${response.status}).`;
    throw new NominationsApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function getNominationIntake(credentials: string, electionId: string, positionId: string): Promise<NominationIntake> {
  return request<NominationIntake>(
    `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/nominations`,
    { Authorization: authorizationHeader(credentials) },
  );
}

export async function streamNominationIntake(
  credentials: string,
  electionId: string,
  positionId: string,
  signal: AbortSignal,
  onSnapshot: (snapshot: NominationIntake) => void,
): Promise<void> {
  const response = await fetch(
    `${apiBaseUrl}/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/nominations/stream`,
    {
      method: 'GET',
      headers: {
        Accept: 'text/event-stream',
        Authorization: authorizationHeader(credentials),
      },
      signal,
    },
  );

  if (!response.ok) {
    const message = response.status === 404
      ? 'This nomination intake is unavailable.'
      : response.status === 410
        ? 'This nomination intake is closed.'
        : `The request failed (HTTP ${response.status}).`;
    throw new NominationsApiError(response.status, message);
  }
  if (!response.body) throw new Error('The live nomination stream did not provide a response body.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (frame: string) => {
    let eventName = '';
    const data: string[] = [];
    for (const line of frame.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
      if (!line || line.startsWith(':')) continue;
      const separator = line.indexOf(':');
      const field = separator === -1 ? line : line.slice(0, separator);
      const value = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '');
      if (field === 'event') eventName = value;
      if (field === 'data') data.push(value);
    }
    if (eventName === 'intake' && data.length > 0) onSnapshot(JSON.parse(data.join('\n')) as NominationIntake);
  };

  const consumeFrames = (flush = false) => {
    let boundary = buffer.match(/\r\n\r\n|\n\n|\r\r/);
    while (boundary?.index !== undefined) {
      dispatch(buffer.slice(0, boundary.index));
      buffer = buffer.slice(boundary.index + boundary[0].length);
      boundary = buffer.match(/\r\n\r\n|\n\n|\r\r/);
    }
    if (flush && buffer) {
      dispatch(buffer);
      buffer = '';
    }
  };

  const cancelReader = () => { void reader.cancel(); };
  signal.addEventListener('abort', cancelReader, { once: true });
  try {
    while (!signal.aborted) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      consumeFrames();
    }
    if (!signal.aborted) {
      buffer += decoder.decode();
      consumeFrames(true);
    }
  } finally {
    signal.removeEventListener('abort', cancelReader);
    reader.releaseLock();
  }
}

export function createNominationIntake(
  credentials: string,
  electionId: string,
  positionId: string,
  nameLimit: number,
): Promise<NominationIntake> {
  return request<NominationIntake>(
    `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/nominations`,
    { Authorization: authorizationHeader(credentials) },
    'POST',
    { nameLimit },
  );
}

export function closeNominationIntake(credentials: string, electionId: string, positionId: string): Promise<NominationIntake> {
  return request<NominationIntake>(
    `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/nominations/close`,
    { Authorization: authorizationHeader(credentials) },
    'POST',
  );
}

export function saveNominationConsolidation(
  credentials: string,
  electionId: string,
  positionId: string,
  candidateNames: string[],
): Promise<{ candidateNames: string[] }> {
  return request<{ candidateNames: string[] }>(
    `/api/elections/${encodeURIComponent(electionId)}/positions/${encodeURIComponent(positionId)}/nominations/consolidation`,
    { Authorization: authorizationHeader(credentials) },
    'PUT',
    { candidateNames },
  );
}

export function getNominationDeviceToken(): string {
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

export function getPublicNominationIntake(accessToken: string, deviceToken: string): Promise<PublicNominationIntake> {
  return request<PublicNominationIntake>(
    `/api/nomination-intakes/${encodeURIComponent(accessToken)}`,
    { 'X-Nomination-Device-Token': deviceToken },
  );
}

export function savePublicNominationSubmission(accessToken: string, deviceToken: string, names: string[]): Promise<PublicNominationIntake> {
  return request<PublicNominationIntake>(
    `/api/nomination-intakes/${encodeURIComponent(accessToken)}/submission`,
    { 'X-Nomination-Device-Token': deviceToken },
    'PUT',
    { names },
  );
}