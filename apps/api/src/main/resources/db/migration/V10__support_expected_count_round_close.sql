ALTER TABLE voting_rounds
    ALTER COLUMN close_reason TYPE VARCHAR(20);

ALTER TABLE voting_rounds
    DROP CONSTRAINT ck_voting_rounds_close_reason;

ALTER TABLE voting_rounds
    ADD CONSTRAINT ck_voting_rounds_close_reason
    CHECK (close_reason IS NULL OR close_reason IN ('ADMIN', 'CUTOFF', 'EXPECTED_COUNT'));