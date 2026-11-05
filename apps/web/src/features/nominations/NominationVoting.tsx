import { FormEvent, RefObject, SetStateAction, Dispatch } from 'react';
import {
	CandidateDecision,
	VotingRound,
	VotingRoundAggregateResults,
	VotingRoundProgress,
	VotingRoundResult,
} from '../../api/rounds';
import VotingRoundSetup from './VotingRoundSetup';
import VotingDecisions from './VotingDecisions';
import { ActiveVotingStage } from './NominationWorkflowStages';

type NominationVotingProps = {
	isExpanded: boolean;
	hasActiveRound: boolean;
	hasSavedSnapshot: boolean;
	firstRoundPrepared: boolean;
	firstRoundSetupVisible: boolean;
	firstRoundDraftStale: boolean;
	showClosedRoundDecisions: boolean;
	openingCount: number;
	rounds: VotingRound[];
	activeRound?: VotingRound;
	latestRound?: VotingRound;
	latestClosedRound?: VotingRound;
	draftRound?: VotingRound;
	draftRoundId: string | null;
	selectionCount: string;
	selectionCountBaseline: string;
	setSelectionCount: (value: string) => void;
	selectionCandidates: string[];
	roundsLoading: boolean;
	roundsReady: boolean;
	roundsSaving: boolean;
	roundsError: string;
	roundsSuccess: string;
	roundsLoadAttempt: () => void;
	roundLifecycleBusy: boolean;
	roundProgress: Record<string, VotingRoundProgress>;
	roundAggregateResults: Record<string, VotingRoundAggregateResults>;
	aggregateRefreshErrors: Record<string, boolean>;
	roundResults: Record<string, VotingRoundResult>;
	decisionDrafts: Record<string, { decision: CandidateDecision | null; reason: string }>;
	setDecisionDrafts: Dispatch<SetStateAction<Record<string, { decision: CandidateDecision | null; reason: string }>>>;
	savingDecisionCandidateId: string | null;
	startRoundId: string | null;
	setStartRoundId: (roundId: string | null) => void;
	expectedVoterCount: string;
	setExpectedVoterCount: (value: string) => void;
	expectedVoterInputRef: RefObject<HTMLInputElement>;
	startSuccessRef: RefObject<HTMLParagraphElement>;
	reopenRoundId: string | null;
	setReopenRoundId: (roundId: string | null) => void;
	resetRoundId: string | null;
	setResetRoundId: (roundId: string | null) => void;
	onDraftStateChange: (dirty: boolean) => void;
	onSaveRoundConfiguration: (event: FormEvent<HTMLFormElement>) => void;
	onSaveAndOpenStartDialog: (event: FormEvent<HTMLFormElement>, trigger: HTMLButtonElement) => void;
	onSaveStartRound: (event: FormEvent<HTMLFormElement>) => void;
	onOpenStartDialog: (round: VotingRound) => void;
	onCancelFirstRoundDraft: () => void;
	onCloseRound: (round: VotingRound) => void;
	onSaveCandidateDecisions: (roundId: string) => void;
	onReopenRound: () => void;
	onResetRound: () => void;
	onCopyVotingLink: (round: VotingRound) => void;
	onEditCandidateList: () => void;
	copiedRoundId: string | null;
};

export default function NominationVoting({
	isExpanded,
	hasActiveRound,
	hasSavedSnapshot,
	firstRoundPrepared,
	firstRoundSetupVisible,
	firstRoundDraftStale,
	showClosedRoundDecisions,
	openingCount,
	rounds,
	activeRound,
	latestRound,
	latestClosedRound,
	draftRound,
	draftRoundId,
	selectionCount,
	selectionCountBaseline,
	setSelectionCount,
	selectionCandidates,
	roundsLoading,
	roundsReady,
	roundsSaving,
	roundsError,
	roundsSuccess,
	roundsLoadAttempt,
	roundLifecycleBusy,
	roundProgress,
	roundAggregateResults,
	aggregateRefreshErrors,
	roundResults,
	decisionDrafts,
	setDecisionDrafts,
	savingDecisionCandidateId,
	startRoundId,
	setStartRoundId,
	expectedVoterCount,
	setExpectedVoterCount,
	expectedVoterInputRef,
	startSuccessRef,
	reopenRoundId,
	setReopenRoundId,
	resetRoundId,
	setResetRoundId,
	onDraftStateChange,
	onSaveRoundConfiguration,
	onSaveAndOpenStartDialog,
	onSaveStartRound,
	onOpenStartDialog,
	onCancelFirstRoundDraft,
	onCloseRound,
	onSaveCandidateDecisions,
	onReopenRound,
	onResetRound,
	onCopyVotingLink,
	onEditCandidateList,
	copiedRoundId,
}: NominationVotingProps) {
	if (!isExpanded || !(hasActiveRound || hasSavedSnapshot && (rounds.length > 0 || firstRoundPrepared))) return null;

	return <details className={`workflow-details voting-round-configuration${firstRoundSetupVisible ? ' is-first-round-setup' : ''}${hasActiveRound ? ' is-voting-active' : ''}`} open>
		<summary hidden={firstRoundSetupVisible || hasActiveRound}>Voting round configuration <span>{rounds.length} {rounds.length === 1 ? 'round' : 'rounds'} · {draftRoundId ? 'Draft ready' : 'Setup'}</span></summary>
		<section aria-labelledby="voting-round-title">
			{hasActiveRound && activeRound && <ActiveVotingStage
				round={activeRound}
				progress={roundProgress[activeRound.id]}
				aggregate={roundAggregateResults[activeRound.id]}
				aggregateError={Boolean(aggregateRefreshErrors[activeRound.id])}
				lifecycleBusy={roundLifecycleBusy}
				onCancel={() => setResetRoundId(activeRound.id)}
				onClose={() => onCloseRound(activeRound)}
			/>}
			{!hasActiveRound && !firstRoundSetupVisible && latestRound?.status !== 'DRAFT' && !latestClosedRound && <div className="section-heading">
				<div><h3 id="voting-round-title">Voting round configuration</h3><p>{latestRound ? 'Candidates marked Advanced in the preceding round continue automatically.' : 'The consolidated list is the complete candidate roster for this poll.'}</p></div>
			</div>}
			{roundsError && !roundsLoading && !roundsReady && <button className="secondary-button" type="button" onClick={roundsLoadAttempt}>Retry loading rounds</button>}
			{!roundsLoading && roundsReady && <>
				{showClosedRoundDecisions && latestClosedRound && <>
					<VotingDecisions roundNumber={latestClosedRound.roundNumber} result={roundResults[latestClosedRound.id]} aggregate={roundAggregateResults[latestClosedRound.id]} openingCount={openingCount} rounds={rounds} roundResults={roundResults} selectionCount={latestClosedRound.selectionCount} decisionDrafts={decisionDrafts} setDecisionDrafts={setDecisionDrafts} saving={Boolean(savingDecisionCandidateId)} onSave={() => onSaveCandidateDecisions(latestClosedRound.id)} />
					<div className="form-actions"><button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setReopenRoundId(latestClosedRound.id)}>Reopen voting</button>{!rounds.some((round) => round.roundNumber > latestClosedRound.roundNumber) && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setResetRoundId(latestClosedRound.id)}>Reset round</button>}</div>
				</>}
				{rounds.some((round) => round.status !== 'ACTIVE' && (hasActiveRound || round.id !== latestClosedRound?.id)) && !firstRoundSetupVisible && latestRound?.status !== 'DRAFT' && <ul className="voting-round-list" aria-label="Voting rounds">
					{rounds.filter((round) => round.status !== 'ACTIVE' && (hasActiveRound || round.id !== latestClosedRound?.id)).map((round) => <li className="voting-round-item" key={round.id}>
						<details id={`round-${round.id}`} className={`workflow-details round-details${round.status === 'ACTIVE' ? ' round-details-active' : ''}${round.status === 'CLOSED' && round.id === latestClosedRound?.id ? ' round-details-current-decisions' : ''}`} name="voting-rounds" open={false}>
							<summary><span>Round {round.roundNumber}</span><span>{round.status === 'DRAFT' ? 'Draft' : round.status === 'ACTIVE' ? 'Voting active now' : 'Closed'} · {round.candidates.length} candidates</span></summary>
							<div className="round-detail-content">
								<div className="voting-round-heading"><h4>Round {round.roundNumber}</h4><span className={`row-status ${round.status === 'CLOSED' ? 'closed-status' : ''}`}>{round.status === 'DRAFT' ? 'Draft' : round.status === 'ACTIVE' ? 'Active' : 'Closed'}</span></div>
								{round.status === 'DRAFT' ? <>{round.roundNumber > 1 && <button className="primary-button" type="button" disabled={roundLifecycleBusy || round.selectionCount === null} onClick={() => onOpenStartDialog(round)}>Start voting</button>}{round.roundNumber === 1 && firstRoundDraftStale && <p className="form-note">The shared list changed after this draft was saved. Update the draft roster before starting.</p>}</> : round.accessToken && round.id !== latestClosedRound?.id && <>
									<label className="share-label" htmlFor={`voting-share-${round.id}`}>Public voting link</label>
									<div className="intake-controls share-controls"><input id={`voting-share-${round.id}`} value={`${window.location.origin}/vote/${encodeURIComponent(round.accessToken)}`} readOnly onFocus={(event) => event.currentTarget.select()} /><button className="secondary-button" type="button" onClick={() => onCopyVotingLink(round)}>{copiedRoundId === round.id ? 'Copied' : 'Copy link'}</button></div>
								</>}
								{round.status === 'CLOSED' && round.id !== latestClosedRound?.id && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setReopenRoundId(round.id)}>Reopen voting</button>}
								{round.status === 'CLOSED' && round.id !== latestClosedRound?.id && !rounds.some((item) => item.roundNumber > round.roundNumber) && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setResetRoundId(round.id)}>Reset round</button>}
								{(round.resetCount ?? 0) > 0 && <p className="form-note">Reset count: {round.resetCount}</p>}
								{round.status === 'CLOSED' && round.id !== latestClosedRound?.id && <VotingDecisions roundNumber={round.roundNumber} result={roundResults[round.id]} aggregate={roundAggregateResults[round.id]} openingCount={openingCount} rounds={rounds} roundResults={roundResults} selectionCount={round.selectionCount} showHeading={false} decisionDrafts={decisionDrafts} setDecisionDrafts={setDecisionDrafts} saving={Boolean(savingDecisionCandidateId)} onSave={() => onSaveCandidateDecisions(round.id)} />}
							</div>
						</details>
					</li>)}
				</ul>}
				{draftRoundId && !firstRoundSetupVisible && <p className="state-message saved-round-summary" role="status">Draft round {rounds.find((round) => round.id === draftRoundId)?.roundNumber}: allows {rounds.find((round) => round.id === draftRoundId)?.selectionCount} {rounds.find((round) => round.id === draftRoundId)?.selectionCount === 1 ? 'selection' : 'selections'} from {rounds.find((round) => round.id === draftRoundId)?.candidates.length} candidates.</p>}
				{firstRoundSetupVisible && !hasActiveRound ? <VotingRoundSetup
					roundNumber={1}
					candidateNames={selectionCandidates}
					selectionCount={selectionCount}
					expectedVoterCount={expectedVoterCount}
					isSaving={roundsSaving}
					isLoading={roundsLoading}
					hasSavedDraft={draftRound?.roundNumber === 1 && draftRound.status === 'DRAFT'}
					resetCount={draftRound?.resetCount ?? 0}
					canStart={Boolean(Number.isInteger(Number(selectionCount)) && Number(selectionCount) >= 1 && Number(selectionCount) <= selectionCandidates.length && !roundsSaving && !roundsLoading && !firstRoundDraftStale)}
					error={roundsError}
					success={roundsSuccess}
					cancelDraftLabel="Cancel and rebuild draft"
					onSelectionCountChange={(value) => { setSelectionCount(value); onDraftStateChange(value !== selectionCountBaseline); }}
					onExpectedVoterCountChange={setExpectedVoterCount}
					onStart={(event, trigger) => onSaveAndOpenStartDialog(event, trigger)}
					onCancel={onCancelFirstRoundDraft}
				/> : hasActiveRound ? <p className="state-message" role="status">Voting remains open until you close it. Afterward, choose an outcome for each candidate and save the decisions.</p> : draftRoundId || rounds.length === 0 || selectionCandidates.length > 0 ? <form className="round-configuration-form" onSubmit={onSaveRoundConfiguration}>
					<div className="round-candidate-roster"><span className="summary-label">{latestRound ? 'Candidates advancing to this round' : 'Candidates in this poll'}</span><ul aria-label={latestRound ? 'Candidates advancing to this round' : 'Candidates in this poll'}>{selectionCandidates.map((name) => <li key={name}>{name}</li>)}</ul>{!latestClosedRound && !hasActiveRound && <button className="secondary-button" type="button" onClick={onEditCandidateList}>Edit candidate list</button>}</div>
					<label className="round-selection-count" htmlFor="round-selection-count">How many names can each ballot select?</label>
					<div className="round-selection-stepper" role="group" aria-label="Selections allowed per ballot"><button className="round-selection-step" type="button" aria-label="Decrease selections per ballot" disabled={roundsSaving || Number(selectionCount) <= 1} onClick={() => { const next = String(Math.max(1, Number(selectionCount || 1) - 1)); setSelectionCount(next); onDraftStateChange(next !== selectionCountBaseline); }}>−</button><input id="round-selection-count" type="number" min="1" max={selectionCandidates.length} step="1" inputMode="numeric" aria-describedby="round-selection-count-help" value={selectionCount} onChange={(event) => { setSelectionCount(event.target.value); onDraftStateChange(event.target.value !== selectionCountBaseline); }} required disabled={roundsSaving} /><button className="round-selection-step" type="button" aria-label="Increase selections per ballot" disabled={roundsSaving || Number(selectionCount) >= selectionCandidates.length} onClick={() => { const next = String(Math.min(selectionCandidates.length, Number(selectionCount || 1) + 1)); setSelectionCount(next); onDraftStateChange(next !== selectionCountBaseline); }}>+</button></div>
					<p className="form-note" id="round-selection-count-help">Choose from 1 to {selectionCandidates.length}, the number of candidates in the confirmed list.</p>
					<div className="form-actions"><button className="primary-button" type="submit" disabled={roundsSaving || roundsLoading}>{roundsSaving ? 'Saving…' : 'Save round setup'}</button>{draftRound && draftRound.selectionCount !== null && <><button className="primary-button" type="button" disabled={roundsSaving || roundsLoading || firstRoundDraftStale} onClick={() => onOpenStartDialog(draftRound)}>Start voting</button>{draftRound.roundNumber === 1 && <button className="secondary-button" type="button" disabled={roundsSaving || roundsLoading} onClick={onCancelFirstRoundDraft}>Cancel and rebuild draft</button>}</>}</div>
				</form> : <p className="state-message" role="status">No candidates are ready for the next round. Mark at least two candidates Advanced in the closed round to continue.</p>}
				{!firstRoundSetupVisible && !hasActiveRound && roundsSuccess && <p className="state-message" role="status" tabIndex={roundsSuccess.startsWith('Voting is active') ? -1 : undefined} ref={roundsSuccess.startsWith('Voting is active') ? startSuccessRef : undefined}>{roundsSuccess}</p>}
			</>}
		</section>
		{startRoundId && <StartVotingDialog round={rounds.find((round) => round.id === startRoundId)} lifecycleBusy={roundLifecycleBusy} roundsError={roundsError} expectedVoterCount={expectedVoterCount} setExpectedVoterCount={setExpectedVoterCount} inputRef={expectedVoterInputRef} onSubmit={onSaveStartRound} onCancel={() => setStartRoundId(null)} />}
		{reopenRoundId && <ConfirmationDialog title={`Reopen voting for round ${rounds.find((round) => round.id === reopenRoundId)?.roundNumber}?`} titleId="reopen-voting-title" descriptionId="reopen-voting-description" description="Reopening makes the ballot available again. Voting stays open until an administrator closes it." busy={roundLifecycleBusy} onCancel={() => setReopenRoundId(null)} onConfirm={onReopenRound} confirmLabel="Confirm reopen" />}
		{resetRoundId && <ResetRoundDialog round={rounds.find((round) => round.id === resetRoundId)} lifecycleBusy={roundLifecycleBusy} roundsError={roundsError} onCancel={() => setResetRoundId(null)} onConfirm={onResetRound} />}
	</details>;
}

function StartVotingDialog({ round, lifecycleBusy, roundsError, expectedVoterCount, setExpectedVoterCount, inputRef, onSubmit, onCancel }: {
	round?: VotingRound;
	lifecycleBusy: boolean;
	roundsError: string;
	expectedVoterCount: string;
	setExpectedVoterCount: (value: string) => void;
	inputRef: RefObject<HTMLInputElement>;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	onCancel: () => void;
}) {
	if (!round) return null;
	return <div className="dialog-backdrop"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="start-voting-title" aria-describedby="start-voting-description">
		<h3 id="start-voting-title">Start voting for round {round.roundNumber}?</h3>
		{lifecycleBusy && <p className="state-message" role="status">Starting voting…</p>}
		<p id="start-voting-description">Expected voter count: {Number.isInteger(Number(expectedVoterCount)) ? expectedVoterCount : 'not set'}. Confirm the count below; the round will become active immediately.</p>
		{roundsError && <p className="error-message" role="alert">{roundsError}</p>}
		<form onSubmit={onSubmit}><label htmlFor="expected-voter-count">Expected voter count</label><input ref={inputRef} id="expected-voter-count" type="number" min="1" step="1" value={expectedVoterCount} onChange={(event) => setExpectedVoterCount(event.target.value)} required autoFocus /><div className="form-actions dialog-actions"><button className="secondary-button" type="button" disabled={lifecycleBusy} onClick={onCancel}>Cancel</button><button className="primary-button" type="submit" disabled={lifecycleBusy}>{lifecycleBusy ? 'Starting…' : 'Confirm and start'}</button></div></form>
	</section></div>;
}

function ConfirmationDialog({ title, titleId, descriptionId, description, busy, onCancel, onConfirm, confirmLabel }: { title: string; titleId: string; descriptionId: string; description: string; busy: boolean; onCancel: () => void; onConfirm: () => void; confirmLabel: string }) {
	return <div className="dialog-backdrop"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}><h3 id={titleId}>{title}</h3><p id={descriptionId}>{description}</p><div className="form-actions dialog-actions"><button className="secondary-button" type="button" disabled={busy} onClick={onCancel}>Cancel</button><button className="primary-button" type="button" disabled={busy} onClick={onConfirm}>{busy ? 'Reopening…' : confirmLabel}</button></div></section></div>;
}

function ResetRoundDialog({ round, lifecycleBusy, roundsError, onCancel, onConfirm }: { round?: VotingRound; lifecycleBusy: boolean; roundsError: string; onCancel: () => void; onConfirm: () => void }) {
	if (!round || (round.status !== 'CLOSED' && round.status !== 'ACTIVE')) return null;
	const cancellingActiveRound = round.status === 'ACTIVE';
	return <div className="dialog-backdrop"><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-round-title" aria-describedby="reset-round-description">
		<h3 id="reset-round-title">{cancellingActiveRound ? 'Cancel active voting?' : 'Reset this round?'}</h3><p id="reset-round-description">This permanently deletes ballots and current decisions. The candidate roster stays in place. Selection count and expected voter count are cleared; configure them again to start from zero.</p>
		{roundsError && <p className="error-message" role="alert">{roundsError}</p>}<div className="form-actions dialog-actions"><button className="secondary-button" type="button" disabled={lifecycleBusy} onClick={onCancel}>Cancel</button><button className="danger-button" type="button" disabled={lifecycleBusy} onClick={onConfirm}>{lifecycleBusy ? 'Cancelling…' : cancellingActiveRound ? 'Cancel active voting' : 'Reset round'}</button></div>
	</section></div>;
}