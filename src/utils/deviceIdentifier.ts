/**
 * Device and browser identification utility
 * Provides functions to generate unique session IDs and collect device information
 */

import { v4 as uuidv4 } from 'uuid';

// Interface for device information
export interface DeviceInfo {
  browser: string;
  os: string;
  deviceType: string;
  screenSize?: string;
  colorDepth?: number;
  timezone?: string;
  language?: string;
}

// Storage key for the session ID
const SESSION_ID_KEY = 'sessionId';
const DEVICE_ID_KEY = 'deviceId';

/**
 * Generates a unique session ID for the current browser session
 * or retrieves the existing one from localStorage
 * @returns Session ID string
 */
export const getSessionId = (): string => {
  try {
    // Try to get existing session ID
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    
    // If no session ID exists, create a new one
    if (!sessionId) {
      sessionId = `session-${uuidv4()}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    
    return sessionId;
  } catch (error) {
    // Fallback if localStorage is not available
    //console.error('Failed to get/create session ID:', error);
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
};

/**
 * Generates or retrieves a persistent device ID that survives across sessions
 * @returns Device ID string
 */
export const getDeviceId = (): string => {
  try {
    // Try to get existing device ID
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    
    // If no device ID exists, create a new one
    if (!deviceId) {
      deviceId = `device-${uuidv4()}`;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    // Fallback if localStorage is not available
    //console.error('Failed to get/create device ID:', error);
    return `device-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
};

/**
 * Detects the user's browser
 * @returns Browser name and version if available
 */
export const detectBrowser = (): string => {
  const userAgent = navigator.userAgent;
  
  // Detect common browsers
  if (userAgent.indexOf('Firefox') > -1) {
    return 'Firefox';
  } else if (userAgent.indexOf('SamsungBrowser') > -1) {
    return 'Samsung Browser';
  } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
    return 'Opera';
  } else if (userAgent.indexOf('Trident') > -1) {
    return 'Internet Explorer';
  } else if (userAgent.indexOf('Edge') > -1 || userAgent.indexOf('Edg') > -1) {
    return 'Edge';
  } else if (userAgent.indexOf('Chrome') > -1) {
    return 'Chrome';
  } else if (userAgent.indexOf('Safari') > -1) {
    return 'Safari';
  } else {
    return 'Unknown';
  }
};

/**
 * Detects the user's operating system
 * @returns Operating system name
 */
export const detectOS = (): string => {
  const userAgent = navigator.userAgent;
  
  // Detect common operating systems
  if (userAgent.indexOf('Windows') > -1) {
    return 'Windows';
  } else if (userAgent.indexOf('Mac') > -1) {
    return 'MacOS';
  } else if (userAgent.indexOf('Linux') > -1) {
    return 'Linux';
  } else if (userAgent.indexOf('Android') > -1) {
    return 'Android';
  } else if (userAgent.indexOf('iOS') > -1 || userAgent.indexOf('iPhone') > -1 || userAgent.indexOf('iPad') > -1) {
    return 'iOS';
  } else {
    return 'Unknown';
  }
};

/**
 * Detects the user's device type
 * @returns Device type (desktop, mobile, tablet)
 */
export const detectDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  
  // Check for mobile or tablet
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(userAgent)) {
    return 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile';
  } else {
    return 'desktop';
  }
};

/**
 * Gets information about the user's device
 * @returns Device information object
 */
export const getDeviceInfo = (): DeviceInfo => {
  try {
    const screenSize = `${window.screen.width}x${window.screen.height}`;
    
    return {
      browser: detectBrowser(),
      os: detectOS(),
      deviceType: detectDeviceType(),
      screenSize,
      colorDepth: window.screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language
    };
  } catch (error) {
    //console.error('Failed to get device info:', error);
    return {
      browser: 'unknown',
      os: 'unknown',
      deviceType: 'unknown'
    };
  }
};

/**
 * Gets a complete device fingerprint including session ID and device info
 * @returns Object containing session_id and device_info
 */
export const getDeviceFingerprint = () => {
  return {
    session_id: getSessionId(),
    device_id: getDeviceId(),
    device_info: getDeviceInfo()
  };
}; 