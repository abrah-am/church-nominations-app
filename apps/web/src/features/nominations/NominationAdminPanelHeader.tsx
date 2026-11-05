type NominationAdminPanelHeaderProps = {
	title: string;
	subtitle: string;
	currentTask: string;
	status: string;
	statusClassName?: string;
	currentStep: number;
	steps: string[];
};

export default function NominationAdminPanelHeader({ title, subtitle, currentStep, steps }: NominationAdminPanelHeaderProps) {
	return (
		<header className="guided-workflow-task">
			<p className="eyebrow">Position workflow</p>
			<h2 className="workflow-position-name" id="nomination-admin-title">{title}</h2>
			<p className="workflow-task-kicker">Current task</p>
			<p>{subtitle}</p>
			<span className="sr-only">Workflow step {currentStep + 1} of {steps.length}.</span>
        <div className="guided-workflow-progress">
          <div className="workflow-progress-meta"><span>Election progress</span><span>{currentStep + 1} of {steps.length}</span></div>
				<div className="workflow-progress-bar" aria-hidden="true">
					{steps.map((step, index) => <span className={index <= currentStep ? 'is-reached' : ''} key={step} />)}
				</div>
				<ol className="workflow-step-list">
					{steps.map((step, index) => (
						<li className={index < currentStep ? 'is-complete' : index === currentStep ? 'is-current' : 'is-upcoming'} aria-current={index === currentStep ? 'step' : undefined} key={step}>
							<span className="workflow-step-marker" aria-hidden="true">{index < currentStep ? '✓' : index + 1}</span>
							<span>{step}</span>
							<span className="sr-only">{index < currentStep ? 'Complete' : index === currentStep ? 'Current step' : 'Upcoming'}</span>
						</li>
					))}
				</ol>
			</div>
		</header>
	);
}