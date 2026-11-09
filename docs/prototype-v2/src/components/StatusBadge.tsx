import type { CandidateStatus, ElectionTerm } from '../model'

export default function StatusBadge({ status }: { status: CandidateStatus | 'Draft' | 'Open' | 'Closed' | 'Approved' | ElectionTerm['status'] }) {
  return <span className={`status-badge status-${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>
}