import { useDispatch } from "react-redux";
import userImage from "../commonComponents/icons/nav/User Image.png";
import editIcon from "../commonComponents/icons/nav/editIcon.png";
import { logout } from "../redux/slices/userSlice";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleMobileNavigation } from "../utils/authRedirectUtils";
import { getUser, updateUser } from "../services/userApis";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../contexts/ToastContext";
import TimeTrackingDashboard from "../features/learn/components/graphs-components/TimeTrackingDashboard";
// import DailyProgress from "../features/learn/components/DailyProgressTable";
import StreakTable from "../features/learn/components/StreakTable";
import ResumeBuilder from "../features/resume-builder/pages/ResumeBuilder";

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  profile_picture: string;
  phone_number: string;
  bio: string | null;
  social_links: {
    linkedin?: string;
    github?: string;
  };
  date_of_birth: string | null;
  emailNotification?: boolean;
  inAppNotification?: boolean;
}

type TabType = "activity" | "profile" | "resume";

const ProfileSettings = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { error: showErrorToast, success: showSuccessToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [editable, setEditable] = useState(false);
  const [formData, setFormData] = useState<UserData>({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    profile_picture: "",
    phone_number: "",
    bio: null,
    social_links: {},
    date_of_birth: null,
    emailNotification: false,
    inAppNotification: false,
  });

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user"],
    queryFn: () => getUser(clientId),
  });

  const updateUserMutation = useMutation({
    mutationFn: (userData: Partial<UserData>) => updateUser(clientId, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setIsSaving(false);
      setEditable(false);
      showSuccessToast(
        "Profile Updated",
        "Your profile has been updated successfully!"
      );
    },
    onError: () => {
      setIsSaving(false);
      showErrorToast(
        "Update Failed",
        "Failed to update profile. Please try again."
      );
    },
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        username: user.username || "",
        profile_picture: user.profile_picture || "",
        phone_number: user.phone_number || "",
        bio: user.bio,
        social_links: user.social_links || {},
        date_of_birth: user.date_of_birth,
        emailNotification: user.emailNotification || false,
        inAppNotification: user.inAppNotification || false,
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    if (name.startsWith("social_links.")) {
      const socialKey = name.split(
        "."
      )[1] as keyof typeof formData.social_links;
      setFormData((prev) => ({
        ...prev,
        social_links: {
          ...prev.social_links,
          [socialKey]: val,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: val }));
    }
  };

  const handleToggle = (key: keyof UserData) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    const updateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      phone_number: formData.phone_number,
      bio: formData.bio,
      date_of_birth: formData.date_of_birth,
      emailNotification: formData.emailNotification,
      inAppNotification: formData.inAppNotification,
      social_links: {
        linkedin: formData.social_links.linkedin || "",
        github: formData.social_links.github || "",
      },
    };

    updateUserMutation.mutate(updateData);
  };

  const Logout = async () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      dispatch(logout());

      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = "https://accounts.google.com/logout";
      document.body.appendChild(iframe);

      const cleanupPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          document.body.removeChild(iframe);
          resolve();
        }, 200);
      });

      await cleanupPromise;
      window.history.replaceState(null, "", "/login");
      window.location.reload();
    } catch {
      showErrorToast(
        "Logout Error",
        "Failed to logout properly. Please try again."
      );
      handleMobileNavigation("/login", navigate, true, false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--primary-500)] border-t-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-4 border-[var(--primary-200)] border-b-transparent animate-spin animation-delay-150"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <svg
          className="w-20 h-20 text-[var(--error-500)] mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="text-[var(--error-500)] text-lg font-semibold text-center">
          Error loading user data. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--primary-50)] via-[var(--primary-100)] to-[var(--secondary-50)] py-6 sm:py-10 px-3 sm:px-6" style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%' }}>
      <div className="max-w-7xl mx-auto" style={{ overflowX: 'hidden', maxWidth: '100%' }}>
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white/70 backdrop-blur-md border border-[var(--primary-100)] rounded-2xl p-2 shadow-xl inline-flex gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "profile"
                  ? "bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-700)] text-[var(--font-light)] shadow-lg scale-105"
                  : "text-[var(--font-secondary)] hover:text-[var(--primary-500)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="hidden sm:inline">Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "activity"
                  ? "bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-700)] text-[var(--font-light)] shadow-lg scale-105"
                  : "text-[var(--font-secondary)] hover:text-[var(--primary-500)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="hidden sm:inline">Activity</span>
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                activeTab === "resume"
                  ? "bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-700)] text-[var(--font-light)] shadow-lg scale-105"
                  : "text-[var(--font-secondary)] hover:text-[var(--primary-500)] hover:bg-[var(--neutral-100)]"
              }`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">Resume</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="relative" style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%' }}>
          {/* Activity Tab Content */}
          <div
            className={`transition-all duration-500 ${
              activeTab === "activity"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 translate-x-full absolute inset-0 pointer-events-none"
            }`}
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white/80 backdrop-blur-md border border-[var(--primary-100)] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <TimeTrackingDashboard />
                </div>

                <div className="space-y-6">
                  {/* <div className="bg-white/80 backdrop-blur-md border border-[var(--primary-100)] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <DailyProgress clientId={parseInt(clientId, 10)} />
                  </div> */}
                  <div className="bg-white/80 backdrop-blur-md border border-[var(--primary-100)] rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <StreakTable clientId={parseInt(clientId, 10)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Tab Content */}
          <div
            className={`transition-all duration-500 ${
              activeTab === "profile"
                ? "opacity-100 translate-x-0 relative"
                : "opacity-0 -translate-x-full absolute inset-0 pointer-events-none"
            }`}
          >
            <div className="bg-white/90 backdrop-blur-lg border border-[var(--primary-100)] rounded-3xl shadow-2xl overflow-hidden">
              {/* Profile Header */}
              <div className="relative bg-gradient-to-r from-[var(--primary-500)] via-[var(--primary-600)] to-[var(--primary-700)] h-32 sm:h-40">
                <div className="absolute inset-0 bg-[var(--secondary-500)]/10"></div>
                <div className="absolute -bottom-16 sm:-bottom-20 left-6 sm:left-10">
                  <div className="relative group">
                    <img
                      src={formData.profile_picture || userImage}
                      alt="Profile"
                      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover border-4 sm:border-6 border-[var(--font-light)] shadow-2xl"
                    />
                    {editable && (
                      <button
                        aria-label="Change profile picture"
                        className="absolute bottom-2 right-2 bg-[var(--primary-500)] hover:bg-[var(--primary-700)] p-2.5 rounded-full shadow-lg transform transition-all duration-300 hover:scale-110"
                      >
                        <svg
                          className="w-5 h-5 text-[var(--font-light)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Info & Edit Button */}
              <div className="pt-20 sm:pt-24 px-6 sm:px-10 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-bold text-[var(--font-primary)]">
                      {formData.first_name} {formData.last_name}
                    </h3>
                    <p className="text-sm sm:text-base text-[var(--font-secondary)] break-all">
                      {formData.email}
                    </p>
                    <p className="text-sm text-[var(--font-tertiary)]">
                      @{formData.username}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      editable ? handleSave() : setEditable(true)
                    }
                    disabled={isSaving}
                    className="relative group flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-[var(--font-light)]
                      bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-700)] 
                      hover:from-[var(--primary-600)] hover:to-[var(--primary-800)] 
                      shadow-lg hover:shadow-xl 
                      transform transition-all duration-300 hover:scale-105 
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                      overflow-hidden"
                  >
                    <span className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></span>
                    {isSaving ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 relative z-10"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          ></path>
                        </svg>
                        <span className="relative z-10">Saving...</span>
                      </>
                    ) : editable ? (
                      <>
                        <svg
                          className="w-5 h-5 relative z-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="relative z-10">Save Changes</span>
                      </>
                    ) : (
                      <>
                        <img
                          src={editIcon}
                          alt="Edit"
                          className="w-5 h-5 relative z-10"
                        />
                        <span className="relative z-10">Edit Profile</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Form Fields */}
                <div className="space-y-8">
                  {/* Personal Information */}
                  <div>
                    <h4 className="text-lg font-bold text-[var(--font-primary)] mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[var(--primary-500)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Personal Information
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* First Name */}
                      <div className="relative">
                        <input
                          id="first_name"
                          name="first_name"
                          type="text"
                          value={formData.first_name}
                          onChange={handleChange}
                          readOnly={!editable}
                          placeholder=" "
                          className={`peer w-full px-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] 
                            ${
                              editable
                                ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                                : "border-[var(--neutral-200)]"
                            } 
                            focus:outline-none transition-all duration-300 placeholder-transparent`}
                        />
                        <label
                          htmlFor="first_name"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-secondary)] 
                            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-[var(--font-tertiary)] 
                            peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-[var(--primary-500)]"
                        >
                          First Name
                        </label>
                      </div>

                      {/* Last Name */}
                      <div className="relative">
                        <input
                          id="last_name"
                          name="last_name"
                          type="text"
                          value={formData.last_name}
                          onChange={handleChange}
                          readOnly={!editable}
                          placeholder=" "
                          className={`peer w-full px-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] 
                            ${
                              editable
                                ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                                : "border-[var(--neutral-200)]"
                            } 
                            focus:outline-none transition-all duration-300 placeholder-transparent`}
                        />
                        <label
                          htmlFor="last_name"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-secondary)] 
                            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-[var(--font-tertiary)] 
                            peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-[var(--primary-500)]"
                        >
                          Last Name
                        </label>
                      </div>

                      {/* Phone Number */}
                      <div className="relative">
                        <input
                          id="phone_number"
                          name="phone_number"
                          type="tel"
                          value={formData.phone_number || ""}
                          onChange={handleChange}
                          readOnly={!editable}
                          placeholder=" "
                          className={`peer w-full px-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] 
                            ${
                              editable
                                ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                                : "border-[var(--neutral-200)]"
                            } 
                            focus:outline-none transition-all duration-300 placeholder-transparent`}
                        />
                        <label
                          htmlFor="phone_number"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-secondary)] 
                            transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base peer-placeholder-shown:text-[var(--font-tertiary)] 
                            peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-[var(--primary-500)]"
                        >
                          Phone Number
                        </label>
                      </div>

                      {/* Email - Read Only */}
                      <div className="relative">
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          readOnly
                          placeholder=" "
                          className="peer w-full px-4 py-3 rounded-xl border-2 border-[var(--neutral-200)] bg-[var(--neutral-100)] 
                            focus:outline-none cursor-not-allowed placeholder-transparent"
                        />
                        <label
                          htmlFor="email"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-tertiary)]"
                        >
                          Email (Cannot be changed)
                        </label>
                      </div>

                      {/* Username - Read Only */}
                      <div className="relative">
                        <input
                          id="username"
                          name="username"
                          type="text"
                          value={formData.username}
                          readOnly
                          placeholder=" "
                          className="peer w-full px-4 py-3 rounded-xl border-2 border-[var(--neutral-200)] bg-[var(--neutral-100)] 
                            focus:outline-none cursor-not-allowed placeholder-transparent"
                        />
                        <label
                          htmlFor="username"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-tertiary)]"
                        >
                          Username (Cannot be changed)
                        </label>
                      </div>

                      {/* Date of Birth */}
                      <div className="relative">
                        <input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth || ""}
                          onChange={handleChange}
                          readOnly={!editable}
                          className={`peer w-full px-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] 
                            ${
                              editable
                                ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                                : "border-[var(--neutral-200)]"
                            } 
                            focus:outline-none transition-all duration-300`}
                        />
                        <label
                          htmlFor="date_of_birth"
                          className="absolute left-4 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-secondary)]"
                        >
                          Date of Birth
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="text-lg font-bold text-[var(--font-primary)] mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[var(--primary-500)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6h16M4 12h16M4 18h7"
                        />
                      </svg>
                      About Me
                    </h4>
                    <div className="relative">
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ""}
                        onChange={handleChange}
                        readOnly={!editable}
                        rows={4}
                        placeholder="Tell us about yourself..."
                        className={`w-full px-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] resize-none
                          ${
                            editable
                              ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                              : "border-[var(--neutral-200)]"
                          } 
                          focus:outline-none transition-all duration-300`}
                      />
                    </div>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h4 className="text-lg font-bold text-[var(--font-primary)] mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[var(--primary-500)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Social Profiles
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* LinkedIn */}
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 text-[var(--font-tertiary)]">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        </div>
                        <input
                          id="linkedin"
                          name="social_links.linkedin"
                          type="url"
                          value={formData.social_links.linkedin || ""}
                          onChange={handleChange}
                          readOnly={!editable}
                          placeholder="https://linkedin.com/in/yourprofile"
                          className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] 
                            ${
                              editable
                                ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                                : "border-[var(--neutral-200)]"
                            } 
                            focus:outline-none transition-all duration-300 text-sm`}
                        />
                        <label
                          htmlFor="linkedin"
                          className="absolute left-12 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-secondary)]"
                        >
                          LinkedIn Profile
                        </label>
                      </div>

                      {/* GitHub */}
                      <div className="relative">
                        <div className="absolute left-4 top-3.5 text-[var(--font-tertiary)]">
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </div>
                        <input
                          id="github"
                          name="social_links.github"
                          type="url"
                          value={formData.social_links.github || ""}
                          onChange={handleChange}
                          readOnly={!editable}
                          placeholder="https://github.com/yourusername"
                          className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-[var(--neutral-50)] 
                            ${
                              editable
                                ? "border-[var(--primary-500)] focus:border-[var(--primary-700)] focus:bg-white"
                                : "border-[var(--neutral-200)]"
                            } 
                            focus:outline-none transition-all duration-300 text-sm`}
                        />
                        <label
                          htmlFor="github"
                          className="absolute left-12 -top-2.5 bg-white px-2 text-sm font-medium text-[var(--font-secondary)]"
                        >
                          GitHub Profile
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div>
                    <h4 className="text-lg font-bold text-[var(--font-primary)] mb-4 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-[var(--primary-500)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                      Notification Preferences
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Email Notifications Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[var(--primary-50)] to-[var(--primary-100)] border-2 border-[var(--primary-200)]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg
                              className="w-5 h-5 text-[var(--primary-500)]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--font-primary)]">
                              Email Notifications
                            </p>
                            <p className="text-xs text-[var(--font-tertiary)]">
                              Receive updates via email
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle("emailNotification")}
                          disabled={!editable}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none 
                            ${
                              formData.emailNotification
                                ? "bg-gradient-to-r from-[var(--accent-green)] to-[var(--success-500)]"
                                : "bg-[var(--neutral-300)]"
                            }
                            ${!editable && "opacity-50 cursor-not-allowed"}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 
                              ${
                                formData.emailNotification
                                  ? "translate-x-8"
                                  : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>

                      {/* In-App Notifications Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[var(--secondary-50)] to-[var(--primary-50)] border-2 border-[var(--primary-200)]">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <svg
                              className="w-5 h-5 text-[var(--primary-500)]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-semibold text-[var(--font-primary)]">
                              In-App Notifications
                            </p>
                            <p className="text-xs text-[var(--font-tertiary)]">
                              Show notifications in app
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggle("inAppNotification")}
                          disabled={!editable}
                          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none 
                            ${
                              formData.inAppNotification
                                ? "bg-gradient-to-r from-[var(--accent-green)] to-[var(--success-500)]"
                                : "bg-[var(--neutral-300)]"
                            }
                            ${!editable && "opacity-50 cursor-not-allowed"}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 
                              ${
                                formData.inAppNotification
                                  ? "translate-x-8"
                                  : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-6 border-t-2 border-[var(--neutral-200)]">
                    <button
                      onClick={Logout}
                      className="w-full sm:w-auto group flex items-center justify-center gap-3 px-8 py-3.5 rounded-xl font-semibold
                        bg-gradient-to-r from-[var(--error-500)] to-[var(--error-600)] hover:from-[var(--error-600)] hover:to-[var(--secondary-300)]
                        text-[var(--font-light)] shadow-lg hover:shadow-xl 
                        transform transition-all duration-300 hover:scale-105"
                    >
                      <svg
                        className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Tab Content */}
          {activeTab === "resume" && (
            <div className="w-full min-h-screen" style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%' }}>
              <div style={{ overflowX: 'hidden', maxWidth: '100%', width: '100%' }}>
                <ResumeBuilder />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
