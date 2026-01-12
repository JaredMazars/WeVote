-- =====================================================
-- WeVote Database Schema
-- Version: 1.0
-- Date: December 7, 2025
-- Database: PostgreSQL 14+
-- =====================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Organizations/Companies Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#0072CE',
    secondary_color VARCHAR(7) DEFAULT '#171C8F',
    subscription_tier VARCHAR(50) DEFAULT 'startup', -- startup, growth, enterprise, white-label
    max_voters INTEGER DEFAULT 100,
    max_meetings_per_year INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table (Authentication & Profile)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT, -- NULL for OAuth-only users
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20),
    role VARCHAR(50) DEFAULT 'voter', -- voter, admin, auditor, super_admin
    language_preference VARCHAR(10) DEFAULT 'en', -- en, af, zu, xh, etc.
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_lower_check CHECK (email = LOWER(email))
);

-- OAuth Accounts (Microsoft, Google, etc.)
CREATE TABLE oauth_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- microsoft, google, linkedin
    provider_account_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_account_id)
);

-- Two-Factor Authentication
CREATE TABLE two_factor_auth (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    secret TEXT NOT NULL,
    backup_codes TEXT[], -- Array of encrypted backup codes
    is_enabled BOOLEAN DEFAULT false,
    enabled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sessions (for multi-device tracking)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    device_info JSONB, -- browser, OS, device type
    ip_address INET,
    is_trusted_device BOOLEAN DEFAULT false,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Employee Profiles (Extended user information)
CREATE TABLE employee_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    employee_id VARCHAR(50), -- Company employee ID
    department VARCHAR(100),
    position VARCHAR(100),
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    hire_date DATE,
    bio TEXT,
    skills TEXT[], -- Array of skills
    achievements TEXT[], -- Array of achievements
    location VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'Africa/Johannesburg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- VOTING SYSTEM TABLES
-- =====================================================

-- AGM Meetings/Sessions
CREATE TABLE agm_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50) DEFAULT 'annual', -- annual, special, extraordinary
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, active, ended, cancelled
    quorum_required INTEGER DEFAULT 50, -- Percentage
    quorum_met BOOLEAN DEFAULT false,
    meeting_url TEXT, -- Video conferencing link
    recording_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Documents (Agendas, Reports, etc.)
CREATE TABLE meeting_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50), -- pdf, docx, xlsx
    file_size_bytes BIGINT,
    version INTEGER DEFAULT 1,
    uploaded_by UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidates (for voting)
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100) NOT NULL, -- Board Member, Director, etc.
    department VARCHAR(100),
    bio TEXT,
    manifesto TEXT,
    photo_url TEXT,
    nomination_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resolutions (proposals to vote on)
CREATE TABLE resolutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100), -- financial, governance, operational, policy
    voting_requirement VARCHAR(50) DEFAULT 'ordinary', -- ordinary (50%), special (75%), unanimous
    required_percentage DECIMAL(5,2) DEFAULT 50.00,
    financial_impact DECIMAL(15,2),
    effective_date DATE,
    proposer_id UUID REFERENCES users(id),
    seconder_id UUID REFERENCES users(id),
    display_order INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vote Allocations (how many votes each user has)
CREATE TABLE vote_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    allocated_votes INTEGER DEFAULT 1,
    reason TEXT, -- shareholding, membership level, etc.
    allocated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(agm_session_id, user_id)
);

-- Proxy Assignments
CREATE TABLE proxy_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    principal_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Person assigning proxy
    proxy_holder_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Person receiving proxy
    proxy_type VARCHAR(50) NOT NULL, -- discretionary, instructional, split
    vote_weight DECIMAL(5,2) DEFAULT 100.00, -- Percentage of votes (for split proxies)
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (vote_weight > 0 AND vote_weight <= 100)
);

-- Proxy Instructions (for instructional proxies)
CREATE TABLE proxy_instructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proxy_assignment_id UUID REFERENCES proxy_assignments(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    resolution_id UUID REFERENCES resolutions(id) ON DELETE CASCADE,
    instruction VARCHAR(50) NOT NULL, -- vote_for, vote_against, abstain (for resolutions: yes, no, abstain)
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (candidate_id IS NOT NULL AND resolution_id IS NULL) OR
        (candidate_id IS NULL AND resolution_id IS NOT NULL)
    )
);

-- Candidate Votes
CREATE TABLE candidate_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(50) NOT NULL, -- regular, proxy, split_proxy
    proxy_assignment_id UUID REFERENCES proxy_assignments(id), -- NULL for regular votes
    vote_weight DECIMAL(5,2) DEFAULT 1.00, -- Actual vote weight (considering splits)
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    UNIQUE(agm_session_id, candidate_id, voter_id, proxy_assignment_id)
);

-- Resolution Votes
CREATE TABLE resolution_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    resolution_id UUID REFERENCES resolutions(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vote VARCHAR(20) NOT NULL, -- yes, no, abstain
    vote_type VARCHAR(50) NOT NULL, -- regular, proxy, split_proxy
    proxy_assignment_id UUID REFERENCES proxy_assignments(id),
    vote_weight DECIMAL(5,2) DEFAULT 1.00,
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    UNIQUE(agm_session_id, resolution_id, voter_id, proxy_assignment_id),
    CHECK (vote IN ('yes', 'no', 'abstain'))
);

-- =====================================================
-- ENGAGEMENT & COMMUNICATION TABLES
-- =====================================================

-- Q&A Questions (Live meeting engagement)
CREATE TABLE qa_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    question TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, answered
    upvotes INTEGER DEFAULT 0,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Q&A Answers
CREATE TABLE qa_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES qa_questions(id) ON DELETE CASCADE,
    answered_by UUID REFERENCES users(id),
    answer TEXT NOT NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Q&A Upvotes
CREATE TABLE qa_upvotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES qa_questions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, user_id)
);

-- Email Notifications Queue
CREATE TABLE email_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL, -- meeting_reminder, vote_confirmation, proxy_assigned, etc.
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, cancelled
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB, -- Additional data (meeting_id, candidate_name, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- SMS Notifications Queue
CREATE TABLE sms_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    provider VARCHAR(50), -- twilio, aws_sns
    provider_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- WhatsApp Notifications Queue
CREATE TABLE whatsapp_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    provider_message_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- AUDIT & COMPLIANCE TABLES
-- =====================================================

-- Comprehensive Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login, vote_cast, proxy_assigned, meeting_started, etc.
    entity_type VARCHAR(50), -- user, candidate, resolution, proxy, meeting
    entity_id UUID,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10), -- GET, POST, PUT, DELETE
    request_path TEXT,
    request_body JSONB,
    response_status INTEGER,
    metadata JSONB, -- Flexible additional data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Meeting Attendance Tracking
CREATE TABLE meeting_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    ip_address INET,
    device_info JSONB,
    UNIQUE(agm_session_id, user_id)
);

-- Vote Verification Tokens (for blockchain-lite verification)
CREATE TABLE vote_verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vote_id UUID, -- References candidate_votes or resolution_votes
    vote_type VARCHAR(50) NOT NULL, -- candidate_vote, resolution_vote
    token_hash TEXT NOT NULL UNIQUE,
    verification_code VARCHAR(20) NOT NULL UNIQUE,
    blockchain_tx_hash TEXT, -- For future blockchain integration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ANALYTICS & REPORTING TABLES
-- =====================================================

-- Voting Patterns (Aggregated analytics)
CREATE TABLE voting_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_meetings_attended INTEGER DEFAULT 0,
    total_votes_cast INTEGER DEFAULT 0,
    total_proxies_given INTEGER DEFAULT 0,
    total_proxies_received INTEGER DEFAULT 0,
    participation_rate DECIMAL(5,2) DEFAULT 0.00,
    last_vote_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Report Generation History
CREATE TABLE report_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agm_session_id UUID REFERENCES agm_sessions(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL, -- full_pdf, full_excel, quick_summary
    file_url TEXT,
    generated_by UUID REFERENCES users(id),
    file_size_bytes BIGINT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SYSTEM CONFIGURATION TABLES
-- =====================================================

-- Feature Flags (for A/B testing and gradual rollouts)
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN DEFAULT false,
    enabled_for_organizations UUID[], -- Array of organization IDs
    enabled_for_users UUID[], -- Array of user IDs
    rollout_percentage INTEGER DEFAULT 0, -- 0-100
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings (Global configuration)
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    value_type VARCHAR(50) DEFAULT 'string', -- string, integer, boolean, json
    description TEXT,
    is_secret BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_name VARCHAR(100) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB, -- List of available template variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id, template_name)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- AGM Sessions indexes
CREATE INDEX idx_agm_sessions_organization_id ON agm_sessions(organization_id);
CREATE INDEX idx_agm_sessions_status ON agm_sessions(status);
CREATE INDEX idx_agm_sessions_scheduled_start ON agm_sessions(scheduled_start_time);

-- Candidates indexes
CREATE INDEX idx_candidates_agm_session_id ON candidates(agm_session_id);
CREATE INDEX idx_candidates_user_id ON candidates(user_id);

-- Resolutions indexes
CREATE INDEX idx_resolutions_agm_session_id ON resolutions(agm_session_id);

-- Vote Allocations indexes
CREATE INDEX idx_vote_allocations_agm_session_id ON vote_allocations(agm_session_id);
CREATE INDEX idx_vote_allocations_user_id ON vote_allocations(user_id);

-- Proxy Assignments indexes
CREATE INDEX idx_proxy_assignments_agm_session_id ON proxy_assignments(agm_session_id);
CREATE INDEX idx_proxy_assignments_principal_id ON proxy_assignments(principal_id);
CREATE INDEX idx_proxy_assignments_proxy_holder_id ON proxy_assignments(proxy_holder_id);
CREATE INDEX idx_proxy_assignments_is_active ON proxy_assignments(is_active);

-- Candidate Votes indexes
CREATE INDEX idx_candidate_votes_agm_session_id ON candidate_votes(agm_session_id);
CREATE INDEX idx_candidate_votes_candidate_id ON candidate_votes(candidate_id);
CREATE INDEX idx_candidate_votes_voter_id ON candidate_votes(voter_id);
CREATE INDEX idx_candidate_votes_voted_at ON candidate_votes(voted_at);

-- Resolution Votes indexes
CREATE INDEX idx_resolution_votes_agm_session_id ON resolution_votes(agm_session_id);
CREATE INDEX idx_resolution_votes_resolution_id ON resolution_votes(resolution_id);
CREATE INDEX idx_resolution_votes_voter_id ON resolution_votes(voter_id);
CREATE INDEX idx_resolution_votes_voted_at ON resolution_votes(voted_at);

-- Audit Logs indexes
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_agm_session_id ON audit_logs(agm_session_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Q&A indexes
CREATE INDEX idx_qa_questions_agm_session_id ON qa_questions(agm_session_id);
CREATE INDEX idx_qa_questions_status ON qa_questions(status);

-- Notifications indexes
CREATE INDEX idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_scheduled_for ON email_notifications(scheduled_for);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View: User Full Details (with organization and profile)
CREATE VIEW v_user_full_details AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.avatar_url,
    u.phone_number,
    u.role,
    u.language_preference,
    u.is_active,
    u.last_login_at,
    o.name AS organization_name,
    o.domain AS organization_domain,
    ep.employee_id,
    ep.department,
    ep.position,
    ep.bio,
    ep.skills,
    ep.achievements
FROM users u
LEFT JOIN organizations o ON u.organization_id = o.id
LEFT JOIN employee_profiles ep ON u.id = ep.user_id;

-- View: Candidate Vote Results
CREATE VIEW v_candidate_vote_results AS
SELECT 
    c.id AS candidate_id,
    c.agm_session_id,
    c.position,
    u.first_name || ' ' || u.last_name AS candidate_name,
    COUNT(cv.id) AS vote_count,
    COALESCE(SUM(cv.vote_weight), 0) AS weighted_vote_count
FROM candidates c
LEFT JOIN users u ON c.user_id = u.id
LEFT JOIN candidate_votes cv ON c.id = cv.candidate_id
GROUP BY c.id, c.agm_session_id, c.position, u.first_name, u.last_name;

-- View: Resolution Vote Results
CREATE VIEW v_resolution_vote_results AS
SELECT 
    r.id AS resolution_id,
    r.agm_session_id,
    r.title,
    r.voting_requirement,
    r.required_percentage,
    COUNT(CASE WHEN rv.vote = 'yes' THEN 1 END) AS yes_votes,
    COUNT(CASE WHEN rv.vote = 'no' THEN 1 END) AS no_votes,
    COUNT(CASE WHEN rv.vote = 'abstain' THEN 1 END) AS abstain_votes,
    COALESCE(SUM(CASE WHEN rv.vote = 'yes' THEN rv.vote_weight ELSE 0 END), 0) AS weighted_yes_votes,
    COALESCE(SUM(CASE WHEN rv.vote = 'no' THEN rv.vote_weight ELSE 0 END), 0) AS weighted_no_votes,
    COALESCE(SUM(CASE WHEN rv.vote = 'abstain' THEN rv.vote_weight ELSE 0 END), 0) AS weighted_abstain_votes,
    COUNT(rv.id) AS total_votes,
    CASE 
        WHEN COUNT(rv.id) > 0 THEN
            (COALESCE(SUM(CASE WHEN rv.vote = 'yes' THEN rv.vote_weight ELSE 0 END), 0) * 100.0 / 
             NULLIF(COALESCE(SUM(CASE WHEN rv.vote != 'abstain' THEN rv.vote_weight ELSE 0 END), 0), 0))
        ELSE 0
    END AS yes_percentage
FROM resolutions r
LEFT JOIN resolution_votes rv ON r.id = rv.resolution_id
GROUP BY r.id, r.agm_session_id, r.title, r.voting_requirement, r.required_percentage;

-- View: Active Proxy Assignments
CREATE VIEW v_active_proxies AS
SELECT 
    pa.id,
    pa.agm_session_id,
    pa.proxy_type,
    pa.vote_weight,
    principal.first_name || ' ' || principal.last_name AS principal_name,
    principal.email AS principal_email,
    proxy_holder.first_name || ' ' || proxy_holder.last_name AS proxy_holder_name,
    proxy_holder.email AS proxy_holder_email,
    pa.valid_from,
    pa.valid_until
FROM proxy_assignments pa
JOIN users principal ON pa.principal_id = principal.id
JOIN users proxy_holder ON pa.proxy_holder_id = proxy_holder.id
WHERE pa.is_active = true 
  AND (pa.valid_until IS NULL OR pa.valid_until > CURRENT_TIMESTAMP);

-- View: Meeting Participation Stats
CREATE VIEW v_meeting_participation_stats AS
SELECT 
    agm.id AS agm_session_id,
    agm.title AS meeting_title,
    agm.status,
    COUNT(DISTINCT ma.user_id) AS attendees_count,
    COUNT(DISTINCT cv.voter_id) AS candidate_voters_count,
    COUNT(DISTINCT rv.voter_id) AS resolution_voters_count,
    COUNT(DISTINCT COALESCE(cv.voter_id, rv.voter_id)) AS total_unique_voters
FROM agm_sessions agm
LEFT JOIN meeting_attendance ma ON agm.id = ma.agm_session_id
LEFT JOIN candidate_votes cv ON agm.id = cv.agm_session_id
LEFT JOIN resolution_votes rv ON agm.id = rv.agm_session_id
GROUP BY agm.id, agm.title, agm.status;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update_updated_at trigger to all tables with updated_at column
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_accounts_updated_at BEFORE UPDATE ON oauth_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employee_profiles_updated_at BEFORE UPDATE ON employee_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agm_sessions_updated_at BEFORE UPDATE ON agm_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resolutions_updated_at BEFORE UPDATE ON resolutions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vote_allocations_updated_at BEFORE UPDATE ON vote_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_proxy_assignments_updated_at BEFORE UPDATE ON proxy_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Calculate meeting duration on attendance check-out
CREATE OR REPLACE FUNCTION calculate_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.check_out_time IS NOT NULL AND OLD.check_out_time IS NULL THEN
        NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_meeting_attendance_duration 
BEFORE UPDATE ON meeting_attendance 
FOR EACH ROW 
EXECUTE FUNCTION calculate_attendance_duration();

-- Function: Auto-create audit log entry for votes
CREATE OR REPLACE FUNCTION audit_vote_cast()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        organization_id,
        agm_session_id,
        user_id,
        action,
        entity_type,
        entity_id,
        description,
        ip_address,
        user_agent
    ) VALUES (
        (SELECT organization_id FROM agm_sessions WHERE id = NEW.agm_session_id),
        NEW.agm_session_id,
        NEW.voter_id,
        'vote_cast',
        TG_TABLE_NAME,
        NEW.id,
        'Vote cast for ' || TG_TABLE_NAME,
        NEW.ip_address,
        NEW.user_agent
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_candidate_vote_cast AFTER INSERT ON candidate_votes FOR EACH ROW EXECUTE FUNCTION audit_vote_cast();
CREATE TRIGGER audit_resolution_vote_cast AFTER INSERT ON resolution_votes FOR EACH ROW EXECUTE FUNCTION audit_vote_cast();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resolution_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own data
CREATE POLICY users_view_own ON users
    FOR SELECT
    USING (id = current_setting('app.current_user_id')::UUID);

-- Policy: Admins can see all users in their organization
CREATE POLICY users_view_organization ON users
    FOR SELECT
    USING (
        organization_id = current_setting('app.current_organization_id')::UUID
        AND EXISTS (
            SELECT 1 FROM users u 
            WHERE u.id = current_setting('app.current_user_id')::UUID 
            AND u.role IN ('admin', 'super_admin')
        )
    );

-- =====================================================
-- SEED DATA (Initial records)
-- =====================================================

-- Insert default organization
INSERT INTO organizations (id, name, domain, subscription_tier, max_voters, max_meetings_per_year)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Forvis Mazars', 'forvismzansi.com', 'enterprise', 1000, 999);

-- Insert system settings
INSERT INTO system_settings (key, value, value_type, description) VALUES
    ('smtp_host', 'smtp.sendgrid.net', 'string', 'SMTP server hostname'),
    ('smtp_port', '587', 'integer', 'SMTP server port'),
    ('smtp_from_email', 'noreply@wevote.com', 'string', 'Default from email address'),
    ('smtp_from_name', 'WeVote Platform', 'string', 'Default from name'),
    ('twilio_account_sid', '', 'string', 'Twilio Account SID for SMS'),
    ('twilio_auth_token', '', 'string', 'Twilio Auth Token'),
    ('twilio_phone_number', '', 'string', 'Twilio phone number'),
    ('jwt_secret', '', 'string', 'JWT signing secret'),
    ('session_timeout_hours', '24', 'integer', 'Session timeout in hours'),
    ('enable_2fa', 'false', 'boolean', 'Enable two-factor authentication'),
    ('enable_email_verification', 'true', 'boolean', 'Require email verification'),
    ('max_file_upload_size_mb', '50', 'integer', 'Maximum file upload size in MB');

-- Insert default email templates
INSERT INTO email_templates (organization_id, template_name, subject, body_html, body_text, variables) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'meeting_reminder',
    'Reminder: AGM Meeting on {{meeting_date}}',
    '<h1>Meeting Reminder</h1><p>Dear {{user_name}},</p><p>This is a reminder that the AGM meeting "{{meeting_title}}" is scheduled for {{meeting_date}} at {{meeting_time}}.</p><p><a href="{{meeting_url}}">Join Meeting</a></p>',
    'Dear {{user_name}}, This is a reminder that the AGM meeting "{{meeting_title}}" is scheduled for {{meeting_date}} at {{meeting_time}}. Join: {{meeting_url}}',
    '["user_name", "meeting_title", "meeting_date", "meeting_time", "meeting_url"]'::JSONB
),
(
    '00000000-0000-0000-0000-000000000001',
    'vote_confirmation',
    'Vote Confirmation - {{meeting_title}}',
    '<h1>Vote Confirmed</h1><p>Dear {{user_name}},</p><p>Your vote has been successfully recorded for the meeting "{{meeting_title}}".</p><p>Verification Code: {{verification_code}}</p>',
    'Dear {{user_name}}, Your vote has been successfully recorded for "{{meeting_title}}". Verification Code: {{verification_code}}',
    '["user_name", "meeting_title", "verification_code"]'::JSONB
);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE organizations IS 'Multi-tenant organizations using the platform';
COMMENT ON TABLE users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE oauth_accounts IS 'OAuth provider connections (Microsoft, Google)';
COMMENT ON TABLE two_factor_auth IS 'Two-factor authentication settings per user';
COMMENT ON TABLE user_sessions IS 'Active user sessions for multi-device tracking';
COMMENT ON TABLE employee_profiles IS 'Extended employee information beyond basic user data';
COMMENT ON TABLE agm_sessions IS 'Annual General Meetings or voting sessions';
COMMENT ON TABLE meeting_documents IS 'Documents associated with meetings (agendas, reports)';
COMMENT ON TABLE candidates IS 'Candidates nominated for positions in voting';
COMMENT ON TABLE resolutions IS 'Proposals/resolutions to be voted on';
COMMENT ON TABLE vote_allocations IS 'Number of votes allocated to each user per meeting';
COMMENT ON TABLE proxy_assignments IS 'Proxy voting assignments between users';
COMMENT ON TABLE proxy_instructions IS 'Specific voting instructions for instructional proxies';
COMMENT ON TABLE candidate_votes IS 'Votes cast for candidates';
COMMENT ON TABLE resolution_votes IS 'Votes cast for resolutions (yes/no/abstain)';
COMMENT ON TABLE qa_questions IS 'Questions submitted during meetings';
COMMENT ON TABLE qa_answers IS 'Answers to questions from moderators/admins';
COMMENT ON TABLE qa_upvotes IS 'User upvotes on questions';
COMMENT ON TABLE email_notifications IS 'Email notification queue';
COMMENT ON TABLE sms_notifications IS 'SMS notification queue';
COMMENT ON TABLE whatsapp_notifications IS 'WhatsApp notification queue';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail of all system actions';
COMMENT ON TABLE meeting_attendance IS 'Track user attendance at meetings';
COMMENT ON TABLE vote_verification_tokens IS 'Verification tokens for vote integrity';
COMMENT ON TABLE voting_patterns IS 'Aggregated user voting analytics';
COMMENT ON TABLE report_history IS 'History of generated reports';
COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollouts';
COMMENT ON TABLE system_settings IS 'Global system configuration';
COMMENT ON TABLE email_templates IS 'Customizable email templates per organization';

-- =====================================================
-- END OF SCHEMA
-- =====================================================
