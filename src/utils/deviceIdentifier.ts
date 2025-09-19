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
const SESSION_START_TIME_KEY = 'sessionStartTime';

/**
 * Generates a unique session ID for the current browser session
 * Maintains the same session ID throughout a single user session
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
      // Also store when this session started
      localStorage.setItem(SESSION_START_TIME_KEY, Date.now().toString());
    }
    
    return sessionId;
  } catch {
    // Fallback if localStorage is not available
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
};

/**
 * Generates a new session ID and clears the old one
 * This should be called when starting a completely new session
 * @returns New session ID string
 */
export const generateNewSessionId = (): string => {
  try {
    const sessionId = `session-${uuidv4()}`;
    localStorage.setItem(SESSION_ID_KEY, sessionId);
    localStorage.setItem(SESSION_START_TIME_KEY, Date.now().toString());
    return sessionId;
  } catch {
    // Fallback if localStorage is not available
    return `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }
};

/**
 * Gets the current session ID from localStorage (if it exists)
 * @returns Current session ID or null if none exists
 */
export const getCurrentSessionId = (): string | null => {
  try {
    return localStorage.getItem(SESSION_ID_KEY);
  } catch {
    return null;
  }
};

/**
 * Clears the current session ID from localStorage
 * This should be called when a session actually ends
 */
export const clearCurrentSessionId = (): void => {
  try {
    localStorage.removeItem(SESSION_ID_KEY);
    localStorage.removeItem(SESSION_START_TIME_KEY);
  } catch {
    // Silently fail if localStorage is not available
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
  } catch {
    // Fallback if localStorage is not available
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
  } catch {
    return {
      browser: 'unknown',
      os: 'unknown',
      deviceType: 'unknown'
    };
  }
};

/**
 * Detects if the current device is iOS (iPhone or iPad)
 * @returns True if iOS device, false otherwise
 */
export const isIOSDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
};

/**
 * Detects if the current device is an iPhone specifically
 * @returns True if iPhone, false otherwise
 */
export const isIPhoneDevice = (): boolean => {
  const userAgent = navigator.userAgent;
  return /iPhone/.test(userAgent) && !(window as any).MSStream;
};

/**
 * Detects if the PWA is already installed (running in standalone mode)
 * @returns True if PWA is installed/standalone, false otherwise
 */
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true ||
         document.referrer.includes('android-app://');
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