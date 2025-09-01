import React from 'react';

interface TestSecurityInstructionsProps {
  onStartTest: () => void;
  testName?: string;
  maxWarnings?: number;
}

const TestSecurityInstructions: React.FC<TestSecurityInstructionsProps> = ({
  onStartTest,
  testName = 'Test',
  maxWarnings = 3
}) => {
  return (
    <div className="test-instructions">
      <h2>{testName} - Security Instructions</h2>
      
      <div className="warning-box">
        <h3>⚠️ Important Security Notice</h3>
        <p>This test implements strict security measures to ensure fair assessment. Please read the following carefully:</p>
        
        <ul>
          <li><strong>Fullscreen Mode Required:</strong> The test must be taken in fullscreen mode at all times</li>
          <li><strong>No Tab Switching:</strong> Do not switch to other tabs, windows, or applications</li>
          <li><strong>Warning System:</strong> You will receive warnings for any security violations</li>
          <li><strong>Automatic Submission:</strong> After {maxWarnings} warnings, your test will be automatically submitted</li>
          <li><strong>Blocked Actions:</strong> Right-click, developer tools, and keyboard shortcuts are disabled</li>
          <li><strong>Browser Restrictions:</strong> Refresh, back button, and navigation controls are blocked</li>
        </ul>
      </div>

      <div className="security-guidelines">
        <h3>📋 Test Guidelines</h3>
        <ul>
          <li>Ensure you have a stable internet connection</li>
          <li>Close all unnecessary applications and browser tabs</li>
          <li>Use a computer/laptop (mobile devices may have limited fullscreen support)</li>
          <li>Ensure your browser supports fullscreen mode</li>
          <li>Do not use multiple monitors or screen sharing software</li>
          <li>Keep your workspace clean and avoid distractions</li>
        </ul>
      </div>

      <div className="security-consequences">
        <h3>⚖️ Security Violations</h3>
        <p>The following actions are considered malpractice and will trigger warnings:</p>
        <ul>
          <li>Exiting fullscreen mode (pressing Escape, F11, etc.)</li>
          <li>Switching to other tabs or applications</li>
          <li>Attempting to open developer tools</li>
          <li>Using blocked keyboard shortcuts</li>
          <li>Attempting to copy, paste, or access external resources</li>
        </ul>
        <p><strong>Remember:</strong> {maxWarnings} violations will result in automatic test submission!</p>
      </div>

      <div className="start-test-section">
        <p className="final-notice">
          By clicking "Start Test", you acknowledge that you understand and agree to these security measures.
        </p>
        <button 
          onClick={onStartTest} 
          className="btn-primary start-test-btn"
        >
          🔒 Start Test (Enter Fullscreen Mode)
        </button>
      </div>
    </div>
  );
};

export default TestSecurityInstructions;
