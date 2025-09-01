import { useEffect, useRef, useState, useCallback } from 'react';
import FullscreenMonitor from '@/utils/fullscreenMonitor';

interface UseFullscreenMonitorOptions {
  onTestSubmit: (reason: 'malpractice' | 'manual') => void;
  maxWarnings?: number;
  isTestActive?: boolean;
}

interface UseFullscreenMonitorReturn {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  warningCount: number;
  remainingWarnings: number;
  isMonitoring: boolean;
  securityStatus: 'secure' | 'warning' | 'danger';
}

export const useFullscreenMonitor = ({
  onTestSubmit,
  maxWarnings = 3,
  isTestActive = false
}: UseFullscreenMonitorOptions): UseFullscreenMonitorReturn => {
  const monitorRef = useRef<FullscreenMonitor | null>(null);
  const [warningCount, setWarningCount] = useState(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleWarning = useCallback((count: number, reason: string) => {
    setWarningCount(count);
    console.warn(`Security warning ${count}/${maxWarnings}: ${reason}`);
  }, [maxWarnings]);

  const startMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stopMonitoring();
    }

    monitorRef.current = new FullscreenMonitor({
      onTestSubmit,
      maxWarnings,
      onWarning: handleWarning
    });

    monitorRef.current.startMonitoring();
    setIsMonitoring(true);
    setWarningCount(0);
  }, [onTestSubmit, maxWarnings, handleWarning]);

  const stopMonitoring = useCallback(() => {
    if (monitorRef.current) {
      monitorRef.current.stopMonitoring();
      monitorRef.current = null;
    }
    setIsMonitoring(false);
    setWarningCount(0);
  }, []);

  // Auto start/stop monitoring based on isTestActive
  useEffect(() => {
    if (isTestActive && !isMonitoring) {
      startMonitoring();
    } else if (!isTestActive && isMonitoring) {
      stopMonitoring();
    }
  }, [isTestActive, isMonitoring, startMonitoring, stopMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitorRef.current) {
        monitorRef.current.stopMonitoring();
      }
    };
  }, []);

  const remainingWarnings = maxWarnings - warningCount;
  
  const securityStatus: 'secure' | 'warning' | 'danger' = 
    warningCount === 0 ? 'secure' :
    warningCount < maxWarnings - 1 ? 'warning' : 'danger';

  return {
    startMonitoring,
    stopMonitoring,
    warningCount,
    remainingWarnings,
    isMonitoring,
    securityStatus
  };
};
