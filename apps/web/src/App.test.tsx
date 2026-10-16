import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { checkApiHealth } from './api/health';

vi.mock('./api/health', () => ({
  checkApiHealth: vi.fn(),
}));

const mockedHealthCheck = vi.mocked(checkApiHealth);

afterEach(() => {
  cleanup();
  mockedHealthCheck.mockReset();
});

describe('API connection status', () => {
  it('shows loading before the health check resolves, then connected', async () => {
    let resolveHealth!: () => void;
    mockedHealthCheck.mockReturnValue(new Promise<void>((resolve) => { resolveHealth = resolve; }));

    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Checking API connection');

    resolveHealth();
    expect(await screen.findByRole('status')).toHaveTextContent('API connected');
  });

  it('shows unavailable when the health check fails', async () => {
    mockedHealthCheck.mockRejectedValue(new Error('API is offline'));

    render(<App />);

    expect(await screen.findByRole('status')).toHaveTextContent('API unavailable');
  });
});
