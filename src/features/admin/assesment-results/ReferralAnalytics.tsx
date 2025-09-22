import React, { useMemo } from "react";
import { FiUsers, FiTrendingUp, FiBarChart, FiPercent } from "react-icons/fi";

interface ReferralAnalyticsProps {
  assessmentData: Array<{
    referral_code?: string;
    score: string;
    offered_scholarship_percentage: string;
    submitted_at: string;
  }>;
}

const ReferralAnalytics: React.FC<ReferralAnalyticsProps> = ({
  assessmentData,
}) => {
  const analytics = useMemo(() => {
    const referralSubmissions = assessmentData.filter(
      (entry) => entry?.referral_code
    );
    const directSubmissions = assessmentData.filter(
      (entry) => !entry?.referral_code
    );

    // Group by referral code
    const referralGroups = referralSubmissions.reduce((acc, entry) => {
      const code = entry.referral_code!;
      if (!acc[code]) {
        acc[code] = [];
      }
      acc[code].push(entry);
      return acc;
    }, {} as Record<string, typeof referralSubmissions>);

    // Calculate stats for each referral code
    const referralStats = Object.entries(referralGroups)
      .map(([code, submissions]) => {
        const avgScore =
          submissions.reduce((sum, entry) => {
            const score = parseFloat(entry.score) || 0;
            return sum + score;
          }, 0) / submissions.length;

        const avgScholarship =
          submissions.reduce((sum, entry) => {
            const scholarship =
              parseFloat(entry.offered_scholarship_percentage) || 0;
            return sum + scholarship;
          }, 0) / submissions.length;

        return {
          code,
          count: submissions.length,
          avgScore: Math.round(avgScore * 100) / 100,
          avgScholarship: Math.round(avgScholarship * 100) / 100,
          submissions,
        };
      })
      .sort((a, b) => b.count - a.count); // Sort by count descending

    return {
      totalSubmissions: assessmentData.length,
      referralSubmissions: referralSubmissions.length,
      directSubmissions: directSubmissions.length,
      referralRate: (referralSubmissions.length / assessmentData.length) * 100,
      uniqueReferralCodes: Object.keys(referralGroups).length,
      topReferralCodes: referralStats.slice(0, 5),
      referralStats,
    };
  }, [assessmentData]);

  if (assessmentData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Referral Analytics
        </h3>
        <p className="text-gray-500">
          No assessment data available for analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <FiBarChart className="w-5 h-5 text-[var(--default-primary)]" />
        <h3 className="text-lg font-semibold text-gray-900">
          Referral Analytics
        </h3>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <FiPercent className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm text-blue-600 font-medium">Referral Rate</p>
          <p className="text-xl font-bold text-blue-800">
            {analytics.referralRate.toFixed(1)}%
          </p>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <FiUsers className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-600 font-medium">Via Referral</p>
          <p className="text-xl font-bold text-green-800">
            {analytics.referralSubmissions}
          </p>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <FiTrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-sm text-purple-600 font-medium">Unique Codes</p>
          <p className="text-xl font-bold text-purple-800">
            {analytics.uniqueReferralCodes}
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <FiBarChart className="w-6 h-6 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">Direct</p>
          <p className="text-xl font-bold text-gray-800">
            {analytics.directSubmissions}
          </p>
        </div>
      </div>

      {/* Top Performing Referral Codes */}
      {analytics.topReferralCodes.length > 0 && (
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            Top Performing Referral Codes
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">
                    Referral Code
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">
                    Submissions
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">
                    Avg Score
                  </th>
                  <th className="px-4 py-2 text-center font-medium text-gray-700">
                    Avg Scholarship %
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analytics.topReferralCodes.map((stat, index) => (
                  <tr key={stat.code} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            index === 0
                              ? "bg-yellow-500"
                              : index === 1
                              ? "bg-gray-400"
                              : index === 2
                              ? "bg-orange-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-mono text-blue-600 font-medium">
                          {stat.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {stat.count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          stat.avgScore >= 80
                            ? "bg-green-100 text-green-800"
                            : stat.avgScore >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {stat.avgScore.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                        {stat.avgScholarship.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {analytics.referralSubmissions === 0 && (
        <div className="text-center py-8">
          <FiUsers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No referral submissions yet.</p>
          <p className="text-sm text-gray-400">
            Generate referral URLs above to start tracking referrals.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReferralAnalytics;
