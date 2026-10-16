CREATE TABLE boards (
    id UUID PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES churches (id),
    board_year INTEGER NOT NULL,
    CONSTRAINT ck_boards_year CHECK (board_year > 0),
    CONSTRAINT uq_boards_church_year UNIQUE (church_id, board_year)
);

CREATE INDEX idx_boards_church_year ON boards (church_id, board_year DESC);

CREATE TABLE board_members (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    CONSTRAINT ck_board_members_name CHECK (length(trim(name)) > 0)
);

CREATE TABLE board_sessions (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards (id) ON DELETE CASCADE,
    session_date DATE NOT NULL
);

CREATE INDEX idx_board_sessions_board_id ON board_sessions (board_id);

CREATE TABLE board_session_attendance (
    session_id UUID NOT NULL REFERENCES board_sessions (id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES board_members (id) ON DELETE CASCADE,
    PRIMARY KEY (session_id, member_id)
);