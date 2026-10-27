ALTER TABLE nomination_intakes
    ADD COLUMN IF NOT EXISTS list_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE nomination_intakes
    ADD COLUMN IF NOT EXISTS list_created_by VARCHAR(320);
ALTER TABLE nomination_intakes
    ADD COLUMN IF NOT EXISTS list_contributor_count BIGINT;

UPDATE nomination_intakes intake
SET list_created_at = COALESCE(intake.revealed_at, CURRENT_TIMESTAMP),
    list_created_by = COALESCE(intake.revealed_by, 'legacy migration'),
    list_contributor_count = COALESCE(
        intake.revealed_contributor_count,
        (SELECT COUNT(DISTINCT submission.device_token)
         FROM nomination_submissions submission
         WHERE submission.intake_id = intake.id AND submission.device_token IS NOT NULL)
    )
WHERE intake.status = 'CLOSED' AND intake.list_created_at IS NULL;

ALTER TABLE nomination_intakes
    DROP CONSTRAINT IF EXISTS ck_nomination_intakes_reveal_metadata;

ALTER TABLE nomination_intakes
    ADD CONSTRAINT ck_nomination_intakes_reveal_metadata CHECK (
        (list_created_at IS NULL AND list_created_by IS NULL AND list_contributor_count IS NULL
            AND revealed_at IS NULL AND revealed_by IS NULL AND revealed_contributor_count IS NULL)
        OR (list_created_at IS NOT NULL AND list_created_by IS NOT NULL AND list_contributor_count >= 0
            AND status = 'CLOSED'
            AND ((revealed_at IS NULL AND revealed_by IS NULL AND revealed_contributor_count IS NULL)
                OR (revealed_at IS NOT NULL AND revealed_by IS NOT NULL AND revealed_contributor_count >= 0)))
    );
