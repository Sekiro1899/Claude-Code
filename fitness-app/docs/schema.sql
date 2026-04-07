-- ============================================================
-- FITNESS APP — PostgreSQL Schema
-- Supabase-compatible DDL
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROGRAMS (créé en premier car personas y fait référence)
-- ============================================================
CREATE TABLE programs (
    id                          VARCHAR(50)     PRIMARY KEY,
    code                        VARCHAR(10)     NOT NULL UNIQUE,
    name                        TEXT            NOT NULL,
    slug                        VARCHAR(80)     NOT NULL UNIQUE,
    tagline                     TEXT,
    objective                   VARCHAR(50)     NOT NULL,
    target_personas             TEXT[],
    duration_weeks              INTEGER,
    is_continuous               BOOLEAN         DEFAULT FALSE,
    frequency_per_week_min      INTEGER         NOT NULL,
    frequency_per_week_max      INTEGER         NOT NULL,
    session_duration_min        INTEGER         NOT NULL,
    session_duration_max        INTEGER         NOT NULL,
    rest_between_sets_sec_min   INTEGER,
    rest_between_sets_sec_max   INTEGER,
    rep_range_min               INTEGER,
    rep_range_max               INTEGER,
    load_intensity              VARCHAR(30),
    load_pct_1rm_min            INTEGER,
    load_pct_1rm_max            INTEGER,
    superset_level              VARCHAR(20),
    superset_label              TEXT,
    has_emom_finisher           BOOLEAN         DEFAULT FALSE,
    emom_duration_min           INTEGER,
    mobility_focus              VARCHAR(20),
    warmup_focus                VARCHAR(20),
    warmup_note                 TEXT,
    cardio_integrated           BOOLEAN         DEFAULT FALSE,
    periodization_type          VARCHAR(40),
    periodization_note          TEXT,
    progression_rule            TEXT,
    tempo                       VARCHAR(20),
    time_under_tension_sec      INTEGER,
    available_protocols         TEXT[],
    default_protocol            VARCHAR(30),
    superset_types              TEXT[],
    warmup_method               VARCHAR(50),
    risky_exercises             TEXT[],
    conditioning_work           TEXT[],
    equipment_required          TEXT[],
    references_sources          TEXT[],
    color                       VARCHAR(10),
    icon                        VARCHAR(10),
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 2. PROGRAM PHASES
-- ============================================================
CREATE TABLE program_phases (
    id                          VARCHAR(50)     PRIMARY KEY,
    program_id                  VARCHAR(50)     NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    phase_number                INTEGER         NOT NULL,
    name                        TEXT            NOT NULL,
    slug                        VARCHAR(80),
    duration_weeks              INTEGER         NOT NULL,
    objective                   TEXT,
    approach                    TEXT,
    rep_range_min               INTEGER,
    rep_range_max               INTEGER,
    sets_compounds              INTEGER,
    sets_isolation              INTEGER,
    sets_main_protocol          VARCHAR(20),
    sets_alternatives           TEXT[],
    load_type                   VARCHAR(30),
    load_pct_1rm                INTEGER,
    load_pct_1rm_start          INTEGER,
    load_pct_1rm_end            INTEGER,
    load_pct_1rm_peak           INTEGER,
    rest_sec_min                INTEGER,
    rest_sec_max                INTEGER,
    superset_level              VARCHAR(20),
    has_emom                    BOOLEAN         DEFAULT FALSE,
    emom_format                 TEXT,
    progression_rule            TEXT,
    deload_every_n_weeks        INTEGER,
    deload_reduction_pct        INTEGER,
    warmup_sets_per_lift        JSONB,
    target_skills               TEXT[],
    notes                       TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(program_id, phase_number)
);

-- ============================================================
-- 3. PERSONAS
-- ============================================================
CREATE TABLE personas (
    id                          VARCHAR(50)     PRIMARY KEY,
    code                        VARCHAR(10)     NOT NULL UNIQUE,
    name                        TEXT            NOT NULL,
    slug                        VARCHAR(80)     NOT NULL UNIQUE,
    tagline                     TEXT,
    description                 TEXT,
    objective                   VARCHAR(50)     NOT NULL,
    objective_label             TEXT,
    typical_age_range           VARCHAR(20),
    gender_bias                 VARCHAR(30),
    experience_level            VARCHAR(40),
    sessions_per_week_min       INTEGER,
    sessions_per_week_max       INTEGER,
    session_duration_min_min    INTEGER,
    session_duration_min_max    INTEGER,
    preferred_environment       TEXT[],
    equipment_access            VARCHAR(40),
    cardio_tolerance            VARCHAR(30),
    intensity_preference        VARCHAR(40),
    primary_program_id          VARCHAR(50)     REFERENCES programs(id),
    secondary_program_id        VARCHAR(50)     REFERENCES programs(id),
    tertiary_program_id         VARCHAR(50)     REFERENCES programs(id),
    excluded_program_ids        TEXT[],
    color                       VARCHAR(10),
    icon                        VARCHAR(10),
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 4. PERSONA-PROGRAM ELIGIBILITY MATRIX
-- ============================================================
CREATE TABLE persona_program_eligibility (
    id                          VARCHAR(60)     PRIMARY KEY,
    persona_id                  VARCHAR(50)     NOT NULL REFERENCES personas(id),
    program_id                  VARCHAR(50)     NOT NULL REFERENCES programs(id),
    eligibility_rank            VARCHAR(20)     NOT NULL CHECK (eligibility_rank IN ('primary','secondary','tertiary','excluded')),
    rank_order                  INTEGER,
    rationale                   TEXT,
    is_recommended_default      BOOLEAN         DEFAULT FALSE,
    is_hard_exclusion           BOOLEAN         DEFAULT FALSE,
    can_be_suggested_by_feedback BOOLEAN        DEFAULT FALSE,
    feedback_suggestion_condition TEXT,
    frequency_override_min      INTEGER,
    frequency_override_max      INTEGER,
    frequency_override_note     TEXT,
    combination_note            TEXT,
    sav_rotation_day            VARCHAR(30),
    pitch_message               TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW(),
    UNIQUE(persona_id, program_id)
);

-- ============================================================
-- 5. USERS (runtime — créé avant exercises pour FK created_by_user_id)
-- ============================================================
CREATE TABLE users (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    email                       TEXT            NOT NULL UNIQUE,
    full_name                   TEXT,
    date_of_birth               DATE,
    gender                      VARCHAR(20),
    persona_id                  VARCHAR(50)     REFERENCES personas(id),
    questionnaire_answers       JSONB,
    questionnaire_scores        JSONB,
    preferred_environment       TEXT[],
    available_equipment         TEXT[],
    experience_level            VARCHAR(20),
    sessions_per_week           INTEGER,
    session_duration_target     INTEGER,
    subscription_status         VARCHAR(20)     DEFAULT 'inactive' CHECK (subscription_status IN ('active','inactive','trial','cancelled','past_due')),
    subscription_plan           VARCHAR(30),
    stripe_customer_id          TEXT,
    stripe_subscription_id      TEXT,
    onboarding_completed        BOOLEAN         DEFAULT FALSE,
    created_at                  TIMESTAMPTZ     DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 6. EXERCISES
-- ============================================================
CREATE TABLE exercises (
    id                          VARCHAR(50)     PRIMARY KEY,
    category                    VARCHAR(30)     NOT NULL
                                    CHECK (category IN ('push','pull','arms','legs','core_strength','core_endurance','explosive','complex','conditioning','warmup','finisher')),
    name                        TEXT            NOT NULL,
    muscles_primary             TEXT[]          NOT NULL,
    muscles_secondary           TEXT[],
    intent                      TEXT[]          NOT NULL,
    level                       VARCHAR(20)     NOT NULL CHECK (level IN ('debutant','intermediaire','avance')),
    bodyweight_compatible       BOOLEAN         NOT NULL DEFAULT FALSE,
    material_required           TEXT[],
    description                 TEXT,
    warmup_target               TEXT[],
    protocol                    VARCHAR(30),
    video_url                   TEXT,
    is_custom                   BOOLEAN         DEFAULT FALSE,
    created_by_user_id          UUID            REFERENCES users(id),
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 7. QUESTIONNAIRE QUESTIONS
-- ============================================================
CREATE TABLE questionnaire_questions (
    id                          VARCHAR(20)     PRIMARY KEY,
    questionnaire_id            VARCHAR(50)     NOT NULL,
    question_number             INTEGER         NOT NULL,
    text                        TEXT            NOT NULL,
    type                        VARCHAR(30)     NOT NULL CHECK (type IN ('single_choice','multiple_choice','scale_1_5','qcm_with_subscale')),
    segmentation_role           VARCHAR(40),
    note                        TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

CREATE TABLE questionnaire_options (
    id                          VARCHAR(30)     PRIMARY KEY,
    question_id                 VARCHAR(20)     NOT NULL REFERENCES questionnaire_questions(id),
    label                       TEXT            NOT NULL,
    value                       VARCHAR(50)     NOT NULL,
    maps_to_objective           VARCHAR(50),
    maps_to_duration_max        INTEGER,
    maps_to_frequency_min       INTEGER,
    maps_to_frequency_max       INTEGER,
    maps_to_environment         VARCHAR(30),
    score_smb                   INTEGER         DEFAULT 0,
    score_bf                    INTEGER         DEFAULT 0,
    score_aw                    INTEGER         DEFAULT 0,
    score_cr                    INTEGER         DEFAULT 0,
    score_sav                   INTEGER         DEFAULT 0,
    has_malus                   BOOLEAN         DEFAULT FALSE,
    is_exclusive                BOOLEAN         DEFAULT FALSE,
    is_sav_exclusive_signal     BOOLEAN         DEFAULT FALSE,
    note                        TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 8. FEEDBACK POLL
-- ============================================================
CREATE TABLE feedback_poll_questions (
    id                          VARCHAR(20)     PRIMARY KEY,
    poll_id                     VARCHAR(50)     NOT NULL DEFAULT 'feedback_poll_v1',
    question_number             INTEGER         NOT NULL,
    text                        TEXT            NOT NULL,
    type                        VARCHAR(30)     NOT NULL,
    stores_as                   VARCHAR(30),
    stores_factor_as            VARCHAR(30),
    scoring_rule                TEXT,
    note                        TEXT
);

CREATE TABLE feedback_poll_options (
    id                          VARCHAR(30)     PRIMARY KEY,
    question_id                 VARCHAR(20)     NOT NULL REFERENCES feedback_poll_questions(id),
    value                       VARCHAR(30)     NOT NULL,
    label                       TEXT            NOT NULL,
    sublabel                    TEXT,
    numeric_value               INTEGER,
    has_subscale                BOOLEAN         DEFAULT FALSE,
    fixed_score                 INTEGER,
    maps_to_variant             TEXT[],
    maps_to_program_id          VARCHAR(50),
    maps_to_persona             VARCHAR(10),
    triggers_alternative_pitch  BOOLEAN         DEFAULT FALSE,
    fallback_to_bodyweight      BOOLEAN         DEFAULT FALSE
);

-- ============================================================
-- 9. PROGRAM VARIANTS (for feedback redirection)
-- ============================================================
CREATE TABLE program_variants (
    id                          VARCHAR(40)     PRIMARY KEY,
    code                        VARCHAR(20)     NOT NULL UNIQUE,
    name                        TEXT            NOT NULL,
    trigger_factor              TEXT[],
    trigger_subscale_min        INTEGER,
    description                 TEXT,
    load_adjustment_pct         NUMERIC(5,2),
    rep_range_adjustment        INTEGER,
    sets_adjustment             INTEGER,
    rest_adjustment_sec         INTEGER,
    frequency_adjustment        INTEGER,
    frequency_min_floor         INTEGER,
    frequency_max_ceiling       INTEGER,
    volume_per_session_adjustment INTEGER,
    exercise_swap_pct           INTEGER,
    swap_preserve_muscle_groups BOOLEAN         DEFAULT TRUE,
    protocol_change             BOOLEAN         DEFAULT FALSE,
    protocol_transitions        JSONB,
    applicable_programs         TEXT[],
    excluded_programs           TEXT[],
    message_template            TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 10. ALTERNATIVE PROGRAM PITCHES
-- ============================================================
CREATE TABLE alternative_program_pitches (
    id                          VARCHAR(50)     PRIMARY KEY,
    from_persona                VARCHAR(10)     NOT NULL,
    from_program                VARCHAR(50)     NOT NULL REFERENCES programs(id),
    to_program                  VARCHAR(50)     NOT NULL REFERENCES programs(id),
    trigger_condition           TEXT            NOT NULL,
    title                       TEXT            NOT NULL,
    intro                       TEXT,
    benefits                    JSONB,
    expected_result             TEXT,
    return_to_program           VARCHAR(50)     REFERENCES programs(id),
    return_after_weeks          INTEGER,
    return_condition            TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 11. USER PROGRAMS (runtime)
-- ============================================================
CREATE TABLE user_programs (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id                  VARCHAR(50)     NOT NULL REFERENCES programs(id),
    persona_id                  VARCHAR(50)     NOT NULL REFERENCES personas(id),
    protocol                    VARCHAR(30),
    status                      VARCHAR(20)     DEFAULT 'active' CHECK (status IN ('active','completed','paused','abandoned')),
    current_phase_id            VARCHAR(50)     REFERENCES program_phases(id),
    current_week                INTEGER         DEFAULT 1,
    start_date                  DATE            NOT NULL DEFAULT CURRENT_DATE,
    end_date                    DATE,
    completed_at                TIMESTAMPTZ,
    variant_load_pct_override   NUMERIC(5,2),
    variant_frequency_override  INTEGER,
    variant_note                TEXT,
    total_sessions_planned      INTEGER,
    total_sessions_completed    INTEGER         DEFAULT 0,
    created_at                  TIMESTAMPTZ     DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 12. SESSIONS (runtime — generated by Workout Engine)
-- ============================================================
CREATE TABLE sessions (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_program_id             UUID            NOT NULL REFERENCES user_programs(id),
    phase_id                    VARCHAR(50)     REFERENCES program_phases(id),
    week_number                 INTEGER         NOT NULL,
    day_number                  INTEGER         NOT NULL,
    session_label               TEXT,
    protocol                    VARCHAR(30),
    focus                       VARCHAR(30),
    status                      VARCHAR(20)     DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','skipped')),
    energy_level                INTEGER         CHECK (energy_level BETWEEN 1 AND 5),
    warmup_block                JSONB,
    main_block                  JSONB,
    core_block                  JSONB,
    finisher_block              JSONB,
    scheduled_date              DATE,
    started_at                  TIMESTAMPTZ,
    completed_at                TIMESTAMPTZ,
    actual_duration_min         INTEGER,
    session_notes               TEXT,
    created_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 13. SESSION LOGS (runtime)
-- ============================================================
CREATE TABLE session_logs (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id                  UUID            NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id                     UUID            NOT NULL REFERENCES users(id),
    exercise_id                 VARCHAR(50)     NOT NULL REFERENCES exercises(id),
    block_type                  VARCHAR(20)     NOT NULL CHECK (block_type IN ('warmup','main','core','finisher')),
    set_number                  INTEGER,
    reps_planned                INTEGER,
    reps_completed              INTEGER,
    load_kg_planned             NUMERIC(6,2),
    load_kg_completed           NUMERIC(6,2),
    rest_sec_planned            INTEGER,
    rest_sec_actual             INTEGER,
    rpe                         INTEGER         CHECK (rpe BETWEEN 1 AND 10),
    completed                   BOOLEAN         DEFAULT FALSE,
    notes                       TEXT,
    logged_at                   TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 14. FEEDBACK RESPONSES (runtime)
-- ============================================================
CREATE TABLE feedback_responses (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_program_id             UUID            NOT NULL REFERENCES user_programs(id),
    poll_id                     VARCHAR(50)     NOT NULL DEFAULT 'feedback_poll_v1',
    score_q1                    INTEGER         NOT NULL CHECK (score_q1 BETWEEN 1 AND 5),
    q2_factor                   VARCHAR(20)     NOT NULL CHECK (q2_factor IN ('difficulty','time','boredom','equipment','recovery','nothing')),
    q2_subscale                 INTEGER         CHECK (q2_subscale BETWEEN 1 AND 3),
    score_q2                    INTEGER         NOT NULL CHECK (score_q2 BETWEEN 1 AND 5),
    q3_new_objective            VARCHAR(20)     NOT NULL,
    score_global                NUMERIC(4,2)    NOT NULL,
    satisfaction_tier           VARCHAR(20)     NOT NULL CHECK (satisfaction_tier IN ('very_satisfied','moderate','unsatisfied')),
    redirect_action             VARCHAR(40),
    redirected_program_id       VARCHAR(50)     REFERENCES programs(id),
    applied_variant_ids         TEXT[],
    alternative_pitch_id        VARCHAR(50)     REFERENCES alternative_program_pitches(id),
    alternative_pitch_accepted  BOOLEAN,
    coach_notification_sent     BOOLEAN         DEFAULT FALSE,
    submitted_at                TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- 15. SUBSCRIPTIONS (runtime — Stripe-synced)
-- ============================================================
CREATE TABLE subscriptions (
    id                          UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                     UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id      TEXT            UNIQUE,
    stripe_customer_id          TEXT,
    plan_id                     VARCHAR(40)     NOT NULL,
    plan_name                   TEXT,
    status                      VARCHAR(30)     NOT NULL,
    current_period_start        TIMESTAMPTZ,
    current_period_end          TIMESTAMPTZ,
    cancel_at_period_end        BOOLEAN         DEFAULT FALSE,
    cancelled_at                TIMESTAMPTZ,
    trial_start                 TIMESTAMPTZ,
    trial_end                   TIMESTAMPTZ,
    amount_cents                INTEGER,
    currency                    VARCHAR(5)      DEFAULT 'EUR',
    created_at                  TIMESTAMPTZ     DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ     DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_persona ON users(persona_id);
CREATE INDEX idx_users_subscription ON users(subscription_status);
CREATE INDEX idx_user_programs_user ON user_programs(user_id);
CREATE INDEX idx_user_programs_status ON user_programs(status);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_program ON sessions(user_program_id);
CREATE INDEX idx_sessions_date ON sessions(scheduled_date);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_session_logs_session ON session_logs(session_id);
CREATE INDEX idx_session_logs_user ON session_logs(user_id);
CREATE INDEX idx_session_logs_exercise ON session_logs(exercise_id);
CREATE INDEX idx_exercises_category ON exercises(category);
CREATE INDEX idx_exercises_level ON exercises(level);
CREATE INDEX idx_exercises_bw ON exercises(bodyweight_compatible);
CREATE INDEX idx_feedback_user ON feedback_responses(user_id);
CREATE INDEX idx_ppe_persona ON persona_program_eligibility(persona_id);
CREATE INDEX idx_ppe_program ON persona_program_eligibility(program_id);
CREATE INDEX idx_ppe_rank ON persona_program_eligibility(eligibility_rank);

-- ============================================================
-- ROW LEVEL SECURITY (Supabase)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "user_programs_own" ON user_programs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sessions_own" ON sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "session_logs_own" ON session_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "feedback_own" ON feedback_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- Reference tables are public read
CREATE POLICY "personas_public_read" ON personas FOR SELECT USING (true);
CREATE POLICY "programs_public_read" ON programs FOR SELECT USING (true);
CREATE POLICY "program_phases_public_read" ON program_phases FOR SELECT USING (true);
CREATE POLICY "exercises_public_read" ON exercises FOR SELECT USING (true);
CREATE POLICY "eligibility_public_read" ON persona_program_eligibility FOR SELECT USING (true);
CREATE POLICY "questionnaire_public_read" ON questionnaire_questions FOR SELECT USING (true);
CREATE POLICY "options_public_read" ON questionnaire_options FOR SELECT USING (true);
CREATE POLICY "feedback_questions_public_read" ON feedback_poll_questions FOR SELECT USING (true);
CREATE POLICY "feedback_options_public_read" ON feedback_poll_options FOR SELECT USING (true);
CREATE POLICY "variants_public_read" ON program_variants FOR SELECT USING (true);
CREATE POLICY "pitches_public_read" ON alternative_program_pitches FOR SELECT USING (true);
