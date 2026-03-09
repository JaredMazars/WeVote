-- =====================================================
-- WeVote - Azure SQL Database Schema
-- Comprehensive voting platform with AGM sessions, 
-- proxy voting, vote allocations, and audit trails
-- =====================================================

-- =====================================================
-- 1. ORGANIZATIONS & USERS
-- =====================================================

-- Organizations table (multi-tenant support)
CREATE TABLE Organizations (
    OrganizationID INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Domain NVARCHAR(100) UNIQUE,
    Logo NVARCHAR(500),
    PrimaryColor NVARCHAR(7) DEFAULT '#0072CE',
    SecondaryColor NVARCHAR(7) DEFAULT '#171C8F',
    IsActive BIT DEFAULT 1,
    SubscriptionTier NVARCHAR(50) DEFAULT 'Standard', -- Basic, Standard, Premium
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Users table (authentication and base user info)
CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    Email NVARCHAR(255) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Salt NVARCHAR(255) NOT NULL,
    FirstName NVARCHAR(100),
    LastName NVARCHAR(100),
    Role NVARCHAR(50) NOT NULL DEFAULT 'user', -- super_admin, admin, auditor, employee, user
    IsActive BIT DEFAULT 1,
    IsEmailVerified BIT DEFAULT 0,
    EmailVerificationToken NVARCHAR(255),
    PasswordResetToken NVARCHAR(255),
    PasswordResetExpiry DATETIME2,
    MicrosoftOAuthID NVARCHAR(255),
    ProfilePictureURL NVARCHAR(500),
    PhoneNumber NVARCHAR(20),
    LastLoginAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
);

-- Create indexes for performance
CREATE INDEX IX_Users_Email ON Users(Email);
CREATE INDEX IX_Users_OrganizationID ON Users(OrganizationID);
CREATE INDEX IX_Users_Role ON Users(Role);

-- =====================================================
-- 2. EMPLOYEES & DEPARTMENTS
-- =====================================================

-- Departments table
CREATE TABLE Departments (
    DepartmentID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    Name NVARCHAR(100) NOT NULL,
    Code NVARCHAR(20),
    Description NVARCHAR(500),
    ManagerUserID INT,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (ManagerUserID) REFERENCES Users(UserID)
);

-- Employees table (extended profile for employees)
CREATE TABLE Employees (
    EmployeeID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    OrganizationID INT NOT NULL,
    EmployeeNumber NVARCHAR(50) UNIQUE,
    DepartmentID INT,
    ManagerID INT,
    Position NVARCHAR(100),
    HireDate DATE,
    Bio NVARCHAR(1000),
    Shares INT DEFAULT 0, -- For vote allocation based on shareholding
    MembershipTier NVARCHAR(50), -- Bronze, Silver, Gold, Platinum
    RegistrationStatus NVARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    ApprovedBy INT,
    ApprovedAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (DepartmentID) REFERENCES Departments(DepartmentID),
    FOREIGN KEY (ManagerID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID)
);

CREATE INDEX IX_Employees_UserID ON Employees(UserID);
CREATE INDEX IX_Employees_DepartmentID ON Employees(DepartmentID);

-- Employee Skills
CREATE TABLE EmployeeSkills (
    SkillID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    SkillName NVARCHAR(100) NOT NULL,
    ProficiencyLevel NVARCHAR(50), -- Beginner, Intermediate, Advanced, Expert
    YearsOfExperience INT,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

-- Employee Achievements
CREATE TABLE EmployeeAchievements (
    AchievementID INT IDENTITY(1,1) PRIMARY KEY,
    EmployeeID INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(1000),
    AchievedDate DATE,
    Category NVARCHAR(50), -- Award, Certification, Project, Innovation
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID) ON DELETE CASCADE
);

-- =====================================================
-- 3. AGM SESSIONS & VOTING
-- =====================================================

-- AGM Sessions table (voting meetings)
CREATE TABLE AGMSessions (
    SessionID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    SessionType NVARCHAR(50) DEFAULT 'Annual', -- Annual, Quarterly, Special, Emergency
    ScheduledStartTime DATETIME2 NOT NULL,
    ScheduledEndTime DATETIME2 NOT NULL,
    ActualStartTime DATETIME2,
    ActualEndTime DATETIME2,
    Status NVARCHAR(50) DEFAULT 'scheduled', -- scheduled, active, ended, cancelled
    QuorumRequired DECIMAL(5,2) DEFAULT 50.00, -- Percentage
    TotalVoters INT DEFAULT 0,
    TotalVotesCast INT DEFAULT 0,
    QuorumReached BIT DEFAULT 0,
    CreatedBy INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (CreatedBy) REFERENCES Users(UserID)
);

CREATE INDEX IX_AGMSessions_Status ON AGMSessions(Status);
CREATE INDEX IX_AGMSessions_OrganizationID ON AGMSessions(OrganizationID);

-- Session Admin Assignments
CREATE TABLE SessionAdmins (
    SessionAdminID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    UserID INT NOT NULL,
    AssignedBy INT NOT NULL,
    AssignedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (AssignedBy) REFERENCES Users(UserID),
    UNIQUE(SessionID, UserID)
);

-- =====================================================
-- 4. CANDIDATES & NOMINATIONS
-- =====================================================

-- Candidates table
CREATE TABLE Candidates (
    CandidateID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    EmployeeID INT NOT NULL,
    Category NVARCHAR(100) NOT NULL, -- Excellence, Innovation, Leadership, etc.
    NominatedBy INT,
    NominationReason NVARCHAR(MAX),
    Status NVARCHAR(50) DEFAULT 'active', -- active, withdrawn, disqualified
    TotalVotesReceived INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (EmployeeID) REFERENCES Employees(EmployeeID),
    FOREIGN KEY (NominatedBy) REFERENCES Users(UserID)
);

CREATE INDEX IX_Candidates_SessionID ON Candidates(SessionID);
CREATE INDEX IX_Candidates_Category ON Candidates(Category);

-- =====================================================
-- 5. RESOLUTIONS
-- =====================================================

-- Resolutions table (Yes/No/Abstain voting)
CREATE TABLE Resolutions (
    ResolutionID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    Title NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    Category NVARCHAR(100), -- Policy, Budget, Strategic, Operational
    ProposedBy INT,
    RequiredMajority DECIMAL(5,2) DEFAULT 50.00, -- Percentage for approval
    Status NVARCHAR(50) DEFAULT 'open', -- open, passed, failed, withdrawn
    TotalYesVotes INT DEFAULT 0,
    TotalNoVotes INT DEFAULT 0,
    TotalAbstainVotes INT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (ProposedBy) REFERENCES Users(UserID)
);

CREATE INDEX IX_Resolutions_SessionID ON Resolutions(SessionID);
CREATE INDEX IX_Resolutions_Status ON Resolutions(Status);

-- =====================================================
-- 6. VOTE LIMITS & ALLOCATIONS
-- =====================================================

-- Per-Session Vote Limits
CREATE TABLE SessionVoteLimits (
    VoteLimitID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    MinVotesPerUser INT DEFAULT 1,
    MaxVotesPerUser INT DEFAULT 10,
    DefaultVotesPerUser INT DEFAULT 3,
    SetBy INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (SetBy) REFERENCES Users(UserID),
    UNIQUE(SessionID) -- One limit per session
);

-- Custom Vote Allocations (e.g., based on shares)
CREATE TABLE VoteAllocations (
    AllocationID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    UserID INT NOT NULL,
    AllocatedVotes INT NOT NULL,
    Reason NVARCHAR(500),
    BasedOn NVARCHAR(100), -- Shares, Membership, Custom
    SetBy INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (SetBy) REFERENCES Users(UserID),
    UNIQUE(SessionID, UserID)
);

CREATE INDEX IX_VoteAllocations_SessionID_UserID ON VoteAllocations(SessionID, UserID);

-- =====================================================
-- 7. PROXY VOTING
-- =====================================================

-- Vote Splitting Settings (Global)
CREATE TABLE VoteSplittingSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    OrganizationID INT NOT NULL,
    Enabled BIT DEFAULT 0,
    MinProxyVoters INT DEFAULT 1,
    MaxProxyVoters INT DEFAULT 10,
    MinIndividualVotes INT DEFAULT 1,
    MaxIndividualVotes INT DEFAULT 5,
    UpdatedBy INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID),
    FOREIGN KEY (UpdatedBy) REFERENCES Users(UserID),
    UNIQUE(OrganizationID)
);

-- Proxy Assignments
CREATE TABLE ProxyAssignments (
    ProxyID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    PrincipalUserID INT NOT NULL, -- User delegating their vote
    ProxyUserID INT NOT NULL, -- User receiving proxy authority
    ProxyType NVARCHAR(50) NOT NULL, -- discretionary, instructional
    StartDate DATETIME2 DEFAULT GETDATE(),
    EndDate DATETIME2,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (PrincipalUserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProxyUserID) REFERENCES Users(UserID),
    CHECK (PrincipalUserID != ProxyUserID)
);

CREATE INDEX IX_ProxyAssignments_SessionID ON ProxyAssignments(SessionID);
CREATE INDEX IX_ProxyAssignments_ProxyUserID ON ProxyAssignments(ProxyUserID);

-- Instructional Proxy Details (specific voting instructions)
CREATE TABLE ProxyInstructions (
    InstructionID INT IDENTITY(1,1) PRIMARY KEY,
    ProxyID INT NOT NULL,
    CandidateID INT NULL,
    ResolutionID INT NULL,
    InstructionType NVARCHAR(50), -- vote_for_candidate, vote_yes, vote_no, abstain
    VotesToAllocate INT,
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (ProxyID) REFERENCES ProxyAssignments(ProxyID) ON DELETE CASCADE,
    FOREIGN KEY (CandidateID) REFERENCES Candidates(CandidateID),
    FOREIGN KEY (ResolutionID) REFERENCES Resolutions(ResolutionID)
);

-- =====================================================
-- 8. VOTING RECORDS
-- =====================================================

-- Candidate Votes
CREATE TABLE CandidateVotes (
    VoteID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    CandidateID INT NOT NULL,
    VoterUserID INT NOT NULL,
    VotesAllocated INT DEFAULT 1,
    IsProxyVote BIT DEFAULT 0,
    ProxyID INT NULL,
    VotedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID),
    FOREIGN KEY (CandidateID) REFERENCES Candidates(CandidateID),
    FOREIGN KEY (VoterUserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProxyID) REFERENCES ProxyAssignments(ProxyID)
);

CREATE INDEX IX_CandidateVotes_SessionID ON CandidateVotes(SessionID);
CREATE INDEX IX_CandidateVotes_CandidateID ON CandidateVotes(CandidateID);
CREATE INDEX IX_CandidateVotes_VoterUserID ON CandidateVotes(VoterUserID);

-- Resolution Votes
CREATE TABLE ResolutionVotes (
    VoteID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    ResolutionID INT NOT NULL,
    VoterUserID INT NOT NULL,
    VoteChoice NVARCHAR(20) NOT NULL, -- yes, no, abstain
    VotesAllocated INT DEFAULT 1,
    IsProxyVote BIT DEFAULT 0,
    ProxyID INT NULL,
    VotedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID),
    FOREIGN KEY (ResolutionID) REFERENCES Resolutions(ResolutionID),
    FOREIGN KEY (VoterUserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProxyID) REFERENCES ProxyAssignments(ProxyID),
    CHECK (VoteChoice IN ('yes', 'no', 'abstain'))
);

CREATE INDEX IX_ResolutionVotes_SessionID ON ResolutionVotes(SessionID);
CREATE INDEX IX_ResolutionVotes_ResolutionID ON ResolutionVotes(ResolutionID);
CREATE INDEX IX_ResolutionVotes_VoterUserID ON ResolutionVotes(VoterUserID);

-- User Vote Tracking (to enforce vote limits)
CREATE TABLE UserVoteTracking (
    TrackingID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    UserID INT NOT NULL,
    TotalVotesUsed INT DEFAULT 0,
    TotalVotesAvailable INT,
    LastVotedAt DATETIME2,
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    UNIQUE(SessionID, UserID)
);

-- =====================================================
-- 9. AUDIT & LOGGING
-- =====================================================

-- Audit Log
CREATE TABLE AuditLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT,
    OrganizationID INT,
    Action NVARCHAR(100) NOT NULL, -- login, vote_cast, session_created, etc.
    EntityType NVARCHAR(50), -- User, Session, Vote, Candidate, Resolution
    EntityID INT,
    Details NVARCHAR(MAX),
    IPAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (OrganizationID) REFERENCES Organizations(OrganizationID)
);

CREATE INDEX IX_AuditLog_UserID ON AuditLog(UserID);
CREATE INDEX IX_AuditLog_Action ON AuditLog(Action);
CREATE INDEX IX_AuditLog_CreatedAt ON AuditLog(CreatedAt);

-- Security Events (failed logins, suspicious activity)
CREATE TABLE SecurityEvents (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    EventType NVARCHAR(100) NOT NULL, -- failed_login, unauthorized_access, etc.
    UserID INT NULL,
    Email NVARCHAR(255),
    IPAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    Details NVARCHAR(MAX),
    Severity NVARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

CREATE INDEX IX_SecurityEvents_EventType ON SecurityEvents(EventType);
CREATE INDEX IX_SecurityEvents_CreatedAt ON SecurityEvents(CreatedAt);

-- =====================================================
-- 10. NOTIFICATIONS
-- =====================================================

-- Notifications table
CREATE TABLE Notifications (
    NotificationID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    Type NVARCHAR(50) NOT NULL, -- session_started, vote_reminder, proxy_assigned, etc.
    Title NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX),
    RelatedEntityType NVARCHAR(50), -- Session, Vote, Proxy
    RelatedEntityID INT,
    IsRead BIT DEFAULT 0,
    SentViaEmail BIT DEFAULT 0,
    SentViaWhatsApp BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    ReadAt DATETIME2,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
);

CREATE INDEX IX_Notifications_UserID_IsRead ON Notifications(UserID, IsRead);
CREATE INDEX IX_Notifications_CreatedAt ON Notifications(CreatedAt);

-- =====================================================
-- 11. REPORTS & ANALYTICS
-- =====================================================

-- Session Reports (cached results)
CREATE TABLE SessionReports (
    ReportID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    ReportType NVARCHAR(50) NOT NULL, -- summary, detailed, proxy_analysis, voter_turnout
    ReportData NVARCHAR(MAX), -- JSON format
    GeneratedBy INT NOT NULL,
    GeneratedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    FOREIGN KEY (GeneratedBy) REFERENCES Users(UserID)
);

-- Vote Statistics (pre-calculated for performance)
CREATE TABLE VoteStatistics (
    StatID INT IDENTITY(1,1) PRIMARY KEY,
    SessionID INT NOT NULL,
    TotalRegisteredVoters INT,
    TotalVotesCast INT,
    VoterTurnoutPercentage DECIMAL(5,2),
    ProxyVotesCount INT,
    DirectVotesCount INT,
    TotalCandidates INT,
    TotalResolutions INT,
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID) ON DELETE CASCADE,
    UNIQUE(SessionID)
);

-- =====================================================
-- 12. WHATSAPP INTEGRATION
-- =====================================================

-- WhatsApp Messages Log
CREATE TABLE WhatsAppMessages (
    MessageID INT IDENTITY(1,1) PRIMARY KEY,
    RecipientUserID INT NOT NULL,
    PhoneNumber NVARCHAR(20) NOT NULL,
    MessageType NVARCHAR(50), -- vote_reminder, session_notification, proxy_alert
    MessageContent NVARCHAR(MAX),
    SessionID INT NULL,
    Status NVARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
    ExternalMessageID NVARCHAR(255), -- WhatsApp API message ID
    SentAt DATETIME2,
    DeliveredAt DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (RecipientUserID) REFERENCES Users(UserID),
    FOREIGN KEY (SessionID) REFERENCES AGMSessions(SessionID)
);

CREATE INDEX IX_WhatsAppMessages_Status ON WhatsAppMessages(Status);
CREATE INDEX IX_WhatsAppMessages_RecipientUserID ON WhatsAppMessages(RecipientUserID);

-- =====================================================
-- 13. SAMPLE DATA (SUPER ADMIN)
-- =====================================================

-- Create default organization
INSERT INTO Organizations (Name, Domain, Logo, PrimaryColor, SecondaryColor, IsActive, SubscriptionTier)
VALUES ('Forvis Mazars', 'forvismzars.com', NULL, '#0072CE', '#171C8F', 1, 'Premium');

-- Create super admin user
DECLARE @OrgID INT = SCOPE_IDENTITY();

INSERT INTO Users (OrganizationID, Email, PasswordHash, Salt, FirstName, LastName, Role, IsActive, IsEmailVerified)
VALUES 
    (@OrgID, 'superadmin@wevote.com', 
     'HASHED_PASSWORD_HERE', -- Use proper password hashing in your backend
     'SALT_HERE',
     'Super', 'Admin', 'super_admin', 1, 1),
    (@OrgID, 'admin@wevote.com', 
     'HASHED_PASSWORD_HERE',
     'SALT_HERE',
     'Admin', 'User', 'admin', 1, 1),
    (@OrgID, 'auditor@wevote.com', 
     'HASHED_PASSWORD_HERE',
     'SALT_HERE',
     'Auditor', 'User', 'auditor', 1, 1);

-- =====================================================
-- 14. VIEWS FOR REPORTING
-- =====================================================

-- View: Active Sessions with Statistics
GO
CREATE VIEW vw_ActiveSessions AS
SELECT 
    s.SessionID,
    s.OrganizationID,
    o.Name AS OrganizationName,
    s.Title,
    s.Description,
    s.SessionType,
    s.Status,
    s.ScheduledStartTime,
    s.ScheduledEndTime,
    s.QuorumRequired,
    s.TotalVoters,
    s.TotalVotesCast,
    CASE 
        WHEN s.TotalVoters > 0 
        THEN CAST(s.TotalVotesCast AS DECIMAL(10,2)) / s.TotalVoters * 100 
        ELSE 0 
    END AS VoterTurnoutPercentage,
    COUNT(DISTINCT sa.UserID) AS AssignedAdmins,
    COUNT(DISTINCT c.CandidateID) AS TotalCandidates,
    COUNT(DISTINCT r.ResolutionID) AS TotalResolutions,
    u.FirstName + ' ' + u.LastName AS CreatedByName
FROM AGMSessions s
INNER JOIN Organizations o ON s.OrganizationID = o.OrganizationID
LEFT JOIN SessionAdmins sa ON s.SessionID = sa.SessionID
LEFT JOIN Candidates c ON s.SessionID = c.SessionID AND c.Status = 'active'
LEFT JOIN Resolutions r ON s.SessionID = r.SessionID AND r.Status = 'open'
INNER JOIN Users u ON s.CreatedBy = u.UserID
WHERE s.Status IN ('scheduled', 'active')
GROUP BY 
    s.SessionID, s.OrganizationID, o.Name, s.Title, s.Description, 
    s.SessionType, s.Status, s.ScheduledStartTime, s.ScheduledEndTime,
    s.QuorumRequired, s.TotalVoters, s.TotalVotesCast,
    u.FirstName, u.LastName;
GO

-- View: Candidate Voting Results
GO
CREATE VIEW vw_CandidateResults AS
SELECT 
    c.CandidateID,
    c.SessionID,
    s.Title AS SessionTitle,
    e.EmployeeID,
    u.FirstName + ' ' + u.LastName AS CandidateName,
    u.Email AS CandidateEmail,
    c.Category,
    c.Status,
    COUNT(cv.VoteID) AS TotalVotes,
    SUM(cv.VotesAllocated) AS TotalVotesAllocated,
    SUM(CASE WHEN cv.IsProxyVote = 1 THEN cv.VotesAllocated ELSE 0 END) AS ProxyVotes,
    SUM(CASE WHEN cv.IsProxyVote = 0 THEN cv.VotesAllocated ELSE 0 END) AS DirectVotes,
    RANK() OVER (PARTITION BY c.SessionID, c.Category ORDER BY SUM(cv.VotesAllocated) DESC) AS RankInCategory
FROM Candidates c
INNER JOIN AGMSessions s ON c.SessionID = s.SessionID
INNER JOIN Employees e ON c.EmployeeID = e.EmployeeID
INNER JOIN Users u ON e.UserID = u.UserID
LEFT JOIN CandidateVotes cv ON c.CandidateID = cv.CandidateID
GROUP BY 
    c.CandidateID, c.SessionID, s.Title, e.EmployeeID,
    u.FirstName, u.LastName, u.Email, c.Category, c.Status;
GO

-- View: Resolution Results
CREATE VIEW vw_ResolutionResults AS
SELECT 
    r.ResolutionID,
    r.SessionID,
    s.Title AS SessionTitle,
    r.Title AS ResolutionTitle,
    r.Description,
    r.Category,
    r.Status,
    r.RequiredMajority,
    SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesAllocated ELSE 0 END) AS YesVotes,
    SUM(CASE WHEN rv.VoteChoice = 'no' THEN rv.VotesAllocated ELSE 0 END) AS NoVotes,
    SUM(CASE WHEN rv.VoteChoice = 'abstain' THEN rv.VotesAllocated ELSE 0 END) AS AbstainVotes,
    COUNT(DISTINCT rv.VoterUserID) AS TotalVoters,
    CASE 
        WHEN SUM(rv.VotesAllocated) > 0 
        THEN CAST(SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesAllocated ELSE 0 END) AS DECIMAL(10,2)) / 
             SUM(rv.VotesAllocated) * 100
        ELSE 0 
    END AS YesPercentage,
    CASE 
        WHEN SUM(rv.VotesAllocated) > 0 AND
             (CAST(SUM(CASE WHEN rv.VoteChoice = 'yes' THEN rv.VotesAllocated ELSE 0 END) AS DECIMAL(10,2)) / 
             SUM(rv.VotesAllocated) * 100) >= r.RequiredMajority
        THEN 1
        ELSE 0 
    END AS IsPassed
FROM Resolutions r
INNER JOIN AGMSessions s ON r.SessionID = s.SessionID
LEFT JOIN ResolutionVotes rv ON r.ResolutionID = rv.ResolutionID
GROUP BY 
    r.ResolutionID, r.SessionID, s.Title, r.Title, r.Description,
    r.Category, r.Status, r.RequiredMajority;
GO

-- View: User Vote Allocations
CREATE VIEW vw_UserVoteAllocations AS
SELECT 
    u.UserID,
    u.Email,
    u.FirstName + ' ' + u.LastName AS FullName,
    s.SessionID,
    s.Title AS SessionTitle,
    COALESCE(va.AllocatedVotes, svl.DefaultVotesPerUser, 3) AS AvailableVotes,
    COALESCE(uvt.TotalVotesUsed, 0) AS VotesUsed,
    COALESCE(va.AllocatedVotes, svl.DefaultVotesPerUser, 3) - COALESCE(uvt.TotalVotesUsed, 0) AS VotesRemaining,
    va.Reason AS AllocationReason,
    va.BasedOn
FROM Users u
CROSS JOIN AGMSessions s
LEFT JOIN VoteAllocations va ON u.UserID = va.UserID AND s.SessionID = va.SessionID
LEFT JOIN SessionVoteLimits svl ON s.SessionID = svl.SessionID
LEFT JOIN UserVoteTracking uvt ON u.UserID = uvt.UserID AND s.SessionID = uvt.SessionID
WHERE u.IsActive = 1 AND s.Status IN ('scheduled', 'active');
GO

-- =====================================================
-- 15. STORED PROCEDURES
-- =====================================================

-- SP: Cast Vote for Candidate
CREATE PROCEDURE sp_CastCandidateVote
    @SessionID INT,
    @CandidateID INT,
    @VoterUserID INT,
    @VotesToAllocate INT,
    @IsProxyVote BIT = 0,
    @ProxyID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Check if session is active (accepts both 'active' and 'in_progress')
        IF NOT EXISTS (SELECT 1 FROM AGMSessions WHERE SessionID = @SessionID AND Status IN ('active', 'in_progress'))
        BEGIN
            RAISERROR('Session is not active', 16, 1);
            RETURN;
        END

        -- Check if candidate exists and is active
        IF NOT EXISTS (SELECT 1 FROM Candidates WHERE CandidateID = @CandidateID AND Status = 'active')
        BEGIN
            RAISERROR('Candidate is not active', 16, 1);
            RETURN;
        END

        -- Get user's available votes
        DECLARE @AvailableVotes INT;
        SELECT @AvailableVotes = AvailableVotes FROM vw_UserVoteAllocations 
        WHERE UserID = @VoterUserID AND SessionID = @SessionID;

        -- Get votes remaining
        DECLARE @VotesRemaining INT;
        SELECT @VotesRemaining = VotesRemaining FROM vw_UserVoteAllocations
        WHERE UserID = @VoterUserID AND SessionID = @SessionID;

        -- Check if user has enough votes
        IF @VotesRemaining < @VotesToAllocate
        BEGIN
            RAISERROR('Insufficient votes remaining', 16, 1);
            RETURN;
        END

        -- Insert vote
        INSERT INTO CandidateVotes (SessionID, CandidateID, VoterUserID, VotesAllocated, IsProxyVote, ProxyID)
        VALUES (@SessionID, @CandidateID, @VoterUserID, @VotesToAllocate, @IsProxyVote, @ProxyID);

        -- Update tracking
        IF EXISTS (SELECT 1 FROM UserVoteTracking WHERE SessionID = @SessionID AND UserID = @VoterUserID)
        BEGIN
            UPDATE UserVoteTracking 
            SET TotalVotesUsed = TotalVotesUsed + @VotesToAllocate,
                LastVotedAt = GETDATE()
            WHERE SessionID = @SessionID AND UserID = @VoterUserID;
        END
        ELSE
        BEGIN
            INSERT INTO UserVoteTracking (SessionID, UserID, TotalVotesUsed, TotalVotesAvailable, LastVotedAt)
            VALUES (@SessionID, @VoterUserID, @VotesToAllocate, @AvailableVotes, GETDATE());
        END

        -- Update candidate total
        UPDATE Candidates 
        SET TotalVotesReceived = TotalVotesReceived + @VotesToAllocate
        WHERE CandidateID = @CandidateID;

        -- Update session total
        UPDATE AGMSessions
        SET TotalVotesCast = TotalVotesCast + 1
        WHERE SessionID = @SessionID;

        -- Log audit
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details)
        VALUES (@VoterUserID, 'vote_cast', 'Candidate', @CandidateID, 
                'Cast ' + CAST(@VotesToAllocate AS NVARCHAR) + ' votes');

        COMMIT TRANSACTION;
        SELECT 'Success' AS Result;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- SP: Cast Vote for Resolution
GO
CREATE PROCEDURE sp_CastResolutionVote
    @SessionID INT,
    @ResolutionID INT,
    @VoterUserID INT,
    @VoteChoice NVARCHAR(20),
    @VotesToAllocate INT = 1,
    @IsProxyVote BIT = 0,
    @ProxyID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validate vote choice
        IF @VoteChoice NOT IN ('yes', 'no', 'abstain')
        BEGIN
            RAISERROR('Invalid vote choice', 16, 1);
            RETURN;
        END

        -- Check if session is active (accepts both 'active' and 'in_progress')
        IF NOT EXISTS (SELECT 1 FROM AGMSessions WHERE SessionID = @SessionID AND Status IN ('active', 'in_progress'))
        BEGIN
            RAISERROR('Session is not active', 16, 1);
            RETURN;
        END

        -- Check if resolution exists and is open
        IF NOT EXISTS (SELECT 1 FROM Resolutions WHERE ResolutionID = @ResolutionID AND Status = 'open')
        BEGIN
            RAISERROR('Resolution is not open for voting', 16, 1);
            RETURN;
        END

        -- Insert vote
        INSERT INTO ResolutionVotes (SessionID, ResolutionID, VoterUserID, VoteChoice, VotesAllocated, IsProxyVote, ProxyID)
        VALUES (@SessionID, @ResolutionID, @VoterUserID, @VoteChoice, @VotesToAllocate, @IsProxyVote, @ProxyID);

        -- Update resolution totals
        IF @VoteChoice = 'yes'
            UPDATE Resolutions SET TotalYesVotes = TotalYesVotes + @VotesToAllocate WHERE ResolutionID = @ResolutionID;
        ELSE IF @VoteChoice = 'no'
            UPDATE Resolutions SET TotalNoVotes = TotalNoVotes + @VotesToAllocate WHERE ResolutionID = @ResolutionID;
        ELSE IF @VoteChoice = 'abstain'
            UPDATE Resolutions SET TotalAbstainVotes = TotalAbstainVotes + @VotesToAllocate WHERE ResolutionID = @ResolutionID;

        -- Log audit
        INSERT INTO AuditLog (UserID, Action, EntityType, EntityID, Details)
        VALUES (@VoterUserID, 'resolution_vote_cast', 'Resolution', @ResolutionID, 
                'Voted ' + @VoteChoice + ' with ' + CAST(@VotesToAllocate AS NVARCHAR) + ' votes');

        COMMIT TRANSACTION;
        SELECT 'Success' AS Result;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO

-- =====================================================
-- 16. TRIGGERS
-- =====================================================

-- Trigger: Update organization UpdatedAt
GO
CREATE TRIGGER tr_Organizations_UpdatedAt
ON Organizations
AFTER UPDATE
AS
BEGIN
    UPDATE Organizations
    SET UpdatedAt = GETDATE()
    FROM Organizations o
    INNER JOIN inserted i ON o.OrganizationID = i.OrganizationID;
END;
GO

-- Trigger: Update user UpdatedAt
GO
CREATE TRIGGER tr_Users_UpdatedAt
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users
    SET UpdatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.UserID = i.UserID;
END;
GO

-- =====================================================
-- END OF SCHEMA
-- =====================================================
