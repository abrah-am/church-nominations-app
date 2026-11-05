import { VotingRoundAggregateResults } from '../../api/rounds';

export default function VotingLiveResults({ result, label = 'Live aggregate candidate results' }: { result: VotingRoundAggregateResults; label?: string }) {
	const candidates = [...result.candidates].sort((first, second) => second.votes - first.votes || first.name.localeCompare(second.name, 'en', { sensitivity: 'base' }) || first.name.localeCompare(second.name, 'en'));
	return <section className="round-results live-round-results" aria-label={label}>
		<p className="round-live-submissions">{result.ballotsCast} of {result.expectedVoterCount} submissions</p>
		<ul className="round-result-candidates" aria-label={label}>
			{candidates.map((candidate) => {
				const percentage = result.ballotsCast > 0 ? Math.round(candidate.votes / result.ballotsCast * 100) : 0;
				const indicatorValue = Math.min(percentage, 100);
				return <li key={candidate.id}>
					<div className="round-result-candidate-heading"><strong>{candidate.name}</strong><span>{candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'} · {percentage}%</span></div>
					<div className="aggregate-result-track" role="progressbar" aria-label={`${candidate.name}: ${candidate.votes} ${candidate.votes === 1 ? 'vote' : 'votes'}, ${percentage}% of submissions`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={indicatorValue}><span style={{ width: `${indicatorValue}%` }} /></div>
				</li>;
			})}
		</ul>
	</section>;
}