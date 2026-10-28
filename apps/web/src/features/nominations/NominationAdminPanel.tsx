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
	VotingRoundProgress,
	VotingRoundResult,
	createVotingRound,
	getVotingRoundProgress,
	getVotingRoundResults,
	listVotingRounds,
	revealVotingRound,
	saveCandidateDecision,
	undoCandidateDecision,
	updateVotingRound,
} from '../../api/rounds';
import {
	closeVotingRound,
	reopenVotingRound,
	resetVotingRound,
	startVotingRound,
} from '../../api/voting';
import { getCandidateRecommendation } from '../elections/candidateRecommendations';

export type NominationAdminPanelProps = {
	credentials: string;
	electionId: string;
	positionId: string;
	positionName: string;
	openingCount: number;
	positionProgressStatus: string;
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

export default function NominationAdminPanel({ credentials, electionId, positionId, positionName, openingCount, positionProgressStatus, onLifecycleChange, onDraftStateChange }: NominationAdminPanelProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [intakeDetailsOpen, setIntakeDetailsOpen] = useState(true);
	const [sharedListOpen, setSharedListOpen] = useState(true);
	const [intake, setIntake] = useState<NominationIntake | null>(null);
	const [nameLimit, setNameLimit] = useState('5');
	const [sharedListDraft, setSharedListDraft] = useState<SharedNominationEntry[]>([]);
	const [removedEntries, setRemovedEntries] = useState<RemovedNominationEntry[]>([]);
	const [sharedListDirty, setSharedListDirty] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
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
	const [liveAnnouncement, setLiveAnnouncement] = useState('');
	const [focusClosedStatus, setFocusClosedStatus] = useState(false);
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
	const [revealRoundId, setRevealRoundId] = useState<string | null>(null);
	const [roundResults, setRoundResults] = useState<Record<string, VotingRoundResult>>({});
	const [roundProgress, setRoundProgress] = useState<Record<string, VotingRoundProgress>>({});
	const [unrevealedRoundIds, setUnrevealedRoundIds] = useState<string[]>([]);
	const [decisionDrafts, setDecisionDrafts] = useState<Record<string, { decision: CandidateDecision; reason: string }>>({});
	const [savingDecisionCandidateId, setSavingDecisionCandidateId] = useState<string | null>(null);
	const [electedCandidateId, setElectedCandidateId] = useState<string | null>(null);
	const [roundLifecycleBusy, setRoundLifecycleBusy] = useState(false);
	const [copiedRoundId, setCopiedRoundId] = useState<string | null>(null);
	const lifecycleChangeRef = useRef(onLifecycleChange);
	const closeTriggerRef = useRef<HTMLButtonElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
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
	const firstRoundDraftStale = Boolean(draftRound?.roundNumber === 1 && intake
		&& draftRound.nominationRevision !== intake.sharedListRevision);
	const latestRound = [...rounds].sort((first, second) => first.roundNumber - second.roundNumber)[rounds.length - 1];
	const latestClosedRound = [...rounds]
		.filter((round) => round.status === 'CLOSED')
		.sort((first, second) => second.roundNumber - first.roundNumber)[0];
	const latestRevealedRound = [...rounds]
		.filter((round) => round.status === 'CLOSED' && roundResults[round.id])
		.sort((first, second) => second.roundNumber - first.roundNumber)[0];
	const latestRevealedResult = latestRevealedRound ? roundResults[latestRevealedRound.id] : undefined;
	const currentWorkflowTask = !intake
		? positionProgressStatus === 'NOMINATIONS_OPEN'
			? { stage: 0, title: 'Collect nominations', description: 'Manage the public nomination link and close intake when ready.' }
			: positionProgressStatus === 'NOMINATIONS_CLOSED' || positionProgressStatus === 'CONSOLIDATED'
				? { stage: 0, title: 'Review and reveal nominations', description: 'Review the consolidated list. It remains hidden from the presentation until you explicitly reveal it.' }
				: positionProgressStatus === 'ROUND_ACTIVE'
					? { stage: 1, title: `Monitor voting${latestRound ? ` · Round ${latestRound.roundNumber}` : ''}`, description: 'Track participation only. Ballot totals remain hidden while voting is active.' }
					: positionProgressStatus === 'ROUND_CLOSED_UNREVEALED'
						? { stage: 1, title: `Review results${latestClosedRound ? ` · Round ${latestClosedRound.roundNumber}` : ''}`, description: 'Voting is closed. Results remain private until you explicitly reveal them.' }
						: positionProgressStatus === 'RESULTS_REVEALED'
							? { stage: 2, title: 'Record candidate decisions', description: 'Review aggregate results and record who advances, is eliminated, or is elected.' }
							: positionProgressStatus === 'CANDIDATES_ADVANCED'
								? { stage: 1, title: 'Prepare the next round', description: 'Use the saved candidate decisions to prepare the next round.' }
								: positionProgressStatus === 'COMPLETE'
									? { stage: 3, title: 'Position complete', description: 'All election actions for this position are complete.' }
									: { stage: 0, title: 'Open nomination intake', description: 'Set the name limit and create an intake link for this position.' }
		: intake.status === 'OPEN'
			? { stage: 0, title: 'Collect nominations', description: 'Share the nomination link, monitor profile submissions, and close intake when ready.' }
			: !intake.revealed
				? { stage: 0, title: 'Review and reveal nominations', description: 'Review the consolidated list. It remains hidden from the presentation until you explicitly reveal it.' }
				: activeRound
					? { stage: 1, title: `Monitor voting · Round ${activeRound.roundNumber}`, description: 'Track participation only. Ballot totals remain hidden while voting is active.' }
					: latestClosedRound && unrevealedRoundIds.includes(latestClosedRound.id)
						? { stage: 1, title: `Review results · Round ${latestClosedRound.roundNumber}`, description: 'Voting is closed. Results remain private until you explicitly reveal them.' }
						: latestRevealedResult && !latestRevealedResult.candidates.every((candidate) => candidate.decision)
							? { stage: 2, title: `Record candidate decisions · Round ${latestRevealedRound?.roundNumber}`, description: 'Review aggregate results and record who advances, is eliminated, or is elected.' }
							: latestRound?.status === 'DRAFT'
								? { stage: 1, title: `Prepare voting · Round ${latestRound.roundNumber}`, description: 'Confirm the roster and selection count before starting the voting round.' }
								: latestRevealedRound
									? { stage: positionProgressStatus === 'COMPLETE' ? 3 : 1, title: positionProgressStatus === 'COMPLETE' ? 'Position complete' : `Prepare the next round · Round ${latestRevealedRound.roundNumber + 1}`, description: positionProgressStatus === 'COMPLETE' ? 'All election actions for this position are complete.' : 'Use the saved candidate decisions to prepare the next round.' }
									: { stage: 1, title: 'Prepare voting', description: 'Configure the first round using the confirmed nomination list.' };
	const candidateOptions = latestClosedRound
		? (roundResults[latestClosedRound.id]?.candidates ?? [])
			.filter((candidate) => candidate.decision === 'ADVANCED')
			.map((candidate) => candidate.name)
		: draftRound
						? draftRound.roundNumber === 1 ? confirmedNames : draftRound.candidates.map((candidate) => candidate.name)
			: confirmedNames;
	const unsavedDrafts = (!intake && nameLimit !== '5')
		|| sharedListDirty
		|| (hasSavedSnapshot && roundsReady && selectionCount !== selectionCountBaseline)
		|| Object.entries(decisionDrafts).some(([candidateId, draft]) => {
			const candidate = rounds.flatMap((round) => roundResults[round.id]?.candidates ?? []).find((item) => item.id === candidateId);
			return candidate && (draft.decision !== (candidate.decision ?? 'ADVANCED') || draft.reason.trim() !== (candidate.decisionReason ?? '').trim());
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
			setUnrevealedRoundIds([]);
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
		setUnrevealedRoundIds([]);
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
				setUnrevealedRoundIds(loadedResults.filter((entry) => entry.result === null).map((entry) => entry.roundId));
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
		if (activeRoundIds.length === 0) return () => { isCurrent = false; };

		const pollProgress = async () => {
			await Promise.all(activeRoundIds.map(async (roundId) => {
				if (inFlight.has(roundId)) return;
				inFlight.add(roundId);
				try {
					const progress = await getVotingRoundProgress(credentials, electionId, positionId, roundId);
					if (!isCurrent) return;
					setRoundProgress((current) => ({ ...current, [roundId]: progress }));
					if (progress.status === 'CLOSED') {
						lifecycleChangeRef.current();
						try {
							const result = await getVotingRoundResults(credentials, electionId, positionId, roundId);
							if (!isCurrent) return;
							setRoundResults((current) => ({ ...current, [roundId]: result }));
							setUnrevealedRoundIds((current) => current.filter((id) => id !== roundId));
						} catch (requestError) {
							if (!isCurrent) return;
							if (requestError instanceof RoundsApiError && requestError.status === 404) {
								setRoundResults((current) => {
									const next = { ...current };
									delete next[roundId];
									return next;
								});
								setUnrevealedRoundIds((current) => current.includes(roundId) ? current : [...current, roundId]);
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

	async function loadIntake() {
		setIsExpanded(true);
		setIsLoading(true);
		setError('');
		try {
			const normalized = normalizeNominationIntake(await getNominationIntake(credentials, electionId, positionId));
			setIntake(normalized);
			previousIntakeRef.current = normalized;
			setIntakeDetailsOpen(true);
			if (normalized.status === 'CLOSED') setSharedListOpen(true);
			setSharedListDraft(normalized.sharedList);
			setRemovedEntries(normalized.removedEntries ?? []);
			setSharedListDirty(false);
		} catch (requestError) {
			if (requestError instanceof NominationsApiError && requestError.status === 404) {
				setIntake(null);
			} else {
				setError(requestError instanceof Error ? requestError.message : 'Could not load nomination intake.');
			}
		} finally {
			setIsLoading(false);
		}
	}

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
			if (previous && normalized.status === 'OPEN'
					&& previous.currentContributorCount !== normalized.currentContributorCount) {
				const contributorCount = normalized.currentContributorCount == null
					? 'profile submission count unavailable'
					: `${normalized.currentContributorCount} current profile submissions`;
				setLiveAnnouncement(`Submissions updated: ${contributorCount}.`);
			}
			previousIntakeRef.current = normalized;
			intakeClosed = normalized.status === 'CLOSED';
			setIntake(normalized);
			previousIntakeRef.current = normalized;
			if (normalized.status === 'CLOSED') {
				if (previous?.status !== 'CLOSED') setSharedListOpen(true);
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
			setSharedListOpen(false);
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
			setSharedListOpen(true);
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

	async function revealIntake() {
		if (!intake || intake.status !== 'CLOSED' || intake.revealed) return;
		const viewerWindow = window.open('about:blank', '_blank');
		if (!viewerWindow) {
			setError('The browser blocked the presentation tab. Allow pop-ups, then reveal the list again.');
			return;
		}
		setIsLoading(true);
		setError('');
		try {
			const revealed = normalizeNominationIntake(await revealNominationIntake(credentials, electionId, positionId));
			setIntake(revealed);
			setSharedListDraft(revealed.sharedList);
			setRemovedEntries(revealed.removedEntries ?? []);
			setSharedListDirty(false);
			setSharedListOpen(true);
			const session = await showNominationPresentation(credentials, electionId, positionId);
			const route = `/nomination-presentation/${encodeURIComponent(session.accessToken)}`;
			setPresentationPath(route);
			setPresentationVisible(session.visible);
			viewerWindow.location.assign(route);
			onLifecycleChange();
		} catch (requestError) {
			viewerWindow?.close();
			setError(requestError instanceof Error ? requestError.message : 'Could not reveal nominations. Please retry.');
		} finally {
			setIsLoading(false);
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
		setSharedListOpen(true);
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

	async function saveRoundConfiguration(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!hasSavedSnapshot) return;
		const candidateNames = candidateOptions;
		const requestedSelectionCount = Number(selectionCount);
		if (!Number.isInteger(requestedSelectionCount) || requestedSelectionCount < 1 || requestedSelectionCount > candidateNames.length) {
			setRoundsError('Enter a selection count from 1 through the number of candidates in this round.');
			setRoundsSuccess('');
			return;
		}
		if (candidateNames.length === 0) {
			setRoundsError('No candidates are available for this round.');
			setRoundsSuccess('');
			return;
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
		} catch (requestError) {
			setRoundsError(requestError instanceof RoundsApiError || requestError instanceof Error
				? requestError.message
				: 'Could not save the draft round configuration.');
		} finally {
			setRoundsSaving(false);
		}
	}

	function openStartDialog(round: VotingRound) {
		if (round.selectionCount === null) return;
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
			setRoundResults((current) => {
				const next = { ...current };
				delete next[closed.id];
				return next;
			});
			setUnrevealedRoundIds((current) => current.includes(closed.id) ? current : [...current, closed.id]);
			setRoundsSuccess(`Round ${closed.roundNumber} is closed.`);
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not close voting.');
		} finally {
			setRoundLifecycleBusy(false);
		}
	}

	async function confirmRevealRound() {
		if (!credentials || !revealRoundId) return;
		const round = rounds.find((item) => item.id === revealRoundId);
		if (!round || round.status !== 'CLOSED') return;
		setRoundLifecycleBusy(true);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const result = await revealVotingRound(credentials, electionId, positionId, round.id);
			setRoundResults((current) => ({ ...current, [round.id]: result }));
			setUnrevealedRoundIds((current) => current.filter((id) => id !== round.id));
			setRevealRoundId(null);
			setRoundsSuccess(`Results for round ${round.roundNumber} are revealed to administrators.`);
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not reveal round results.');
		} finally {
			setRoundLifecycleBusy(false);
		}
	}

	async function saveCandidateOutcome(roundId: string, candidateId: string, electedConfirmed = false) {
		if (!credentials) return;
		const draft = decisionDrafts[candidateId] ?? { decision: 'ADVANCED' as CandidateDecision, reason: '' };
		const reason = draft.reason.trim();
		if (draft.decision === 'ELECTED' && !electedConfirmed) {
			setElectedCandidateId(candidateId);
			return;
		}
		const result = roundResults[roundId];
		if (!result) return;
		const completionMayChange = draft.decision === 'ELECTED'
			|| result.candidates.find((candidate) => candidate.id === candidateId)?.decision === 'ELECTED';
		setSavingDecisionCandidateId(candidateId);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const saved = await saveCandidateDecision(credentials, electionId, positionId, roundId, candidateId, {
				decision: draft.decision,
				...(reason ? { reason } : {}),
			});
			const updatedResult = 'roundId' in saved
				? saved
				: {
					...result,
					candidates: result.candidates.map((candidate) => candidate.id === saved.id ? { ...candidate, ...saved } : candidate),
				};
			setRoundResults((current) => ({ ...current, [roundId]: updatedResult }));
			setElectedCandidateId(null);
			setRoundsSuccess('Candidate decision saved.');
			onLifecycleChange(completionMayChange);
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not save the candidate decision.');
		} finally {
			setSavingDecisionCandidateId(null);
		}
	}

	async function undoCandidateOutcome(roundId: string, candidateId: string) {
		if (!credentials) return;
		setSavingDecisionCandidateId(candidateId);
		setRoundsError('');
		setRoundsSuccess('');
		try {
			const updatedResult = await undoCandidateDecision(credentials, electionId, positionId, roundId, candidateId);
			setRoundResults((current) => ({ ...current, [roundId]: updatedResult }));
			const restoredCandidate = updatedResult.candidates.find((candidate) => candidate.id === candidateId);
			if (restoredCandidate) {
				setDecisionDrafts((current) => ({
					...current,
					[candidateId]: { decision: 'ADVANCED', reason: '' },
				}));
			}
			setRoundsSuccess('Candidate decision undone. Mark the candidate Advanced to include them in the next round.');
			onLifecycleChange();
		} catch (requestError) {
			setRoundsError(requestError instanceof Error ? requestError.message : 'Could not undo the candidate decision.');
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
			setRoundResults((current) => {
				const next = { ...current };
				delete next[reopened.id];
				return next;
			});
			setUnrevealedRoundIds((current) => current.filter((id) => id !== reopened.id));
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
		if (!round || round.status !== 'CLOSED' || rounds.some((item) => item.roundNumber > round.roundNumber)) return;
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
			onLifecycleChange(true);
			setUnrevealedRoundIds((current) => current.filter((id) => id !== reset.id));
			setResetRoundId(null);
			setRoundsSuccess(`Round ${reset.roundNumber} reset. Ballots and current decisions were permanently deleted; candidate roster preserved. Reset count: ${reset.resetCount ?? 0}.`);
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

	return (
		<section className="nomination-admin" aria-labelledby="nomination-admin-title">
			<div className="workflow-heading">
				<div><p className="eyebrow">Position workflow</p><h2 id="nomination-admin-title">{positionName}</h2><p>Manage nominations and voting for this position.</p></div>
				{!isExpanded && <button className="secondary-button" type="button" onClick={loadIntake}>Manage nominations</button>}
			</div>
			<section className="guided-workflow" aria-label="Position workflow progress">
				<div className="guided-workflow-task" aria-live="polite" aria-atomic="true">
					<p className="workflow-task-kicker">Current task</p>
					<h3>{currentWorkflowTask.title}</h3>
					<p>{currentWorkflowTask.description}</p>
					<span className="sr-only">Workflow step {currentWorkflowTask.stage + 1} of {workflowSteps.length}.</span>
				</div>
				<div className="guided-workflow-progress">
					<div className="workflow-progress-meta"><span>Election progress</span><span>{currentWorkflowTask.stage + 1} of {workflowSteps.length}</span></div>
					<div className="workflow-progress-bar" aria-hidden="true">
						{workflowSteps.map((step, index) => <span className={index <= currentWorkflowTask.stage ? 'is-reached' : ''} key={step} />)}
					</div>
					<ol className="workflow-step-list">
						{workflowSteps.map((step, index) => (
							<li className={index < currentWorkflowTask.stage ? 'is-complete' : index === currentWorkflowTask.stage ? 'is-current' : ''} aria-current={index === currentWorkflowTask.stage ? 'step' : undefined} key={step}>
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
					<label htmlFor="nomination-name-limit">Maximum names per visitor</label>
					<div className="intake-controls">
						<input id="nomination-name-limit" type="number" min="1" step="1" value={nameLimit} onChange={(event) => { setNameLimit(event.target.value); updateDraftState(event.target.value !== '5'); }} required />
						<button className="primary-button" type="submit" disabled={isLoading}>Create intake</button>
					</div>
				</form>
			)}
			{isExpanded && !isLoading && intake && (
					<section className="workflow-details intake-details">
						<button className="workflow-disclosure-trigger" type="button" aria-expanded={intakeDetailsOpen} onClick={() => setIntakeDetailsOpen((open) => !open)}>
							<span>Nomination intake</span><span>{intake.status === 'OPEN' ? 'Open' : 'Closed'} · {intake.currentContributorCount == null ? 'profile submission count unavailable' : `${intake.currentContributorCount} current profile submissions`}{intake.consolidatedNames ? ` · ${intake.consolidatedNames.length} candidates` : ''}</span>
							<span className="workflow-disclosure-icon" aria-hidden="true">{intakeDetailsOpen ? '−' : '+'}</span>
						</button>
						{intakeDetailsOpen && <div className="intake-content">
					<div className="detail-summary intake-summary">
						<div><span className="summary-label">Intake status</span><span className={`row-status ${intake.status === 'CLOSED' ? 'closed-status' : ''}`}>{intake.status === 'OPEN' ? 'Open' : 'Closed'}</span></div>
						<div className="intake-metric"><span className="summary-label">Current profile submissions</span><strong>{intake.currentContributorCount ?? 'Unavailable'}</strong><span>{intake.currentContributorCount == null ? 'The connected API did not provide this count. Restart or update the API, then reload nominations.' : 'Browser profiles with at least one name currently submitted. This is not a verified count of people.'}</span></div>
						<div><span className="summary-label">Names allowed per profile</span><strong>{intake.nameLimit}</strong></div>
					</div>
					{liveAnnouncement && <p className="live-intake-announcement" role="status" aria-live="polite" aria-atomic="true">{liveAnnouncement}</p>}
					{intake.status === 'OPEN' ? (
						<>
							<label className="share-label" htmlFor="nomination-share-url">Public nomination link</label>
							<div className="intake-controls share-controls">
								<input id="nomination-share-url" value={`${window.location.origin}/nominate/${encodeURIComponent(intake.accessToken)}`} readOnly onFocus={(event) => event.currentTarget.select()} />
								<button className="secondary-button" type="button" onClick={copyShareUrl}>{copied ? 'Copied' : 'Copy link'}</button>
							</div>
							<p className="form-note">Usable while intake is open.</p>
							<p className="form-note">Anyone with this link can submit or update names until you close nominations.</p>
							<div className="form-actions"><button ref={closeTriggerRef} className="secondary-button" type="button" disabled={isLoading} onClick={() => setCloseDialogOpen(true)}>Close nominations</button></div>
							<p className="form-note">Names are available to admins after closing; the presentation remains hidden until you reveal the list.</p>
						</>
					) : (
						<>
							<p className="form-note">Public link disabled. Nominations are read-only.</p>
							{!intake.revealed && <div className="form-actions"><button className="primary-button" type="button" disabled={isLoading} onClick={() => { void revealIntake(); }}>Reveal results</button></div>}
							{intake.revealed && <div className="presentation-admin-controls">
								<button className="primary-button" type="button" disabled={presentationBusy} onClick={() => { void openPresentation(); }}>{presentationPath ? 'Open presentation tab' : 'Start presentation'}</button>
								{presentationVisible && <button className="secondary-button" type="button" disabled={presentationBusy} onClick={() => { void controlPresentation('hide'); }}>Hide presentation</button>}
								{presentationPath && <button className="secondary-button" type="button" disabled={presentationBusy} onClick={() => { void controlPresentation('end'); }}>End presentation</button>}
								{presentationError && <p className="error-message" role="alert">{presentationError}</p>}
							</div>}
							{!intake.revealed && intake.listCreated && <p className="form-note">The shared list is ready for admin review. The presentation remains hidden until you reveal it.</p>}
						</>
					)}
					</div>}
				</section>
			)}
			{isExpanded && !isLoading && !intake && error && (
				<button className="secondary-button" type="button" onClick={() => { void loadIntake(); }}>Retry loading nominations</button>
			)}
			{isExpanded && !isLoading && intake?.status === 'CLOSED' && (
				<p ref={closedStatusRef} tabIndex={-1} className="state-message intake-closure-status" role="status" aria-live="polite" aria-atomic="true">
					{intake.revealed
						? 'The shared list is revealed to the presentation.'
						: 'Nominations are closed. Review the shared list; the presentation remains hidden until you reveal it.'}
				</p>
			)}
			{closeDialogOpen && (
				<div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCloseDialogOpen(false); }}>
					<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="close-nominations-title" aria-describedby="close-nominations-description">
						<h3 id="close-nominations-title">Close nominations?</h3>
						<p id="close-nominations-description">The public link will stop accepting changes. Submitted names will be available to admins; the presentation stays hidden until you reveal the list.</p>
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
			{isExpanded && !isLoading && intake?.status === 'CLOSED' && intake.listCreated && (
				<section ref={sharedListSectionRef} className="workflow-details consolidation-details">
					<button className="workflow-disclosure-trigger" type="button" aria-expanded={sharedListOpen} onClick={() => setSharedListOpen((open) => !open)}>
						<span>Shared nomination list</span><span>{sharedListDraft.filter((entry) => entry.active).length} active · {sharedListDraft.filter((entry) => !entry.active).length} removed</span>
						<span className="workflow-disclosure-icon" aria-hidden="true">{sharedListOpen ? '−' : '+'}</span>
					</button>
					{sharedListOpen && <div className="consolidation-complete">
						<ol className="member-list shared-nomination-list" aria-label="Shared nomination list">
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
						</ol>
						<details className="removed-nomination-section">
							<summary>Removed ({removedEntries.length})</summary>
							{removedEntries.length === 0 ? <p className="form-note">No removed names.</p> : (
								<ul className="member-list" aria-label="Removed nominations">
									{removedEntries.map((entry) => <li key={entry.auditEventId}>
										<span className="shared-nomination-name">{entry.name}</span>
										<button className="icon-button shared-nomination-restore" type="button" aria-label={`Restore ${entry.name}`} title="Restore name" disabled={isLoading || !roundsReady || roundsLoading || hasActiveRound || sharedListDirty} onClick={() => { void restoreRemovedEntry(entry); }}><span aria-hidden="true">↶</span></button>
									</li>)}
								</ul>
							)}
						</details>
						{sharedListError && !removalEntry && <p className="error-message" role="alert">{sharedListError}</p>}
						{sharedListDirty && <div className="shared-list-recovery"><p className="form-note">Unsaved edits are kept here and are not visible on the presentation.</p><button className="primary-button" type="button" disabled={isLoading || hasActiveRound} onClick={() => { void saveSharedList(); }}>{isLoading ? 'Saving…' : 'Save changes'}</button>{sharedListConflict && <button className="secondary-button" type="button" disabled={isLoading} onClick={() => { void reloadSharedList(); }}>Reload latest saved list</button>}</div>}
						{sharedListConflict && !sharedListDirty && !removalEntry && <button className="secondary-button" type="button" disabled={isLoading} onClick={() => { void reloadSharedList(); }}>Reload latest saved list</button>}
						{hasActiveRound && <p className="form-note">Shared-list editing is unavailable while voting is active.</p>}
						{confirmedChangeEvents.length > 0 && <details className="admin-change-history"><summary>Confirmed change history ({confirmedChangeEvents.length})</summary><ol>{confirmedChangeEvents.map((event) => <li key={event.id}><span>{event.action === 'CORRECTED' ? `${event.beforeName} → ${event.afterName}` : event.action === 'REMOVED' ? `${event.beforeName} removed · ${event.removalReason ?? 'Other'}${event.reasonDetail ? `: ${event.reasonDetail}` : ''}` : `${event.afterName ?? event.beforeName} restored`}</span><small>{event.actorLabel} · {new Date(event.occurredAt).toLocaleString()}</small></li>)}</ol></details>}
						{!sharedListDirty && <p className="state-message" role="status">{intake.revealed ? 'Saved; confirmed changes are available to the presentation.' : 'Saved for admin review. The presentation remains hidden.'}</p>}
					</div>}
				</section>
			)}
			{isExpanded && hasSavedSnapshot && (
				<details className="workflow-details voting-round-configuration" open>
					<summary>Voting round configuration <span>{rounds.length} {rounds.length === 1 ? 'round' : 'rounds'} · {hasActiveRound ? 'Voting active' : draftRoundId ? 'Draft ready' : 'Setup'}</span></summary>
					<section aria-labelledby="voting-round-title">
							<div className="section-heading">
						<div><h3 id="voting-round-title">Voting round configuration</h3><p>{latestRound ? 'Candidates marked Advanced in the preceding round continue automatically.' : 'The consolidated list is the complete candidate roster for this poll.'}</p></div>
					</div>
					{roundsLoading && <p className="state-message" role="status">Loading draft round configuration…</p>}
					{roundsError && <p className="error-message" role="alert">{roundsError}</p>}
					{roundsError && !roundsLoading && !roundsReady && <button className="secondary-button" type="button" onClick={() => setRoundsLoadAttempt((attempt) => attempt + 1)}>Retry loading rounds</button>}
					{!roundsLoading && roundsReady && (
						<>
							{activeRound && (
								<button
									className="secondary-button active-round-jump"
									type="button"
									onClick={() => {
										const activeRoundElement = document.getElementById(`round-${activeRound.id}`);
										if (activeRoundElement instanceof HTMLDetailsElement) {
											activeRoundElement.open = true;
											activeRoundElement.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
										}
									}}
								>
									Go to active round {activeRound.roundNumber}
								</button>
							)}
							{rounds.length > 0 && (
								<ul className="voting-round-list" aria-label="Voting rounds">
									{rounds.map((round) => (
										<li className="voting-round-item" key={round.id}>
											<details id={`round-${round.id}`} className={`workflow-details round-details${round.status === 'ACTIVE' ? ' round-details-active' : ''}`} name="voting-rounds">
												<summary><span>Round {round.roundNumber}</span><span>{round.status === 'DRAFT' ? 'Draft' : round.status === 'ACTIVE' ? 'Voting active now' : 'Closed'} · {round.candidates.length} candidates</span></summary>
												<div className="round-detail-content">
											<div className="voting-round-heading">
												<h4>Round {round.roundNumber}</h4>
												<span className={`row-status ${round.status === 'CLOSED' ? 'closed-status' : ''}`}>{round.status === 'DRAFT' ? 'Draft' : round.status === 'ACTIVE' ? 'Active' : 'Closed'}</span>
											</div>
													{round.status === 'DRAFT' ? (
														<><button className="primary-button" type="button" disabled={roundLifecycleBusy || round.selectionCount === null || (round.roundNumber === 1 && firstRoundDraftStale)} onClick={() => openStartDialog(round)}>Start voting</button>{round.roundNumber === 1 && firstRoundDraftStale && <p className="form-note">The shared list changed after this draft was saved. Update the draft roster before starting.</p>}</>
											) : round.accessToken && (
												<>
													<label className="share-label" htmlFor={`voting-share-${round.id}`}>Public voting link</label>
													<div className="intake-controls share-controls">
														<input id={`voting-share-${round.id}`} value={`${window.location.origin}/vote/${encodeURIComponent(round.accessToken)}`} readOnly onFocus={(event) => event.currentTarget.select()} />
														<button className="secondary-button" type="button" onClick={() => copyVotingLink(round)}>{copiedRoundId === round.id ? 'Copied' : 'Copy link'}</button>
													</div>
												</>
											)}
											{round.status === 'ACTIVE' && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => closeRound(round)}>Close voting</button>}
											{round.status === 'ACTIVE' && roundProgress[round.id]?.status === 'ACTIVE' && (
												<div className="round-progress" role="status">
													<strong>Ballots submitted: {roundProgress[round.id].ballotsCast} of {roundProgress[round.id].expectedVoterCount} expected</strong>
													<span>Ballots are counted per browser profile/link, not as verified people.</span>
												</div>
											)}
											{round.status === 'CLOSED' && unrevealedRoundIds.includes(round.id) && <button className="primary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setRevealRoundId(round.id)}>Reveal results</button>}
																			{round.status === 'CLOSED' && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setReopenRoundId(round.id)}>Reopen voting</button>}
																			{round.status === 'CLOSED' && !rounds.some((item) => item.roundNumber > round.roundNumber) && <button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setResetRoundId(round.id)}>Reset round</button>}
																			{(round.resetCount ?? 0) > 0 && <p className="form-note">Reset count: {round.resetCount}</p>}
											{round.status === 'CLOSED' && roundResults[round.id] && (() => {
												const result = roundResults[round.id];
												return (
													<details className="workflow-details result-details" open>
														<summary>Revealed results <span>{result.ballotsCast} / {result.expectedVoterCount} ballots</span></summary>
													<section className="round-results" aria-labelledby={`round-results-title-${round.id}`}>
														<div className="section-heading"><div><h4 id={`round-results-title-${round.id}`}>Revealed results</h4><p>Aggregate totals only. Ballot choices are not shown.</p></div></div>
														<dl className="round-result-summary">
															<div><dt>Ballots cast</dt><dd>{result.ballotsCast} / {result.expectedVoterCount}</dd></div>
															<div><dt>Majority threshold</dt><dd>{result.majorityThreshold}</dd></div>
														</dl>
														<ul className="round-result-candidates" aria-label={`Aggregate candidate votes for round ${round.roundNumber}`}>
															{[...result.candidates]
																.sort((first, second) => second.votes - first.votes || first.name.localeCompare(second.name))
																.map((candidate) => {
																const draft = decisionDrafts[candidate.id];
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
																		{isEliminated ? (
																			<button className="secondary-button" type="button" disabled={savingDecisionCandidateId === candidate.id} onClick={() => void undoCandidateOutcome(round.id, candidate.id)}>
																				{savingDecisionCandidateId === candidate.id ? 'Undoing…' : 'Undo'}
																			</button>
																		) : !isElected && (
																		<form className="candidate-decision-form" onSubmit={(event) => { event.preventDefault(); void saveCandidateOutcome(round.id, candidate.id); }}>
																			<label htmlFor={`candidate-decision-${candidate.id}`}>Decision</label>
																			<select
																				id={`candidate-decision-${candidate.id}`}
																				value={draft?.decision ?? candidate.decision ?? 'ADVANCED'}
																				disabled={savingDecisionCandidateId === candidate.id}
																				onChange={(event) => setDecisionDrafts((current) => ({
																					...current,
																					[candidate.id]: { decision: event.target.value as CandidateDecision, reason: current[candidate.id]?.reason ?? '' },
																				}))}
																			>
																				<option value="ADVANCED">Advanced</option>
																				<option value="ELIMINATED">Eliminated</option>
																				<option value="ELECTED">Elected</option>
																			</select>
																			<label htmlFor={`candidate-reason-${candidate.id}`}>Reason (optional)</label>
																			<input
																				id={`candidate-reason-${candidate.id}`}
																				value={draft?.reason ?? ''}
																				placeholder="Add an optional reason"
																				disabled={savingDecisionCandidateId === candidate.id}
																				onChange={(event) => setDecisionDrafts((current) => ({
																					...current,
																					[candidate.id]: { decision: current[candidate.id]?.decision ?? candidate.decision ?? 'ADVANCED', reason: event.target.value },
																				}))}
																			/>
																			<button className="secondary-button" type="submit" disabled={savingDecisionCandidateId === candidate.id}>
																				{savingDecisionCandidateId === candidate.id ? 'Saving…' : 'Save decision'}
																			</button>
																		</form>
																		)}
																	</li>
																);
															})}
														</ul>
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
							{draftRoundId && (() => {
								const draft = rounds.find((round) => round.id === draftRoundId);
								return draft ? (
									<p className="state-message saved-round-summary" role="status">
										Draft round {draft.roundNumber}: allows {draft.selectionCount} {draft.selectionCount === 1 ? 'selection' : 'selections'} from {draft.candidates.length} candidates.
									</p>
								) : null;
							})()}
							{hasActiveRound ? (
								<p className="state-message" role="status">Next-round setup is available after the active round closes and results are reviewed.</p>
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
									<label className="round-selection-count" htmlFor="round-selection-count">Number of selections allowed</label>
									<input
										id="round-selection-count"
										type="number"
										min="1"
										max={candidateOptions.length}
										step="1"
										value={selectionCount}
										onChange={(event) => { setSelectionCount(event.target.value); updateDraftState(event.target.value !== selectionCountBaseline); }}
										required
										disabled={roundsSaving}
									/>
									<div className="form-actions">
										<button className="primary-button" type="submit" disabled={roundsSaving || roundsLoading}>
											{roundsSaving ? 'Saving…' : draftRoundId ? 'Update draft round' : 'Create draft round'}
										</button>
									</div>
								</form>
							) : (
								<p className="state-message" role="status">No candidates are ready for the next round. Reveal the preceding round and mark candidates Advanced to continue.</p>
							)}
							{roundsSuccess && <p className="state-message" role="status">{roundsSuccess}</p>}
							{startRoundId && (() => {
								const round = rounds.find((item) => item.id === startRoundId);
								if (!round) return null;
								const count = Number(expectedVoterCount);
								const cutoffApplies = round.candidates.length === 2 && round.selectionCount === 1 && Number.isInteger(count) && count > 0 && count % 2 === 0;
								return (
									<div className="dialog-backdrop">
										<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="start-voting-title" aria-describedby="start-voting-description">
											<h3 id="start-voting-title">Start voting for round {round.roundNumber}?</h3>
											<p id="start-voting-description">Expected voter count: {Number.isInteger(Number(expectedVoterCount)) ? expectedVoterCount : 'not set'}. Confirm the count below; the round will become active immediately.</p>
											<form onSubmit={startRound}>
												<label htmlFor="expected-voter-count">Expected voter count</label>
												<input id="expected-voter-count" type="number" min="1" step="1" value={expectedVoterCount} onChange={(event) => setExpectedVoterCount(event.target.value)} required autoFocus />
												{cutoffApplies && <p className="cutoff-warning" role="note">With {count} expected voters, this two-candidate, one-selection round will automatically close after {count - 1} ballots.</p>}
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
										<p id="reopen-voting-description">Reopening overrides this round’s automatic ballot-count limit. The administrator can close it again at any time.</p>
										<div className="form-actions dialog-actions">
											<button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setReopenRoundId(null)}>Cancel</button>
											<button className="primary-button" type="button" disabled={roundLifecycleBusy} onClick={confirmReopenRound}>{roundLifecycleBusy ? 'Reopening…' : 'Confirm reopen'}</button>
										</div>
									</section>
								</div>
							)}
							{resetRoundId && (() => {
								const round = rounds.find((item) => item.id === resetRoundId);
								if (!round || round.status !== 'CLOSED') return null;
								return (
									<div className="dialog-backdrop">
										<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reset-round-title" aria-describedby="reset-round-description">
											<h3 id="reset-round-title">Reset this round?</h3>
											<p id="reset-round-description">This permanently deletes ballots and current decisions. The candidate roster stays in place. Selection count and expected voter count are cleared; configure them again to start from zero.</p>
											<div className="form-actions dialog-actions">
												<button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setResetRoundId(null)}>Cancel</button>
												<button className="primary-button" type="button" disabled={roundLifecycleBusy} onClick={confirmResetRound}>{roundLifecycleBusy ? 'Resetting…' : 'Reset round'}</button>
											</div>
										</section>
									</div>
								);
							})()}
							{revealRoundId && (() => {
								const round = rounds.find((item) => item.id === revealRoundId);
								if (!round || round.status !== 'CLOSED') return null;
								return (
									<div className="dialog-backdrop">
										<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="reveal-results-title" aria-describedby="reveal-results-description">
											<h3 id="reveal-results-title">Reveal results for round {round.roundNumber}?</h3>
											<p id="reveal-results-description">Aggregate results will become visible to administrators. Voter-linked data is never displayed.</p>
											<div className="form-actions dialog-actions">
												<button className="secondary-button" type="button" disabled={roundLifecycleBusy} onClick={() => setRevealRoundId(null)}>Cancel</button>
												<button className="primary-button" type="button" disabled={roundLifecycleBusy} onClick={confirmRevealRound}>{roundLifecycleBusy ? 'Revealing…' : 'Confirm reveal'}</button>
											</div>
										</section>
									</div>
								);
							})()}
						</>
					)}
					</section>
					{electedCandidateId && (() => {
						const electedCandidate = Object.values(roundResults).flatMap((result) => result.candidates).find((candidate) => candidate.id === electedCandidateId);
						if (!electedCandidate) return null;
						return (
							<div className="dialog-backdrop">
								<section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="elected-confirmation-title">
									<h3 id="elected-confirmation-title">Confirm elected outcome</h3>
									<p>Are you sure you want to mark {electedCandidate.name} as elected?</p>
									<div className="form-actions dialog-actions">
										<button className="secondary-button" type="button" disabled={savingDecisionCandidateId === electedCandidateId} onClick={() => setElectedCandidateId(null)}>Cancel</button>
										<button className="primary-button" type="button" disabled={savingDecisionCandidateId === electedCandidateId} onClick={() => {
											const result = Object.values(roundResults).find((item) => item.candidates.some((candidate) => candidate.id === electedCandidateId));
											if (result) void saveCandidateOutcome(result.roundId, electedCandidateId, true);
										}}>{savingDecisionCandidateId === electedCandidateId ? 'Saving…' : 'Confirm elected'}</button>
									</div>
								</section>
							</div>
						);
					})()}
				</details>
			)}
		</section>
	);
}
