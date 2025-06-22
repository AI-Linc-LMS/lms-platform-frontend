import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getWorkshopRegistrations } from "../../../services/admin/workshopRegistrationApis";
import * as XLSX from "xlsx";

interface WorkshopRegistrationData {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  registered_at: string;
  workshop_name: string;
}

const WorkshopRegistration = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const {
    data: workshopData = [],
    isLoading,
    error,
  } = useQuery<WorkshopRegistrationData[]>({
    queryKey: ["workshopRegistrations", clientId],
    queryFn: () => getWorkshopRegistrations(clientId),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const filteredData = useMemo(() => {
    return workshopData.filter((entry) =>
      `${entry.name} ${entry.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, workshopData]);

  const handleExport = () => {
    const exportData = filteredData.map((entry, index) => ({
      "Serial No.": index + 1,
      Name: entry.name,
      Email: entry.email,
      "Mobile Number": entry.phone_number,
      "Workshop Name": entry.workshop_name,
      "Registered At": entry.registered_at,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Workshop Registrations");
    XLSX.writeFile(workbook, "workshop_registrations.xlsx");
  };

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error)
    return <div className="p-6">Error loading workshop registrations</div>;

  const paginatedData = filteredData.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const totalPages = Math.ceil(filteredData.length / pageSize);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl md:text-2xl font-bold mb-6">
        Workshop Registrations
      </h1>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by Name, Email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="p-2 border rounded w-full sm:max-w-sm"
        />
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-[#5FA564] text-white px-4 py-2 rounded text-sm max-w-[120px]"
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
        </button>
      </div>

      <div className="mb-4 text-sm text-gray-600">
        Total Students Registered: <strong>{workshopData.length}</strong>
      </div>

      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="w-full text-sm text-left min-w-[600px]">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Mobile Number</th>
              <th className="p-3">Workshop Name</th>
              <th className="p-3">Registered At</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entry) => (
              <tr key={entry.id} className="border-t">
                <td className="p-3">{entry.name}</td>
                <td className="p-3">{entry.email}</td>
                <td className="p-3">{entry.phone_number}</td>
                <td className="p-3">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full md:text-xs text-[10px]">
                    {entry.workshop_name}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(entry.registered_at).toLocaleString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
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

export default WorkshopRegistration;
