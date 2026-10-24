ALTER TABLE nomination_intakes
    ADD COLUMN shared_list_revision BIGINT NOT NULL DEFAULT 0;

ALTER TABLE nomination_consolidated_names
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;