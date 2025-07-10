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
import { getAllAssessments } from "../../../services/assesment/assesmentApis";

const AssessmentReferals = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const queryClient = useQueryClient();

  // New: assessment slug state (default scholarship test)
  const [assessmentSlug, setAssessmentSlug] = useState("ai-linc-scholarship-test");
  // fetch assessments list
  const { data: assessments = [] } = useQuery({
    queryKey: ["assessments-list", clientId],
    queryFn: () => getAllAssessments(clientId),
    staleTime: 5*60*1000,
  });
  // ensure slug matches list if not existing
  React.useEffect(() => {
    if (assessments.length && !assessments.some(a => a.slug === assessmentSlug)) {
      setAssessmentSlug(assessments[0].slug);
    }
  }, [assessments]);

  // State for search, modal, and editing
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingReferral, setEditingReferral] = useState<Referral | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [referralToDelete, setReferralToDelete] = useState<Referral | null>(null);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Generate assessment referral link
  const generateReferralLink = (referralCode: string) => {
    return `https://ailinc.com/assessment?ref=${encodeURIComponent(referralCode)}`;
  };

  // Copy link
  const copyToClipboard = async (link: string, referralId: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLinkId(referralId);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  // Fetch referrals
  const { data: referrals, isLoading, error } = useQuery({
    queryKey: ["referals"],
    queryFn: () => getRefferalDetails(clientId),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ReferralData) => createReferral(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setIsCreateModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReferralData }) => updateReferral(clientId, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setEditingReferral(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReferral(clientId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referals"] });
      setIsDeleteModalOpen(false);
      setReferralToDelete(null);
    },
  });

  // Search filter
  const filteredReferrals = useMemo(() => {
    if (!referrals) return [];
    return referrals.filter((referral: Referral) =>
      `${referral.name} ${referral.email} ${referral.referral_code}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [referrals, searchTerm]);

  if (isLoading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#255C79]"></div></div>;
  if (error) return <div className="flex items-center justify-center min-h-screen"><p className="text-red-500">Error loading referrals</p></div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessment Referrals Management</h1>
          <p className="text-gray-600">Create and track referral codes for assessments</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or referral code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none" />
          </div>
          {/* Assessment selector */}
          <select value={assessmentSlug} onChange={(e)=> setAssessmentSlug(e.target.value)} className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#255C79] focus:border-transparent outline-none" >
            {assessments.map(ass => (
              <option key={ass.slug} value={ass.slug}>{ass.title}</option>
            ))}
          </select>
          {/* Create button */}
          <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 bg-[#255C79] text-white px-6 py-3 rounded-lg hover:bg-[#1E4A63] transition-colors font-medium"><FiPlus className="w-5 h-5" />Create Referral</button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Referral Code</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Referral Link</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReferrals.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No referrals found.</td></tr>
                ) : (
                  filteredReferrals.map((referral: Referral) => {
                    const link = generateReferralLink(referral.referral_code);
                    const isCopied = copiedLinkId === referral.id.toString();
                    return (
                      <tr key={referral.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{referral.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{referral.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{referral.phone_number}</td>
                        <td className="px-6 py-4 text-sm text-gray-600"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md font-mono text-xs">{referral.referral_code}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2 max-w-xs">
                            <p className="flex-1 min-w-0 text-xs text-gray-500 truncate" title={link}>{link}</p>
                            <button onClick={() => copyToClipboard(link, referral.id.toString())} className={`p-1.5 rounded-md transition-colors ${isCopied ? "bg-green-100 text-green-700" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>{isCopied ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}</button>
                            <a href={link} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600"><FiExternalLink className="w-4 h-4" /></a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-600 whitespace-nowrap">
                          <button onClick={() => setEditingReferral(referral)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-yellow-50 text-yellow-800 rounded-md hover:bg-yellow-100 mr-2"><FiEdit2 className="w-4 h-4" />Edit</button>
                          <button onClick={() => { setIsDeleteModalOpen(true); setReferralToDelete(referral); }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-red-50 text-red-800 rounded-md hover:bg-red-100"><FiTrash2 className="w-4 h-4" />Delete</button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Count */}
        <div className="mt-4 text-sm text-gray-600">Total Referrals: <strong>{filteredReferrals.length}</strong></div>

        {/* Modals (reuse logic from original component) */}
        {/* Create/Edit Modal */}
        {isCreateModalOpen || editingReferral ? (
          <ReferralModal isOpen={Boolean(isCreateModalOpen || editingReferral)} onClose={() => { setIsCreateModalOpen(false); setEditingReferral(null); }} onSubmit={(data) => {
              if (editingReferral) {
                updateMutation.mutate({ id: editingReferral.id.toString(), data });
              } else {
                createMutation.mutate(data);
              }
            }} referral={editingReferral} isLoading={createMutation.isPending || updateMutation.isPending} />
        ) : null}

        {/* Delete Confirmation */}
        {isDeleteModalOpen && referralToDelete && (
          <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={() => deleteMutation.mutate(referralToDelete.id.toString())} referral={referralToDelete} isLoading={deleteMutation.isPending} />
        )}
      </div>
    </div>
  );
};

// ----- Reusable Modal Components (copied from original) -----
interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReferralData) => void;
  referral?: Referral | null;
  isLoading: boolean;
}
const ReferralModal: React.FC<ReferralModalProps> = ({ isOpen, onClose, onSubmit, referral, isLoading }) => {
  const [formData, setFormData] = useState<ReferralFormData>({
    name: referral?.name || "",
    email: referral?.email || "",
    phone_number: referral?.phone_number || "",
    referral_code: referral?.referral_code || "",
  });
  const [errors, setErrors] = useState<Partial<ReferralFormData>>({});

  const validateForm = () => {
    const newErrors: Partial<ReferralFormData> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email";
    if (!formData.phone_number.trim()) newErrors.phone_number = "Phone number is required";
    if (!formData.referral_code.trim()) newErrors.referral_code = "Referral code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{referral ? "Edit Referral" : "Create Referral"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FiX className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] outline-none ${errors.name ? "border-red-500" : "border-gray-300"}`} />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          <input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] outline-none ${errors.email ? "border-red-500" : "border-gray-300"}`} />
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
          <input type="tel" placeholder="Phone Number" value={formData.phone_number} onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] outline-none ${errors.phone_number ? "border-red-500" : "border-gray-300"}`} />
          {errors.phone_number && <p className="text-xs text-red-500">{errors.phone_number}</p>}
          <input type="text" placeholder="Referral Code" value={formData.referral_code} onChange={(e) => setFormData(prev => ({ ...prev, referral_code: e.target.value }))} className={`w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-[#255C79] outline-none ${errors.referral_code ? "border-red-500" : "border-gray-300"}`} />
          {errors.referral_code && <p className="text-xs text-red-500">{errors.referral_code}</p>}
          <button type="submit" disabled={isLoading} className="w-full py-2 bg-[#255C79] text-white rounded-md hover:bg-[#1E4A63] transition-colors">{isLoading ? "Saving..." : "Save"}</button>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  referral: Referral;
  isLoading: boolean;
}
const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, referral, isLoading }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-gray-900">Delete Referral</h2><button onClick={onClose} className="text-gray-500 hover:text-gray-700"><FiX className="w-5 h-5" /></button></div>
        <p className="mb-6 text-sm text-gray-600">Are you sure you want to delete referral <span className="font-medium">{referral.name}</span>?</p>
        <div className="flex justify-end gap-3"><button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button><button onClick={onConfirm} disabled={isLoading} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">{isLoading ? "Deleting..." : "Delete"}</button></div>
      </div>
    </div>
  );
};

export default AssessmentReferals; 