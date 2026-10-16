CREATE TABLE accounts (
    id UUID PRIMARY KEY,
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(60) NOT NULL,
    CONSTRAINT uq_accounts_email UNIQUE (email)
);

CREATE TABLE churches (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    admin_account_id UUID,
    CONSTRAINT uq_churches_admin_account UNIQUE (admin_account_id),
    CONSTRAINT fk_churches_admin_account FOREIGN KEY (admin_account_id) REFERENCES accounts (id)
);

INSERT INTO churches (id, name, admin_account_id)
SELECT DISTINCT church_id, 'Unclaimed legacy church', CAST(NULL AS UUID) FROM elections;

ALTER TABLE elections
    ADD CONSTRAINT fk_elections_church FOREIGN KEY (church_id) REFERENCES churches (id);