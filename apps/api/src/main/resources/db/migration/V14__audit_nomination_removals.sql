CREATE TABLE nomination_shared_list_audit_events (
    id UUID PRIMARY KEY,
    intake_id UUID NOT NULL REFERENCES nomination_intakes (id) ON DELETE CASCADE,
    entry_id UUID NOT NULL,
    entry_name TEXT NOT NULL,
    entry_sequence INTEGER NOT NULL,
    action VARCHAR(12) NOT NULL,
    actor VARCHAR(320) NOT NULL,
    occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT ck_nomination_shared_list_audit_action CHECK (action IN ('REMOVED', 'RESTORED'))
);

CREATE INDEX ix_nomination_shared_list_audit_intake_time
    ON nomination_shared_list_audit_events (intake_id, occurred_at);