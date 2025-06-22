import { useDispatch, useSelector } from "react-redux";
import userImage from "../commonComponents/icons/nav/User Image.png";
import editIcon from "../commonComponents/icons/nav/editIcon.png";
import { logout } from "../redux/slices/userSlice";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { handleMobileNavigation } from "../utils/authRedirectUtils";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  dob: string;
  gender: string;
  profile_picture: string;
  emailNotification: boolean;
  inAppNotification: boolean;
}

const ProfileSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const userData = useSelector((state: { user: UserData }) => state.user);
  const [editable, setEditable] = useState(false);
  const [formData, setFormData] = useState<UserData>(userData);
  console.log("userData", userData);
  console.log(formData);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const val =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleToggle = (key: keyof UserData) => {
    setFormData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true); // Show loader
    setEditable(false);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Saved Form Data:", formData);
    setIsSaving(false); // Hide loader
    setEditable(false); // Exit edit mode
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
    } catch (error) {
      console.error("Error during logout:", error);
      handleMobileNavigation("/login", navigate, true);
    }
  };

  return (
    <div className="p-6 rounded-lg w-full max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 px-2">Profile Settings</h2>

      <div className="border-1 border-gray-300 shadow-sm rounded-lg p-6 space-y-6 min-h-screen">
        <div className="text-xl font-bold text-[#257195]">My Profile</div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img
              src={formData.profile_picture ?? userImage}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
            <div>
              <div className="text-lg font-semibold">{formData.full_name}</div>
              <div className="text-sm text-gray-500">{formData.email}</div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => (editable ? handleSave() : setEditable(true))}
              className="bg-[#255C79] text-white px-5 py-2 rounded-lg flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
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
                  <img src={editIcon} alt="Edit" className="w-4 h-4" />
                  <span>Edit</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              readOnly={!editable}
              className={`mt-1 w-full border rounded px-3 py-2 ${
                editable ? "border-[#255C79]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              readOnly={!editable}
              className={`mt-1 w-full border rounded px-3 py-2 ${
                editable ? "border-[#255C79]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              name="phone"
              type="text"
              value={formData.phone_number ?? "9999XXXXXX"}
              onChange={handleChange}
              readOnly={!editable}
              className={`mt-1 w-full border rounded px-3 py-2 ${
                editable ? "border-[#255C79]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date of Birth
            </label>
            <input
              name="dob"
              type="text"
              value={formData.dob ?? "25/05/20XX"}
              onChange={handleChange}
              readOnly={!editable}
              className={`mt-1 w-full border rounded px-3 py-2 ${
                editable ? "border-[#255C79]" : "border-gray-300"
              } focus:outline-none`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Gender
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              disabled={!editable}
              className={`mt-1 w-full border rounded px-3 py-2 ${
                editable ? "border-[#255C79]" : "border-gray-300"
              } focus:outline-none`}
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <hr className="my-4" />

        <div>
          <h3 className="text-lg font-bold text-[#257195] mb-4">
            Notification Setting
          </h3>
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <span>Email Notifications</span>
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

            <div className="flex items-center gap-2">
              <span>In-App Notification</span>
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

        <div className="flex">
          <button
            onClick={() => Logout()}
            className="bg-[#255C79] text-white px-5 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
