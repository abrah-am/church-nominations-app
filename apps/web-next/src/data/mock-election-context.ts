import { createContext } from 'react'
import type { MockElectionStore } from './mock-election-store'

export const ElectionStoreContext = createContext<MockElectionStore | null>(null)
