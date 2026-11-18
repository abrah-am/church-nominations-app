import { FormEvent, RefObject } from 'react';
import {
	NominationIntake as NominationIntakeData,
	NominationRemovalReason,
	RemovedNominationEntry,
	SharedNominationEntry,
} from '../../api/nominations';
import { ClosedNominationReviewStage, OpenNominationIntakeStage } from './NominationWorkflowStages';

type NominationIntakeProps = {
	view: 'stage' | 'editor';
	positionName: string;
	openingCount: number;
	isExpanded: boolean;
	isLoading: boolean;
	error: string;
	streamStatus: string;
	intake: NominationIntakeData | null;
	nameLimit: string;
	onNameLimitChange: (value: string) => void;
	onCreateIntake: (event: FormEvent<HTMLFormElement>) => void;
	onRetryIntake: () => void;
	onCloseIntake: () => void;
	onConfirmConsolidatedList: () => void;
	closeDialogOpen: boolean;
	keepIntakeOpenRef: RefObject<HTMLButtonElement>;
	closeButtonRef: RefObject<HTMLButtonElement>;
	onCancelClose: () => void;
	closeDialogError: string;
	onConfirmClose: () => void;
	submissionNames: string[];
	closeTriggerRef: RefObject<HTMLButtonElement>;
	closedStatusRef: RefObject<HTMLParagraphElement>;
	sharedListSectionRef: RefObject<HTMLElement>;
	sharedListDraft: SharedNominationEntry[];
	removedEntries: RemovedNominationEntry[];
	sharedListDirty: boolean;
	sharedListError: string;
	sharedListConflict: boolean;
	sharedListEditing: boolean;
	removalEntry: SharedNominationEntry | null;
	removalReason: NominationRemovalReason;
	removalDetail: string;
	removeDialogRef: RefObject<HTMLElement>;
	hasActiveRound: boolean;
	roundsReady: boolean;
	roundsLoading: boolean;
	firstRoundSetupVisible: boolean;
	prepareRoundButtonRef: RefObject<HTMLButtonElement>;
	roundsCount: number;
	changeEvents: NonNullable<NominationIntakeData['changeEvents']>;
	onUpdateSharedRow: (rowId: string, update: Partial<SharedNominationEntry>) => void;
	onSaveSharedList: (entryId?: string) => void;
	onRemoveSharedEntry: (entry: SharedNominationEntry) => void;
	onRestoreRemovedEntry: (entry: RemovedNominationEntry) => void;
	onReloadSharedList: () => void;
	onRemovalReasonChange: (reason: NominationRemovalReason) => void;
	onRemovalDetailChange: (detail: string) => void;
	onCancelRemoval: () => void;
	onConfirmRemoval: () => void;
	onEditSharedList: () => void;
	onSharedListEditingChange: (editing: boolean) => void;
	onPrepareRound: () => void;
};

export default function NominationIntake({
	positionName,
	openingCount,
	view,
	isExpanded,
	isLoading,
	error,
	streamStatus,
	intake,
	nameLimit,
	onNameLimitChange,
	onCreateIntake,
	onRetryIntake,
	onCloseIntake,
	onConfirmConsolidatedList,
	closeDialogOpen,
	keepIntakeOpenRef,
	closeButtonRef,
	onCancelClose,
	closeDialogError,
	onConfirmClose,
	submissionNames,
	closeTriggerRef,
	closedStatusRef,
	sharedListSectionRef,
	sharedListDraft,
	removedEntries,
	sharedListDirty,
	sharedListError,
	sharedListConflict,
	sharedListEditing,
	removalEntry,
	removalReason,
	removalDetail,
	removeDialogRef,
	hasActiveRound,
	roundsReady,
	roundsLoading,
	firstRoundSetupVisible,
	prepareRoundButtonRef,
	roundsCount,
	changeEvents,
	onUpdateSharedRow,
	onSaveSharedList,
	onRemoveSharedEntry,
	onRestoreRemovedEntry,
	onReloadSharedList,
	onRemovalReasonChange,
	onRemovalDetailChange,
	onCancelRemoval,
	onConfirmRemoval,
	onEditSharedList,
	onSharedListEditingChange,
	onPrepareRound,
}: NominationIntakeProps) {
	const stage = <>
		{isExpanded && isLoading && <p className="state-message" role="status">Loading nomination intake…</p>}
		{error && <p className="error-message" role="alert">{error}</p>}
		{streamStatus && <p className="state-message" role="status">{streamStatus}</p>}
		{!isLoading && !intake && !error && <section className="nomination-intake-setup" role="region" aria-label="Nomination intake setup">
			{isExpanded && <form className="intake-create" onSubmit={onCreateIntake}>
				<h3>Nomination intake</h3>
				<p className="form-note">People can submit proposed names for {positionName} using a position-specific link. Their submissions remain anonymous to administrators.</p>
				<label htmlFor="nomination-name-limit">Maximum names per visitor</label>
				<div className="intake-controls">
					<input id="nomination-name-limit" type="number" min="1" step="1" value={nameLimit} onChange={(event) => onNameLimitChange(event.target.value)} required />
					<button className="primary-button" type="submit" disabled={isLoading}>Create intake</button>
				</div>
			</form>}
			<aside className="position-roster-panel" aria-labelledby="position-roster-title">
				<p className="eyebrow">Nomination intake</p>
				<h3 id="position-roster-title">Names not yet submitted</h3>
				<p>Submitted names are not shown to the audience before consolidation is confirmed and the presentation is shown.</p>
				<div className="position-roster-empty">No candidates yet.</div>
				<span className="position-opening-count">{openingCount} {openingCount === 1 ? 'opening' : 'openings'}</span>
			</aside>
		</section>}
		{isExpanded && !isLoading && !intake && error && (
			<button className="secondary-button" type="button" onClick={onRetryIntake}>Retry loading nominations</button>
		)}
		{isExpanded && !isLoading && intake?.status === 'CLOSED' && roundsCount === 0 && !firstRoundSetupVisible && !hasActiveRound && (
			<ClosedNominationReviewStage intake={intake} sharedListDirty={sharedListDirty} sharedListDraft={sharedListDraft} isLoading={isLoading} statusRef={closedStatusRef} onConfirm={onConfirmConsolidatedList} />
		)}
		{isExpanded && !isLoading && intake?.status === 'OPEN' && (
			<OpenNominationIntakeStage intake={intake} names={submissionNames} closeTriggerRef={closeTriggerRef} isLoading={isLoading} onClose={onCloseIntake} />
		)}
		{closeDialogOpen && (
			<div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancelClose(); }}>
				<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="close-nominations-title" aria-describedby="close-nominations-description">
					<h3 id="close-nominations-title">Close nominations?</h3>
					<p id="close-nominations-description">The public link will stop accepting changes. You can review and consolidate submitted names before confirming the list.</p>
					{isLoading && <p role="status">Closing nominations…</p>}
					{closeDialogError && <p className="error-message" role="alert">{closeDialogError}</p>}
					<div className="dialog-actions">
						<button ref={keepIntakeOpenRef} className="secondary-button" type="button" disabled={isLoading} onClick={onCancelClose}>Keep intake open</button>
						<button ref={closeButtonRef} className="danger-button" type="button" disabled={isLoading} onClick={onConfirmClose}>Close nominations</button>
					</div>
				</section>
			</div>
		)}
	</>;
	const editor = <>
		{removalEntry && (
			<div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isLoading) onCancelRemoval(); }}>
				<section ref={removeDialogRef} className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-nomination-title">
					<h3 id="remove-nomination-title">Remove {removalEntry.name}?</h3>
					<label htmlFor="nomination-removal-reason">Reason</label>
					<select id="nomination-removal-reason" value={removalReason} onChange={(event) => onRemovalReasonChange(event.target.value as NominationRemovalReason)}>
						<option value="DUPLICATE">Duplicate</option><option value="DECLINED">Declined</option><option value="OTHER">Other</option>
					</select>
					{removalReason === 'OTHER' && <label htmlFor="nomination-removal-detail">Details<input id="nomination-removal-detail" value={removalDetail} onChange={(event) => onRemovalDetailChange(event.target.value)} required /></label>}
					{sharedListError && <p className="error-message" role="alert">{sharedListError}</p>}
					{sharedListConflict && <button className="secondary-button" type="button" disabled={isLoading} onClick={onReloadSharedList}>Reload latest saved list</button>}
					<div className="dialog-actions"><button className="secondary-button" type="button" disabled={isLoading} onClick={onCancelRemoval}>Cancel</button><button className="danger-button" type="button" disabled={isLoading || (removalReason === 'OTHER' && !removalDetail.trim())} onClick={onConfirmRemoval}>Confirm removal</button></div>
				</section>
			</div>
		)}
		{isExpanded && !isLoading && intake?.status === 'CLOSED' && intake.listCreated && roundsCount === 0 && !hasActiveRound && (
			<section ref={sharedListSectionRef} className="workflow-details consolidation-details">
				<div className="consolidation-list-heading">
					<h3>{intake.revealed ? 'Consolidated list' : 'Review and consolidate'}</h3>
					<span>{sharedListDraft.filter((entry) => entry.active).length} candidates</span>
				</div>
				<div className="consolidation-complete">
					{(!intake.revealed || sharedListEditing) ? <ol className="member-list shared-nomination-list" aria-label="Shared nomination list">
						{sharedListDraft.map((entry) => {
							const savedName = intake.sharedList.find((savedEntry) => savedEntry.id === entry.id)?.name;
							const rowDirty = entry.active && savedName !== entry.name;
							return <li key={entry.id} className="shared-nomination-row">
								<label className="sr-only" htmlFor={`shared-nomination-${entry.id}`}>Correct {savedName ?? entry.name}</label>
								<input id={`shared-nomination-${entry.id}`} value={entry.name} onChange={(event) => onUpdateSharedRow(entry.id, { name: event.target.value })} disabled={hasActiveRound || !entry.active} />
								{entry.active && <>
									<button className="icon-button shared-nomination-save" type="button" aria-label={`Save ${savedName ?? entry.name}`} title="Save name" disabled={isLoading || hasActiveRound || !rowDirty || !entry.name.trim()} onClick={() => onSaveSharedList(entry.id)}>
										<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8M9 15h6" /></svg>
									</button>
									<button className="icon-button shared-nomination-remove" type="button" aria-label={`Remove ${entry.name}`} title="Remove name" disabled={isLoading || hasActiveRound || sharedListDirty} onClick={() => onRemoveSharedEntry(entry)}>
										<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7m4 3v7m4-7v7" /></svg>
									</button>
								</>}
							</li>;
						})}
					</ol> : <ol className="member-list shared-nomination-list" aria-label="Confirmed consolidated list">
						{sharedListDraft.filter((entry) => entry.active).map((entry) => <li key={entry.id}><span className="shared-nomination-name">{entry.name}</span></li>)}
					</ol>}
					{removedEntries.length > 0 && <details className="removed-nomination-section">
						<summary>Removed ({removedEntries.length})</summary>
						<ul className="member-list" aria-label="Removed nominations">
							{removedEntries.map((entry) => <li key={entry.auditEventId}>
								<span className="shared-nomination-name">{entry.name}</span>
								<button className="icon-button shared-nomination-restore" type="button" aria-label={`Restore ${entry.name}`} title="Restore name" disabled={isLoading || !roundsReady || roundsLoading || hasActiveRound || sharedListDirty} onClick={() => onRestoreRemovedEntry(entry)}><span aria-hidden="true">↶</span></button>
							</li>)}
						</ul>
					</details>}
					{sharedListError && !removalEntry && <p className="error-message" role="alert">{sharedListError}</p>}
					{sharedListDirty && <div className="shared-list-recovery"><p className="form-note">Unsaved edits are kept here and are not visible on the presentation.</p><button className="primary-button" type="button" disabled={isLoading || hasActiveRound} onClick={() => onSaveSharedList()}>{isLoading ? 'Saving…' : 'Save changes'}</button>{sharedListConflict && <button className="secondary-button" type="button" disabled={isLoading} onClick={onReloadSharedList}>Reload latest saved list</button>}</div>}
					{sharedListConflict && !sharedListDirty && !removalEntry && <button className="secondary-button" type="button" disabled={isLoading} onClick={onReloadSharedList}>Reload latest saved list</button>}
					{hasActiveRound && <p className="form-note">Shared-list editing is unavailable while voting is active.</p>}
					{changeEvents.length > 0 && <details className="admin-change-history"><summary>Confirmed change history ({changeEvents.length})</summary><ol>{changeEvents.map((event) => <li key={event.id}><span>{event.action === 'CORRECTED' ? `${event.beforeName} → ${event.afterName}` : event.action === 'REMOVED' ? `${event.beforeName} removed · ${event.removalReason ?? 'Other'}${event.reasonDetail ? `: ${event.reasonDetail}` : ''}` : `${event.afterName ?? event.beforeName} restored`}</span><small>{event.actorLabel} · {new Date(event.occurredAt).toLocaleString()}</small></li>)}</ol></details>}
					{intake.revealed && !sharedListEditing && !firstRoundSetupVisible && !hasActiveRound && <div className="form-actions">
						<button className="secondary-button" type="button" onClick={onEditSharedList}>Edit consolidated list</button>
						{roundsCount === 0 && <button ref={prepareRoundButtonRef} className="primary-button" type="button" onClick={onPrepareRound}>Prepare round 1</button>}
					</div>}
					{intake.revealed && sharedListEditing && !sharedListDirty && <button className="secondary-button" type="button" onClick={() => onSharedListEditingChange(false)}>Done editing</button>}
				</div>
			</section>
		)}
	</>;
	return view === 'stage' ? stage : editor;
}