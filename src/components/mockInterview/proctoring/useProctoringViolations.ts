import { useMemo } from 'react';
import type { ProctoringEvent } from './types';

export interface ProctoringViolation {
  id: string;
  type: 'tab_switch' | 'window_switch';
  timestamp: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
  duration?: number;
}

export interface ProctoringStats {
  tabSwitches: {
    count: number;
    totalTimeAway: number;
  };
  windowSwitches: {
    count: number;
    totalTimeAway: number;
  };
}

export const useProctoringViolations = (eventLog: ProctoringEvent[]) => {
  const result = useMemo(() => {
    const violationsList: ProctoringViolation[] = [];
    const stats: ProctoringStats = {
      tabSwitches: { count: 0, totalTimeAway: 0 },
      windowSwitches: { count: 0, totalTimeAway: 0 }
    };

    let pendingTabBlur: ProctoringEvent | null = null;
    let pendingWindowBlur: ProctoringEvent | null = null;

    eventLog.forEach((event) => {
      switch (event.type) {
        case 'TAB_BLUR':
          pendingTabBlur = event;
          break;

        case 'TAB_FOCUS':
          if (pendingTabBlur) {
            stats.tabSwitches.count++;
            const duration = event.timestamp - pendingTabBlur.timestamp;
            stats.tabSwitches.totalTimeAway += duration;
            pendingTabBlur = null;
          }
          break;

        case 'WINDOW_BLUR':
          pendingWindowBlur = event;
          break;

        case 'WINDOW_FOCUS':
          if (pendingWindowBlur) {
            stats.windowSwitches.count++;
            const duration = event.timestamp - pendingWindowBlur.timestamp;
            stats.windowSwitches.totalTimeAway += duration;
            pendingWindowBlur = null;
          }
          break;

        default:
          break;
      }
    });

    // Handle pending blurs
    if (pendingTabBlur) {
      const currentTime = Date.now();
      const duration = currentTime - pendingTabBlur.timestamp;
      stats.tabSwitches.totalTimeAway += duration;
      
      violationsList.push({
        id: `tab_switch_pending_${pendingTabBlur.timestamp}`,
        type: 'tab_switch',
        timestamp: pendingTabBlur.timestamp,
        duration: duration,
        description: `Currently away from interview tab (${Math.round(duration / 1000)}s)`,
        severity: 'high'
      });
    }

    if (pendingWindowBlur) {
      const currentTime = Date.now();
      const duration = currentTime - pendingWindowBlur.timestamp;
      stats.windowSwitches.totalTimeAway += duration;
      
      violationsList.push({
        id: `window_switch_pending_${pendingWindowBlur.timestamp}`,
        type: 'window_switch', 
        timestamp: pendingWindowBlur.timestamp,
        duration: duration,
        description: `Interview window currently not in focus (${Math.round(duration / 1000)}s)`,
        severity: 'high'
      });
    }

    const violations = violationsList.sort((a, b) => b.timestamp - a.timestamp);

    const violationCounts = {
      total: violations.length,
      high: violations.filter(v => v.severity === 'high').length,
      medium: violations.filter(v => v.severity === 'medium').length,
      low: violations.filter(v => v.severity === 'low').length,
      tabSwitches: violations.filter(v => v.type === 'tab_switch').length,
      windowSwitches: violations.filter(v => v.type === 'window_switch').length,
    };

    return { violations, violationCounts, stats };
  }, [eventLog]);

  return result;
};

