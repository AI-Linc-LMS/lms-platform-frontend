import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCopy,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import {
  getRefferalDetails,
  createReferral,
  updateReferral,
  deleteReferral,
} from "../../../services/admin/workshopRegistrationApis";
import {
  Referral,
  ReferralData,
  ReferralFormData,
} from "../../../types/referral";
import { useToast } from "../../../contexts/ToastContext";

const Referals = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const queryClient = useQueryClient();
  const { error: showError } = useToast();

  // State for search, modal, and editing
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [referralToDelete, setReferralToDelete] = useState<Referral | null>(
    null
  );
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // New: referral type state
  const [selectedReferralType, setSelectedReferralType] = useState("workshop");
  // Removed assessments query

  // Function to generate referral link based on type
  const generateReferralLink = (referralCode: string) => {
    if (selectedReferralType === "assessment") {
      return `https://ailinc.com/assessment?ref=${encodeURIComponent(
        referralCode
      )}`;
    } else {
      return `https://ailinc.com/workshop-registration?ref=${referralCode}`;
    }
  };

  // Function to copy link to clipboard
  const copyToClipboard = async (link: string, referralId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(referralId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch {
      //console.error("Failed to copy link:", err);
      showError("Failed to copy link");
    }
  };

  // Fetch referrals data
  const {
    data: referrals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["referals"],
    queryFn: () => getRefferalDetails(clientId),
  });

  // Create referral mutation
  const createMutation = useMutation({
    mutationFn: (data: ReferralData) => createReferral(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setIsCreateModalOpen(false);
    },
  });

  // Update referral mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReferralData }) =>
      updateReferral(clientId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setEditingReferral(null);
    },
  });

  // Delete referral mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReferral(clientId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setIsDeleteModalOpen(false);
      setReferralToDelete(null);
    },
  });

  // Filter referrals based on search term
  const filteredReferrals = useMemo(() => {
    if (!referrals) return [];
    return referrals.filter(
      (referral: Referral) =>
        referral.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [referrals, searchTerm]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-500)]"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center">
          <p className="text-xl font-semibold mb-2">Error Loading Referrals</p>
          <p>{error.message}</p>
        </div>
      </div>
    );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Referrals Management
          </h1>
          <p className="text-gray-600">
            Manage your referral program and track referrals for workshops and
            assessments
          </p>
        </div>

        {/* Search, Link Type Selector, and Create Button */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or referral code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
            />
          </div>

          {/* Referral Type Dropdown */}
          <select
            value={selectedReferralType}
            onChange={(e) => setSelectedReferralType(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none"
          >
            <option value="workshop">Workshop Registration</option>
            <option value="assessment">Assessment</option>
          </select>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-[var(--primary-500)] text-[var(--font-light)] px-6 py-3 rounded-lg hover:bg-[var(--primary-600)] transition-colors font-medium"
          >
            <FiPlus className="w-5 h-5" />
            Create Referral
          </button>
        </div>

        {/* Count Display */}
        <div className="mb-4 text-sm text-gray-600">
          {searchTerm ? (
            <>
              Filtered count: <strong>{filteredReferrals.length}</strong> of{" "}
              <strong>{referrals?.length || 0}</strong> total referrals
            </>
          ) : (
            <>
              Total Referrals: <strong>{referrals?.length || 0}</strong>
            </>
          )}
        </div>

        {/* Referrals Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Phone Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Referral Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Referral Link
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {searchTerm
                        ? "No referrals found matching your search."
                        : "No referrals found."}
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((referral: Referral) => {
                    const referralLink = generateReferralLink(
                      referral.referral_code
                    );
                    const isCopied = copiedLinkId === referral.id.toString();

                    return (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                          {referral.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {referral.email}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {referral.phone_number}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-mono text-xs">
                            {referral.referral_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2 max-w-xs">
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-xs text-gray-500 truncate"
                                title={referralLink}
                              >
                                {referralLink}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    referralLink,
                                    referral.id.toString()
                                  )
                                }
                                className={`p-1.5 rounded-md transition-colors ${
                                  isCopied
                                    ? "text-green-600 bg-green-50"
                                    : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                }`}
                                title={isCopied ? "Copied!" : "Copy link"}
                              >
                                {isCopied ? (
                                  <FiCheck className="w-3 h-3" />
                                ) : (
                                  <FiCopy className="w-3 h-3" />
                                )}
                              </button>
                              <a
                                href={referralLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Open link"
                              >
                                <FiExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingReferral(referral)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setReferralToDelete(referral);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Referral Modal */}
        {(isCreateModalOpen || editingReferral) && (
          <ReferralModal
            isOpen={isCreateModalOpen || !!editingReferral}
            onClose={() => {
              setIsCreateModalOpen(false);
              setEditingReferral(null);
            }}
            onSubmit={(data: ReferralData) => {
              if (editingReferral) {
                updateMutation.mutate({
                  id: editingReferral?.id.toString() ?? "",
                  data,
                });
              } else {
                createMutation.mutate(data);
              }
            }}
            referral={editingReferral}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && referralToDelete && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setReferralToDelete(null);
            }}
            onConfirm={() => {
              deleteMutation.mutate(referralToDelete?.id.toString() ?? "");
            }}
            referral={referralToDelete}
            isLoading={deleteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
};

// Referral Modal Component
interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReferralData) => void;
  referral?: Referral | null;
  isLoading: boolean;
}

const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  referral,
  isLoading,
}) => {
  const [formData, setFormData] = useState<ReferralFormData>({
    name: "",
    email: "",
    phone_number: "",
    referral_code: "",
  });

  const [errors, setErrors] = useState<Partial<ReferralFormData>>({});

  // Populate form when editing
  React.useEffect(() => {
    if (referral) {
      setFormData({
        id: referral.id,
        name: referral.name,
        email: referral.email,
        phone_number: referral.phone_number,
        referral_code: referral.referral_code,
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        referral_code: "",
      });
    }
    setErrors({});
  }, [referral]);

  const validateForm = () => {
    const newErrors: Partial<ReferralFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }

    if (!formData.referral_code.trim()) {
      newErrors.referral_code = "Referral code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Remove id from formData when creating new referral
      const submitData: ReferralData = {
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone_number,
        referral_code: formData.referral_code,
      };
      onSubmit(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {referral ? "Edit Referral" : "Create New Referral"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter full name"
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email address"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone_number}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone_number: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none ${
                errors.phone_number ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter phone number"
              disabled={isLoading}
            />
            {errors.phone_number && (
              <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="referralCode"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Referral Code *
            </label>
            <input
              type="text"
              id="referralCode"
              value={formData.referral_code}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  referral_code: e.target.value,
                }))
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent outline-none ${
                errors.referral_code ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter referral code"
              disabled={isLoading}
            />
            {errors.referral_code && (
              <p className="text-red-500 text-xs mt-1">
                {errors.referral_code}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : referral ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  referral: Referral;
  isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  referral,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Delete Referral
          </h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete the referral for{" "}
            <strong>{referral.name}</strong>? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-[var(--font-light)] rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referals;
