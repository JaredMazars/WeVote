// =====================================================
// Attendance Model  
// Handles session check-in and attendance tracking
// =====================================================

const { executeQuery } = require('../config/database');
const logger = require('../config/logger');

class Attendance {
  // Check in to session
  static async checkIn(attendanceData) {
    try {
      // Check if already checked in
      const existingQuery = `
        SELECT AttendanceID 
        FROM SessionAttendance 
        WHERE AGMSessionID = @sessionId 
        AND UserID = @userId
      `;

      const existing = await executeQuery(existingQuery, {
        sessionId: attendanceData.sessionId,
        userId: attendanceData.userId
      });

      if (existing.recordset.length > 0) {
        throw new Error('User already checked in to this session');
      }

      const query = `
        INSERT INTO SessionAttendance (
          AGMSessionID, UserID, CheckInTime, CheckInMethod,
          IPAddress, DeviceInfo, Location
        )
        OUTPUT INSERTED.*
        VALUES (
          @sessionId, @userId, GETDATE(), @checkInMethod,
          @ipAddress, @deviceInfo, @location
        )
      `;

      const params = {
        sessionId: attendanceData.sessionId,
        userId: attendanceData.userId,
        checkInMethod: attendanceData.checkInMethod || 'web',
        ipAddress: attendanceData.ipAddress || null,
        deviceInfo: attendanceData.deviceInfo || null,
        location: attendanceData.location || null
      };

      const result = await executeQuery(query, params);
      const checkIn = result.recordset[0];

      logger.info(`User checked in: UserID ${attendanceData.userId} to Session ${attendanceData.sessionId}`);
      return checkIn;
    } catch (error) {
      logger.error('Error in Attendance.checkIn:', error);
      throw error;
    }
  }

  // Check out from session
  static async checkOut(sessionId, userId) {
    try {
      const query = `
        UPDATE SessionAttendance
        SET CheckOutTime = GETDATE()
        OUTPUT INSERTED.*
        WHERE AGMSessionID = @sessionId
        AND UserID = @userId
        AND CheckOutTime IS NULL
      `;

      const result = await executeQuery(query, { sessionId, userId });

      if (result.recordset.length === 0) {
        throw new Error('No active check-in found for this user');
      }

      logger.info(`User checked out: UserID ${userId} from Session ${sessionId}`);
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Attendance.checkOut:', error);
      throw error;
    }
  }

  // Get session attendance
  static async getSessionAttendance(sessionId) {
    try {
      const query = `
        SELECT 
          sa.*,
          u.FirstName,
          u.LastName,
          u.Email,
          e.DepartmentID,
          d.DepartmentName,
          DATEDIFF(MINUTE, sa.CheckInTime, ISNULL(sa.CheckOutTime, GETDATE())) as DurationMinutes
        FROM SessionAttendance sa
        INNER JOIN Users u ON sa.UserID = u.UserID
        LEFT JOIN Employees e ON u.UserID = e.UserID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        WHERE sa.AGMSessionID = @sessionId
        ORDER BY sa.CheckInTime DESC
      `;

      const result = await executeQuery(query, { sessionId });
      return result.recordset;
    } catch (error) {
      logger.error('Error in Attendance.getSessionAttendance:', error);
      throw error;
    }
  }

  // Get user's check-in status for a session
  static async getUserStatus(sessionId, userId) {
    try {
      const query = `
        SELECT 
          sa.*,
          CASE 
            WHEN sa.CheckOutTime IS NOT NULL THEN 'checked_out'
            WHEN sa.CheckInTime IS NOT NULL THEN 'checked_in'
            ELSE 'not_checked_in'
          END as Status
        FROM SessionAttendance sa
        WHERE sa.AGMSessionID = @sessionId
        AND sa.UserID = @userId
      `;

      const result = await executeQuery(query, { sessionId, userId });
      
      if (result.recordset.length === 0) {
        return { status: 'not_checked_in' };
      }

      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Attendance.getUserStatus:', error);
      throw error;
    }
  }

  // Get user's attendance history
  static async getUserHistory(userId) {
    try {
      const query = `
        SELECT 
          sa.*,
          s.Title as SessionTitle,
          s.ScheduledStartTime,
          s.ScheduledEndTime,
          DATEDIFF(MINUTE, sa.CheckInTime, ISNULL(sa.CheckOutTime, GETDATE())) as DurationMinutes
        FROM SessionAttendance sa
        INNER JOIN AGMSessions s ON sa.AGMSessionID = s.AGMSessionID
        WHERE sa.UserID = @userId
        ORDER BY sa.CheckInTime DESC
      `;

      const result = await executeQuery(query, { userId });
      return result.recordset;
    } catch (error) {
      logger.error('Error in Attendance.getUserHistory:', error);
      throw error;
    }
  }

  // Get live attendance feed (recent check-ins)
  static async getLiveAttendance(sessionId, minutes = 30) {
    try {
      const query = `
        SELECT 
          sa.AttendanceID,
          sa.CheckInTime,
          u.FirstName,
          u.LastName,
          u.Email,
          d.DepartmentName
        FROM SessionAttendance sa
        INNER JOIN Users u ON sa.UserID = u.UserID
        LEFT JOIN Employees e ON u.UserID = e.UserID
        LEFT JOIN Departments d ON e.DepartmentID = d.DepartmentID
        WHERE sa.AGMSessionID = @sessionId
        AND sa.CheckInTime >= DATEADD(MINUTE, -@minutes, GETDATE())
        ORDER BY sa.CheckInTime DESC
      `;

      const result = await executeQuery(query, { sessionId, minutes });
      return result.recordset;
    } catch (error) {
      logger.error('Error in Attendance.getLiveAttendance:', error);
      throw error;
    }
  }

  // Get attendance statistics
  static async getStatistics(sessionId) {
    try {
      const query = `
        SELECT 
          s.TotalVoters as ExpectedAttendees,
          COUNT(sa.AttendanceID) as CheckedIn,
          COUNT(CASE WHEN sa.CheckOutTime IS NOT NULL THEN 1 END) as CheckedOut,
          COUNT(CASE WHEN sa.CheckOutTime IS NULL AND sa.CheckInTime IS NOT NULL THEN 1 END) as CurrentlyPresent,
          CAST(COUNT(sa.AttendanceID) as FLOAT) / NULLIF(s.TotalVoters, 0) * 100 as AttendancePercentage,
          AVG(DATEDIFF(MINUTE, sa.CheckInTime, ISNULL(sa.CheckOutTime, GETDATE()))) as AvgDurationMinutes
        FROM AGMSessions s
        LEFT JOIN SessionAttendance sa ON s.AGMSessionID = sa.AGMSessionID
        WHERE s.AGMSessionID = @sessionId
        GROUP BY s.TotalVoters, s.AGMSessionID
      `;

      const result = await executeQuery(query, { sessionId });
      return result.recordset[0];
    } catch (error) {
      logger.error('Error in Attendance.getStatistics:', error);
      throw error;
    }
  }
}

module.exports = Attendance;
