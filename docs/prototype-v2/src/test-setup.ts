import '@testing-library/jest-dom/vitest'

class TestBroadcastChannel {
	onmessage: ((event: MessageEvent) => void) | null = null
	postMessage() {}
	close() {}
}

globalThis.BroadcastChannel = TestBroadcastChannel as unknown as typeof BroadcastChannel