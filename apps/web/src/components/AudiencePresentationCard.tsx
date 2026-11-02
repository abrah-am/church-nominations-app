import { ReactNode, useId } from 'react';

type AudiencePresentationCardProps = {
  description: string;
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onOpen?: () => void;
  openDisabled?: boolean;
  switchDisabled?: boolean;
  statusLabel?: string;
  openLabel?: string;
  className?: string;
  children?: ReactNode;
  afterControls?: ReactNode;
};

export function AudiencePresentationCard({
  description,
  visible,
  onVisibilityChange,
  onOpen,
  openDisabled = false,
  switchDisabled = false,
  statusLabel = `Presentation display is ${visible ? 'on' : 'off'}`,
  openLabel = 'Open presentation',
  className = '',
  children,
  afterControls,
}: AudiencePresentationCardProps) {
  const headingId = useId();
  const switchId = useId();
  return (
    <article className={`access-card access-card--presentation ${className}`.trim()} aria-labelledby={headingId}>
      <h3 id={headingId}>Audience presentation</h3>
      <p className="access-card-description">{description}</p>
      <p className="access-card-state" aria-live="polite">{statusLabel}</p>
      {children}
      <div className="access-card-controls">
        <div className="form-check form-switch access-card-switch">
          <input className="form-check-input" id={switchId} type="checkbox" role="switch" checked={visible} disabled={switchDisabled} onChange={(event) => onVisibilityChange(event.target.checked)} />
          <label className="form-check-label" htmlFor={switchId}>Show audience presentation</label>
        </div>
        <button className="primary-button access-card-action" type="button" disabled={openDisabled || !onOpen} onClick={onOpen}>{openLabel}</button>
      </div>
      {afterControls}
    </article>
  );
}
