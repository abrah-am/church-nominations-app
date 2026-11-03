import { FormEvent, useEffect, useRef } from 'react';

export type RoundPollSetupProps = {
	roundNumber: number;
	candidateNames: string[];
	selectionCount: string;
	isSaving: boolean;
	isLoading: boolean;
	hasSavedDraft: boolean;
	resetCount: number;
	canStart: boolean;
	error: string;
	success: string;
	cancelDraftLabel?: string;
	onSelectionCountChange: (value: string) => void;
	onStart: (event: FormEvent<HTMLFormElement>, trigger: HTMLButtonElement) => void;
	onCancel: () => void;
};

export default function RoundPollSetup({ roundNumber, candidateNames, selectionCount, isSaving, isLoading, hasSavedDraft, resetCount, canStart, error, success, cancelDraftLabel = 'Cancel draft', onSelectionCountChange, onStart, onCancel }: RoundPollSetupProps) {
	const headingRef = useRef<HTMLHeadingElement>(null);
	const startButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		headingRef.current?.focus();
	}, []);

	return (
		<section className="round-poll-setup" aria-labelledby="round-poll-setup-title">
			<div className="round-poll-setup-controls">
				<h3 id="round-poll-setup-title" ref={headingRef} tabIndex={-1}>Round {roundNumber} setup</h3>
				<form className="round-configuration-form" onSubmit={(event) => { if (startButtonRef.current) onStart(event, startButtonRef.current); }}>
					{isSaving && <p className="state-message" role="status">Saving round setup…</p>}
					<label className="round-selection-count" htmlFor="round-selection-count">How many candidates can each ballot select?</label>
					<input
						className="form-control round-poll-selection-input"
						id="round-selection-count"
						type="number"
						min="1"
						max={candidateNames.length}
						step="1"
						inputMode="numeric"
						aria-describedby="round-selection-count-help"
						value={selectionCount}
						onChange={(event) => onSelectionCountChange(event.target.value)}
						required
						disabled={isSaving}
					/>
					<p className="form-note" id="round-selection-count-help">Enter a whole number from 1 through {candidateNames.length}, the number of candidates.</p>
					{resetCount > 0 && <p className="form-note">Reset count: {resetCount}</p>}
					<div className="form-actions">
						<button ref={startButtonRef} className="primary-button" type="submit" disabled={!canStart || isSaving || isLoading}>{isSaving ? 'Saving…' : 'Start Voting'}</button>
						{hasSavedDraft && <button className="secondary-button" type="button" disabled={isSaving || isLoading || resetCount > 0} onClick={onCancel}>{cancelDraftLabel}</button>}
					</div>
				</form>
				{error && <p className="error-message" role="alert">{error}</p>}
				{success && <p className="state-message" role="status">{success}</p>}
			</div>
			<aside className="round-poll-setup-roster" aria-label={`Round ${roundNumber} candidate roster`}>
				<p className="eyebrow">Round {roundNumber} · candidate roster</p>
				<h4>People on the ballot</h4>
				<p className="form-note">Confirmed candidates for this poll. The ballot uses this same list.</p>
				<ol aria-label="Candidates in this poll">
					{candidateNames.map((name, index) => <li key={`${index}-${name}`}>{name}</li>)}
				</ol>
			</aside>
		</section>
	);
}