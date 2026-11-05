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
import RoundPollSetup from './RoundPollSetup';
import { ActiveVotingStage, AggregateCandidateResults, ClosedNominationReviewStage, ClosedRoundDecisionsStage, OpenNominationIntakeStage } from './NominationWorkflowStages';
import { getCandidateRecommendation } from '../elections/candidateRecommendations';

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
		setExpectedVoterCount((round.resetCount ?? 0) > 0 ? '' : String(mostRecentCount ?? 1));
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
				{!hasActiveRound && <div className="guided-workflow-task" aria-live="polite" aria-atomic="true">
					<p className="eyebrow">Position workflow</p>
					<h2 className="workflow-position-name" id="nomination-admin-title">{positionName}</h2>
					<p className="workflow-task-kicker">Current task</p>
					<div className="workflow-task-heading-row"><h3>{currentWorkflowTask.title}</h3>{workflowStatus !== 'Voting open' && <span className={`row-status ${workflowStatus === 'Not open' || (intake?.status === 'CLOSED' && !intake.revealed) ? 'closed-status' : ''}`}>{workflowStatus}</span>}</div>
					<p>{currentWorkflowTask.description}</p>
					<span className="sr-only">Workflow step {currentWorkflowTask.stage + 1} of {workflowSteps.length}.</span>
				</div>}
				<div className="guided-workflow-progress">
					<div className="workflow-progress-meta"><span>Election progress</span><span>{currentWorkflowTask.stage + 1} of {workflowSteps.length}</span></div>
					<div className="workflow-progress-bar" aria-hidden="true">
						{workflowSteps.map((step, index) => <span className={index <= currentWorkflowTask.stage ? 'is-reached' : ''} key={step} />)}
					</div>
					<ol className="workflow-step-list">
						{workflowSteps.map((step, index) => (
							<li className={index < currentWorkflowTask.stage ? 'is-complete' : index === currentWorkflowTask.stage ? 'is-current' : 'is-upcoming'} aria-current={index === currentWorkflowTask.stage ? 'step' : undefined} key={step}>
								<span className="workflow-step-marker" aria-hidden="true">{index < currentWorkflowTask.stage ? '✓' : index + 1}</span>
								<span>{step}</span>
								<span className="sr-only">{index < currentWorkflowTask.stage ? 'Complete' : index === currentWorkflowTask.stage ? 'Current step' : 'Upcoming'}</span>
							</li>
						))}
					</ol>
				</div>
			</section>
			{isExpanded && isLoading && <p className="state-message" role="status">Loading nomination intake…</p>}
			{error && <p className="error-message" role="alert">{error}</p>}
			{streamStatus && <p className="state-message" role="status">{streamStatus}</p>}
			{isExpanded && !isLoading && !intake && !error && (
				<form className="intake-create" onSubmit={createIntake}>
					<h3>Nomination intake</h3>
					<p className="form-note">People can submit proposed names for {positionName} using a position-specific link. Their submissions remain anonymous to administrators.</p>
					<label htmlFor="nomination-name-limit">Maximum names per visitor</label>
					<div className="intake-controls">
						<input id="nomination-name-limit" type="number" min="1" step="1" value={nameLimit} onChange={(event) => { setNameLimit(event.target.value); updateDraftState(event.target.value !== '5'); }} required />
						<button className="primary-button" type="submit" disabled={isLoading}>Create intake</button>
					</div>
				</form>
			)}
			{isExpanded && !isLoading && !intake && error && (
				<button className="secondary-button" type="button" onClick={() => { setIntakeLoadAttempt((attempt) => attempt + 1); }}>Retry loading nominations</button>
			)}
			{!intake && !isLoading && !error && <aside className="position-roster-panel" aria-labelledby="position-roster-title">
				<p className="eyebrow">Nomination intake</p>
				<h3 id="position-roster-title">Names not yet submitted</h3>
				<p>Submitted names are not shown to the audience before consolidation is confirmed and the presentation is shown.</p>
				<div className="position-roster-empty">No candidates yet.</div>
				<span className="position-opening-count">{openingCount} {openingCount === 1 ? 'opening' : 'openings'}</span>
			</aside>}
			{isExpanded && !isLoading && intake?.status === 'CLOSED' && rounds.length === 0 && !firstRoundSetupVisible && !hasActiveRound && (
				<ClosedNominationReviewStage intake={intake} sharedListDirty={sharedListDirty} sharedListDraft={sharedListDraft} isLoading={isLoading} statusRef={closedStatusRef} onConfirm={() => { void confirmConsolidatedList(); }} />
			)}
			{isExpanded && !isLoading && intake?.status === 'OPEN' && (
				<OpenNominationIntakeStage intake={intake} names={openSubmissionNames} closeTriggerRef={closeTriggerRef} isLoading={isLoading} onClose={() => setCloseDialogOpen(true)} />
			)}
			</div>
			<div className={`position-workflow-grid${!intake ? ' is-intake-setup' : ''}${intake?.status === 'OPEN' ? ' is-intake-open' : ''}${intake?.status === 'CLOSED' ? ' is-intake-closed' : ''}${firstRoundSetupVisible ? ' is-round-setup-primary' : ''}${hasActiveRound ? ' is-voting-active' : ''}`}>
				<div className="position-workflow-main">
			{closeDialogOpen && (
				<div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCloseDialogOpen(false); }}>
					<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="close-nominations-title" aria-describedby="close-nominations-description">
						<h3 id="close-nominations-title">Close nominations?</h3>
						<p id="close-nominations-description">The public link will stop accepting changes. You can review and consolidate submitted names before confirming the list.</p>
						{isLoading && <p role="status">Closing nominations…</p>}
						{error && <p className="error-message" role="alert">{error}</p>}
						<div className="dialog-actions">
							<button ref={keepIntakeOpenRef} className="secondary-button" type="button" disabled={isLoading} onClick={() => setCloseDialogOpen(false)}>Keep intake open</button>
							<button ref={closeButtonRef} className="danger-button" type="button" disabled={isLoading} onClick={() => { void closeIntake(); }}>Close nominations</button>
						</div>
					</section>
				</div>
			)}
			{removalEntry && (
				<div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !isLoading) setRemovalEntry(null); }}>
					<section ref={removeDialogRef} className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="remove-nomination-title">
						<h3 id="remove-nomination-title">Remove {removalEntry.name}?</h3>
						<label htmlFor="nomination-removal-reason">Reason</label>
						<select id="nomination-removal-reason" value={removalReason} onChange={(event) => setRemovalReason(event.target.value as NominationRemovalReason)}>
							<option value="DUPLICATE">Duplicate</option><option value="DECLINED">Declined</option><option value="OTHER">Other</option>
						</select>
						{removalReason === 'OTHER' && <label htmlFor="nomination-removal-detail">Details<input id="nomination-removal-detail" value={removalDetail} onChange={(event) => setRemovalDetail(event.target.value)} required /></label>}
						{sharedListError && <p className="error-message" role="alert">{sharedListError}</p>}
						{sharedListConflict && <button className="secondary-button" type="button" disabled={isLoading} onClick={() => { void reloadSharedList(); }}>Reload latest saved list</button>}
						<div className="dialog-actions"><button className="secondary-button" type="button" disabled={isLoading} onClick={() => setRemovalEntry(null)}>Cancel</button><button className="danger-button" type="button" disabled={isLoading || (removalReason === 'OTHER' && !removalDetail.trim())} onClick={() => { void confirmRemoveSharedEntry(); }}>Confirm removal</button></div>
					</section>
				</div>
			)}
			{isExpanded && !isLoading && intake?.status === 'CLOSED' && intake.listCreated && rounds.length === 0 && !firstRoundSetupVisible && !hasActiveRound && (
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
									<input id={`shared-nomination-${entry.id}`} value={entry.name} onChange={(event) => updateSharedRow(entry.id, { name: event.target.value })} disabled={hasActiveRound || !entry.active} />
									{entry.active && <>
										<button className="icon-button shared-nomination-save" type="button" aria-label={`Save ${savedName ?? entry.name}`} title="Save name" disabled={isLoading || hasActiveRound || !rowDirty || !entry.name.trim()} onClick={() => { void saveSharedList(entry.id); }}>
											<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8M9 15h6" /></svg>
										</button>
										<button className="icon-button shared-nomination-remove" type="button" aria-label={`Remove ${entry.name}`} title="Remove name" disabled={isLoading || hasActiveRound || sharedListDirty} onClick={() => { void removeSharedEntry(entry); }}>
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
							{(
								<ul className="member-list" aria-label="Removed nominations">
									{removedEntries.map((entry) => <li key={entry.auditEventId}>
										<span className="shared-nomination-name">{entry.name}</span>
										<button className="icon-button shared-nomination-restore" type="button" aria-label={`Restore ${entry.name}`} title="Restore name" disabled={isLoading || !roundsReady || roundsLoading || hasActiveRound || sharedListDirty} onClick={() => { void restoreRemovedEntry(entry); }}><span aria-hidden="true">↶</span></button>
									</li>)}
								</ul>
							)}
						</details>}
						{sharedListError && !removalEntry && <p className="error-message" role="alert">{sharedListError}</p>}
						{sharedListDirty && <div className="shared-list-recovery"><p className="form-note">Unsaved edits are kept here and are not visible on the presentation.</p><button className="primary-button" type="button" disabled={isLoading || hasActiveRound} onClick={() => { void saveSharedList(); }}>{isLoading ? 'Saving…' : 'Save changes'}</button>{sharedListConflict && <button className="secondary-button" type="button" disabled={isLoading} onClick={() => { void reloadSharedList(); }}>Reload latest saved list</button>}</div>}
						{sharedListConflict && !sharedListDirty && !removalEntry && <button className="secondary-button" type="button" disabled={isLoading} onClick={() => { void reloadSharedList(); }}>Reload latest saved list</button>}
						{hasActiveRound && <p className="form-note">Shared-list editing is unavailable while voting is active.</p>}
						{confirmedChangeEvents.length > 0 && <details className="admin-change-history"><summary>Confirmed change history ({confirmedChangeEvents.length})</summary><ol>{confirmedChangeEvents.map((event) => <li key={event.id}><span>{event.action === 'CORRECTED' ? `${event.beforeName} → ${event.afterName}` : event.action === 'REMOVED' ? `${event.beforeName} removed · ${event.removalReason ?? 'Other'}${event.reasonDetail ? `: ${event.reasonDetail}` : ''}` : `${event.afterName ?? event.beforeName} restored`}</span><small>{event.actorLabel} · {new Date(event.occurredAt).toLocaleString()}</small></li>)}</ol></details>}
						{intake.revealed && !sharedListEditing && !hasActiveRound && <div className="form-actions">
							<button className="secondary-button" type="button" onClick={() => setSharedListEditing(true)}>Edit consolidated list</button>
							{rounds.length === 0 && <button ref={prepareRoundButtonRef} className="primary-button" type="button" onClick={() => {
								const initialCount = String(Math.min(2, confirmedNames.length));
								setSelectionCount(initialCount);
								setSelectionCountBaseline(initialCount);
								setFirstRoundPrepared(true);
								setSharedListEditing(false);
							}}>Prepare round 1</button>}
						</div>}
						{intake.revealed && sharedListEditing && !sharedListDirty && <button className="secondary-button" type="button" onClick={() => setSharedListEditing(false)}>Done editing</button>}
					</div>
				</section>
			)}
			{isExpanded && (hasActiveRound || hasSavedSnapshot && (rounds.length > 0 || firstRoundPrepared)) && (
				<details className={`workflow-details voting-round-configuration${firstRoundSetupVisible ? ' is-first-round-setup' : ''}${hasActiveRound ? ' is-voting-active' : ''}`} open>
					<summary hidden={firstRoundSetupVisible || hasActiveRound}>Voting round configuration <span>{rounds.length} {rounds.length === 1 ? 'round' : 'rounds'} · {draftRoundId ? 'Draft ready' : 'Setup'}</span></summary>
						<section aria-labelledby="voting-round-title">
							{hasActiveRound && activeRound && <ActiveVotingStage
								round={activeRound}
								progress={roundProgress[activeRound.id]}
								aggregate={roundAggregateResults[activeRound.id]}
								aggregateError={Boolean(aggregateRefreshErrors[activeRound.id])}
								lifecycleBusy={roundLifecycleBusy}
								onCancel={() => setResetRoundId(activeRound.id)}
								onClose={() => { void closeRound(activeRound); }}
							/>}
							{!hasActiveRound && !firstRoundSetupVisible && latestRound?.status !== 'DRAFT' && !latestClosedRound && <div className="section-heading">
								<div><h3 id="voting-round-title">Voting round configuration</h3><p>{latestRound ? 'Candidates marked Advanced in the preceding round continue automatically.' : 'The consolidated list is the complete candidate roster for this poll.'}</p></div>
							</div>}
					{roundsError && !roundsLoading && !roundsReady && <button className="secondary-button" type="button" onClick={() => setRoundsLoadAttempt((attempt) => attempt + 1)}>Retry loading rounds</button>}
					{!roundsLoading && roundsReady && (
						<>
									{showClosedRoundDecisions && latestClosedRound && <ClosedRoundDecisionsStage
										round={latestClosedRound}
										result={roundResults[latestClosedRound.id]}
										aggregate={roundAggregateResults[latestClosedRound.id]}
										decisionDrafts={decisionDrafts}
										setDecisionDrafts={setDecisionDrafts}
										onSave={() => { void saveCandidateDecisions(latestClosedRound.id); }}
										onReopen={() => setReopenRoundId(latestClosedRound.id)}
										onReset={() => setResetRoundId(latestClosedRound.id)}
										canReset={!rounds.some((round) => round.roundNumber > latestClosedRound.roundNumber)}
										lifecycleBusy={roundLifecycleBusy}
									/>}
									{rounds.some((round) => round.status !== 'ACTIVE' && round.id !== latestClosedRound?.id) && !hasActiveRound && !firstRoundSetupVisible && latestRound?.status !== 'DRAFT' && (
								<ul className="voting-round-list" aria-label="Voting rounds">
												{rounds.filter((round) => round.status !== 'ACTIVE' && round.id !== latestClosedRound?.id).map((round) => (
										<li className="voting-round-item" key={round.id}>
											<details id={`round-${round.id}`} className={`workflow-details round-details${round.status === 'ACTIVE' ? ' round-details-active' : ''}${round.status === 'CLOSED' && round.id === latestClosedRound?.id ? ' round-details-current-decisions' : ''}`} name="voting-rounds" open={round.status === 'CLOSED' && round.id === latestClosedRound?.id}>
												<summary><span>Round {round.roundNumber}</span><span>{round.status === 'DRAFT' ? 'Draft' : round.status === 'ACTIVE' ? 'Voting active now' : 'Closed'} · {round.candidates.length} candidates</span></summary>
												<div className="round-detail-content">
											<div className="voting-round-heading">
												<h4>Round {round.roundNumber}</h4>
												<span className={`row-status ${round.status === 'CLOSED' ? 'closed-status' : ''}`}>{round.status === 'DRAFT' ? 'Draft' : round.status === 'ACTIVE' ? 'Active' : 'Closed'}</span>
											</div>
													{round.status === 'DRAFT' ? (
													<>{round.roundNumber > 1 && <button className="primary-button" type="button" disabled={roundLifecycleBusy || round.selectionCount === null} onClick={() => openStartDialog(round)}>Start voting</button>}{round.roundNumber === 1 && firstRoundDraftStale && <p className="form-note">The shared list changed after this draft was saved. Update the draft roster before starting.</p>}</>
											) : round.accessToken && (
												<>
													<label className="share-label" htmlFor={`voting-share-${round.id}`}>Public voting link</label>
													<div className="intake-controls share-controls">
														<input id={`voting-share-${round.id}`} value={`${window.location.origin}/vote/${encodeURIComponent(round.accessToken)}`} readOnly onFocus={(event) => event.currentTarget.select()} />
														<button className="secondary-button" type="button" onClick={() => copyVotingLink(round)}>{copiedRoundId === round.id ? 'Copied' : 'Copy link'}</button>
													</div>
												</>
											)}
															{round.status === 'CLOSED' && roundAggregateResults[round.id] && !roundResults[round.id] && <AggregateCandidateResults result={roundAggregateResults[round.id]} label={`Final aggregate candidate results for round ${round.roundNumber}`} />}
																			{round.status === 'CLOSED' && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setReopenRoundId(round.id)}>Reopen voting</button>}
																			{round.status === 'CLOSED' && !rounds.some((item) => item.roundNumber > round.roundNumber) && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setResetRoundId(round.id)}>Reset round</button>}
																			{(round.resetCount ?? 0) > 0 && <p className="form-note">Reset count: {round.resetCount}</p>}
											{round.status === 'CLOSED' && roundResults[round.id] && (() => {
												const result = roundResults[round.id];
												return (
													<details className="workflow-details result-details" open>
														<summary>Final results <span>{result.ballotsCast} / {result.expectedVoterCount} ballots</span></summary>
													<section className="round-results" aria-labelledby={`round-results-title-${round.id}`}>
														<div className="section-heading"><div><h4 id={`round-results-title-${round.id}`}>Final results</h4><p>Aggregate totals only. Ballot choices are not shown.</p></div></div>
														<dl className="round-result-summary">
															<div><dt>Ballots cast</dt><dd>{result.ballotsCast} / {result.expectedVoterCount}</dd></div>
															<div><dt>Majority threshold</dt><dd>{result.majorityThreshold}</dd></div>
														</dl>
														<ul className="round-result-candidates" aria-label={`Aggregate candidate votes for round ${round.roundNumber}`}>
																				{[...result.candidates]
																.sort((first, second) => second.votes - first.votes || first.name.localeCompare(second.name))
																.map((candidate) => {
																				const draft = decisionDrafts[candidate.id];
																				const selectedDecision = draft?.decision ?? candidate.decision ?? null;
																const isEliminated = candidate.decision === 'ELIMINATED';
																const isElected = candidate.decision === 'ELECTED';
																const electedCount = rounds
																	.filter((priorRound) => priorRound.roundNumber < round.roundNumber)
																	.flatMap((priorRound) => roundResults[priorRound.id]?.candidates ?? [])
																	.filter((roundCandidate) => roundCandidate.decision === 'ELECTED').length;
																const majorityCandidateCount = result.candidates
																	.filter((roundCandidate) => roundCandidate.votes >= result.majorityThreshold).length;
																const recommendation = getCandidateRecommendation(
																	candidate.votes,
																	result.majorityThreshold,
																	openingCount,
																	electedCount,
																	majorityCandidateCount,
																	round.roundNumber > 1 && round.selectionCount === 1,
																	Math.min(...result.candidates.map((roundCandidate) => roundCandidate.votes)),
																	round.selectionCount ?? 1,
																);
																return (
																	<li className={isEliminated ? 'candidate-outcome candidate-eliminated' : isElected ? 'candidate-outcome candidate-elected' : candidate.decision === 'ADVANCED' ? 'candidate-outcome candidate-advanced' : 'candidate-outcome'} key={candidate.id}>
																		<div className="round-result-candidate-heading">
																			<strong>{candidate.name}</strong><span>{candidate.votes} {candidate.votes === 1 ? 'vote' : 'votes'}</span>
																		</div>
																		<p className="candidate-recommendation" role="note"><strong>Recommendation:</strong> {recommendation}</p>
																		{candidate.decision && (
																			<p className="candidate-decision-current">
																				Current decision: <strong>{candidate.decision}</strong>{candidate.decisionReason ? `: ${candidate.decisionReason}` : ''}
																				{candidate.decisionBy && <> <span>By {candidate.decisionBy}</span></>}
																				{candidate.decisionAt && <> <time dateTime={candidate.decisionAt}>{new Date(candidate.decisionAt).toLocaleString()}</time></>}
																			</p>
																		)}
																						<div className="candidate-actions" role="group" aria-label={`Decision for ${candidate.name}`}>
																							{([
																							['ELECTED', 'Elect'],
																							['ADVANCED', 'Advance'],
																							['ELIMINATED', 'Remove'],
																						] as const).map(([decision, label]) => <button
																							key={decision}
																							type="button"
																							className={`candidate-action${selectedDecision === decision ? ' is-selected' : ''}`}
																							aria-pressed={selectedDecision === decision}
																							disabled={Boolean(savingDecisionCandidateId)}
																							onClick={() => setDecisionDrafts((current) => ({
																								...current,
																								[candidate.id]: { decision, reason: current[candidate.id]?.reason ?? candidate.decisionReason ?? '' },
																							}))}
																						>{label}</button>)}
																						</div>
																	</li>
																);
															})}
														</ul>
														<div className="form-actions">
															<button className="primary-button" type="button" disabled={Boolean(savingDecisionCandidateId)} onClick={() => { void saveCandidateDecisions(round.id); }}>
																{savingDecisionCandidateId === round.id ? 'Saving…' : 'Save decisions'}
															</button>
														</div>
													</section>
													</details>
												);
											})()}
												</div>
											</details>
										</li>
									))}
								</ul>
							)}
							{draftRoundId && !firstRoundSetupVisible && (() => {
								const draft = rounds.find((round) => round.id === draftRoundId);
								return draft ? (
									<p className="state-message saved-round-summary" role="status">
										Draft round {draft.roundNumber}: allows {draft.selectionCount} {draft.selectionCount === 1 ? 'selection' : 'selections'} from {draft.candidates.length} candidates.
									</p>
								) : null;
							})()}
							{firstRoundSetupVisible && !hasActiveRound ? (
								<RoundPollSetup
									roundNumber={1}
									candidateNames={candidateOptions}
									selectionCount={selectionCount}
									isSaving={roundsSaving}
									isLoading={roundsLoading}
									hasSavedDraft={draftRound?.roundNumber === 1 && draftRound.status === 'DRAFT'}
									resetCount={draftRound?.resetCount ?? 0}
									canStart={Boolean(Number.isInteger(Number(selectionCount)) && Number(selectionCount) >= 1 && Number(selectionCount) <= candidateOptions.length && !roundsSaving && !roundsLoading && !firstRoundDraftStale)}
									error={roundsError}
									success={roundsSuccess}
									cancelDraftLabel="Cancel and rebuild draft"
									onSelectionCountChange={(value) => { setSelectionCount(value); updateDraftState(value !== selectionCountBaseline); }}
									onStart={(event, trigger) => { startDialogTriggerRef.current = trigger; void saveAndOpenStartDialog(event); }}
									onCancel={() => { void cancelAndRebuildFirstRound(); }}
								/>
							) : hasActiveRound ? (
								<p className="state-message" role="status">Voting remains open until you close it. Afterward, choose an outcome for each candidate and save the decisions.</p>
												) : draftRoundId || rounds.length === 0 || candidateOptions.length > 0 ? (
								<form className="round-configuration-form" onSubmit={saveRoundConfiguration}>
									<div className="round-candidate-roster">
										<span className="summary-label">{latestRound ? 'Candidates advancing to this round' : 'Candidates in this poll'}</span>
										<ul aria-label={latestRound ? 'Candidates advancing to this round' : 'Candidates in this poll'}>
											{candidateOptions.map((name) => <li key={name}>{name}</li>)}
										</ul>
										{!latestClosedRound && !hasActiveRound && (
											<button className="secondary-button" type="button" onClick={editSharedList}>Edit candidate list</button>
										)}
									</div>
									<label className="round-selection-count" htmlFor="round-selection-count">How many names can each ballot select?</label>
									<div className="round-selection-stepper" role="group" aria-label="Selections allowed per ballot">
										<button className="round-selection-step" type="button" aria-label="Decrease selections per ballot" disabled={roundsSaving || Number(selectionCount) <= 1} onClick={() => {
											const next = String(Math.max(1, Number(selectionCount || 1) - 1));
											setSelectionCount(next);
											updateDraftState(next !== selectionCountBaseline);
										}}>−</button>
										<input
											id="round-selection-count"
											type="number"
											min="1"
											max={candidateOptions.length}
											step="1"
											inputMode="numeric"
											aria-describedby="round-selection-count-help"
											value={selectionCount}
											onChange={(event) => { setSelectionCount(event.target.value); updateDraftState(event.target.value !== selectionCountBaseline); }}
											required
											disabled={roundsSaving}
										/>
										<button className="round-selection-step" type="button" aria-label="Increase selections per ballot" disabled={roundsSaving || Number(selectionCount) >= candidateOptions.length} onClick={() => {
											const next = String(Math.min(candidateOptions.length, Number(selectionCount || 1) + 1));
											setSelectionCount(next);
											updateDraftState(next !== selectionCountBaseline);
										}}>+</button>
									</div>
									<p className="form-note" id="round-selection-count-help">Choose from 1 to {candidateOptions.length}, the number of candidates in the confirmed list.</p>
									<div className="form-actions">
										<button className="primary-button" type="submit" disabled={roundsSaving || roundsLoading}>
											{roundsSaving ? 'Saving…' : draftRoundId ? 'Save round setup' : 'Save round setup'}
										</button>
										{draftRound && draftRound.selectionCount !== null && <>
											<button className="primary-button" type="button" disabled={roundsSaving || roundsLoading || draftRound.selectionCount === null || firstRoundDraftStale} onClick={() => openStartDialog(draftRound)}>Start voting</button>
											{draftRound.roundNumber === 1 && <button className="secondary-button" type="button" disabled={roundsSaving || roundsLoading} onClick={() => { void cancelAndRebuildFirstRound(); }}>Cancel and rebuild draft</button>}
										</>}
									</div>
								</form>
							) : (
								<p className="state-message" role="status">No candidates are ready for the next round. Mark at least two candidates Advanced in the closed round to continue.</p>
							)}
							{!firstRoundSetupVisible && !hasActiveRound && roundsSuccess && <p className="state-message" role="status" tabIndex={roundsSuccess.startsWith('Voting is active') ? -1 : undefined} ref={roundsSuccess.startsWith('Voting is active') ? startSuccessRef : undefined}>{roundsSuccess}</p>}
							{startRoundId && (() => {
								const round = rounds.find((item) => item.id === startRoundId);
								if (!round) return null;
								return (
									<div className="dialog-backdrop">
										<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="start-voting-title" aria-describedby="start-voting-description">
											<h3 id="start-voting-title">Start voting for round {round.roundNumber}?</h3>
											{roundLifecycleBusy && <p className="state-message" role="status">Starting voting…</p>}
											<p id="start-voting-description">Expected voter count: {Number.isInteger(Number(expectedVoterCount)) ? expectedVoterCount : 'not set'}. Confirm the count below; the round will become active immediately.</p>
											{roundsError && <p className="error-message" role="alert">{roundsError}</p>}
											<form onSubmit={startRound}>
												<label htmlFor="expected-voter-count">Expected voter count</label>
												<input ref={expectedVoterInputRef} id="expected-voter-count" type="number" min="1" step="1" value={expectedVoterCount} onChange={(event) => setExpectedVoterCount(event.target.value)} required autoFocus />
												<div className="form-actions dialog-actions">
													<button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setStartRoundId(null)}>Cancel</button>
													<button className="primary-button" type="submit" disabled={roundLifecycleBusy}>{roundLifecycleBusy ? 'Starting…' : 'Confirm and start'}</button>
												</div>
											</form>
										</section>
									</div>
								);
							})()}
							{reopenRoundId && (
								<div className="dialog-backdrop">
									<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reopen-voting-title" aria-describedby="reopen-voting-description">
										<h3 id="reopen-voting-title">Reopen voting for round {rounds.find((round) => round.id === reopenRoundId)?.roundNumber}?</h3>
										<p id="reopen-voting-description">Reopening makes the ballot available again. Voting stays open until an administrator closes it.</p>
										<div className="form-actions dialog-actions">
											<button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setReopenRoundId(null)}>Cancel</button>
											<button className="primary-button" type="button" disabled={roundLifecycleBusy} onClick={confirmReopenRound}>{roundLifecycleBusy ? 'Reopening…' : 'Confirm reopen'}</button>
										</div>
									</section>
								</div>
							)}
							{resetRoundId && (() => {
								const round = rounds.find((item) => item.id === resetRoundId);
								if (!round || (round.status !== 'CLOSED' && round.status !== 'ACTIVE')) return null;
								const cancellingActiveRound = round.status === 'ACTIVE';
								return (
									<div className="dialog-backdrop">
										<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-round-title" aria-describedby="reset-round-description">
											<h3 id="reset-round-title">{cancellingActiveRound ? 'Cancel active voting?' : 'Reset this round?'}</h3>
											<p id="reset-round-description">This permanently deletes ballots and current decisions. The candidate roster stays in place. Selection count and expected voter count are cleared; configure them again to start from zero.</p>
											{roundsError && <p className="error-message" role="alert">{roundsError}</p>}
											<div className="form-actions dialog-actions">
												<button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setResetRoundId(null)}>Cancel</button>
												<button className="danger-button" type="button" disabled={roundLifecycleBusy} onClick={confirmResetRound}>{roundLifecycleBusy ? 'Cancelling…' : cancellingActiveRound ? 'Cancel active voting' : 'Reset round'}</button>
											</div>
										</section>
									</div>
								);
							})()}
						</>
					)}
					</section>
				</details>
			)}
				</div>
			</div>
		</section>
	);
}
