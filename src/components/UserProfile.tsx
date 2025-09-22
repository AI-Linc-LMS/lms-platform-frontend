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

const ProfileSettings = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { error: showErrorToast, success: showSuccessToast } = useToast();
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

  // Update mutation
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
      //console.error("Failed to update user:", error);
      setIsSaving(false);
      showErrorToast(
        "Update Failed",
        "Failed to update profile. Please try again."
      );
    },
  });

  // Update formData when user data is loaded
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

    // Handle nested social_links fields
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

    // Prepare data for update (exclude non-editable fields)
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
    setEditable(false);
  };

  const Logout = async () => {
    try {
      // Clear user data from localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Dispatch logout action
      dispatch(logout());

      // Create a hidden iframe to clear Google session
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = "https://accounts.google.com/logout";
      document.body.appendChild(iframe);

      // Wait for iframe to load and then clean up
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
      //console.error("Error during logout:", error);
      showErrorToast(
        "Logout Error",
        "Failed to logout properly. Please try again."
      );
      handleMobileNavigation("/login", navigate, true, false); // Don't force reload for logout
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 rounded-lg w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-b-2 border-[var(--default-primary)]"></div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 sm:p-6 rounded-lg w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-500 text-center px-4">
            Error loading user data. Please try again.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 rounded-lg w-full max-w-7xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 px-2">
        Profile Settings
      </h2>

      <div className="border-1 border-gray-300 shadow-sm rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6 min-h-screen">
        <div className="text-lg sm:text-xl font-bold text-[#257195]">
          My Profile
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={formData.profile_picture || userImage}
              alt="Profile"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
            />
            <div className="text-center sm:text-left">
              <div className="text-base sm:text-lg font-semibold">
                {formData.first_name} {formData.last_name}
              </div>
              <div className="text-sm text-gray-500 break-all">
                {formData.email}
              </div>
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button
              onClick={() => (editable ? handleSave() : setEditable(true))}
              className="bg-[var(--default-primary)] text-white px-4 sm:px-5 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
              disabled={isSaving}
            >
              {isSaving ? (
                <svg
                  className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
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
              ) : editable ? (
                "Save"
              ) : (
                <>
                  <img
                    src={editIcon}
                    alt="Edit"
                    className="w-3 h-3 sm:w-4 sm:h-4"
                  />
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              readOnly={!editable}
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              readOnly={!editable}
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              readOnly={true}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base focus:outline-none bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              name="username"
              type="text"
              value={formData.username}
              readOnly={true}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm sm:text-base focus:outline-none bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Username cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              name="phone_number"
              type="text"
              value={formData.phone_number || ""}
              onChange={handleChange}
              readOnly={!editable}
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth || ""}
              onChange={handleChange}
              readOnly={!editable}
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              name="bio"
              value={formData.bio || ""}
              onChange={handleChange}
              readOnly={!editable}
              rows={3}
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base resize-none ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Profile
            </label>
            <input
              name="social_links.linkedin"
              type="url"
              value={formData.social_links.linkedin || ""}
              onChange={handleChange}
              readOnly={!editable}
              placeholder="https://linkedin.com/in/yourprofile"
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Profile
            </label>
            <input
              name="social_links.github"
              type="url"
              value={formData.social_links.github || ""}
              onChange={handleChange}
              readOnly={!editable}
              placeholder="https://github.com/yourusername"
              className={`w-full border rounded px-3 py-2 text-sm sm:text-base ${
                editable ? "border-[var(--default-primary)]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>
        </div>

        <hr className="my-4" />

        <div>
          <h3 className="text-base sm:text-lg font-bold text-[#257195] mb-4">
            Notification Settings
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-sm sm:text-base">Email Notifications</span>
              <button
                type="button"
                onClick={() => handleToggle("emailNotification")}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                  formData.emailNotification ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    formData.emailNotification ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="text-sm sm:text-base">In-App Notifications</span>
              <button
                type="button"
                onClick={() => handleToggle("inAppNotification")}
                className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors duration-300 ${
                  formData.inAppNotification ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    formData.inAppNotification ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center sm:justify-start">
          <button
            onClick={() => Logout()}
            className="bg-[var(--default-primary)] text-white px-6 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
