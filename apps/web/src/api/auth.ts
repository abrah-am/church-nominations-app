export type SafeAccount = {
  id?: string;
  email?: string;
  [property: string]: unknown;
};

export type Church = {
  id?: string;
  name?: string;
  [property: string]: unknown;
};

export type RegistrationRequest = {
  email: string;
  password: string;
};

export type ChurchRequest = {
  name: string;
};

export class AuthApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

function authorizationHeader(credentials: string): string {
  const bytes = new TextEncoder().encode(credentials);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return `Basic ${btoa(binary)}`;
}

async function request<T>(
  path: string,
  options: { credentials?: string; method?: string; body?: RegistrationRequest | ChurchRequest } = {},
): Promise<T> {
  const { credentials, method = 'GET', body } = options;
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(credentials ? { Authorization: authorizationHeader(credentials) } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    let message = response.status === 401
      ? 'Your email or password was not accepted.'
      : `The request failed (HTTP ${response.status}).`;
    try {
      const errorBody = await response.json() as { error?: unknown; message?: unknown };
      if (path === '/api/auth/register' && response.status === 400 && errorBody.error === 'validation_failed') {
        message = 'Use a valid email and a password between 8 and 72 characters.';
      } else if (typeof errorBody.message === 'string') {
        message = errorBody.message;
      }
    } catch {
      // Keep the status-based message when the response has no JSON body.
    }
    throw new AuthApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function registerAccount(registration: RegistrationRequest): Promise<SafeAccount> {
  return request<SafeAccount>('/api/auth/register', { method: 'POST', body: registration });
}

export function getCurrentAccount(credentials: string): Promise<SafeAccount> {
  return request<SafeAccount>('/api/auth/me', { credentials });
}

export function getMyChurches(credentials: string): Promise<Church[]> {
  return request<Church[]>('/api/churches/my', { credentials });
}

export function createChurch(credentials: string, church: ChurchRequest): Promise<Church> {
  return request<Church>('/api/churches', { credentials, method: 'POST', body: church });
}