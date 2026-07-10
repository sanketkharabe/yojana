CREATE TABLE IF NOT EXISTS schemes (
    id SERIAL PRIMARY KEY,
    scheme_name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    description TEXT,
    official_website VARCHAR(500),
    apply_link VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS eligibility_criteria (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    gender VARCHAR(50),
    residency VARCHAR(255),
    age_min INTEGER,
    age_max INTEGER,
    annual_income NUMERIC,
    education VARCHAR(255),
    business_requirement TEXT,
    priority_group VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS benefits (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    benefit_name VARCHAR(255),
    description TEXT
);

CREATE TABLE IF NOT EXISTS documents_required (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    document_name VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS disqualification_criteria (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    reason TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    description TEXT,
    priority VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
