import { Dispatch, SetStateAction } from 'react';
import { CandidateDecision, VotingRound, VotingRoundAggregateResults, VotingRoundResult } from '../../api/rounds';
import { getCandidateRecommendation } from '../elections/candidateRecommendations';

type DecisionDraft = { decision: CandidateDecision | null; reason: string };

export default function VotingDecisions({
	roundNumber,
	result,
	aggregate,
	openingCount,
	rounds,
	roundResults,
	selectionCount,
	showBallotSummary = true,
	showHeading = true,
	decisionDrafts,
	setDecisionDrafts,
	saving,
	onSave,
}: {
	roundNumber: number;
	result?: VotingRoundResult;
	aggregate?: VotingRoundAggregateResults;
	openingCount: number;
	rounds: VotingRound[];
	roundResults: Record<string, VotingRoundResult>;
	selectionCount: number | null;
	showBallotSummary?: boolean;
	showHeading?: boolean;
	decisionDrafts: Record<string, DecisionDraft>;
	setDecisionDrafts: Dispatch<SetStateAction<Record<string, DecisionDraft>>>;
	saving: boolean;
	onSave: () => void;
}) {
	const decisionsResult: VotingRoundResult | undefined = result ?? (aggregate ? {
		roundId: '',
		roundNumber,
		expectedVoterCount: aggregate.expectedVoterCount,
		ballotsCast: aggregate.ballotsCast,
		majorityThreshold: aggregate.majorityThreshold,
		revealedAt: '',
		revealedBy: '',
		candidates: aggregate.candidates.map((candidate) => ({ ...candidate, sequence: 0, decision: null, decisionReason: null, decisionAt: null, decisionBy: null })),
	} : undefined);
	if (!decisionsResult) return null;
	const candidates = [...decisionsResult.candidates].sort((first, second) => second.votes - first.votes || first.name.localeCompare(second.name));

	return <section className="round-results voting-decisions" aria-label={showHeading ? `Round ${roundNumber} candidate decisions` : `Historical results for round ${roundNumber}`}>
		{showHeading && <h3>Round {roundNumber} · Candidate decisions</h3>}
		<div className="section-heading"><div><h4>Final results</h4><p>Aggregate totals only. Ballot choices are not shown.</p></div></div>
		{showBallotSummary && <dl className="round-result-summary"><div><dt>Ballots cast</dt><dd>{decisionsResult.ballotsCast} / {decisionsResult.expectedVoterCount}</dd></div><div><dt>Majority threshold</dt><dd>{decisionsResult.majorityThreshold}</dd></div></dl>}
		<ul className="round-result-candidates" aria-label={`Aggregate candidate votes for round ${roundNumber}`}>
			{candidates.map((candidate) => {
				const percentage = decisionsResult.ballotsCast > 0 ? Math.round(candidate.votes / decisionsResult.ballotsCast * 100) : 0;
				const selectedDecision = decisionDrafts[candidate.id]?.decision ?? candidate.decision ?? null;
				const electedCount = rounds.filter((priorRound) => priorRound.roundNumber < roundNumber).flatMap((priorRound) => roundResults[priorRound.id]?.candidates ?? []).filter((priorCandidate) => priorCandidate.decision === 'ELECTED').length;
				const majorityCandidateCount = candidates.filter((item) => item.votes >= decisionsResult.majorityThreshold).length;
				const recommendation = getCandidateRecommendation(candidate.votes, decisionsResult.majorityThreshold, openingCount, electedCount, majorityCandidateCount, roundNumber > 1 && selectionCount === 1, Math.min(...candidates.map((item) => item.votes)), selectionCount ?? 1);
				return <li className="candidate-outcome" key={candidate.id}>
					<div className="round-result-candidate-heading"><strong>{candidate.name}</strong><span>{candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'} · {percentage}%</span></div>
					<p className="candidate-recommendation" role="note"><strong>Recommendation:</strong> {recommendation}</p>
					{candidate.decision && <p className="candidate-decision-current">Current decision: <strong>{candidate.decision}</strong>{candidate.decisionReason ? `: ${candidate.decisionReason}` : ''}{candidate.decisionBy && <> <span>By {candidate.decisionBy}</span></>}{candidate.decisionAt && <> <time dateTime={candidate.decisionAt}>{new Date(candidate.decisionAt).toLocaleString()}</time></>}</p>}
					<div className="candidate-actions" role="group" aria-label={`Decision for ${candidate.name}`}>
						{([['ELECTED', 'Elect'], ['ADVANCED', 'Advance'], ['ELIMINATED', 'Eliminate']] as const).map(([decision, label]) => <button key={decision} type="button" className={`candidate-action${selectedDecision === decision ? ' is-selected' : ''}`} aria-pressed={selectedDecision === decision} disabled={saving} onClick={() => setDecisionDrafts((current) => ({ ...current, [candidate.id]: { decision, reason: current[candidate.id]?.reason ?? candidate.decisionReason ?? '' } }))}>{label}</button>)}
					</div>
				</li>;
			})}
		</ul>
		<button className="primary-button" type="button" disabled={saving} onClick={onSave}>{saving ? 'Saving…' : 'Save decisions'}</button>
	</section>;
}