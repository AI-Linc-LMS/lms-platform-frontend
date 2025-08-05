/**
 * API Call Tracker for Debugging Duplicate Calls
 * This will help identify why 120 seconds becomes 392+ seconds
 */

interface ApiCall {
  timestamp: number;
  duration: number;
  source: string;
  endpoint: string;
  method: 'fetch' | 'beacon';
  sessionId: string;
  stackTrace: string;
  payload: Record<string, unknown> | null;
}

class ApiCallTracker {
  private calls: ApiCall[] = [];
  private originalFetch: typeof window.fetch;
  private originalSendBeacon: typeof Navigator.prototype.sendBeacon;

  constructor() {
    this.originalFetch = window.fetch.bind(window);
    this.originalSendBeacon = navigator.sendBeacon.bind(navigator);
    this.initializeInterceptors();
  }

  private initializeInterceptors() {
    // Intercept fetch calls
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.toString();
      
      if (url.includes('track-time')) {
        const payload = init?.body ? JSON.parse(init.body as string) : null;
        const callInfo: ApiCall = {
          timestamp: Date.now(),
          duration: payload?.time_spent_seconds || 0,
          source: this.getCallSource(),
          endpoint: url,
          method: 'fetch',
          sessionId: payload?.session_id || 'unknown',
          stackTrace: new Error().stack || '',
          payload
        };
        
        this.calls.push(callInfo);
        this.logCall(callInfo);
        
        // Check for potential duplicates
        this.checkForDuplicates(callInfo);
      }
      
      return this.originalFetch(input, init);
    };

    // Intercept beacon calls
    navigator.sendBeacon = (url: string | URL, data?: BodyInit | null) => {
      const urlString = url.toString();
      
      if (urlString.includes('track-time')) {
        let payload = null;
        if (data instanceof Blob) {
          // For beacon calls, we can't easily read the blob synchronously
          // but we can make a reasonable guess about the payload structure
          payload = { type: 'beacon_data', size: data.size };
        }
        
        const callInfo: ApiCall = {
          timestamp: Date.now(),
          duration: 0, // We can't easily extract from beacon
          source: this.getCallSource(),
          endpoint: urlString,
          method: 'beacon',
          sessionId: 'beacon_call',
          stackTrace: new Error().stack || '',
          payload
        };
        
        this.calls.push(callInfo);
        this.logCall(callInfo);
        
        // Check for potential duplicates
        this.checkForDuplicates(callInfo);
      }
      
      return this.originalSendBeacon(url, data);
    };
  }

  private getCallSource(): string {
    const stack = new Error().stack || '';
    const lines = stack.split('\n');
    
    // Look for the actual calling function (skip interceptor frames)
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('UserActivityContext')) return 'UserActivityContext';
      if (line.includes('userActivitySync')) return 'userActivitySync';
      if (line.includes('FloatingActivityTimer')) return 'FloatingActivityTimer';
      if (line.includes('activityTrackingApi')) return 'activityTrackingApi';
      if (line.includes('sendSessionEndData')) return 'sendSessionEndData';
      if (line.includes('sendPeriodicSessionUpdate')) return 'sendPeriodicSessionUpdate';
      if (line.includes('handleBeforeUnload')) return 'handleBeforeUnload';
      if (line.includes('handleVisibilityChange')) return 'handleVisibilityChange';
    }
    
    return 'unknown_source';
  }

  private logCall(call: ApiCall) {
    console.group(`🚨 API Call Detected - ${call.method.toUpperCase()}`);
    console.log('Source:', call.source);
    console.log('Duration:', call.duration, 'seconds');
    console.log('Timestamp:', new Date(call.timestamp).toISOString());
    console.log('Session ID:', call.sessionId);
    console.log('Endpoint:', call.endpoint);
    if (call.payload) {
      console.log('Payload:', call.payload);
    }
    console.groupEnd();
  }

  private checkForDuplicates(newCall: ApiCall) {
    const recentCalls = this.calls.filter(call => 
      Date.now() - call.timestamp < 30000 && // Within last 30 seconds
      call.duration === newCall.duration && // Same duration
      call.sessionId === newCall.sessionId // Same session
    );

    if (recentCalls.length > 1) {
      console.warn('🔥 POTENTIAL DUPLICATE DETECTED!');
      console.table(recentCalls.map(call => ({
        source: call.source,
        duration: call.duration,
        method: call.method,
        timeDiff: Date.now() - call.timestamp
      })));
    }
  }

  public getCallSummary() {
    const last5Minutes = this.calls.filter(call => 
      Date.now() - call.timestamp < 5 * 60 * 1000
    );

    const summary = {
      totalCalls: last5Minutes.length,
      totalDuration: last5Minutes.reduce((sum, call) => sum + call.duration, 0),
      callsBySource: {} as Record<string, number>,
      callsByMethod: {} as Record<string, number>,
      duplicateGroups: [] as Array<{duration: number, count: number, sources: string[]}>
    };

    // Group by source
    last5Minutes.forEach(call => {
      summary.callsBySource[call.source] = (summary.callsBySource[call.source] || 0) + 1;
      summary.callsByMethod[call.method] = (summary.callsByMethod[call.method] || 0) + 1;
    });

    // Find duplicate groups
    const durationGroups = new Map<number, ApiCall[]>();
    last5Minutes.forEach(call => {
      if (!durationGroups.has(call.duration)) {
        durationGroups.set(call.duration, []);
      }
      durationGroups.get(call.duration)!.push(call);
    });

    durationGroups.forEach((calls, duration) => {
      if (calls.length > 1) {
        summary.duplicateGroups.push({
          duration,
          count: calls.length,
          sources: [...new Set(calls.map(c => c.source))]
        });
      }
    });

    return summary;
  }

  public logSummary() {
    const summary = this.getCallSummary();
    
    console.group('📊 API Call Summary (Last 5 Minutes)');
    console.log('Total Calls:', summary.totalCalls);
    console.log('Total Duration Sent:', summary.totalDuration, 'seconds');
    console.log('Expected vs Actual:', {
      expected: '~120 seconds per 2-minute cycle',
      actual: summary.totalDuration + ' seconds'
    });
    console.log('Calls by Source:', summary.callsBySource);
    console.log('Calls by Method:', summary.callsByMethod);
    
    if (summary.duplicateGroups.length > 0) {
      console.warn('🔥 DUPLICATE GROUPS FOUND:');
      summary.duplicateGroups.forEach(group => {
        console.log(`Duration ${group.duration}s sent ${group.count} times from: ${group.sources.join(', ')}`);
      });
    }
    
    console.groupEnd();
    return summary;
  }

  public getAllCalls() {
    return [...this.calls];
  }

  public clearCalls() {
    this.calls = [];
    console.log('✅ Call history cleared');
  }

  public destroy() {
    window.fetch = this.originalFetch;
    navigator.sendBeacon = this.originalSendBeacon;
    console.log('🔧 API interceptors removed');
  }
}

// Global instance
let apiTracker: ApiCallTracker | null = null;

// Initialize tracker
export const startApiTracking = () => {
  if (apiTracker) {
    apiTracker.destroy();
  }
  
  apiTracker = new ApiCallTracker();
  console.log('🔍 API Call Tracking Started');
  console.log('Use window.apiTracker to access tracking functions');
  
  // Add to window for console access
  if (typeof window !== 'undefined') {
    (window as unknown as { apiTracker: {
      summary: () => ReturnType<ApiCallTracker['getCallSummary']> | undefined;
      calls: () => ApiCall[];
      clear: () => void;
      stop: () => void;
    } }).apiTracker = {
      summary: () => apiTracker?.logSummary(),
      calls: () => apiTracker?.getAllCalls() || [],
      clear: () => apiTracker?.clearCalls(),
      stop: () => apiTracker?.destroy()
    };
  }
  
  return apiTracker;
};

// Auto-start tracking
if (typeof window !== 'undefined') {
  setTimeout(() => {
    startApiTracking();
    console.log('🚀 API Tracker auto-started! Use window.apiTracker.summary() to check for duplicates');
  }, 1000);
}

export { ApiCallTracker }; 