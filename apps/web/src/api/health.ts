type HealthResponse = {
  status: string;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');

export async function checkApiHealth(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/api/health`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}`);
  }

  const body = (await response.json()) as HealthResponse;
  if (body.status !== 'ok') {
    throw new Error('Health response was not successful');
  }
}
