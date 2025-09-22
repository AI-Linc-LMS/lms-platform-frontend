import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getAssesmentStudentResults } from "../../../services/admin/workshopRegistrationApis";
import ReferralAnalytics from "./ReferralAnalytics";

interface AssesmentStudentResultsData {
  id: number;
  userprofile: {
    user: {
      name: string;
      email: string;
    };
    phone_number: string;
  };
  assessment: {
    title: string;
    slug: string;
    duration_minutes: number;
    description: string;
  };
  score: string;
  offered_scholarship_percentage: string;
  submitted_at: string;
  started_at: string;
  status: string;
  amount: number;
  referral_code?: string; // Adding referral code field
  referal_code?: string;
}

const AssesmentStudentResults = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  // const [showReferralGenerator, setShowReferralGenerator] = useState(false);
  const pageSize = 15;

  const {
    data: assessmentData = [],
    isLoading,
    error,
  } = useQuery<AssesmentStudentResultsData[]>({
    queryKey: ["AssesmentStudentResults", clientId],
    queryFn: () => getAssesmentStudentResults(clientId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const filteredData = useMemo(() => {
    const filtered = assessmentData.filter((entry) => {
      const name = entry?.userprofile?.user?.name || "";
      const email = entry?.userprofile?.user?.email || "";
      const assessmentTitle = entry?.assessment?.title || "";
      const referralCode = entry?.referral_code || entry?.referal_code || "";

      return `${name} ${email} ${assessmentTitle} ${referralCode}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });

    // Sort by submitted_at date (latest first)
    return filtered.sort((a, b) => {
      const dateA = a?.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const dateB = b?.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return dateB - dateA; // Descending order (latest first)
    });
  }, [search, assessmentData]);

  // Count referrals vs direct submissions
  const referralStats = useMemo(() => {
    const withReferral = assessmentData.filter(
      (entry) => entry?.referral_code || entry?.referal_code
    ).length;
    const direct = assessmentData.length - withReferral;
    return { withReferral, direct };
  }, [assessmentData]);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6">Error loading assessment results</div>;

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);

  // Helper function to safely parse score
  const getScoreColor = (score: string) => {
    try {
      const numScore = parseFloat(score);
      if (isNaN(numScore)) return "bg-gray-100 text-gray-800";

      if (numScore >= 90) return "bg-green-100 text-green-800";
      if (numScore >= 80) return "bg-yellow-100 text-yellow-800";
      if (numScore >= 70) return "bg-orange-100 text-orange-800";
      return "bg-red-100 text-red-800";
    } catch {
      return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "submitted":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper function to format date safely
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl md:text-2xl font-bold mb-6">Assessment Results</h1>

      {/* Referral Generator Section */}
      {/* <div className="mb-6">
        <button
          onClick={() => setShowReferralGenerator(!showReferralGenerator)}
          className="flex items-center gap-2 bg-[var(--default-primary)] text-white px-4 py-2 rounded-lg hover:bg-[#1E4A63] transition-colors font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.102m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          {showReferralGenerator ? "Hide" : "Generate"} Referral URLs
        </button> */}

      {/* {showReferralGenerator && (
          <div className="mt-4"> */}
      {/* <AssessmentReferralGenerator /> */}
      {/* </div> */}
      {/* // )} */}
      {/* </div> */}

      {/* Referral Analytics Section */}
      <div className="mb-6">
        <ReferralAnalytics assessmentData={assessmentData} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700">
            Total Submissions
          </h3>
          <p className="text-2xl font-bold text-gray-900">
            {assessmentData.length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700">Via Referral</h3>
          <p className="text-2xl font-bold text-blue-600">
            {referralStats.withReferral}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700">Direct</h3>
          <p className="text-2xl font-bold text-green-600">
            {referralStats.direct}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Name, Email, Assessment, Referral Code"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded w-full sm:max-w-sm"
        />
        {/* <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[var(--success-500)] text-white px-4 py-2 rounded text-sm max-w-[120px]"
          title="Export to Excel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
            />
          </svg>
          <span className="inline text-white">Export</span>
        </button> */}
      </div>

      <div className="mb-4 text-sm text-gray-600">
        {search ? (
          <>
            Filtered count: <strong>{filteredData.length}</strong> of{" "}
            <strong>{assessmentData.length}</strong> total students
          </>
        ) : (
          <>
            Total Students: <strong>{assessmentData.length}</strong>
          </>
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full text-sm text-left min-w-[1100px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Mobile Number</th>
              <th className="p-3">Assessment Title</th>
              <th className="p-3">Score</th>
              <th className="p-3">Scholarship %</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Referral</th>
              <th className="p-3">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entry) => (
              <tr key={entry?.id || Math.random()} className="border-t">
                <td className="p-3 font-medium">
                  {entry?.userprofile?.user?.name || "N/A"}
                </td>
                <td className="p-3">
                  {entry?.userprofile?.user?.email || "N/A"}
                </td>
                <td className="p-3">
                  {entry?.userprofile?.phone_number || "N/A"}
                </td>
                <td className="p-3">
                  <span className="text-[13px]">
                    {entry?.assessment?.title || "N/A"}
                  </span>
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(
                      entry?.score
                    )}`}
                  >
                    {entry?.score ? `${entry.score}` : "N/A"}
                  </span>
                </td>
                <td className="p-3">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                    {entry?.offered_scholarship_percentage
                      ? `${entry.offered_scholarship_percentage}%`
                      : "N/A"}
                  </span>
                </td>
                <td className="p-3 font-semibold text-green-600">
                  {entry?.amount ? `₹${entry.amount.toLocaleString()}` : "N/A"}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      entry?.status
                    )}`}
                  >
                    {entry?.status || "N/A"}
                  </span>
                </td>
                <td className="p-3">
                  {entry?.referral_code || entry?.referal_code ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium font-mono">
                      {entry.referral_code || entry.referal_code}
                    </span>
                  ) : (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      Direct
                    </span>
                  )}
                </td>
                <td className="p-3 text-xs text-gray-600">
                  {formatDate(entry?.submitted_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-2 text-sm">
          <span>
            Showing {Math.min((page - 1) * pageSize + 1, filteredData.length)} -{" "}
            {Math.min(page * pageSize, filteredData.length)} of{" "}
            {filteredData.length} students
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssesmentStudentResults;
