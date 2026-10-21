export function getCandidateRecommendation(
  votes: number,
  majorityThreshold: number,
  openingCount: number,
  electedCount: number,
  majorityCandidateCount: number,
  isRunoff: boolean,
  lowestCandidateVotes: number,
  selectionCount = 1,
): string {
  const remainingOpenings = Math.max(0, openingCount - electedCount);
  if (remainingOpenings === 0) return 'All openings are filled; no further election is recommended.';

  const hasMajority = votes >= majorityThreshold;
  if (hasMajority && selectionCount > 1) {
    return 'Suggested: Advance. This multi-selection round carries majority-qualified candidates to the next round; the administrator confirms the outcome.';
  }
  if (openingCount === 1) {
    return hasMajority
      ? 'Suggested: Elect. This candidate reached a strict majority; the administrator confirms the final outcome.'
      : 'No strict majority recommendation. The administrator decides whether to advance, eliminate, or elect.';
  }

  if (majorityCandidateCount > remainingOpenings) {
    return hasMajority
      ? `Suggested: Advance to a one-choice runoff. ${majorityCandidateCount} candidates reached a majority for ${remainingOpenings} remaining openings.`
      : 'Suggested: Eliminate. Only candidates reaching a strict majority continue to the runoff.';
  }

  if (isRunoff && !hasMajority) {
    return votes === lowestCandidateVotes
      ? 'Suggested: Eliminate. This is the lowest-vote candidate in a runoff without a strict majority.'
      : 'Suggested: Advance. This candidate is not lowest in a runoff without a strict majority.';
  }

  return hasMajority
    ? `Suggested: Elect. This candidate reached a strict majority and ${remainingOpenings} ${remainingOpenings === 1 ? 'opening remains' : 'openings remain'}.`
    : 'No strict majority recommendation. The administrator decides whether to advance, eliminate, or elect.';
}