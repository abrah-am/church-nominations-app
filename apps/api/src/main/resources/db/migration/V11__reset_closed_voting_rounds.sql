ALTER TABLE voting_rounds
    ALTER COLUMN selection_count DROP NOT NULL;

ALTER TABLE voting_rounds
    ADD COLUMN reset_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE voting_rounds
    ADD CONSTRAINT ck_voting_rounds_reset_count CHECK (reset_count >= 0);

ALTER TABLE voting_rounds
    DROP CONSTRAINT ck_voting_rounds_selection_count;

ALTER TABLE voting_rounds
    ADD CONSTRAINT ck_voting_rounds_selection_count
    CHECK (selection_count IS NULL OR selection_count > 0);

ALTER TABLE voting_rounds
    DROP CONSTRAINT ck_voting_rounds_lifecycle;

ALTER TABLE voting_rounds
    ADD CONSTRAINT ck_voting_rounds_lifecycle CHECK (
        (status = 'DRAFT' AND expected_voter_count IS NULL
            AND access_token IS NULL AND close_reason IS NULL
            AND (draft_position_id IS NULL OR draft_position_id = position_id)
            AND active_position_id IS NULL)
        OR (status = 'ACTIVE' AND selection_count IS NOT NULL
            AND expected_voter_count IS NOT NULL AND access_token IS NOT NULL AND close_reason IS NULL
            AND draft_position_id IS NULL AND active_position_id = position_id)
        OR (status = 'CLOSED' AND selection_count IS NOT NULL
            AND expected_voter_count IS NOT NULL AND access_token IS NOT NULL AND close_reason IS NOT NULL
            AND draft_position_id IS NULL AND active_position_id IS NULL)
    );

CREATE TABLE voting_round_reset_events (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL REFERENCES voting_rounds (id) ON DELETE CASCADE,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL,
    reset_by VARCHAR(320) NOT NULL
);

CREATE INDEX ix_voting_round_reset_events_round_time
    ON voting_round_reset_events (round_id, reset_at);