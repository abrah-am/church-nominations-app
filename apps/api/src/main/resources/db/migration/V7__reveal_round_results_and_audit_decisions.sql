ALTER TABLE voting_rounds
    ADD COLUMN revealed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE voting_rounds
    ADD COLUMN revealed_by VARCHAR(320);

ALTER TABLE voting_rounds ADD CONSTRAINT ck_voting_rounds_reveal_metadata CHECK (
    (revealed_at IS NULL AND revealed_by IS NULL)
    OR (revealed_at IS NOT NULL AND revealed_by IS NOT NULL AND status = 'CLOSED')
);

CREATE TABLE voting_round_candidate_decisions (
    round_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    decision VARCHAR(10) NOT NULL,
    reason TEXT NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL,
    decided_by VARCHAR(320) NOT NULL,
    CONSTRAINT pk_voting_round_candidate_decisions PRIMARY KEY (round_id, candidate_id),
    CONSTRAINT fk_voting_round_candidate_decisions_candidate
        FOREIGN KEY (round_id, candidate_id)
        REFERENCES voting_round_candidates (round_id, id) ON DELETE CASCADE,
    CONSTRAINT ck_voting_round_candidate_decisions_decision
        CHECK (decision IN ('ADVANCED', 'ELIMINATED', 'ELECTED')),
    CONSTRAINT ck_voting_round_candidate_decisions_reason CHECK (length(trim(reason)) > 0)
);

CREATE TABLE voting_round_candidate_decision_events (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    decision VARCHAR(10) NOT NULL,
    reason TEXT NOT NULL,
    decided_at TIMESTAMP WITH TIME ZONE NOT NULL,
    decided_by VARCHAR(320) NOT NULL,
    CONSTRAINT fk_voting_round_candidate_decision_events_candidate
        FOREIGN KEY (round_id, candidate_id)
        REFERENCES voting_round_candidates (round_id, id) ON DELETE CASCADE,
    CONSTRAINT ck_voting_round_candidate_decision_events_decision
        CHECK (decision IN ('ADVANCED', 'ELIMINATED', 'ELECTED')),
    CONSTRAINT ck_voting_round_candidate_decision_events_reason CHECK (length(trim(reason)) > 0)
);

CREATE INDEX ix_voting_round_candidate_decisions_round
    ON voting_round_candidate_decisions (round_id);
CREATE INDEX ix_voting_round_candidate_decision_events_candidate_time
    ON voting_round_candidate_decision_events (round_id, candidate_id, decided_at);
