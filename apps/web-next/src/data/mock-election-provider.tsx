import type { ReactNode } from 'react'
import { ElectionStoreContext } from './mock-election-context'
import type { MockElectionStore } from './mock-election-store'

export function MockElectionProvider({
  store,
  children,
}: {
  store: MockElectionStore
  children: ReactNode
}) {
  return <ElectionStoreContext.Provider value={store}>{children}</ElectionStoreContext.Provider>
}
