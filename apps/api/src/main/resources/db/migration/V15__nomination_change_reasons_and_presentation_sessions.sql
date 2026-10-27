ALTER TABLE nomination_shared_list_audit_events
    DROP CONSTRAINT ck_nomination_shared_list_audit_action;

ALTER TABLE nomination_shared_list_audit_events ADD COLUMN before_name TEXT;
ALTER TABLE nomination_shared_list_audit_events ADD COLUMN after_name TEXT;
ALTER TABLE nomination_shared_list_audit_events ADD COLUMN removal_reason VARCHAR(12);
ALTER TABLE nomination_shared_list_audit_events ADD COLUMN reason_detail TEXT;

UPDATE nomination_shared_list_audit_events
SET removal_reason = 'OTHER', reason_detail = 'Reason not recorded'
WHERE action = 'REMOVED';

ALTER TABLE nomination_shared_list_audit_events
    ADD CONSTRAINT ck_nomination_shared_list_audit_action
        CHECK (action IN ('CORRECTED', 'REMOVED', 'RESTORED'));

ALTER TABLE nomination_shared_list_audit_events ADD CONSTRAINT ck_nomination_shared_list_removal_reason CHECK (
        (action = 'REMOVED' AND removal_reason IS NOT NULL
            AND removal_reason IN ('DUPLICATE', 'DECLINED', 'OTHER'))
        OR (action <> 'REMOVED' AND removal_reason IS NULL)
    );

ALTER TABLE nomination_shared_list_audit_events ADD CONSTRAINT ck_nomination_shared_list_other_detail CHECK (
        (removal_reason = 'OTHER' AND reason_detail IS NOT NULL AND length(trim(reason_detail)) > 0)
        OR (removal_reason <> 'OTHER' AND reason_detail IS NULL)
        OR (removal_reason IS NULL AND reason_detail IS NULL)
    );

CREATE TABLE nomination_presentation_sessions (
    id UUID PRIMARY KEY,
    intake_id UUID NOT NULL UNIQUE REFERENCES nomination_intakes (id) ON DELETE CASCADE,
    access_token UUID NOT NULL UNIQUE,
    visible BOOLEAN NOT NULL DEFAULT TRUE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE voting_rounds ADD COLUMN nomination_revision BIGINT;

CREATE TABLE nomination_presentation_control_events (
    id UUID PRIMARY KEY,
    intake_id UUID NOT NULL REFERENCES nomination_intakes (id) ON DELETE CASCADE,
    action VARCHAR(8) NOT NULL,
    actor_label VARCHAR(32) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_nomination_presentation_control_action CHECK (action IN ('START', 'HIDE', 'END'))
);

CREATE INDEX ix_nomination_presentation_control_time
    ON nomination_presentation_control_events (intake_id, occurred_at);