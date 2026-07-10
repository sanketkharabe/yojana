const pool = require('./db');

const createTablesQuery = `
-- Clean up existing tables to avoid conflicts
DROP TABLE IF EXISTS disqualification_criteria CASCADE;
DROP TABLE IF EXISTS documents_required CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS eligibility_criteria CASCADE;
DROP TABLE IF EXISTS application_steps CASCADE;
DROP TABLE IF EXISTS schemes CASCADE;

-- 1. Schemes Table
CREATE TABLE schemes (
    id SERIAL PRIMARY KEY,
    scheme_name_mr VARCHAR(255),
    scheme_name_en VARCHAR(255),
    short_name VARCHAR(100),
    launched_by VARCHAR(255),
    launch_date VARCHAR(100),
    official_website VARCHAR(500),
    helpline VARCHAR(255),
    nodal_ministry VARCHAR(255),
    implementing_agency VARCHAR(255),
    scheme_type VARCHAR(255),
    description TEXT
);

-- 2. Eligibility Criteria Table
CREATE TABLE eligibility_criteria (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    criteria_name VARCHAR(255),
    details TEXT,
    is_required BOOLEAN
);

-- 3. Benefits Table
CREATE TABLE benefits (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    benefit_name VARCHAR(255),
    description TEXT
);

-- 4. Documents Required Table
CREATE TABLE documents_required (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    document_name VARCHAR(255),
    doc_type VARCHAR(100)
);

-- 5. Disqualification Criteria Table
CREATE TABLE disqualification_criteria (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    reason TEXT
);

-- 6. Application Steps Table
CREATE TABLE application_steps (
    id SERIAL PRIMARY KEY,
    scheme_id INTEGER REFERENCES schemes(id) ON DELETE CASCADE,
    step_no INTEGER,
    description TEXT
);
`;

const runQueries = async () => {
    try {
        console.log("Connecting to the database to create tables...");
        await pool.query(createTablesQuery);
        console.log("Tables created successfully.");
    } catch (error) {
        console.error("Error creating tables:", error);
    } finally {
        pool.end();
    }
};

runQueries();
