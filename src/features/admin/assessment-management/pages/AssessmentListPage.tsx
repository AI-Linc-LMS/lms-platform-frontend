import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSearch,
  FiPlus,
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import {
  getAssessments,
  deleteAssessment,
  Assessment,
} from "../../../../services/admin/assessmentApis";
import { CURRENCY_OPTIONS } from "../types";

const AssessmentListPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaid, setFilterPaid] = useState<boolean | "all">("all");
  const [filterActive, setFilterActive] = useState<boolean | "all">("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(9);

  // Fetch assessments
  const {
    data: assessments = [],
    isLoading,
    error,
  } = useQuery<Assessment[]>({
    queryKey: ["assessments", clientId],
    queryFn: () => getAssessments(clientId),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (assessmentId: number) =>
      deleteAssessment(clientId, assessmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments", clientId] });
      setDeleteConfirmId(null);
    },
  });

  // Filtered assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((assessment) => {
      const matchesSearch = assessment.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesPaid =
        filterPaid === "all" || assessment.is_paid === filterPaid;
      const matchesActive =
        filterActive === "all" || assessment.is_active === filterActive;
      return matchesSearch && matchesPaid && matchesActive;
    });
  }, [assessments, searchTerm, filterPaid, filterActive]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterPaid, filterActive]);

  // Paginated assessments
  const paginatedAssessments = useMemo(() => {
    const startIndex = page * itemsPerPage;
    return filteredAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssessments, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCurrencySymbol = (currencyCode?: string) => {
    const currency = CURRENCY_OPTIONS.find((c) => c.code === currencyCode);
    return currency?.symbol || "₹";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Assessment Management
          </h1>
          <p className="text-gray-600">
            Create and manage assessments with MCQ questions
          </p>
        </div>

        {/* Actions Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterPaid === "all" ? "all" : filterPaid.toString()}
                onChange={(e) =>
                  setFilterPaid(
                    e.target.value === "all" ? "all" : e.target.value === "true"
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="false">Free</option>
                <option value="true">Paid</option>
              </select>

              <select
                value={filterActive === "all" ? "all" : filterActive.toString()}
                onChange={(e) =>
                  setFilterActive(
                    e.target.value === "all" ? "all" : e.target.value === "true"
                  )
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <button
                onClick={() => navigate("/admin/assessments/create")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--primary-500)",
                  color: "var(--font-light)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-700)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-500)";
                }}
              >
                <FiPlus />
                Create Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading assessments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p className="font-semibold">Error loading assessments</p>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAssessments.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FiFileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No assessments found
            </h3>
            <p className="mt-2 text-gray-600">
              {searchTerm || filterPaid !== "all" || filterActive !== "all"
                ? "Try adjusting your filters"
                : "Get started by creating your first assessment"}
            </p>
            {!searchTerm && filterPaid === "all" && filterActive === "all" && (
              <button
                onClick={() => navigate("/admin/assessments/create")}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                style={{
                  backgroundColor: "var(--primary-500)",
                  color: "var(--font-light)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-700)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--primary-500)";
                }}
              >
                <FiPlus />
                Create Assessment
              </button>
            )}
          </div>
        )}

        {/* Assessments Grid */}
        {!isLoading && !error && filteredAssessments.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">
                        {assessment.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        {assessment.is_paid ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                            <FiDollarSign size={12} />
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                            Free
                          </span>
                        )}
                        {assessment.is_active ? (
                          <FiCheckCircle className="text-green-500" size={20} />
                        ) : (
                          <FiXCircle className="text-gray-400" size={20} />
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {assessment.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {assessment.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiClock className="text-gray-400" />
                        <span>{assessment.duration_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FiFileText className="text-gray-400" />
                        <span>{assessment.total_questions} questions</span>
                      </div>
                    </div>

                    {/* Price */}
                    {assessment.is_paid && assessment.price && (
                      <div className="mb-4">
                        <span
                          className="text-sm"
                          style={{ color: "var(--font-secondary)" }}
                        >
                          Price:{" "}
                        </span>
                        <span
                          className="text-lg font-semibold"
                          style={{ color: "var(--primary-700)" }}
                        >
                          {getCurrencySymbol(assessment.currency)}
                          {assessment.price}
                        </span>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="text-xs text-gray-500 mb-4">
                      Created {formatDate(assessment.created_at)}
                    </div>

                    {/* Actions */}
                    {/* <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() =>
                        navigate(`/admin/assessments/edit/${assessment.id}`)
                      }
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors"
                      style={{
                        color: "var(--primary-600)",
                        borderColor: "var(--primary-600)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--primary-50)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <FiEdit2 size={16} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(assessment.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors"
                      style={{
                        color: "var(--error-500)",
                        borderColor: "var(--error-600)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--error-100)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <FiTrash2 size={16} />
                      Delete
                    </button>
                  </div> */}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {filteredAssessments.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) =>
                        handleItemsPerPageChange(Number(e.target.value))
                      }
                      className="px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                      <option value={18}>18</option>
                      <option value={24}>24</option>
                    </select>
                    <span className="text-sm text-gray-600">per page</span>
                  </div>

                  {/* Page info */}
                  <div className="text-sm text-gray-600">
                    Showing {page * itemsPerPage + 1} to{" "}
                    {Math.min(
                      (page + 1) * itemsPerPage,
                      filteredAssessments.length
                    )}{" "}
                    of {filteredAssessments.length} assessments
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 0}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i).map(
                        (pageNum) => {
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            pageNum === 0 ||
                            pageNum === totalPages - 1 ||
                            Math.abs(pageNum - page) <= 1;

                          const showEllipsisBefore = pageNum === 1 && page > 2;
                          const showEllipsisAfter =
                            pageNum === totalPages - 2 && page < totalPages - 3;

                          if (showEllipsisBefore || showEllipsisAfter) {
                            return (
                              <span
                                key={pageNum}
                                className="px-2 text-gray-400 text-sm"
                              >
                                ...
                              </span>
                            );
                          }

                          if (!showPage) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                pageNum === page
                                  ? "text-white"
                                  : "border border-gray-300 hover:bg-gray-50"
                              }`}
                              style={
                                pageNum === page
                                  ? {
                                      backgroundColor: "var(--primary-500)",
                                    }
                                  : {}
                              }
                            >
                              {pageNum + 1}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages - 1}
                      className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Assessment
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this assessment? This action
                cannot be undone.
              </p>
              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 border rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    color: "var(--font-primary)",
                    borderColor: "var(--neutral-200)",
                    backgroundColor: "var(--card-bg)",
                  }}
                  onMouseEnter={(e) =>
                    !deleteMutation.isPending &&
                    (e.currentTarget.style.backgroundColor =
                      "var(--neutral-50)")
                  }
                  onMouseLeave={(e) =>
                    !deleteMutation.isPending &&
                    (e.currentTarget.style.backgroundColor = "var(--card-bg)")
                  }
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deleteConfirmId)}
                  disabled={deleteMutation.isPending}
                  className="px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--error-500)",
                    color: "var(--font-light)",
                  }}
                  onMouseEnter={(e) =>
                    !deleteMutation.isPending &&
                    (e.currentTarget.style.backgroundColor = "var(--error-600)")
                  }
                  onMouseLeave={(e) =>
                    !deleteMutation.isPending &&
                    (e.currentTarget.style.backgroundColor = "var(--error-500)")
                  }
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
              {deleteMutation.isError && (
                <p className="mt-4 text-sm text-red-600">
                  Error: {(deleteMutation.error as Error).message}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentListPage;
