import { NextApiRequest, NextApiResponse } from 'next';

interface MalpracticeLogEntry {
  timestamp: string;
  reason: string;
  warningCount: number;
  userAgent: string;
  url: string;
  screenWidth?: number;
  screenHeight?: number;
}

interface MalpracticeLogData extends MalpracticeLogEntry {
  studentId?: string;
  testId?: string;
  ipAddress?: string;
  sessionId?: string;
}

// In a real application, this would save to a database
// For now, we'll log to console and could save to a file or database
const malpracticeLogs: MalpracticeLogData[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const logEntry: MalpracticeLogEntry = req.body;
    
    // Extract additional data
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     'unknown';

    // Get student ID from session/token if available
    // This would depend on your authentication system
    const studentId = req.headers.authorization ? 'student-id-from-token' : 'anonymous';
    
    // Extract test ID from URL if possible
    const testId = logEntry.url ? extractTestIdFromUrl(logEntry.url) : 'unknown';
    
    const fullLogEntry: MalpracticeLogData = {
      ...logEntry,
      studentId,
      testId,
      ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
      sessionId: req.headers['x-session-id'] as string || 'unknown'
    };

    // Store the log entry
    malpracticeLogs.push(fullLogEntry);

    // Log to console for debugging
    console.warn('🚨 MALPRACTICE DETECTED:', {
      studentId: fullLogEntry.studentId,
      testId: fullLogEntry.testId,
      reason: fullLogEntry.reason,
      warningCount: fullLogEntry.warningCount,
      timestamp: fullLogEntry.timestamp,
      ipAddress: fullLogEntry.ipAddress
    });

    // In a production environment, you might want to:
    // 1. Save to database
    // 2. Send alerts to administrators
    // 3. Update student's test record
    // 4. Trigger additional security measures

    // Example database save (uncomment and modify based on your DB):
    /*
    await db.collection('malpractice_logs').add({
      ...fullLogEntry,
      createdAt: new Date()
    });
    */

    // Example alert system (uncomment to enable):
    /*
    if (fullLogEntry.warningCount >= 2) {
      await sendSecurityAlert(fullLogEntry);
    }
    */

    res.status(200).json({ 
      success: true, 
      message: 'Malpractice attempt logged',
      logId: malpracticeLogs.length 
    });

  } catch (error) {
    console.error('Error logging malpractice attempt:', error);
    res.status(500).json({ 
      error: 'Failed to log malpractice attempt',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Helper function to extract test ID from URL
function extractTestIdFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const assessmentIndex = pathParts.indexOf('assessment');
    
    if (assessmentIndex !== -1 && pathParts[assessmentIndex + 1]) {
      return pathParts[assessmentIndex + 1];
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// Example function to send security alerts (implement based on your needs)
async function sendSecurityAlert(logEntry: MalpracticeLogData) {
  // This could send emails, push notifications, or update admin dashboards
  console.warn('🚨 HIGH PRIORITY SECURITY ALERT:', {
    message: `Student ${logEntry.studentId} has ${logEntry.warningCount} malpractice warnings in test ${logEntry.testId}`,
    logEntry
  });
  
  // Example: Send email to administrators
  // await sendEmail({
  //   to: 'admin@school.edu',
  //   subject: 'Test Security Alert',
  //   body: `Malpractice detected: ${logEntry.reason}`
  // });
}

// Export logs getter for admin dashboard (optional)
export function getMalpracticeLogs(): MalpracticeLogData[] {
  return malpracticeLogs;
}

// Export function to get logs for specific student/test
export function getLogsByStudent(studentId: string): MalpracticeLogData[] {
  return malpracticeLogs.filter(log => log.studentId === studentId);
}

export function getLogsByTest(testId: string): MalpracticeLogData[] {
  return malpracticeLogs.filter(log => log.testId === testId);
}
