ALTER TABLE nomination_intakes ADD COLUMN list_created_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE nomination_intakes ADD COLUMN list_created_by VARCHAR(320);
ALTER TABLE nomination_intakes ADD COLUMN list_contributor_count BIGINT;
ALTER TABLE nomination_intakes ADD COLUMN revealed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE nomination_intakes ADD COLUMN revealed_by VARCHAR(320);
ALTER TABLE nomination_intakes ADD COLUMN revealed_contributor_count BIGINT;

ALTER TABLE nomination_intakes ADD CONSTRAINT ck_nomination_intakes_reveal_metadata CHECK (
    (list_created_at IS NULL AND list_created_by IS NULL AND list_contributor_count IS NULL
        AND revealed_at IS NULL AND revealed_by IS NULL
        AND revealed_contributor_count IS NULL)
    OR (list_created_at IS NOT NULL AND list_created_by IS NOT NULL AND list_contributor_count >= 0
        AND status = 'CLOSED'
        AND ((revealed_at IS NULL AND revealed_by IS NULL AND revealed_contributor_count IS NULL)
            OR (revealed_at IS NOT NULL AND revealed_by IS NOT NULL AND revealed_contributor_count >= 0)))
);

ALTER TABLE nomination_submissions ALTER COLUMN device_token DROP NOT NULL;