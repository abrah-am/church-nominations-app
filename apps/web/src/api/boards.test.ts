import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBoard, updateSessionAttendance } from './boards';

function response(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: vi.fn().mockResolvedValue(body) };
}

afterEach(() => { vi.unstubAllGlobals(); });

describe('boards API', () => {
  it('sends Basic credentials and the exact board creation payload', async () => {
    const board = { id: 'board-2026', year: 2026, members: [{ id: 'member-1', name: 'Jordan Lee' }], sessions: [] };
    const fetchMock = vi.fn().mockResolvedValue(response(board, 201));
    vi.stubGlobal('fetch', fetchMock);

    await createBoard('admin@example.com:secret', { year: 2026, members: [{ name: 'Jordan Lee' }] });

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/boards');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa('admin@example.com:secret')}`,
      },
      body: JSON.stringify({ year: 2026, members: [{ name: 'Jordan Lee' }] }),
    });
  });

  it('sends attendance separately from the board and session resources', async () => {
    const session = { id: 'session-1', sessionDate: '2026-10-16', attendedMemberIds: ['member-1'] };
    const fetchMock = vi.fn().mockResolvedValue(response(session));
    vi.stubGlobal('fetch', fetchMock);

    await updateSessionAttendance('admin@example.com:secret', 'board/2026', 'session 1', { attendedMemberIds: ['member-1'] });

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/api/boards/board%2F2026/sessions/session%201/attendance');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: 'PUT',
      headers: { Authorization: `Basic ${btoa('admin@example.com:secret')}` },
      body: JSON.stringify({ attendedMemberIds: ['member-1'] }),
    });
  });
});