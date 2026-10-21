ALTER TABLE voting_rounds
    DROP CONSTRAINT ck_voting_rounds_status;

ALTER TABLE voting_rounds
    DROP CONSTRAINT ck_voting_rounds_draft_position;

ALTER TABLE voting_rounds
    ALTER COLUMN draft_position_id DROP NOT NULL;

ALTER TABLE voting_rounds
    ADD COLUMN expected_voter_count INTEGER;

ALTER TABLE voting_rounds
    ADD COLUMN access_token UUID;

ALTER TABLE voting_rounds
    ADD COLUMN close_reason VARCHAR(10);

ALTER TABLE voting_rounds
    ADD COLUMN cutoff_overridden BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE voting_rounds ADD COLUMN active_position_id UUID UNIQUE
    REFERENCES election_positions (id) ON DELETE CASCADE;

ALTER TABLE voting_rounds ADD CONSTRAINT ck_voting_rounds_status
    CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED'));

ALTER TABLE voting_rounds ADD CONSTRAINT ck_voting_rounds_expected_voters
    CHECK (expected_voter_count IS NULL OR expected_voter_count > 0);

ALTER TABLE voting_rounds ADD CONSTRAINT ck_voting_rounds_close_reason
    CHECK (close_reason IS NULL OR close_reason IN ('ADMIN', 'CUTOFF'));

ALTER TABLE voting_rounds ADD CONSTRAINT ck_voting_rounds_lifecycle CHECK (
    (status = 'DRAFT' AND expected_voter_count IS NULL AND access_token IS NULL AND close_reason IS NULL
        AND draft_position_id = position_id AND active_position_id IS NULL)
    OR (status = 'ACTIVE' AND expected_voter_count IS NOT NULL AND access_token IS NOT NULL AND close_reason IS NULL
        AND draft_position_id IS NULL AND active_position_id = position_id)
    OR (status = 'CLOSED' AND expected_voter_count IS NOT NULL AND access_token IS NOT NULL AND close_reason IS NOT NULL
        AND draft_position_id IS NULL AND active_position_id IS NULL)
);

ALTER TABLE voting_rounds ADD CONSTRAINT uq_voting_rounds_access_token UNIQUE (access_token);

ALTER TABLE voting_round_candidates
    ADD CONSTRAINT uq_voting_round_candidates_round_id UNIQUE (round_id, id);

CREATE TABLE voting_ballots (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL REFERENCES voting_rounds (id) ON DELETE CASCADE,
    device_token UUID NOT NULL,
    CONSTRAINT uq_voting_ballots_round_device UNIQUE (round_id, device_token),
    CONSTRAINT uq_voting_ballots_round_id UNIQUE (round_id, id)
);

CREATE TABLE voting_ballot_choices (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL,
    ballot_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    CONSTRAINT fk_voting_ballot_choices_ballot FOREIGN KEY (round_id, ballot_id)
        REFERENCES voting_ballots (round_id, id) ON DELETE CASCADE,
    CONSTRAINT fk_voting_ballot_choices_candidate FOREIGN KEY (round_id, candidate_id)
        REFERENCES voting_round_candidates (round_id, id) ON DELETE CASCADE,
    CONSTRAINT uq_voting_ballot_choices_ballot_candidate UNIQUE (ballot_id, candidate_id)
);

CREATE INDEX ix_voting_ballots_round_id ON voting_ballots (round_id);
CREATE INDEX ix_voting_ballot_choices_ballot_id ON voting_ballot_choices (ballot_id);