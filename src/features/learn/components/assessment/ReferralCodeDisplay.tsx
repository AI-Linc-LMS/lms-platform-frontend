import React from "react";
import { FiUsers, FiInfo } from "react-icons/fi";

interface ReferralCodeDisplayProps {
  referralCode: string | null;
  className?: string;
}

const ReferralCodeDisplay: React.FC<ReferralCodeDisplayProps> = ({
  referralCode,
  className = "",
}) => {
  if (!referralCode) return null;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
          <FiUsers className="w-3 h-3 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-800">
            Referral Code Applied
          </p>
          <p className="text-xs text-blue-600">
            Code: <span className="font-mono bg-blue-100 px-1 rounded">{referralCode}</span>
          </p>
          {import.meta.env.DEV && (
            <p className="text-xs text-blue-500 mt-1">
              ✓ This code will be recorded with your assessment submission
            </p>
          )}
        </div>
        <div className="text-blue-500" title="Your assessment will be linked to this referral code">
          <FiInfo className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default ReferralCodeDisplay; 