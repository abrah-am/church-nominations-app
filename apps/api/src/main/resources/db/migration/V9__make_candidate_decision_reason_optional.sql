ALTER TABLE voting_round_candidate_decisions
    ALTER COLUMN reason DROP NOT NULL;

ALTER TABLE voting_round_candidate_decisions
    DROP CONSTRAINT ck_voting_round_candidate_decisions_reason;

ALTER TABLE voting_round_candidate_decision_events
    ALTER COLUMN reason DROP NOT NULL;

ALTER TABLE voting_round_candidate_decision_events
    DROP CONSTRAINT ck_voting_round_candidate_decision_events_reason;