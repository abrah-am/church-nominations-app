CREATE TABLE nomination_intakes (
    id UUID PRIMARY KEY,
    position_id UUID NOT NULL UNIQUE REFERENCES election_positions (id) ON DELETE CASCADE,
    access_token UUID NOT NULL UNIQUE,
    name_limit INTEGER NOT NULL,
    status VARCHAR(10) NOT NULL,
    CONSTRAINT ck_nomination_intakes_name_limit CHECK (name_limit > 0),
    CONSTRAINT ck_nomination_intakes_status CHECK (status IN ('OPEN', 'CLOSED'))
);

CREATE TABLE nomination_submissions (
    id UUID PRIMARY KEY,
    intake_id UUID NOT NULL REFERENCES nomination_intakes (id) ON DELETE CASCADE,
    device_token UUID NOT NULL,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    CONSTRAINT ck_nomination_submissions_name CHECK (length(trim(name)) > 0),
    CONSTRAINT ck_nomination_submissions_sequence CHECK (sequence > 0),
    CONSTRAINT uq_nomination_submissions_device_name UNIQUE (intake_id, device_token, normalized_name),
    CONSTRAINT uq_nomination_submissions_device_sequence UNIQUE (intake_id, device_token, sequence)
);

CREATE INDEX idx_nomination_submissions_intake ON nomination_submissions (intake_id);

CREATE TABLE nomination_consolidated_names (
    id UUID PRIMARY KEY,
    intake_id UUID NOT NULL REFERENCES nomination_intakes (id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    candidate_name TEXT NOT NULL,
    CONSTRAINT ck_nomination_consolidated_sequence CHECK (sequence > 0),
    CONSTRAINT ck_nomination_consolidated_name CHECK (length(trim(candidate_name)) > 0),
    CONSTRAINT uq_nomination_consolidated_sequence UNIQUE (intake_id, sequence)
);