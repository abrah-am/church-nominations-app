CREATE TABLE elections (
    id UUID PRIMARY KEY,
    church_id UUID NOT NULL,
    department_name VARCHAR NOT NULL,
    status VARCHAR(20) NOT NULL,
    CONSTRAINT ck_elections_status CHECK (status = 'SETUP')
);

CREATE INDEX idx_elections_church_id ON elections (church_id);

CREATE TABLE election_positions (
    id UUID PRIMARY KEY,
    election_id UUID NOT NULL REFERENCES elections (id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    opening_count INTEGER NOT NULL,
    sequence INTEGER NOT NULL,
    CONSTRAINT ck_election_positions_opening_count CHECK (opening_count > 0),
    CONSTRAINT ck_election_positions_sequence CHECK (sequence > 0),
    CONSTRAINT uq_election_positions_sequence UNIQUE (election_id, sequence)
);