CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) CHECK (role IN ('student', 'counselor')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS counselors (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) CHECK (specialization IN ('IT/Engineering', 'Sales/Marketing', 'Finance/Accounting', 'Teaching/Social Work')) NOT NULL,
    experience INT NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS test_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    score_aptitude INT NOT NULL DEFAULT 0,
    score_personality INT NOT NULL DEFAULT 0,
    score_interest INT NOT NULL DEFAULT 0,
    score_ei INT NOT NULL DEFAULT 0,
    score_skills INT NOT NULL DEFAULT 0,
    recommended_path VARCHAR(255) NOT NULL,
    assigned_counselor_id UUID REFERENCES counselors(id) ON DELETE SET NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS counselors_specialization_idx
    ON counselors (specialization);

CREATE INDEX IF NOT EXISTS test_results_student_id_idx
    ON test_results (student_id);

CREATE INDEX IF NOT EXISTS test_results_assigned_counselor_id_idx
    ON test_results (assigned_counselor_id);

CREATE INDEX IF NOT EXISTS test_results_pending_assigned_counselor_idx
    ON test_results (assigned_counselor_id, created_at)
    WHERE status = 'pending';

CREATE OR REPLACE FUNCTION assign_random_counselor(requested_specialization TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    specialization VARCHAR(100),
    experience INT,
    email VARCHAR(255),
    phone VARCHAR(20)
)
LANGUAGE sql
VOLATILE
AS $$
    WITH specialized AS (
        SELECT c.id, c.name, c.specialization, c.experience, c.email, c.phone
        FROM counselors c
        WHERE c.specialization = requested_specialization
        ORDER BY random()
        LIMIT 1
    ),
    fallback AS (
        SELECT c.id, c.name, c.specialization, c.experience, c.email, c.phone
        FROM counselors c
        WHERE NOT EXISTS (SELECT 1 FROM specialized)
        ORDER BY random()
        LIMIT 1
    )
    SELECT * FROM specialized
    UNION ALL
    SELECT * FROM fallback;
$$;
