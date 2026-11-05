import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
	NominationIntake,
	NominationsApiError,
	NominationRemovalReason,
	closeNominationIntake,
	createNominationIntake,
	endNominationPresentation,
	getNominationIntake,
	hideNominationPresentation,
	revealNominationIntake,
	showNominationPresentation,
	streamNominationIntake,
	updateSharedNominationList,
	restoreSharedNominationEntry,
	SharedNominationEntry,
	RemovedNominationEntry,
} from '../../api/nominations';
import {
	CandidateDecision,
	RoundsApiError,
	VotingRound,
	VotingRoundAggregateResults,
	VotingRoundProgress,
	VotingRoundResult,
	createVotingRound,
	getVotingRoundAggregateResults,
	getVotingRoundProgress,
	getVotingRoundResults,
	listVotingRounds,
	deleteDraftVotingRound,
	saveCandidateDecision,
	updateVotingRound,
} from '../../api/rounds';
import {
	closeVotingRound,
	reopenVotingRound,
	resetVotingRound,
	startVotingRound,
} from '../../api/voting';
import { AudiencePresentationCard } from '../../components/AudiencePresentationCard';
import { ParticipantSessionLinkCard } from '../../components/ParticipantSessionLinkCard';
import NominationAdminPanelHeader from './NominationAdminPanelHeader';
import NominationIntakeComponent from './NominationIntake';
import NominationVoting from './NominationVoting';

export type NominationAdminPanelProps = {
	credentials: string;
	electionId: string;
	positionId: string;
	positionName: string;
	churchName: string;
	electionTerm: string;
	departmentName: string;
	openingCount: number;
	positionProgressStatus: string;
	onReturnToElectionList: () => void;
	onLifecycleChange: (completionMayChange?: boolean) => void;
	onDraftStateChange: (dirty: boolean) => void;
};

function normalizeNominationIntake(intake: NominationIntake): NominationIntake {
	const sharedList = Array.isArray(intake.sharedList) ? intake.sharedList : [];
	const submissions = Array.isArray(intake.submissions)
		? intake.submissions.filter((submission) => submission && typeof submission.id === 'string' && typeof submission.name === 'string')
		: [];
	return {
		...intake,
		removedEntries: Array.isArray(intake.removedEntries) ? intake.removedEntries : [],
		changeEvents: Array.isArray(intake.changeEvents) ? intake.changeEvents : [],
		currentContributorCount: Number.isFinite(intake.currentContributorCount)
			? intake.currentContributorCount
			: submissions.length === 0 ? 0 : null,
		submissions,
		sharedList: [...sharedList].sort((first, second) => first.sequence - second.sequence),
	};
}

export default function NominationAdminPanel({ credentials, electionId, positionId, positionName, churchName, electionTerm, departmentName, openingCount, positionProgressStatus, onReturnToElectionList, onLifecycleChange, onDraftStateChange }: NominationAdminPanelProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [intakeDetailsOpen, setIntakeDetailsOpen] = useState(true);
	const [intake, setIntake] = useState<NominationIntake | null>(null);
	const [nameLimit, setNameLimit] = useState('5');
	const [sharedListDraft, setSharedListDraft] = useState<SharedNominationEntry[]>([]);
	const [removedEntries, setRemovedEntries] = useState<RemovedNominationEntry[]>([]);
	const [sharedListDirty, setSharedListDirty] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [intakeLoadAttempt, setIntakeLoadAttempt] = useState(0);
	const [error, setError] = useState('');
	const [sharedListError, setSharedListError] = useState('');
	const [sharedListConflict, setSharedListConflict] = useState(false);
	const [streamStatus, setStreamStatus] = useState('');
	const [copied, setCopied] = useState(false);
	const [closeDialogOpen, setCloseDialogOpen] = useState(false);
	const [removalEntry, setRemovalEntry] = useState<SharedNominationEntry | null>(null);
	const [removalReason, setRemovalReason] = useState<NominationRemovalReason>('DUPLICATE');
	const [removalDetail, setRemovalDetail] = useState('');
	const [presentationVisible, setPresentationVisible] = useState(false);
	const [presentationPath, setPresentationPath] = useState('');
	const [presentationError, setPresentationError] = useState('');
	const [presentationBusy, setPresentationBusy] = useState(false);
	const [firstRoundPrepared, setFirstRoundPrepared] = useState(false);
	const [sharedListEditing, setSharedListEditing] = useState(false);
	const [focusClosedStatus, setFocusClosedStatus] = useState(false);
	const [focusPrepareRound, setFocusPrepareRound] = useState(false);
	const [rounds, setRounds] = useState<VotingRound[]>([]);
	const [draftRoundId, setDraftRoundId] = useState<string | null>(null);
	const [selectionCount, setSelectionCount] = useState('');
	const [selectionCountBaseline, setSelectionCountBaseline] = useState('');
	const [roundsLoading, setRoundsLoading] = useState(false);
	const [roundsReady, setRoundsReady] = useState(false);
	const [roundsSaving, setRoundsSaving] = useState(false);
	const [roundsError, setRoundsError] = useState('');
	const [roundsSuccess, setRoundsSuccess] = useState('');
	const [roundsLoadAttempt, setRoundsLoadAttempt] = useState(0);
	const [startRoundId, setStartRoundId] = useState<string | null>(null);
	const [expectedVoterCount, setExpectedVoterCount] = useState('1');
	const [reopenRoundId, setReopenRoundId] = useState<string | null>(null);
	const [resetRoundId, setResetRoundId] = useState<string | null>(null);
	const [roundResults, setRoundResults] = useState<Record<string, VotingRoundResult>>({});
	const [roundAggregateResults, setRoundAggregateResults] = useState<Record<string, VotingRoundAggregateResults>>({});
	const [aggregateRefreshErrors, setAggregateRefreshErrors] = useState<Record<string, boolean>>({});
	const [roundProgress, setRoundProgress] = useState<Record<string, VotingRoundProgress>>({});
	const [decisionDrafts, setDecisionDrafts] = useState<Record<string, { decision: CandidateDecision | null; reason: string }>>({});
	const [savingDecisionCandidateId, setSavingDecisionCandidateId] = useState<string | null>(null);
	const [roundLifecycleBusy, setRoundLifecycleBusy] = useState(false);
	const [copiedRoundId, setCopiedRoundId] = useState<string | null>(null);
	const lifecycleChangeRef = useRef(onLifecycleChange);
	const closeTriggerRef = useRef<HTMLButtonElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const prepareRoundButtonRef = useRef<HTMLButtonElement>(null);
	const startDialogTriggerRef = useRef<HTMLElement | null>(null);
	const startDialogCompletedRef = useRef(false);
	const expectedVoterInputRef = useRef<HTMLInputElement>(null);
	const startSuccessRef = useRef<HTMLParagraphElement>(null);
	const keepIntakeOpenRef = useRef<HTMLButtonElement>(null);
		const removeDialogRef = useRef<HTMLElement>(null);
	const closedStatusRef = useRef<HTMLParagraphElement>(null);
	const sharedListSectionRef = useRef<HTMLElement>(null);
	const previousIntakeRef = useRef<NominationIntake | null>(null);
	useEffect(() => { lifecycleChangeRef.current = onLifecycleChange; }, [onLifecycleChange]);
	useEffect(() => {
		if (!closeDialogOpen) return;
		const trigger = closeTriggerRef.current;
		keepIntakeOpenRef.current?.focus();
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				event.preventDefault();
				setCloseDialogOpen(false);
				return;
			}
			if (event.key !== 'Tab') return;
			const controls = [keepIntakeOpenRef.current, closeButtonRef.current].filter((control): control is HTMLButtonElement => Boolean(control));
			const first = controls[0];
			const last = controls[controls.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
			trigger?.focus();
		};
	}, [closeDialogOpen]);
		useEffect(() => {
			if (!removalEntry) return;
			const trigger = document.activeElement instanceof HTMLButtonElement ? document.activeElement : null;
			const focusableControls = () => Array.from(removeDialogRef.current?.querySelectorAll<HTMLElement>(
				'button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
			) ?? []);
			focusableControls()[0]?.focus();
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.key === 'Escape') {
					event.preventDefault();
					setRemovalEntry(null);
					return;
				}
				if (event.key !== 'Tab') return;
				const controls = focusableControls();
				if (controls.length === 0) return;
				event.preventDefault();
				const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
				const nextIndex = (currentIndex + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
				controls[nextIndex]?.focus();
			};
			window.addEventListener('keydown', handleKeyDown);
			return () => {
				window.removeEventListener('keydown', handleKeyDown);
				trigger?.focus();
			};
		}, [removalEntry]);
	useEffect(() => {
		if (focusClosedStatus) {
			closedStatusRef.current?.focus();
			setFocusClosedStatus(false);
		}
	}, [focusClosedStatus]);
	useEffect(() => {
		if (focusPrepareRound) {
			prepareRoundButtonRef.current?.focus();
			setFocusPrepareRound(false);
		}
	}, [focusPrepareRound]);
	useEffect(() => {
		if (!startRoundId) {
			if (startDialogTriggerRef.current) {
				if (startDialogCompletedRef.current) startSuccessRef.current?.focus();
				else startDialogTriggerRef.current.focus();
				startDialogTriggerRef.current = null;
				startDialogCompletedRef.current = false;
			}
			return;
		}
		if (!startDialogTriggerRef.current && document.activeElement instanceof HTMLElement) {
			startDialogTriggerRef.current = document.activeElement;
		}
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab') return;
			const controls = Array.from(document.querySelectorAll<HTMLElement>(
				'.confirmation-dialog[aria-labelledby="start-voting-title"] button:not([disabled]), .confirmation-dialog[aria-labelledby="start-voting-title"] input:not([disabled])',
			));
			if (controls.length === 0) return;
			const first = controls[0];
			const last = controls[controls.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [startRoundId]);
	const confirmedNames = intake?.status === 'CLOSED' && Array.isArray(intake.consolidatedNames)
		? intake.consolidatedNames
		: [];
	const confirmedChangeEvents = intake?.changeEvents ?? [];
	const hasSavedSnapshot = confirmedNames.length > 0;
	const snapshotKey = JSON.stringify(confirmedNames);
	const activeRound = rounds.find((round) => round.status === 'ACTIVE');
	const hasActiveRound = Boolean(activeRound);
	const activeRoundIdsKey = rounds.filter((round) => round.status === 'ACTIVE').map((round) => round.id).join(',');
	const draftRound = rounds.find((round) => round.id === draftRoundId);
	const firstRoundSetupVisible = !hasActiveRound && (draftRound?.roundNumber === 1 && draftRound.status === 'DRAFT' || firstRoundPrepared && !draftRound && rounds.length === 0);
	const firstRoundDraftStale = Boolean(draftRound?.roundNumber === 1 && intake
		&& draftRound.nominationRevision !== intake.sharedListRevision);
	const latestRound = [...rounds].sort((first, second) => first.roundNumber - second.roundNumber)[rounds.length - 1];
	const latestClosedRound = [...rounds]
		.filter((round) => round.status === 'CLOSED')
		.sort((first, second) => second.roundNumber - first.roundNumber)[0];
	const latestRoundIsDraft = latestRound?.status === 'DRAFT';
	const latestClosedResult = latestClosedRound ? roundResults[latestClosedRound.id] : undefined;
	const decisionsComplete = Boolean(latestClosedResult?.candidates.every((candidate) => candidate.decision));
	const showClosedRoundDecisions = Boolean(latestClosedRound && !hasActiveRound && !latestRoundIsDraft && !firstRoundSetupVisible && !decisionsComplete);
	const latestRevealedRound = [...rounds]
		.filter((round) => round.status === 'CLOSED' && roundResults[round.id])
		.sort((first, second) => second.roundNumber - first.roundNumber)[0];
	const latestRevealedResult = latestRevealedRound ? roundResults[latestRevealedRound.id] : undefined;
	const openSubmissionNames = intake?.status === 'OPEN'
		? [...intake.submissions]
			.map((submission) => submission.name.trim())
			.filter(Boolean)
			.sort((first, second) => first.localeCompare(second, undefined, { sensitivity: 'base' }))
		: [];
	const candidateOptions = latestClosedRound
		? (roundResults[latestClosedRound.id]?.candidates ?? [])
			.filter((candidate) => candidate.decision === 'ADVANCED')
			.map((candidate) => candidate.name)
		: draftRound
			? draftRound.roundNumber === 1 ? confirmedNames : draftRound.candidates.map((candidate) => candidate.name)
			: confirmedNames;
	const currentWorkflowTask = isLoading
		? { stage: 0, title: 'Loading position workflow', description: 'Loading the current intake and round state.' }
		: error
			? { stage: 0, title: 'Position workflow unavailable', description: 'Retry loading the current position state before continuing.' }
			: !intake
		? positionProgressStatus === 'NOMINATIONS_OPEN'
			? { stage: 0, title: 'Collect nominations', description: 'Manage the public nomination link and close intake when ready.' }
			: positionProgressStatus === 'NOMINATIONS_CLOSED' || positionProgressStatus === 'CONSOLIDATED'
				? { stage: 0, title: 'Review and consolidate', description: 'Review proposed names, correct spellings, remove duplicates, then confirm the consolidated list.' }
				: positionProgressStatus === 'ROUND_ACTIVE'
					? { stage: 1, title: `Monitor voting${latestRound ? ` · Round ${latestRound.roundNumber}` : ''}`, description: 'Track participation and review live aggregate totals.' }
					: positionProgressStatus === 'ROUND_CLOSED_UNREVEALED'
						? { stage: 2, title: `Record candidate decisions${latestClosedRound ? ` · Round ${latestClosedRound.roundNumber}` : ''}`, description: 'Review final aggregate results and record each candidate outcome.' }
						: positionProgressStatus === 'RESULTS_REVEALED'
							? { stage: 2, title: 'Record candidate decisions', description: 'Review aggregate results and record who advances, is eliminated, or is elected.' }
							: positionProgressStatus === 'CANDIDATES_ADVANCED'
								? { stage: 1, title: 'Prepare the next round', description: 'Use the saved candidate decisions to prepare the next round.' }
								: positionProgressStatus === 'COMPLETE'
									? { stage: 3, title: 'Position complete', description: 'All election actions for this position are complete.' }
									: { stage: 0, title: 'Set up nomination intake', description: 'Set the name limit and create an intake link for this position.' }
		: intake.status === 'OPEN'
			? { stage: 0, title: 'Collect nominations', description: 'Share the nomination link, monitor profile submissions, and close intake when ready.' }
			: !intake.revealed && rounds.length === 0
				? { stage: 0, title: 'Review and consolidate', description: 'Review proposed names, correct spellings, remove duplicates, then confirm the consolidated list.' }
				: activeRound
					? { stage: 1, title: 'Voting is active', description: 'Track profile/link submissions only. Ballot totals remain hidden while voting is active.' }
					: latestRoundIsDraft
						? { stage: 1, title: `Prepare voting · Round ${latestRound.roundNumber}`, description: 'Confirm the roster and selection count before starting the voting round.' }
					: showClosedRoundDecisions
						? { stage: 2, title: `Record candidate decisions · Round ${latestRevealedRound?.roundNumber}`, description: 'Review final aggregate results and record who advances, is eliminated, or is elected.' }
						: latestRevealedResult && !latestRevealedResult.candidates.every((candidate) => candidate.decision)
							? { stage: 2, title: `Record candidate decisions · Round ${latestRevealedRound?.roundNumber}`, description: 'Review aggregate results and record who advances, is eliminated, or is elected.' }
							: latestClosedRound && !decisionsComplete
								? { stage: 2, title: `Record candidate decisions · Round ${latestClosedRound.roundNumber}`, description: 'Choose Elect, Advance, or Remove for each candidate, then save the decisions.' }
								: latestClosedRound && decisionsComplete && candidateOptions.length >= 2
									? { stage: 1, title: `Prepare the next round · Round ${latestClosedRound.roundNumber + 1}`, description: 'Review the candidates marked Advance and configure the next round.' }
								: !latestRound && intake.revealed
									? { stage: 1, title: 'Prepare round 1', description: 'Review the confirmed list and configure how many names each ballot can select.' }
								: latestRevealedRound
									? { stage: positionProgressStatus === 'COMPLETE' ? 3 : 1, title: positionProgressStatus === 'COMPLETE' ? 'Position complete' : `Prepare the next round · Round ${latestRevealedRound.roundNumber + 1}`, description: positionProgressStatus === 'COMPLETE' ? 'All election actions for this position are complete.' : 'Use the saved candidate decisions to prepare the next round.' }
										: { stage: 0, title: 'Prepare voting', description: 'Configure the first round using the confirmed nomination list.' };
	const unsavedDrafts = (!intake && nameLimit !== '5')
		|| sharedListDirty
		|| (hasSavedSnapshot && roundsReady && selectionCount !== selectionCountBaseline)
		|| Object.entries(decisionDrafts).some(([candidateId, draft]) => {
			const candidate = rounds.flatMap((round) => roundResults[round.id]?.candidates ?? []).find((item) => item.id === candidateId);
			return candidate && (draft.decision !== (candidate.decision ?? null) || draft.reason.trim() !== (candidate.decisionReason ?? '').trim());
		});

	useLayoutEffect(() => {
		onDraftStateChange(unsavedDrafts);
	}, [onDraftStateChange, unsavedDrafts]);

	function updateDraftState(dirty: boolean) {
		onDraftStateChange(dirty);
	}

	useEffect(() => {
		if (intake?.status !== 'CLOSED' || (!hasSavedSnapshot && removedEntries.length === 0)) {
			setRounds([]);
			setDraftRoundId(null);
			setSelectionCount('');
			setSelectionCountBaseline('');
			setRoundResults({});
			setRoundAggregateResults({});
			setAggregateRefreshErrors({});
			setRoundsError('');
			setRoundsReady(false);
			setRoundsLoading(false);
			return;
		}

		let isCurrent = true;
		setRoundsLoading(true);
		setRoundsReady(false);
		setRoundsError('');
		setRoundsSuccess('');
		setRoundResults({});
		setRoundAggregateResults({});
		setAggregateRefreshErrors({});
		listVotingRounds(credentials, electionId, positionId).then((loaded) => {
			if (!isCurrent) return;
			setRounds(loaded);
			const draft = loaded
				.filter((round) => round.status === 'DRAFT')
				.sort((first, second) => second.roundNumber - first.roundNumber)[0];
			setDraftRoundId(draft?.id ?? null);
			setSelectionCount(draft ? String(draft.selectionCount) : '');
			setSelectionCountBaseline(draft ? String(draft.selectionCount) : '');
			const closedRounds = loaded.filter((round) => round.status === 'CLOSED');
			return Promise.all(closedRounds.map(async (round) => {
				try {
					const result = await getVotingRoundResults(credentials, electionId, positionId, round.id);
					return { roundId: round.id, result };
				} catch (requestError) {
					if (requestError instanceof RoundsApiError && requestError.status === 404) return { roundId: round.id, result: null };
					throw requestError;
				}
			})).then((loadedResults) => {
				if (!isCurrent) return;
				setRoundResults(Object.fromEntries(loadedResults.filter((entry) => entry.result !== null).map((entry) => [entry.roundId, entry.result as VotingRoundResult])));
				setRoundAggregateResults({});
				setRoundsReady(true);
			});
		}).catch((requestError: unknown) => {
			if (!isCurrent) return;
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not load voting round configuration.');
		}).finally(() => {
			if (isCurrent) setRoundsLoading(false);
		});

		return () => { isCurrent = false; };
	}, [credentials, electionId, positionId, intake?.status, hasSavedSnapshot, removedEntries.length, snapshotKey, roundsLoadAttempt]);

	useEffect(() => {
		const activeRoundIds = activeRoundIdsKey ? activeRoundIdsKey.split(',') : [];
		let isCurrent = true;
		const inFlight = new Set<string>();

		setRoundProgress((current) => Object.fromEntries(Object.entries(current).filter(([roundId]) => activeRoundIds.includes(roundId))));
		setAggregateRefreshErrors((current) => Object.fromEntries(Object.entries(current).filter(([roundId]) => activeRoundIds.includes(roundId))));
		if (activeRoundIds.length === 0) return () => { isCurrent = false; };

		const pollProgress = async () => {
			await Promise.all(activeRoundIds.map(async (roundId) => {
				if (inFlight.has(roundId)) return;
				inFlight.add(roundId);
				try {
					const progress = await getVotingRoundProgress(credentials, electionId, positionId, roundId);
					if (!isCurrent) return;
					setRoundProgress((current) => ({ ...current, [roundId]: progress }));
					try {
						const aggregate = await getVotingRoundAggregateResults(credentials, electionId, positionId, roundId);
						if (!isCurrent) return;
						setRoundAggregateResults((current) => ({ ...current, [roundId]: aggregate }));
						setAggregateRefreshErrors((current) => ({ ...current, [roundId]: false }));
					} catch {
						if (isCurrent) setAggregateRefreshErrors((current) => ({ ...current, [roundId]: true }));
					}
					if (!isCurrent) return;
					if (progress.status === 'CLOSED') {
						lifecycleChangeRef.current();
						try {
							const result = await getVotingRoundResults(credentials, electionId, positionId, roundId);
							if (!isCurrent) return;
							setRoundResults((current) => ({ ...current, [roundId]: result }));
						} catch (requestError) {
							if (!isCurrent) return;
							if (requestError instanceof RoundsApiError && requestError.status === 404) {
								setRoundResults((current) => {
									const next = { ...current };
									delete next[roundId];
									return next;
								});
							} else {
								setRoundsError(requestError instanceof Error ? requestError.message : 'Could not refresh voting round results.');
							}
						}
						if (!isCurrent) return;
					}
					if (progress.status !== 'ACTIVE') {
						setRounds((current) => current.map((round) => round.id === roundId ? { ...round, status: progress.status } : round));
					}
				} catch {
					// Keep the latest known count if a polling request fails.
				} finally {
					inFlight.delete(roundId);
				}
			}));
		};

		void pollProgress();
		const intervalId = window.setInterval(() => { void pollProgress(); }, 5000);
		return () => {
			isCurrent = false;
			window.clearInterval(intervalId);
		};
	}, [credentials, electionId, positionId, activeRoundIdsKey]);

	useEffect(() => {
		let isCurrent = true;
		setIsExpanded(true);
		setIsLoading(true);
		setError('');
		getNominationIntake(credentials, electionId, positionId).then((snapshot) => {
			if (!isCurrent) return;
			const normalized = normalizeNominationIntake(snapshot);
			setIntake(normalized);
			previousIntakeRef.current = normalized;
			setIntakeDetailsOpen(true);
			setSharedListDraft(normalized.sharedList);
			setRemovedEntries(normalized.removedEntries ?? []);
			setSharedListDirty(false);
		}).catch((requestError: unknown) => {
			if (!isCurrent) return;
			if (requestError instanceof NominationsApiError && requestError.status === 404) {
				setIntake(null);
			} else {
				setError(requestError instanceof Error ? requestError.message : 'Could not load nomination intake.');
			}
		}).finally(() => {
			if (isCurrent) setIsLoading(false);
		});
		return () => { isCurrent = false; };
	}, [credentials, electionId, positionId, intakeLoadAttempt]);

	useEffect(() => {
		if (!isExpanded || !intakeDetailsOpen || intake?.status !== 'OPEN') {
			setStreamStatus('');
			return;
		}

		const controller = new AbortController();
		let intakeClosed = false;
		let pollInterval: number | undefined;
		let pollInFlight = false;

		const applySnapshot = (snapshot: NominationIntake) => {
			const normalized = normalizeNominationIntake(snapshot);
			const previous = previousIntakeRef.current;
			if (previous?.status === 'CLOSED' && normalized.status === 'OPEN') return;
			previousIntakeRef.current = normalized;
			intakeClosed = normalized.status === 'CLOSED';
			setIntake(normalized);
			previousIntakeRef.current = normalized;
			if (normalized.status === 'CLOSED') {
				setSharedListDraft(normalized.sharedList);
				setRemovedEntries(normalized.removedEntries ?? []);
				setSharedListDirty(false);
			}
			setStreamStatus('');
		};

		const pollSnapshot = async () => {
			if (controller.signal.aborted || pollInFlight) return;
			pollInFlight = true;
			try {
				applySnapshot(await getNominationIntake(credentials, electionId, positionId));
			} catch {
				// Keep the latest stream snapshot if the fallback request also fails.
			} finally {
				pollInFlight = false;
			}
		};

		const startPolling = () => {
			if (controller.signal.aborted || pollInterval !== undefined || intakeClosed) return;
			setStreamStatus('Live updates unavailable. Refreshing submissions periodically.');
			void pollSnapshot();
			pollInterval = window.setInterval(() => { void pollSnapshot(); }, 5000);
		};

		void streamNominationIntake(credentials, electionId, positionId, controller.signal, applySnapshot)
			.then(async () => {
				if (controller.signal.aborted || intakeClosed) return;
				try {
					applySnapshot(await getNominationIntake(credentials, electionId, positionId));
				} catch {
					// Fall back to snapshots when the stream ends without a closing event.
				}
				if (!intakeClosed) startPolling();
			})
			.catch(() => {
				if (!controller.signal.aborted) startPolling();
			});

		return () => {
			controller.abort();
			if (pollInterval !== undefined) window.clearInterval(pollInterval);
		};
	}, [credentials, electionId, positionId, isExpanded, intakeDetailsOpen, intake?.status]);

	async function createIntake(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setIsLoading(true);
		setError('');
		try {
			const created = normalizeNominationIntake(await createNominationIntake(credentials, electionId, positionId, Number(nameLimit)));
			setIntake(created);
			previousIntakeRef.current = created;
			setIntakeDetailsOpen(true);
			onLifecycleChange();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Could not create nomination intake.');
		} finally {
			setIsLoading(false);
		}
	}

	async function closeIntake() {
		setIsLoading(true);
		setError('');
		try {
			const closed = normalizeNominationIntake(await closeNominationIntake(credentials, electionId, positionId));
			setIntake(closed);
			previousIntakeRef.current = closed;
			setIntakeDetailsOpen(true);
			setSharedListDraft(closed.sharedList);
			setRemovedEntries(closed.removedEntries ?? []);
			setSharedListDirty(false);
			setCloseDialogOpen(false);
			setFocusClosedStatus(true);
			onLifecycleChange();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Could not close nomination intake.');
		} finally {
			setIsLoading(false);
		}
	}

	async function confirmConsolidatedList() {
		if (!intake || intake.status !== 'CLOSED' || intake.revealed) return;
		setIsLoading(true);
		setError('');
		try {
			const confirmed = normalizeNominationIntake(await revealNominationIntake(credentials, electionId, positionId));
			setIntake(confirmed);
			setSharedListDraft(confirmed.sharedList);
			setRemovedEntries(confirmed.removedEntries ?? []);
			setSharedListDirty(false);
			setSharedListEditing(false);
			setFocusClosedStatus(true);
			onLifecycleChange();
		} catch (requestError) {
			setError(requestError instanceof Error ? requestError.message : 'Could not confirm the consolidated list. Please retry.');
		} finally {
			setIsLoading(false);
		}
	}

	async function cancelAndRebuildFirstRound() {
		if (!credentials || !draftRound || draftRound.roundNumber !== 1 || draftRound.status !== 'DRAFT' || (draftRound.resetCount ?? 0) > 0) return;
		setRoundsSaving(true);
		setRoundsError('');
		try {
			await deleteDraftVotingRound(credentials, electionId, positionId, draftRound.id);
			setRounds((current) => current.filter((round) => round.id !== draftRound.id));
			setDraftRoundId(null);
			setSelectionCount('');
			setSelectionCountBaseline('');
			setFirstRoundPrepared(false);
			setFocusPrepareRound(true);
			setRoundsSuccess('Draft cancelled. The confirmed list is ready to rebuild.');
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not cancel the draft round.');
		} finally {
			setRoundsSaving(false);
		}
	}

	async function saveSharedList(entryId?: string): Promise<boolean> {
		if (!intake?.listCreated || !sharedListDirty) return false;
		setSharedListError('');
		setSharedListConflict(false);
		setIsLoading(true);
		try {
			const draftBeforeSave = sharedListDraft;
			const saved = normalizeNominationIntake(await updateSharedNominationList(
				credentials,
				electionId,
				positionId,
				intake.sharedListRevision,
				sharedListDraft.filter((entry) => entry.active).map((entry) => {
					const confirmed = intake.sharedList.find((savedEntry) => savedEntry.id === entry.id);
					const name = entryId && entry.id !== entryId ? confirmed?.name ?? entry.name : entry.name;
					return {
					id: entry.id,
					name,
					sequence: entry.sequence,
					active: true as const,
					};
				}),
				[],
			));
			setIntake(saved);
			const nextDraft = entryId
				? saved.sharedList.map((savedEntry) => {
					const draftEntry = draftBeforeSave.find((entry) => entry.id === savedEntry.id);
					const priorConfirmed = intake.sharedList.find((entry) => entry.id === savedEntry.id);
					return draftEntry && savedEntry.id !== entryId && draftEntry.name !== priorConfirmed?.name
						? { ...savedEntry, name: draftEntry.name }
						: savedEntry;
				})
				: saved.sharedList;
			setSharedListDraft(nextDraft);
			setRemovedEntries(saved.removedEntries ?? []);
			setSharedListDirty(nextDraft.some((entry) => entry.name !== saved.sharedList.find((savedEntry) => savedEntry.id === entry.id)?.name));
			onLifecycleChange();
			return true;
		} catch (requestError) {
			setSharedListConflict(requestError instanceof NominationsApiError && requestError.status === 409);
			setSharedListError(requestError instanceof NominationsApiError && requestError.status === 409
				? 'This list changed elsewhere. Reload the latest saved list before editing again.'
				: requestError instanceof Error ? requestError.message : 'Could not save the shared list. Your edits are still here.');
		} finally {
			setIsLoading(false);
		}
		return false;
	}

	async function removeSharedEntry(entry: SharedNominationEntry) {
		setRemovalEntry(entry);
		setRemovalReason('DUPLICATE');
		setRemovalDetail('');
	}

	async function confirmRemoveSharedEntry() {
		const currentIntake = intake;
		const entry = removalEntry;
		if (!currentIntake || !entry || (removalReason === 'OTHER' && !removalDetail.trim())) return;
		setSharedListError('');
		setIsLoading(true);
		try {
			const saved = normalizeNominationIntake(await updateSharedNominationList(
				credentials, electionId, positionId, currentIntake.sharedListRevision,
				currentIntake.sharedList.filter((item) => item.id !== entry.id).map((item) => ({ ...item, active: true as const })),
				[{ id: entry.id, reason: removalReason, ...(removalReason === 'OTHER' ? { detail: removalDetail.trim() } : {}) }],
			));
			setIntake(saved);
			setSharedListDraft(saved.sharedList);
			setRemovedEntries(saved.removedEntries ?? []);
			setRemovalEntry(null);
			onLifecycleChange();
		} catch (requestError) {
			setSharedListConflict(requestError instanceof NominationsApiError && requestError.status === 409);
			setSharedListError(requestError instanceof NominationsApiError && requestError.status === 409
				? 'The saved list changed before this removal. Reload the latest list before trying again.'
				: requestError instanceof Error ? requestError.message : 'Could not remove this name.');
		} finally {
			setIsLoading(false);
		}
	}

	async function restoreRemovedEntry(entry: RemovedNominationEntry) {
		setSharedListError('');
		setIsLoading(true);
		try {
			const latestRounds = await listVotingRounds(credentials, electionId, positionId);
			setRounds(latestRounds);
			if (latestRounds.some((round) => round.status === 'ACTIVE')) {
				setSharedListError('The closed intake is read-only while voting is active. This name cannot be restored until the round closes.');
				return;
			}
			const saved = normalizeNominationIntake(await restoreSharedNominationEntry(
				credentials, electionId, positionId, entry.auditEventId, intake?.sharedListRevision ?? 0,
			));
			setIntake(saved);
			setSharedListDraft(saved.sharedList);
			setRemovedEntries(saved.removedEntries ?? []);
			onLifecycleChange();
		} catch (requestError) {
			setSharedListConflict(requestError instanceof NominationsApiError && requestError.status === 409);
			setSharedListError(requestError instanceof NominationsApiError && requestError.status === 409
				? 'The saved list changed before this restoration. Reload the latest list before trying again.'
				: requestError instanceof Error ? requestError.message : 'Could not restore this name.');
		} finally {
			setIsLoading(false);
		}
	}

	function updateSharedRow(rowId: string, update: Partial<SharedNominationEntry>) {
		setSharedListDraft((current) => current.map((entry) => entry.id === rowId ? { ...entry, ...update } : entry));
		setSharedListDirty(true);
	}

	function editSharedList() {
		if (hasActiveRound) return;
		setIntakeDetailsOpen(true);
		sharedListSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	async function openPresentation() {
		const viewerWindow = window.open('about:blank', '_blank');
		setPresentationBusy(true);
		setPresentationError('');
		try {
			const session = await showNominationPresentation(credentials, electionId, positionId);
			const route = `/nomination-presentation/${encodeURIComponent(session.accessToken)}`;
			setPresentationPath(route);
			setPresentationVisible(session.visible);
			if (viewerWindow) viewerWindow.location.assign(route);
			else setPresentationError('The browser blocked the presentation tab. Allow pop-ups and try again.');
		} catch (requestError) {
			viewerWindow?.close();
			setPresentationError(requestError instanceof Error ? requestError.message : 'Could not open the presentation.');
		} finally {
			setPresentationBusy(false);
		}
	}

	async function reloadSharedList() {
		setIsLoading(true);
		setSharedListError('');
		try {
			const latest = normalizeNominationIntake(await getNominationIntake(credentials, electionId, positionId));
			setIntake(latest);
			setSharedListDraft(latest.sharedList);
			setRemovedEntries(latest.removedEntries);
			setSharedListDirty(false);
			setSharedListConflict(false);
			setRemovalEntry(null);
		} catch (requestError) {
			setSharedListError(requestError instanceof Error ? requestError.message : 'Could not reload the latest saved list.');
		} finally {
			setIsLoading(false);
		}
	}

	async function controlPresentation(action: 'hide' | 'end') {
		setPresentationBusy(true);
		setPresentationError('');
		try {
			if (action === 'hide') await hideNominationPresentation(credentials, electionId, positionId);
			else await endNominationPresentation(credentials, electionId, positionId);
			setPresentationVisible(false);
			if (action === 'end') setPresentationPath('');
		} catch (requestError) {
			setPresentationError(requestError instanceof Error ? requestError.message : 'Could not update presentation visibility.');
		} finally {
			setPresentationBusy(false);
		}
	}

	async function setPresentationVisibility(visible: boolean) {
		if (visible) {
			setPresentationBusy(true);
			setPresentationError('');
			try {
				const session = await showNominationPresentation(credentials, electionId, positionId);
				setPresentationPath(`/nomination-presentation/${encodeURIComponent(session.accessToken)}`);
				setPresentationVisible(session.visible);
			} catch (requestError) {
				setPresentationError(requestError instanceof Error ? requestError.message : 'Could not show the presentation.');
			} finally {
				setPresentationBusy(false);
			}
			return;
		}
		await controlPresentation('hide');
	}

	async function saveRoundConfiguration(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		await persistRoundConfiguration();
	}

	async function persistRoundConfiguration(): Promise<VotingRound | null> {
		if (!hasSavedSnapshot) return null;
		const candidateNames = candidateOptions;
		const requestedSelectionCount = Number(selectionCount);
		if (!Number.isInteger(requestedSelectionCount) || requestedSelectionCount < 1 || requestedSelectionCount > candidateNames.length) {
			setRoundsError('Enter a selection count from 1 through the number of candidates in this round.');
			setRoundsSuccess('');
			return null;
		}
		if (candidateNames.length === 0) {
			setRoundsError('No candidates are available for this round.');
			setRoundsSuccess('');
			return null;
		}

		setRoundsSaving(true);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const configuration = { candidateNames, selectionCount: requestedSelectionCount };
			const saved = draftRoundId
				? await updateVotingRound(credentials, electionId, positionId, draftRoundId, configuration)
				: await createVotingRound(credentials, electionId, positionId, configuration);
			setRounds((current) => [...current.filter((round) => round.id !== saved.id), saved]
				.sort((first, second) => first.roundNumber - second.roundNumber));
			setDraftRoundId(saved.id);
			setSelectionCount(String(saved.selectionCount));
			setSelectionCountBaseline(String(saved.selectionCount));
			setRoundsSuccess('Draft round configuration saved.');
			onLifecycleChange();
			return saved;
		} catch (requestError) {
			setRoundsError(requestError instanceof RoundsApiError || requestError instanceof Error
				? requestError.message
				: 'Could not save the draft round configuration.');
			return null;
		} finally {
			setRoundsSaving(false);
		}
	}

	async function saveAndOpenStartDialog(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (roundsSaving || roundsLoading) return;
		if (draftRound && draftRound.roundNumber === 1 && !firstRoundDraftStale
			&& Number.isInteger(Number(selectionCount))
			&& Number(selectionCount) >= 1
			&& Number(selectionCount) <= candidateOptions.length
			&& selectionCount === selectionCountBaseline
			&& draftRound.selectionCount === Number(selectionCount)) {
			openStartDialog(draftRound);
			return;
		}
		const saved = await persistRoundConfiguration();
		if (saved?.roundNumber === 1 && saved.selectionCount !== null) openStartDialog(saved);
	}

	function openStartDialog(round: VotingRound) {
		if (round.selectionCount === null) return;
		startDialogCompletedRef.current = false;
		const mostRecentCount = [...rounds]
			.filter((item) => Number.isInteger(item.expectedVoterCount) && Number(item.expectedVoterCount) > 0)
			.sort((first, second) => second.roundNumber - first.roundNumber)[0]?.expectedVoterCount;
		setExpectedVoterCount((current) => Number.isInteger(Number(current)) && Number(current) > 0
			? current
			: (round.resetCount ?? 0) > 0 ? '' : String(mostRecentCount ?? 1));
		setStartRoundId(round.id);
		setRoundsError('');
	}

	async function startRound(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!credentials || !intake || !startRoundId) return;
		const count = Number(expectedVoterCount);
		if (!Number.isInteger(count) || count < 1) {
			setRoundsError('Enter an expected voter count of at least 1.');
			return;
		}
		setRoundLifecycleBusy(true);
		setRoundsError('');
		try {
			const active = await startVotingRound(credentials, electionId, positionId, startRoundId, count);
			setRounds((current) => current.map((round) => round.id === active.id ? active : round));
			setDraftRoundId(null);
			startDialogCompletedRef.current = true;
			setStartRoundId(null);
			setRoundsSuccess('Voting is active. Share the private ballot link with voters.');
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not start voting.');
		} finally {
			setRoundLifecycleBusy(false);
		}
	}

	async function closeRound(round: VotingRound) {
		if (!credentials) return;
		setRoundLifecycleBusy(true);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const closed = await closeVotingRound(credentials, electionId, positionId, round.id);
			setRounds((current) => current.map((item) => item.id === closed.id ? closed : item));
			setRoundAggregateResults((current) => {
				const next = { ...current };
				delete next[closed.id];
				return next;
			});
			try {
				const aggregate = await getVotingRoundAggregateResults(credentials, electionId, positionId, closed.id);
				setRoundAggregateResults((current) => ({ ...current, [closed.id]: aggregate }));
			} catch {
				setRoundsError('Voting is closed, but final aggregate totals could not be loaded. Retry by reloading this position.');
			}
					try {
						const finalResults = await getVotingRoundResults(credentials, electionId, positionId, closed.id);
						setRoundResults((current) => ({ ...current, [closed.id]: finalResults }));
					} catch {
						setRoundsError('Voting is closed, but final decision details could not be loaded. Reload this position to retry.');
					}
			setRoundsSuccess(`Round ${closed.roundNumber} is closed.`);
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not close voting.');
		} finally {
			setRoundLifecycleBusy(false);
		}
	}

	async function saveCandidateDecisions(roundId: string) {
		if (!credentials) return;
		const result = roundResults[roundId];
		if (!result) return;
		const choices = result.candidates.map((candidate) => ({
			candidate,
			decision: decisionDrafts[candidate.id]?.decision ?? candidate.decision ?? null,
			reason: decisionDrafts[candidate.id]?.reason.trim() ?? candidate.decisionReason ?? '',
		}));
		if (choices.some((choice) => choice.decision === null)) {
			setRoundsError('Choose Elect, Advance, or Remove for every candidate before saving.');
			return;
		}
		const electedCount = choices.filter((choice) => choice.decision === 'ELECTED').length;
		const advancedCount = choices.filter((choice) => choice.decision === 'ADVANCED').length;
		if (electedCount === 0 && advancedCount < 2) {
			setRoundsError('Elect at least one candidate or advance at least two candidates to continue.');
			return;
		}
		const changedChoices = choices.filter(({ candidate, decision, reason }) =>
			candidate.decision !== decision || (candidate.decisionReason ?? '') !== reason,
		);
		if (changedChoices.length === 0) {
			setRoundsError('No candidate decisions have changed.');
			return;
		}
		const completionMayChange = changedChoices.some(({ candidate, decision }) =>
			decision === 'ELECTED' || candidate.decision === 'ELECTED',
		);
		setSavingDecisionCandidateId(roundId);
		setRoundsError('');
		setRoundsSuccess('');
		let currentResult = result;
		try {
			for (const { candidate, decision, reason } of changedChoices) {
				if (decision === null) continue;
				currentResult = await saveCandidateDecision(credentials, electionId, positionId, roundId, candidate.id, {
					decision,
					...(reason ? { reason } : {}),
				}) as VotingRoundResult;
				setRoundResults((current) => ({ ...current, [roundId]: currentResult }));
			}
			setRoundsSuccess('Candidate decisions saved.');
			onLifecycleChange(completionMayChange);
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not save all candidate decisions. Successfully saved decisions are retained.');
		} finally {
			setSavingDecisionCandidateId(null);
		}
	}

	async function confirmReopenRound() {
		if (!credentials || !reopenRoundId) return;
		setRoundLifecycleBusy(true);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const reopened = await reopenVotingRound(credentials, electionId, positionId, reopenRoundId);
			setRounds((current) => current.map((round) => round.id === reopened.id ? reopened : round));
			setRoundAggregateResults((current) => {
				const next = { ...current };
				delete next[reopened.id];
				return next;
			});
			setRoundResults((current) => {
				const next = { ...current };
				delete next[reopened.id];
				return next;
			});
			setReopenRoundId(null);
			setRoundsSuccess(`Round ${reopened.roundNumber} is active again.`);
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not reopen voting.');
		} finally {
			setRoundLifecycleBusy(false);
		}
	}

	async function confirmResetRound() {
		if (!credentials || !resetRoundId) return;
		const round = rounds.find((item) => item.id === resetRoundId);
		if (!round || (round.status !== 'CLOSED' && round.status !== 'ACTIVE') || rounds.some((item) => item.roundNumber > round.roundNumber)) return;
		const cancellingActiveRound = round.status === 'ACTIVE';
		setRoundLifecycleBusy(true);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const reset = await resetVotingRound(credentials, electionId, positionId, round.id);
			setRounds((current) => current.map((item) => item.id === reset.id ? reset : item));
			setDraftRoundId(reset.id);
			setSelectionCount('');
			setSelectionCountBaseline('');
			setExpectedVoterCount('');
			setRoundProgress((current) => {
				const next = { ...current };
				delete next[reset.id];
				return next;
			});
			setRoundResults((current) => {
				const next = { ...current };
				delete next[reset.id];
				return next;
			});
			setRoundAggregateResults((current) => {
				const next = { ...current };
				delete next[reset.id];
				return next;
			});
			onLifecycleChange(true);
			setResetRoundId(null);
			setRoundsSuccess(cancellingActiveRound
				? `Voting cancelled. Ballots and current decisions were permanently deleted; candidate roster preserved for round ${reset.roundNumber}.`
				: `Round ${reset.roundNumber} reset. Ballots and current decisions were permanently deleted; candidate roster preserved. Reset count: ${reset.resetCount ?? 0}.`);
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not reset the round.');
		} finally {
			setRoundLifecycleBusy(false);
		}
	}

	async function copyVotingLink(round: VotingRound) {
		if (!round.accessToken) return;
		const shareUrl = `${window.location.origin}/vote/${encodeURIComponent(round.accessToken)}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopiedRoundId(round.id);
		} catch {
			setRoundsError('Could not copy the voting link. Select and copy the URL instead.');
		}
	}

	async function copyShareUrl() {
		if (!intake) return;
		const shareUrl = `${window.location.origin}/nominate/${encodeURIComponent(intake.accessToken)}`;
		try {
			await navigator.clipboard.writeText(shareUrl);
			setCopied(true);
		} catch {
			setError('Could not copy the link. Select and copy the share URL instead.');
		}
	}

	const workflowSteps = ['Collect and review nominations', 'Voting rounds', 'Candidate decisions', 'Position complete'];
	const workflowStatus = isLoading ? 'Loading'
		: error ? 'Unavailable'
		: !intake
		? positionProgressStatus === 'NOT_STARTED' ? 'Not open'
			: positionProgressStatus === 'NOMINATIONS_OPEN' ? 'Open'
				: positionProgressStatus === 'NOMINATIONS_CLOSED' || positionProgressStatus === 'CONSOLIDATED' ? 'Closed'
					: positionProgressStatus === 'ROUND_ACTIVE' ? 'Voting open'
						: positionProgressStatus === 'ROUND_CLOSED_UNREVEALED' ? 'Closed · unrevealed'
							: positionProgressStatus === 'RESULTS_REVEALED' || positionProgressStatus === 'CANDIDATES_ADVANCED' ? 'In progress'
								: positionProgressStatus === 'COMPLETE' ? 'Complete' : 'Status unavailable'
		: intake.status === 'OPEN' ? 'Open' : intake.revealed ? 'Revealed' : 'Closed';
		const intakeWorkflowProps = {
			positionName,
			openingCount,
			isExpanded,
			isLoading,
			error,
			streamStatus,
			intake,
			nameLimit,
			onNameLimitChange: (value: string) => { setNameLimit(value); updateDraftState(value !== '5'); },
			onCreateIntake: createIntake,
			onRetryIntake: () => { setIntakeLoadAttempt((attempt) => attempt + 1); },
			onCloseIntake: () => setCloseDialogOpen(true),
			onConfirmConsolidatedList: () => { void confirmConsolidatedList(); },
			closeDialogOpen,
			keepIntakeOpenRef,
			closeButtonRef,
			onCancelClose: () => setCloseDialogOpen(false),
			closeDialogError: error,
			onConfirmClose: () => { void closeIntake(); },
			submissionNames: openSubmissionNames,
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
			roundsCount: rounds.length,
			changeEvents: confirmedChangeEvents,
			onUpdateSharedRow: updateSharedRow,
			onSaveSharedList: (entryId?: string) => { void saveSharedList(entryId); },
			onRemoveSharedEntry: (entry: SharedNominationEntry) => { void removeSharedEntry(entry); },
			onRestoreRemovedEntry: (entry: RemovedNominationEntry) => { void restoreRemovedEntry(entry); },
			onReloadSharedList: () => { void reloadSharedList(); },
			onRemovalReasonChange: setRemovalReason,
			onRemovalDetailChange: setRemovalDetail,
			onCancelRemoval: () => setRemovalEntry(null),
			onConfirmRemoval: () => { void confirmRemoveSharedEntry(); },
			onEditSharedList: () => setSharedListEditing(true),
			onSharedListEditingChange: setSharedListEditing,
			onPrepareRound: () => {
				const initialCount = String(Math.min(2, confirmedNames.length));
				setSelectionCount(initialCount);
				setSelectionCountBaseline(initialCount);
				setFirstRoundPrepared(true);
				setSharedListEditing(false);
			},
		};
	return (
		<section className="nomination-admin" aria-labelledby="nomination-admin-title">
			<nav className="position-workflow-breadcrumb" aria-label="Election workflow breadcrumb">
				<button className="back-button" type="button" onClick={onReturnToElectionList}>{churchName}</button>
				<span aria-hidden="true">/</span><span>{electionTerm}</span>
				<span aria-hidden="true">/</span><span>{departmentName}</span>
				<span aria-hidden="true">-</span><strong aria-current="page">{positionName}</strong>
			</nav>
			<section className="access-card-group access-card-group--workflow" aria-label="Election access">
				<ParticipantSessionLinkCard
					description="One session link for the authorized current phase. Anyone with the link may be able to access it."
					url={activeRound?.accessToken
						? `${window.location.origin}/vote/${encodeURIComponent(activeRound.accessToken)}`
						: intake?.status === 'OPEN' && intake.accessToken
							? `${window.location.origin}/nominate/${encodeURIComponent(intake.accessToken)}`
							: undefined}
					actionLabel={activeRound?.accessToken ? (copiedRoundId === activeRound.id ? 'Copied session link' : 'Copy session link') : intake?.status === 'OPEN' && intake.accessToken ? (copied ? 'Copied nomination link' : 'Copy nomination link') : undefined}
					actionDisabled={!activeRound?.accessToken && !(intake?.status === 'OPEN' && intake.accessToken)}
					actionTitle={!activeRound?.accessToken && !(intake?.status === 'OPEN' && intake.accessToken) ? 'Available when a session phase opens' : undefined}
					onAction={activeRound?.accessToken ? () => { void copyVotingLink(activeRound); } : intake?.status === 'OPEN' && intake.accessToken ? copyShareUrl : undefined}
					className="access-card--workflow"
				>
					{!activeRound?.accessToken && intake?.status === 'OPEN' && intake.accessToken && <p className="workflow-access-state">Anyone with this position-specific link can submit or revise names while intake is open.</p>}
					{!activeRound?.accessToken && !(intake?.status === 'OPEN' && intake.accessToken) && <p className="workflow-access-state">A participant session link is not available until its phase opens.</p>}
				</ParticipantSessionLinkCard>
				<AudiencePresentationCard
					description="The separate display is read-only. Presentation controls stay in this authenticated admin workspace."
					visible={presentationVisible}
					onVisibilityChange={(visible) => { void setPresentationVisibility(visible); }}
					switchDisabled={(!intake || (intake.status === 'CLOSED' && !intake.revealed && !presentationVisible)) || presentationBusy || hasActiveRound}
					openDisabled={(!intake || (intake.status === 'CLOSED' && !intake.revealed && !presentationVisible)) || presentationBusy || hasActiveRound}
					onOpen={() => { if (presentationPath) window.open(presentationPath, '_blank', 'noopener,noreferrer'); else void openPresentation(); }}
					className="access-card--workflow"
					afterControls={presentationPath && <button className="secondary-button prototype-secondary-button" type="button" disabled={presentationBusy} onClick={() => { void controlPresentation('end'); }}>End presentation</button>}
				>
					{intake?.status === 'OPEN' && <p className="form-note">When shown, incoming names appear on the room presentation only.</p>}
					{intake?.status === 'CLOSED' && !intake.revealed && <p className="form-note">Confirm the consolidated list before it can be shown.</p>}
					{presentationError && <p className="error-message" role="alert">{presentationError}</p>}
				</AudiencePresentationCard>
			</section>
			<div className={`workflow-stage-group${!intake ? ' is-intake-setup' : ''}${intake?.status === 'OPEN' ? ' is-intake-open' : ''}${intake?.status === 'CLOSED' ? ' is-intake-closed' : ''}${firstRoundSetupVisible ? ' is-round-setup-primary' : ''}${hasActiveRound ? ' is-voting-active' : ''}`}>
				<section className={`guided-workflow${hasActiveRound ? ' is-voting-active' : ''}`} aria-label="Position workflow progress">
					<div aria-live="polite" aria-atomic="true">
						<NominationAdminPanelHeader
							title={positionName}
							subtitle={currentWorkflowTask.description}
							currentTask={currentWorkflowTask.title}
							status={workflowStatus}
							statusClassName={workflowStatus === 'Not open' || (intake?.status === 'CLOSED' && !intake.revealed) ? 'closed-status' : ''}
							currentStep={currentWorkflowTask.stage}
							steps={workflowSteps}
						/>
					</div>
				</section>
			<NominationIntakeComponent {...intakeWorkflowProps} view="stage" />
			</div>
			<div className={`position-workflow-grid${!intake ? ' is-intake-setup' : ''}${intake?.status === 'OPEN' ? ' is-intake-open' : ''}${intake?.status === 'CLOSED' ? ' is-intake-closed' : ''}${firstRoundSetupVisible ? ' is-round-setup-primary' : ''}${hasActiveRound ? ' is-voting-active' : ''}`}>
				<div className="position-workflow-main">
			<NominationIntakeComponent {...intakeWorkflowProps} view="editor" />
			<NominationVoting
				isExpanded={isExpanded}
				hasActiveRound={hasActiveRound}
				hasSavedSnapshot={hasSavedSnapshot}
				firstRoundPrepared={firstRoundPrepared}
				firstRoundSetupVisible={firstRoundSetupVisible}
				firstRoundDraftStale={firstRoundDraftStale}
				showClosedRoundDecisions={showClosedRoundDecisions}
				openingCount={openingCount}
				rounds={rounds}
				activeRound={activeRound}
				latestRound={latestRound}
				latestClosedRound={latestClosedRound}
				draftRound={draftRound}
				draftRoundId={draftRoundId}
				selectionCount={selectionCount}
				selectionCountBaseline={selectionCountBaseline}
				setSelectionCount={setSelectionCount}
				selectionCandidates={candidateOptions}
				roundsLoading={roundsLoading}
				roundsReady={roundsReady}
				roundsSaving={roundsSaving}
				roundsError={roundsError}
				roundsSuccess={roundsSuccess}
				roundsLoadAttempt={() => setRoundsLoadAttempt((attempt) => attempt + 1)}
				roundLifecycleBusy={roundLifecycleBusy}
				roundProgress={roundProgress}
				roundAggregateResults={roundAggregateResults}
				aggregateRefreshErrors={aggregateRefreshErrors}
				roundResults={roundResults}
				decisionDrafts={decisionDrafts}
				setDecisionDrafts={setDecisionDrafts}
				savingDecisionCandidateId={savingDecisionCandidateId}
				startRoundId={startRoundId}
				setStartRoundId={setStartRoundId}
				expectedVoterCount={expectedVoterCount}
				setExpectedVoterCount={setExpectedVoterCount}
				expectedVoterInputRef={expectedVoterInputRef}
				startSuccessRef={startSuccessRef}
				reopenRoundId={reopenRoundId}
				setReopenRoundId={setReopenRoundId}
				resetRoundId={resetRoundId}
				setResetRoundId={setResetRoundId}
				onDraftStateChange={updateDraftState}
				onSaveRoundConfiguration={(event) => { void saveRoundConfiguration(event); }}
				onSaveAndOpenStartDialog={(event, trigger) => { startDialogTriggerRef.current = trigger; void saveAndOpenStartDialog(event); }}
				onSaveStartRound={(event) => { void startRound(event); }}
				onOpenStartDialog={openStartDialog}
				onCancelFirstRoundDraft={() => { void cancelAndRebuildFirstRound(); }}
				onCloseRound={(round) => { void closeRound(round); }}
				onSaveCandidateDecisions={(roundId) => { void saveCandidateDecisions(roundId); }}
				onReopenRound={() => { void confirmReopenRound(); }}
				onResetRound={() => { void confirmResetRound(); }}
				onCopyVotingLink={(round) => { void copyVotingLink(round); }}
				onEditCandidateList={editSharedList}
				copiedRoundId={copiedRoundId}
			/>
				</div>
			</div>
		</section>
	);
}
