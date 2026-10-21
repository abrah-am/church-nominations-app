CREATE TABLE voting_rounds (
    id UUID PRIMARY KEY,
    position_id UUID NOT NULL REFERENCES election_positions (id) ON DELETE CASCADE,
    draft_position_id UUID NOT NULL UNIQUE REFERENCES election_positions (id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    status VARCHAR(10) NOT NULL,
    selection_count INTEGER NOT NULL,
    CONSTRAINT ck_voting_rounds_number CHECK (round_number > 0),
    CONSTRAINT ck_voting_rounds_status CHECK (status IN ('DRAFT')),
    CONSTRAINT ck_voting_rounds_draft_position CHECK (
        (status = 'DRAFT' AND draft_position_id = position_id)
    ),
    CONSTRAINT ck_voting_rounds_selection_count CHECK (selection_count > 0),
    CONSTRAINT uq_voting_rounds_position_number UNIQUE (position_id, round_number)
);

CREATE TABLE voting_round_candidates (
    id UUID PRIMARY KEY,
    round_id UUID NOT NULL REFERENCES voting_rounds (id) ON DELETE CASCADE,
    candidate_name TEXT NOT NULL,
    sequence INTEGER NOT NULL,
    CONSTRAINT ck_voting_round_candidates_name CHECK (length(trim(candidate_name)) > 0),
    CONSTRAINT ck_voting_round_candidates_sequence CHECK (sequence > 0),
    CONSTRAINT uq_voting_round_candidates_sequence UNIQUE (round_id, sequence)
);