import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FiLink, FiX, FiCheck } from "react-icons/fi";

export const ReferralCodeCapture: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [capturedCode, setCapturedCode] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const referralCode = searchParams.get('ref') || searchParams.get('referral_code');
    
    if (referralCode && referralCode.trim()) {
      setCapturedCode(referralCode);
      setShowNotification(true);
      
      // Auto-hide notification after 5 seconds
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleDismiss = () => {
    setShowNotification(false);
    setCapturedCode(null);
    
    // Remove referral code from URL
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('ref');
    newSearchParams.delete('referral_code');
    setSearchParams(newSearchParams);
  };

  if (!showNotification || !capturedCode) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-blue-200 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <FiLink className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Referral Code Detected
          </h4>
          <p className="text-xs text-gray-600 mb-2">
            A referral code was found in the URL and will be tracked with registrations.
          </p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-500">Code:</span>
            <span className="font-mono text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {capturedCode}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-green-600">
            <FiCheck className="w-3 h-3" />
            <span>Tracking active</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
          title="Dismiss"
        >
          <FiX className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}; 