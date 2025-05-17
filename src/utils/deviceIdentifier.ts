/**
 * Device and browser identification utility
 * Provides functions to generate unique session IDs and collect device information
 */

// Using a fallback UUID generator if uuid package is not installed
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Storage key for persistent session ID
const SESSION_ID_KEY = 'activity_session_id';

/**
 * Generate or retrieve a session ID for the current browser session
 * This ID persists through the current browser session and allows
 * the backend to identify concurrent sessions from the same user account
 */
export const getSessionId = (): string => {
  const sessionId = localStorage.getItem(SESSION_ID_KEY);
  
  if (!sessionId) {
    const newSessionId = generateUUID();
    localStorage.setItem(SESSION_ID_KEY, newSessionId);
    return newSessionId;
  }
  
  return sessionId;
};

/**
 * Get basic information about the current browser and device
 * This is non-invasive information that helps identify sessions
 * without collecting personally identifiable information
 */
export const getDeviceInfo = (): { 
  browser: string;
  os: string;
  deviceType: string;
} => {
  const userAgent = navigator.userAgent;
  
  // Detect browser
  let browser = 'Unknown';
  if (userAgent.indexOf('Firefox') > -1) {
    browser = 'Firefox';
  } else if (userAgent.indexOf('SamsungBrowser') > -1) {
    browser = 'Samsung Browser';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    browser = 'Opera';
  } else if (userAgent.indexOf('Trident') > -1) {
    browser = 'Internet Explorer';
  } else if (userAgent.indexOf('Edge') > -1) {
    browser = 'Edge';
  } else if (userAgent.indexOf('Chrome') > -1) {
    browser = 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    browser = 'Safari';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (userAgent.indexOf('Windows NT 10.0') > -1) {
    os = 'Windows 10';
  } else if (userAgent.indexOf('Windows NT 6.2') > -1) {
    os = 'Windows 8';
  } else if (userAgent.indexOf('Windows NT 6.1') > -1) {
    os = 'Windows 7';
  } else if (userAgent.indexOf('Windows NT 6.0') > -1) {
    os = 'Windows Vista';
  } else if (userAgent.indexOf('Windows NT 5.1') > -1) {
    os = 'Windows XP';
  } else if (userAgent.indexOf('Windows NT 5.0') > -1) {
    os = 'Windows 2000';
  } else if (userAgent.indexOf('Mac') > -1) {
    os = 'MacOS';
  } else if (userAgent.indexOf('X11') > -1) {
    os = 'UNIX';
  } else if (userAgent.indexOf('Linux') > -1) {
    os = 'Linux';
  } else if (userAgent.indexOf('Android') > -1) {
    os = 'Android';
  } else if (userAgent.indexOf('like Mac') > -1) {
    os = 'iOS';
  }
  
  // Detect device type
  let deviceType = 'desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    deviceType = 'mobile';
    
    if (userAgent.indexOf('iPad') > -1 || 
        (userAgent.indexOf('Macintosh') > -1 && 'ontouchend' in document)) {
      deviceType = 'tablet';
    }
  }
  
  return {
    browser,
    os,
    deviceType
  };
};

/**
 * Get a complete device fingerprint object to send with activity data
 */
export const getDeviceFingerprint = () => {
  return {
    session_id: getSessionId(),
    device_info: getDeviceInfo()
  };
}; 