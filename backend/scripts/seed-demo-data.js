require('dotenv').config();
const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME || process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'yes' || process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 30000
  }
};

async function seedDemoData() {
  let pool;
  
  try {
    console.log('🌱 Starting comprehensive demo data seeding...\n');
    
    pool = await sql.connect(config);
    console.log('✅ Connected to database\n');

    // Get organization ID
    const orgResult = await pool.request().query('SELECT TOP 1 OrganizationID FROM Organizations');
    const organizationId = orgResult.recordset[0].OrganizationID;
    console.log(`📊 Using Organization ID: ${organizationId}\n`);

    // ==================== SEED DEPARTMENTS ====================
    console.log('🏢 Seeding Departments...');
    const departments = [
      { name: 'Engineering', code: 'ENG', description: 'Software and hardware development' },
      { name: 'Marketing', code: 'MKT', description: 'Brand and product marketing' },
      { name: 'Human Resources', code: 'HR', description: 'People and culture management' },
      { name: 'Sales', code: 'SLS', description: 'Revenue and client relations' },
      { name: 'Finance', code: 'FIN', description: 'Financial planning and analysis' },
      { name: 'Operations', code: 'OPS', description: 'Business operations and logistics' }
    ];

    const departmentIds = [];
    for (const dept of departments) {
      const result = await pool.request()
        .input('orgId', sql.Int, organizationId)
        .input('name', sql.NVarChar, dept.name)
        .input('code', sql.NVarChar, dept.code)
        .input('description', sql.NVarChar, dept.description)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Departments WHERE Name = @name AND OrganizationID = @orgId)
          BEGIN
            INSERT INTO Departments (OrganizationID, Name, Code, Description, IsActive, CreatedAt)
            OUTPUT INSERTED.DepartmentID
            VALUES (@orgId, @name, @code, @description, 1, GETDATE())
          END
          ELSE
          BEGIN
            SELECT DepartmentID FROM Departments WHERE Name = @name AND OrganizationID = @orgId
          END
        `);
      
      if (result.recordset.length > 0) {
        departmentIds.push(result.recordset[0].DepartmentID);
        console.log(`  ✅ ${dept.name}`);
      }
    }
    console.log(`✅ Created ${departmentIds.length} departments\n`);

    // ==================== SEED EMPLOYEES ====================
    console.log('👥 Seeding Employee Records...');
    const users = await pool.request().query('SELECT UserID, Email, FirstName, LastName FROM Users WHERE OrganizationID = ' + organizationId);
    
    for (const user of users.recordset) {
      const deptId = departmentIds[Math.floor(Math.random() * departmentIds.length)];
      const empNumber = `EMP${String(user.UserID).padStart(4, '0')}`;
      
      await pool.request()
        .input('userId', sql.Int, user.UserID)
        .input('orgId', sql.Int, organizationId)
        .input('empNumber', sql.NVarChar, empNumber)
        .input('deptId', sql.Int, deptId)
        .input('position', sql.NVarChar, 'Staff Member')
        .input('bio', sql.NVarChar, `Professional staff member at Forvis Mazars`)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Employees WHERE UserID = @userId)
          BEGIN
            INSERT INTO Employees (UserID, OrganizationID, EmployeeNumber, DepartmentID, Position, Bio, RegistrationStatus, ApprovedAt, CreatedAt)
            VALUES (@userId, @orgId, @empNumber, @deptId, @position, @bio, 'approved', GETDATE(), GETDATE())
          END
        `);
      
      console.log(`  ✅ ${user.FirstName} ${user.LastName} (${empNumber})`);
    }
    console.log(`✅ Created ${users.recordset.length} employee records\n`);

    // ==================== SEED AGM SESSION ====================
    console.log('📅 Seeding AGM Session...');
    const adminUser = await pool.request().query(`SELECT TOP 1 UserID FROM Users WHERE Role = 'admin' AND OrganizationID = ${organizationId}`);
    const createdBy = adminUser.recordset[0].UserID;
    
    const sessionResult = await pool.request()
      .input('orgId', sql.Int, organizationId)
      .input('title', sql.NVarChar, '2024 Annual General Meeting')
      .input('description', sql.NVarChar, 'Annual meeting for voting on company matters and recognitions')
      .input('createdBy', sql.Int, createdBy)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM AGMSessions WHERE Title = @title AND OrganizationID = @orgId)
        BEGIN
          INSERT INTO AGMSessions (
            OrganizationID, Title, Description, SessionType,
            ScheduledStartTime, ScheduledEndTime, Status, CreatedBy, CreatedAt
          )
          OUTPUT INSERTED.SessionID
          VALUES (
            @orgId, @title, @description, 'Annual',
            DATEADD(HOUR, 2, GETDATE()), DATEADD(HOUR, 5, GETDATE()), 
            'active', @createdBy, GETDATE()
          )
        END
        ELSE
        BEGIN
          SELECT SessionID FROM AGMSessions WHERE Title = @title AND OrganizationID = @orgId
        END
      `);
    
    const sessionId = sessionResult.recordset[0].SessionID;
    console.log(`✅ Created AGM Session (ID: ${sessionId})\n`);

    // ==================== SEED CANDIDATES ====================
    console.log('🏆 Seeding Candidates...');
    const candidateEmployees = users.recordset.slice(3, 11); // Use 8 users as candidates
    
    const candidateNames = [
      { firstName: 'Alice', lastName: 'Johnson', reason: 'Led 3 major projects, increased team productivity by 40%' },
      { firstName: 'Bob', lastName: 'Smith', reason: 'Increased revenue by 40%, top sales performer Q3 2024' },
      { firstName: 'Carol', lastName: 'White', reason: 'Improved employee retention rate by 25%' },
      { firstName: 'David', lastName: 'Brown', reason: 'Delivered 5 projects on time, mentor to 10 engineers' },
      { firstName: 'Emma', lastName: 'Davis', reason: 'Streamlined operations, reduced costs by 30%' },
      { firstName: 'Frank', lastName: 'Wilson', reason: 'Created marketing strategy, grew brand awareness 50%' },
      { firstName: 'Grace', lastName: 'Taylor', reason: 'Implemented new HR policies, employee satisfaction up 35%' },
      { firstName: 'Henry', lastName: 'Anderson', reason: 'Secured 10 major clients, exceeded quota by 60%' }
    ];

    for (let i = 0; i < Math.min(candidateEmployees.length, candidateNames.length); i++) {
      const employee = candidateEmployees[i];
      const candidateInfo = candidateNames[i];
      
      // Get employee details
      const empResult = await pool.request()
        .input('userId', sql.Int, employee.UserID)
        .query('SELECT EmployeeID, DepartmentID FROM Employees WHERE UserID = @userId');
      
      if (empResult.recordset.length > 0) {
        const empData = empResult.recordset[0];
        
        await pool.request()
          .input('sessionId', sql.Int, sessionId)
          .input('employeeId', sql.Int, empData.EmployeeID)
          .input('category', sql.NVarChar, 'Employee of the Year')
          .input('reason', sql.NVarChar, candidateInfo.reason)
          .input('nominatedBy', sql.Int, createdBy)
          .input('status', sql.NVarChar, 'active')
          .query(`
            IF NOT EXISTS (SELECT 1 FROM Candidates WHERE SessionID = @sessionId AND EmployeeID = @employeeId)
            BEGIN
              INSERT INTO Candidates (SessionID, EmployeeID, Category, NominationReason, NominatedBy, Status, CreatedAt)
              VALUES (@sessionId, @employeeId, @category, @reason, @nominatedBy, @status, GETDATE())
            END
          `);
        
        console.log(`  ✅ ${candidateInfo.firstName} ${candidateInfo.lastName}`);
      }
    }
    console.log(`✅ Created candidates\n`);

    // ==================== SEED RESOLUTIONS ====================
    console.log('📜 Seeding Resolutions...');
    const resolutions = [
      {
        title: 'Remote Work Policy Extension',
        description: 'Extend remote work policy to allow 3 days per week work from home for all eligible employees',
        category: 'Policy Change',
        requiredMajority: 51
      },
      {
        title: 'Office Renovation Budget Approval',
        description: 'Approve $500,000 budget for renovating main office building with modern facilities and collaborative spaces',
        category: 'Budget',
        requiredMajority: 66
      },
      {
        title: 'Annual Bonus Structure Update',
        description: 'Implement new performance-based bonus system with quarterly targets and achievement metrics',
        category: 'Compensation',
        requiredMajority: 51
      },
      {
        title: 'Sustainability Initiative',
        description: 'Launch company-wide sustainability program including carbon offset and green energy adoption',
        category: 'Corporate Responsibility',
        requiredMajority: 51
      },
      {
        title: 'Professional Development Fund',
        description: 'Establish $200,000 annual fund for employee training, certifications, and conference attendance',
        category: 'Employee Benefits',
        requiredMajority: 51
      }
    ];

    for (const resolution of resolutions) {
      await pool.request()
        .input('sessionId', sql.Int, sessionId)
        .input('title', sql.NVarChar, resolution.title)
        .input('description', sql.NVarChar, resolution.description)
        .input('category', sql.NVarChar, resolution.category)
        .input('requiredMajority', sql.Decimal(5, 2), resolution.requiredMajority)
        .input('status', sql.NVarChar, 'active')
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Resolutions WHERE SessionID = @sessionId AND Title = @title)
          BEGIN
            INSERT INTO Resolutions (SessionID, Title, Description, Category, RequiredMajority, Status, CreatedAt)
            VALUES (@sessionId, @title, @description, @category, @requiredMajority, @status, GETDATE())
          END
        `);
      
      console.log(`  ✅ ${resolution.title}`);
    }
    console.log(`✅ Created ${resolutions.length} resolutions\n`);

    // ==================== SEED VOTE ALLOCATIONS ====================
    console.log('🎫 Seeding Vote Allocations...');
    const allUsers = await pool.request().query(`SELECT UserID FROM Users WHERE OrganizationID = ${organizationId}`);
    
    for (const user of allUsers.recordset) {
      const allocatedVotes = Math.floor(Math.random() * 8) + 3; // 3-10 votes
      
      await pool.request()
        .input('sessionId', sql.Int, sessionId)
        .input('userId', sql.Int, user.UserID)
        .input('allocatedVotes', sql.Int, allocatedVotes)
        .input('reason', sql.NVarChar, 'Standard allocation based on role')
        .input('basedOn', sql.NVarChar, 'role')
        .input('setBy', sql.Int, createdBy)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM VoteAllocations WHERE SessionID = @sessionId AND UserID = @userId)
          BEGIN
            INSERT INTO VoteAllocations (SessionID, UserID, AllocatedVotes, Reason, BasedOn, SetBy, CreatedAt)
            VALUES (@sessionId, @userId, @allocatedVotes, @reason, @basedOn, @setBy, GETDATE())
          END
        `);
    }
    console.log(`✅ Allocated votes for ${allUsers.recordset.length} users\n`);

    // ==================== SEED SOME VOTES ====================
    console.log('🗳️  Seeding Sample Votes...');
    
    // Get candidates and resolutions
    const candidatesResult = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query('SELECT CandidateID FROM Candidates WHERE SessionID = @sessionId');
    
    const resolutionsResult = await pool.request()
      .input('sessionId', sql.Int, sessionId)
      .query('SELECT ResolutionID FROM Resolutions WHERE SessionID = @sessionId');

    // Cast some candidate votes
    let voteCount = 0;
    for (let i = 0; i < Math.min(5, allUsers.recordset.length); i++) {
      const voter = allUsers.recordset[i];
      const candidate = candidatesResult.recordset[i % candidatesResult.recordset.length];
      const votesUsed = Math.floor(Math.random() * 3) + 1;
      
      try {
        await pool.request()
          .input('sessionId', sql.Int, sessionId)
          .input('candidateId', sql.Int, candidate.CandidateID)
          .input('voterUserId', sql.Int, voter.UserID)
          .input('votesAllocated', sql.Int, votesUsed)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM CandidateVotes WHERE SessionID = @sessionId AND CandidateID = @candidateId AND VoterUserID = @voterUserId)
            BEGIN
              INSERT INTO CandidateVotes (SessionID, CandidateID, VoterUserID, VotesAllocated, IsProxyVote, VotedAt)
              VALUES (@sessionId, @candidateId, @voterUserId, @votesAllocated, 0, GETDATE())
            END
          `);
        voteCount++;
      } catch (err) {
        // Skip if duplicate
      }
    }

    // Cast some resolution votes
    const voteChoices = ['yes', 'no', 'abstain'];
    for (let i = 0; i < Math.min(8, allUsers.recordset.length); i++) {
      const voter = allUsers.recordset[i];
      const resolution = resolutionsResult.recordset[i % resolutionsResult.recordset.length];
      const voteChoice = voteChoices[Math.floor(Math.random() * voteChoices.length)];
      const votesUsed = Math.floor(Math.random() * 3) + 1;
      
      try {
        await pool.request()
          .input('sessionId', sql.Int, sessionId)
          .input('resolutionId', sql.Int, resolution.ResolutionID)
          .input('voterUserId', sql.Int, voter.UserID)
          .input('voteChoice', sql.NVarChar, voteChoice)
          .input('votesAllocated', sql.Int, votesUsed)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM ResolutionVotes WHERE SessionID = @sessionId AND ResolutionID = @resolutionId AND VoterUserID = @voterUserId)
            BEGIN
              INSERT INTO ResolutionVotes (SessionID, ResolutionID, VoterUserID, VoteChoice, VotesAllocated, IsProxyVote, VotedAt)
              VALUES (@sessionId, @resolutionId, @voterUserId, @voteChoice, @votesAllocated, 0, GETDATE())
            END
          `);
        voteCount++;
      } catch (err) {
        // Skip if duplicate
      }
    }
    console.log(`✅ Cast ${voteCount} sample votes\n`);

    // ==================== SUMMARY ====================
    console.log('\n========================================');
    console.log('✅ DEMO DATA SEEDING COMPLETE!');
    console.log('========================================\n');

    // Get final counts
    const stats = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Departments WHERE OrganizationID = ${organizationId}) as Departments,
        (SELECT COUNT(*) FROM Employees WHERE OrganizationID = ${organizationId}) as Employees,
        (SELECT COUNT(*) FROM AGMSessions WHERE OrganizationID = ${organizationId}) as Sessions,
        (SELECT COUNT(*) FROM Candidates WHERE SessionID = ${sessionId}) as Candidates,
        (SELECT COUNT(*) FROM Resolutions WHERE SessionID = ${sessionId}) as Resolutions,
        (SELECT COUNT(*) FROM VoteAllocations WHERE SessionID = ${sessionId}) as VoteAllocations,
        (SELECT COUNT(*) FROM CandidateVotes WHERE SessionID = ${sessionId}) as CandidateVotes,
        (SELECT COUNT(*) FROM ResolutionVotes WHERE SessionID = ${sessionId}) as ResolutionVotes
    `);

    const summary = stats.recordset[0];
    console.log('📊 Database Summary:');
    console.log(`   Departments: ${summary.Departments}`);
    console.log(`   Employees: ${summary.Employees}`);
    console.log(`   AGM Sessions: ${summary.Sessions}`);
    console.log(`   Candidates: ${summary.Candidates}`);
    console.log(`   Resolutions: ${summary.Resolutions}`);
    console.log(`   Vote Allocations: ${summary.VoteAllocations}`);
    console.log(`   Candidate Votes: ${summary.CandidateVotes}`);
    console.log(`   Resolution Votes: ${summary.ResolutionVotes}`);
    console.log('');

    console.log('🎉 Your database is now populated with demo data!');
    console.log('🚀 Start your server with: npm run dev:all');
    console.log('🌐 Admin Dashboard will now pull live data from the database!');

  } catch (error) {
    console.error('\n❌ Error seeding demo data:', error);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
    }
    process.exit(0);
  }
}

// Run the seeder
seedDemoData();
