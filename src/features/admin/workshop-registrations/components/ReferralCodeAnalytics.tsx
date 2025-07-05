import React from "react";
import { WorkshopRegistrationData } from "../types";
import { FiUsers, FiTrendingUp, FiAward, FiBarChart } from "react-icons/fi";

interface ReferralCodeAnalyticsProps {
  workshopData: WorkshopRegistrationData[];
}

export const ReferralCodeAnalytics: React.FC<ReferralCodeAnalyticsProps> = ({
  workshopData,
}) => {
  // Calculate referral code statistics
  const totalRegistrations = workshopData.length;
  const registrationsWithReferral = workshopData.filter(
    (entry) => entry.referal_code && entry.referal_code.trim() !== ""
  ).length;
  const referralRate = totalRegistrations > 0 
    ? ((registrationsWithReferral / totalRegistrations) * 100).toFixed(1)
    : "0";

  // Get top referral codes
  const referralCodeCounts = workshopData.reduce((acc, entry) => {
    if (entry.referal_code && entry.referal_code.trim() !== "") {
      acc[entry.referal_code] = (acc[entry.referal_code] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topReferralCodes = Object.entries(referralCodeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const uniqueReferralCodes = Object.keys(referralCodeCounts).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FiBarChart className="w-5 h-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900">
          Referral Code Analytics
        </h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Total with Referral
              </p>
              <p className="text-2xl font-bold text-purple-900">
                {registrationsWithReferral}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center">
              <FiUsers className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Referral Rate</p>
              <p className="text-2xl font-bold text-blue-900">{referralRate}%</p>
            </div>
            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
              <FiTrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">
                Unique Codes
              </p>
              <p className="text-2xl font-bold text-green-900">
                {uniqueReferralCodes}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
              <FiAward className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-600">
                Avg. per Code
              </p>
              <p className="text-2xl font-bold text-orange-900">
                {uniqueReferralCodes > 0 
                  ? (registrationsWithReferral / uniqueReferralCodes).toFixed(1)
                  : "0"}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
              <FiBarChart className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Referral Codes */}
      {topReferralCodes.length > 0 && (
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-3">
            Top Performing Referral Codes
          </h3>
          <div className="space-y-2">
            {topReferralCodes.map(([code, count], index) => (
              <div
                key={code}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-purple-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-medium bg-purple-100 text-purple-800 px-2 py-1 rounded">
                    {code}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {count} registration{count > 1 ? 's' : ''}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{
                        width: `${(count / Math.max(...Object.values(referralCodeCounts))) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {registrationsWithReferral === 0 && (
        <div className="text-center py-8">
          <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No referral codes found in current data</p>
        </div>
      )}
    </div>
  );
}; 