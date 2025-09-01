import React from 'react';

interface TestSecurityIndicatorProps {
  securityStatus: 'secure' | 'warning' | 'danger';
  warningCount: number;
  remainingWarnings: number;
  isVisible?: boolean;
}

const TestSecurityIndicator: React.FC<TestSecurityIndicatorProps> = ({
  securityStatus,
  warningCount,
  remainingWarnings,
  isVisible = true
}) => {
  if (!isVisible) return null;

  const getStatusText = () => {
    switch (securityStatus) {
      case 'secure':
        return 'Test Secure';
      case 'warning':
        return `${remainingWarnings} Warning${remainingWarnings !== 1 ? 's' : ''} Left`;
      case 'danger':
        return 'Final Warning!';
      default:
        return 'Monitoring';
    }
  };

  const getStatusIcon = () => {
    switch (securityStatus) {
      case 'secure':
        return '🔒';
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🚨';
      default:
        return '👁️';
    }
  };

  return (
    <div className={`test-security-indicator ${securityStatus}`}>
      <span className="security-status-dot" />
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  );
};

export default TestSecurityIndicator;
