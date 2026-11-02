import { ReactNode, useId } from 'react';

type ParticipantSessionLinkCardProps = {
  description: string;
  url?: string;
  actionLabel?: string;
  actionDisabled?: boolean;
  actionTitle?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
};

export function ParticipantSessionLinkCard({
  description,
  url,
  actionLabel = 'Copy session link',
  actionDisabled = false,
  actionTitle,
  onAction,
  className = '',
  children,
}: ParticipantSessionLinkCardProps) {
  const headingId = useId();
  return (
    <article className={`access-card access-card--participant ${className}`.trim()} aria-labelledby={headingId}>
      <h3 id={headingId}>Participant session link</h3>
      <p className="access-card-description">{description}</p>
      {url && <code className="access-card-url">{url}</code>}
      {actionLabel && <button className="secondary-button prototype-secondary-button access-card-action" type="button" disabled={actionDisabled || !onAction} title={actionTitle} onClick={onAction}>{actionLabel}</button>}
      {children}
    </article>
  );
}
