import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkApiHealth } from './health';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkApiHealth', () => {
  it('requests the health endpoint and accepts a healthy response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(checkApiHealth()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8080/api/health', {
      headers: { Accept: 'application/json' },
    });
  });

  it('rejects non-success responses and malformed health payloads', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(checkApiHealth()).rejects.toThrow('status 503');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'starting' }),
    }));
    await expect(checkApiHealth()).rejects.toThrow('not successful');
  });
});
