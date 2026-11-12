import { useContext, useSyncExternalStore } from 'react'
import { ElectionStoreContext } from './mock-election-context'
import type {
  AdminElectionSnapshot,
  PresentationElectionSnapshot,
  VoterElectionSnapshot,
} from './mock-election-store'

export function useMockElectionStore() {
  const store = useContext(ElectionStoreContext)
  if (!store) throw new Error('MockElectionProvider is required for interactive election views.')
  return store
}

export function useAdminElectionSnapshot(): AdminElectionSnapshot {
  const store = useMockElectionStore()
  return useSyncExternalStore(store.subscribe, store.getAdminSnapshot, store.getAdminSnapshot)
}

export function useVoterElectionSnapshot(): VoterElectionSnapshot {
  const store = useMockElectionStore()
  return useSyncExternalStore(store.subscribe, store.getVoterSnapshot, store.getVoterSnapshot)
}

export function usePresentationElectionSnapshot(): PresentationElectionSnapshot {
  const store = useMockElectionStore()
  return useSyncExternalStore(store.subscribe, store.getPresentationSnapshot, store.getPresentationSnapshot)
}
