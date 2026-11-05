import { Dispatch, RefObject, SetStateAction } from 'react';
import { NominationIntake, SharedNominationEntry } from '../../api/nominations';
import {
	CandidateDecision,
	VotingRound,
	VotingRoundAggregateResults,
	VotingRoundProgress,
	VotingRoundResult,
} from '../../api/rounds';

export function AggregateCandidateResults({ result, label }: { result: VotingRoundAggregateResults; label: string }) {
	const candidates = [...result.candidates].sort((first, second) =>
		second.votes - first.votes
		|| first.name.localeCompare(second.name, 'en', { sensitivity: 'base' })
		|| first.name.localeCompare(second.name, 'en'),
	);

	return <section className="round-results live-round-results" aria-label={label}>
		<ul className="round-result-candidates" aria-label={label}>
			{candidates.map((candidate) => {
				const percentage = result.ballotsCast > 0 ? Math.round((candidate.votes / result.ballotsCast) * 100) : 0;
				const indicatorValue = Math.min(percentage, 100);
				return <li key={candidate.id}>
					<div className="round-result-candidate-heading">
						<strong>{candidate.name}</strong>
						<span>{candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'} · {percentage}%</span>
					</div>
					<div className="aggregate-result-track" role="progressbar" aria-label={`${candidate.name}: ${candidate.votes} ${candidate.votes === 1 ? 'vote' : 'votes'}, ${percentage}% of ballots cast`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={indicatorValue}>
						<span style={{ width: `${indicatorValue}%` }} />
					</div>
				</li>;
			})}
		</ul>
	</section>;
}

export function ClosedNominationReviewStage({
	intake,
	sharedListDirty,
	sharedListDraft,
	isLoading,
	statusRef,
	onConfirm,
}: {
	intake: NominationIntake;
	sharedListDirty: boolean;
	sharedListDraft: SharedNominationEntry[];
	isLoading: boolean;
	statusRef: RefObject<HTMLParagraphElement>;
	onConfirm: () => void;
}) {
	return <section className="closed-review-summary" aria-label="Closed nomination review">
		<p ref={statusRef} tabIndex={-1} className="closed-review-message" role="status" aria-live="polite" aria-atomic="true">
			{intake.revealed
				? 'The consolidated list is confirmed. Use Audience presentation to show or hide it.'
				: 'Nominations are closed. Review and consolidate the names, then confirm the list.'}
		</p>
		<div className="closed-review-meta">
			<span>{intake.currentContributorCount ?? 'Unavailable'} current profile submissions</span>
			<span>{intake.consolidatedNames?.length ?? intake.sharedList.filter((entry) => entry.active).length} candidates</span>
		</div>
		{!intake.revealed && <button className="primary-button" type="button" disabled={isLoading || sharedListDirty || sharedListDraft.some((entry) => entry.active && !entry.name.trim())} onClick={onConfirm}>Confirm consolidated list</button>}
	</section>;
}

export function OpenNominationIntakeStage({
	intake,
	names,
	closeTriggerRef,
	isLoading,
	onClose,
}: {
	intake: NominationIntake;
	names: string[];
	closeTriggerRef: RefObject<HTMLButtonElement>;
	isLoading: boolean;
	onClose: () => void;
}) {
	return <section className="intake-collection-view" aria-label="Open nomination intake">
		<h3 className="intake-open-title">Nomination intake is open</h3>
		<div className="intake-collection-metrics" aria-live="polite" aria-atomic="true">
			<div><strong>{intake.currentContributorCount ?? 'Unavailable'}</strong><span>profile submissions</span></div>
			<div><strong>{intake.nameLimit}</strong><span>names allowed per profile</span></div>
		</div>
		{intake.currentContributorCount == null && <p className="form-note">The connected API did not provide this count. Restart or update the API, then reload nominations.</p>}
		{names.length > 0 && <ol className="member-list intake-open-name-list" aria-label="Submitted nomination names">
			{names.map((name, index) => <li key={`${name}-${index}`}><span className="shared-nomination-name">{name}</span></li>)}
		</ol>}
		<div className="intake-open-actions">
			<button ref={closeTriggerRef} className="secondary-button" type="button" disabled={isLoading} onClick={onClose}>Close nomination intake</button>
		</div>
	</section>;
}

export function ActiveVotingStage({
	round,
	progress,
	aggregate,
	aggregateError,
	lifecycleBusy,
	onCancel,
	onClose,
}: {
	round: VotingRound;
	progress?: VotingRoundProgress;
	aggregate?: VotingRoundAggregateResults;
	aggregateError: boolean;
	lifecycleBusy: boolean;
	onCancel: () => void;
	onClose: () => void;
}) {
	return <section className="active-voting-card" aria-label={`Round ${round.roundNumber} active voting`}>
		<div className="section-heading"><div><h3 id="voting-round-title">Voting is active</h3></div></div>
		<div className="round-progress" role="status" aria-live="polite" aria-atomic="true">
			{progress?.status === 'ACTIVE'
				? <strong>{progress.ballotsCast} of {progress.expectedVoterCount} profile/link submissions</strong>
				: <strong>Loading submission count…</strong>}
			<span>Submissions are counted per browser profile or link, not as verified people. Individual ballot choices and voter identities remain private.</span>
		</div>
		{!aggregate && !aggregateError && <p className="form-note" role="status">Loading live results…</p>}
		{aggregateError && <p className="form-note" role="alert">{aggregate ? 'Live totals may be out of date.' : 'Live results are temporarily unavailable.'} Retrying automatically.</p>}
		{aggregate && <AggregateCandidateResults result={aggregate} label="Live aggregate candidate results" />}
		<div className="active-voting-actions">
			<button className="danger-button" type="button" disabled={lifecycleBusy} onClick={onCancel}>Cancel active voting</button>
			<button className="primary-button" type="button" disabled={lifecycleBusy} onClick={onClose}>Close voting</button>
		</div>
	</section>;
}

export function ClosedRoundDecisionsStage({
	round,
	result,
	aggregate,
	decisionDrafts,
	setDecisionDrafts,
	onSave,
	onReopen,
	onReset,
	canReset,
	lifecycleBusy,
}: {
	round: VotingRound;
	result?: VotingRoundResult;
	aggregate?: VotingRoundAggregateResults;
	decisionDrafts: Record<string, { decision: CandidateDecision | null; reason: string }>;
	setDecisionDrafts: Dispatch<SetStateAction<Record<string, { decision: CandidateDecision | null; reason: string }>>>;
	onSave: () => void;
	onReopen: () => void;
	onReset: () => void;
	canReset: boolean;
	lifecycleBusy: boolean;
}) {
	return <section id={`round-${round.id}`} className="current-round-decisions" aria-label={`Round ${round.roundNumber} candidate decisions`}>
		<h3>Round {round.roundNumber} · Candidate decisions</h3>
		{result && <>
			<AggregateCandidateResults result={{ expectedVoterCount: result.expectedVoterCount, ballotsCast: result.ballotsCast, majorityThreshold: result.majorityThreshold, candidates: result.candidates }} label={`Final aggregate candidate results for round ${round.roundNumber}`} />
			<ul className="round-result-candidates" aria-label={`Candidate decisions for round ${round.roundNumber}`}>
				{[...result.candidates].sort((first, second) => second.votes - first.votes || first.name.localeCompare(second.name)).map((candidate) => {
					const selectedDecision = decisionDrafts[candidate.id]?.decision ?? candidate.decision ?? null;
					return <li className="candidate-outcome" key={candidate.id}>
						<div className="round-result-candidate-heading"><strong>{candidate.name}</strong><span>{candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'} · {result.ballotsCast > 0 ? Math.round(candidate.votes / result.ballotsCast * 100) : 0}%</span></div>
						<div className="candidate-actions" role="group" aria-label={`Decision for ${candidate.name}`}>
							{([['ELECTED', 'Elect'], ['ADVANCED', 'Advance'], ['ELIMINATED', 'Remove']] as const).map(([decision, label]) => <button key={decision} type="button" className={`candidate-action${selectedDecision === decision ? ' is-selected' : ''}`} aria-pressed={selectedDecision === decision} onClick={() => setDecisionDrafts((current) => ({ ...current, [candidate.id]: { decision, reason: current[candidate.id]?.reason ?? '' } }))}>{label}</button>)}
						</div>
					</li>;
				})}
			</ul>
			<button className="primary-button" type="button" onClick={onSave}>Save decisions</button>
		</>}
		{!result && aggregate && <AggregateCandidateResults result={aggregate} label={`Final aggregate candidate results for round ${round.roundNumber}`} />}
		<div className="form-actions">
			<button className="secondary-button" type="button" disabled={lifecycleBusy} onClick={onReopen}>Reopen voting</button>
			{canReset && <button className="secondary-button" type="button" disabled={lifecycleBusy} onClick={onReset}>Reset round</button>}
		</div>
	</section>;
}