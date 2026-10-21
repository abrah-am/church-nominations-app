ALTER TABLE voting_round_candidate_decision_events
    DROP CONSTRAINT ck_voting_round_candidate_decision_events_decision;

ALTER TABLE voting_round_candidate_decision_events
    ADD CONSTRAINT ck_voting_round_candidate_decision_events_decision
    CHECK (decision IN ('ADVANCED', 'ELIMINATED', 'ELECTED', 'UNDONE'));