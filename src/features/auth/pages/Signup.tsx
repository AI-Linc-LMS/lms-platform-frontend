import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import GoogleSignupButton from "../../../commonComponents/common-buttons/google-login-button/GoogleSignupButton";
import { signup } from "../../../services/authApis";
import { useToast } from "../../../contexts/ToastContext";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux/store.ts";

export interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country_code: string;
  password: string;
  confirm_password: string;
}

interface FieldErrors {
  [key: string]: string;
}

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

// Expanded countries list
const countries: Country[] = [
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "CN", name: "China", dialCode: "+86", flag: "🇨🇳" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "AE", name: "UAE", dialCode: "+971", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾" },
  { code: "TH", name: "Thailand", dialCode: "+66", flag: "🇹🇭" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩" },
  { code: "VN", name: "Vietnam", dialCode: "+84", flag: "🇻🇳" },
  { code: "KR", name: "South Korea", dialCode: "+82", flag: "🇰🇷" },
  { code: "HK", name: "Hong Kong", dialCode: "+852", flag: "🇭🇰" },
  { code: "TW", name: "Taiwan", dialCode: "+886", flag: "🇹🇼" },
  { code: "SA", name: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦" },
  { code: "EG", name: "Egypt", dialCode: "+20", flag: "🇪🇬" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪" },
  { code: "GH", name: "Ghana", dialCode: "+233", flag: "🇬🇭" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴" },
  { code: "PE", name: "Peru", dialCode: "+51", flag: "🇵🇪" },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪" },
  { code: "RU", name: "Russia", dialCode: "+7", flag: "🇷🇺" },
  { code: "TR", name: "Turkey", dialCode: "+90", flag: "🇹🇷" },
  { code: "IT", name: "Italy", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Spain", dialCode: "+34", flag: "🇪🇸" },
  { code: "NL", name: "Netherlands", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgium", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Switzerland", dialCode: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Austria", dialCode: "+43", flag: "🇦🇹" },
  { code: "SE", name: "Sweden", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norway", dialCode: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Denmark", dialCode: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Finland", dialCode: "+358", flag: "🇫🇮" },
  { code: "PL", name: "Poland", dialCode: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", dialCode: "+420", flag: "🇨🇿" },
  { code: "HU", name: "Hungary", dialCode: "+36", flag: "🇭🇺" },
  { code: "GR", name: "Greece", dialCode: "+30", flag: "🇬🇷" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪" },
  { code: "IL", name: "Israel", dialCode: "+972", flag: "🇮🇱" },
  { code: "BD", name: "Bangladesh", dialCode: "+880", flag: "🇧🇩" },
  { code: "PK", name: "Pakistan", dialCode: "+92", flag: "🇵🇰" },
  { code: "LK", name: "Sri Lanka", dialCode: "+94", flag: "🇱🇰" },
  { code: "NP", name: "Nepal", dialCode: "+977", flag: "🇳🇵" },
];

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [formData, setFormData] = useState<SignupFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country_code: "+91", // Default to India
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to India
  const [countrySearch, setCountrySearch] = useState("");

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  // Filter countries based on search term
  const filteredCountries = countries.filter(
    (country) =>
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch) ||
      country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCountryDropdown(false);
        setCountrySearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (showCountryDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showCountryDropdown]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8 || password.length > 16) {
      errors.push("Password must be between 8 and 16 characters");
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one capital letter");
    }

    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one small letter");
    }

    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return errors;
  };

  const validateField = (name: keyof SignupFormData, value: string) => {
    switch (name) {
      case "first_name": {
        if (!value.trim()) {
          return "First name is required";
        }
        if (value.trim().length < 2) {
          return "First name must be at least 2 characters";
        }
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          return "First name can only contain letters and spaces";
        }
        break;
      }

      case "last_name": {
        if (!value.trim()) {
          return "Last name is required";
        }
        if (value.trim().length < 2) {
          return "Last name must be at least 2 characters";
        }
        if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          return "Last name can only contain letters and spaces";
        }
        break;
      }

      case "email": {
        if (!value.trim()) {
          return "Email is required";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return "Please enter a valid email address";
        }
        break;
      }

      case "phone": {
        if (!value.trim()) {
          return "Phone number is required";
        }
        // Remove all non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, "");
        if (digitsOnly.length < 7) {
          return "Phone number must be at least 7 digits";
        }
        if (digitsOnly.length > 15) {
          return "Phone number cannot exceed 15 digits";
        }
        break;
      }

      case "password": {
        if (!value) {
          return "Password is required";
        }
        const passwordValidationErrors = validatePassword(value);
        if (passwordValidationErrors.length > 0) {
          return passwordValidationErrors[0]; // Return first error
        }
        break;
      }

      case "confirm_password": {
        if (!value) {
          return "Please confirm your password";
        }
        if (value !== formData.password) {
          return "Passwords do not match";
        }
        break;
      }
    }
    return "";
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setFormData((prev) => ({
      ...prev,
      country_code: country.dialCode,
    }));
    setShowCountryDropdown(false);
    setCountrySearch("");
  };

  const handleCountryDropdownToggle = () => {
    setShowCountryDropdown(!showCountryDropdown);
    setCountrySearch("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SignupFormData;

    // Handle phone number input - only allow digits and limit to 15
    if (fieldName === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 15) {
        return; // Don't update if exceeding 15 digits
      }
      setFormData((prev) => ({
        ...prev,
        phone: digitsOnly,
      }));

      // Clear field error when user starts typing
      if (fieldErrors.phone) {
        setFieldErrors((prev) => ({
          ...prev,
          phone: "",
        }));
      }
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // Clear field error when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: "",
      }));
    }

    // Validate password when password field changes
    if (fieldName === "password") {
      const errors = validatePassword(value);
      setPasswordErrors(errors);
    }

    // Validate confirm password when it changes
    if (fieldName === "confirm_password") {
      if (value && value !== formData.password) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: "Passwords do not match",
        }));
      } else if (value && value === formData.password) {
        setFieldErrors((prev) => ({
          ...prev,
          [fieldName]: "",
        }));
      }
    }
  };

  const validateForm = () => {
    const errors: FieldErrors = {};

    Object.keys(formData).forEach((key) => {
      if (key === "country_code") return; // Skip country_code validation
      const fieldError = validateField(
        key as keyof SignupFormData,
        formData[key as keyof typeof formData]
      );
      if (fieldError) {
        errors[key] = fieldError;
      }
    });

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateForm()) {
      return; // Don't proceed if validation fails
    }

    // Check if passwords match
    if (formData.password !== formData.confirm_password) {
      setFieldErrors((prev) => ({
        ...prev,
        confirm_password: "Passwords do not match",
      }));
      return;
    }

    // Check if password meets all requirements
    if (passwordErrors.length > 0) {
      return; // Don't proceed if password requirements not met
    }

    setIsLoading(true);

    try {
      const clientId = import.meta.env.VITE_CLIENT_ID;

      // Create API data with full phone number including country code
      const signupData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: `${formData.country_code}${formData.phone}`, // Combine country code and phone
        country_code: formData.country_code, // Include country_code
        password: formData.password,
        confirm_password: formData.confirm_password,
      };

      await signup(signupData, clientId);

      showSuccessToast(
        "Account Created",
        "Your account has been created successfully!"
      );

      // Store email in localStorage for OTP page
      localStorage.setItem("signupEmail", formData.email);

      navigate(`/otp?email=${encodeURIComponent(formData.email)}`);
    } catch (error) {
      //console.error("Signup error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again.";
      showErrorToast("Signup Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (fieldName: keyof SignupFormData) => {
    return fieldErrors[fieldName] || "";
  };

  return (
    <div className="flex min-h-screen bg-[var(--neutral-50)]">
      {/* Left Section - Background Image */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-[var(--primary-50)] to-[#E9F7FC]">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1170"
          alt="Office workspace"
          className="h-full w-full object-cover opacity-70"
        />
      </div>

      {/* Right Section - Signup Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-4 lg:px-6">
        <div className="w-full max-w-lg space-y-4">
          <div className="text-center">
            <div className="flex flex-col justify-center items-center">
              {clientInfo.data?.app_logo_url && (
                <img
                  src={clientInfo.data?.app_logo_url}
                  alt={`${clientInfo.data?.name}`}
                  className="h-10 mx-auto"
                />
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-[#0BC5EA] to-[#6B46C1] bg-clip-text text-transparent">
                {clientInfo.data?.name}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Create an account
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="first_name"
                    className="block text-xs font-medium text-gray-700"
                  >
                    First Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={formData.first_name}
                      onChange={handleChange}
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                        getFieldError("first_name") ? "border-red-500" : ""
                      }`}
                      placeholder="John"
                    />
                  </div>
                  {getFieldError("first_name") && (
                    <p className="mt-1 text-xs text-red-600">
                      {getFieldError("first_name")}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="last_name"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Last Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={formData.last_name}
                      onChange={handleChange}
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                        getFieldError("last_name") ? "border-red-500" : ""
                      }`}
                      placeholder="Doe"
                    />
                  </div>
                  {getFieldError("last_name") && (
                    <p className="mt-1 text-xs text-red-600">
                      {getFieldError("last_name")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-medium text-gray-700"
                >
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                      getFieldError("email") ? "border-red-500" : ""
                    }`}
                    placeholder="example@email.com"
                  />
                </div>
                {getFieldError("email") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("email")}
                  </p>
                )}
              </div>

              {/* Phone Number with Searchable Country Flag */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <div className="mt-1 flex">
                  {/* Country Selector with Search */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={handleCountryDropdownToggle}
                      className={`h-12 px-3 border border-r-0 rounded-l-xl bg-white flex items-center gap-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                        getFieldError("phone")
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <span className="text-sm font-medium">
                        {selectedCountry.dialCode}
                      </span>
                      <svg
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          showCountryDropdown ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Searchable Country Dropdown */}
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
                        {/* Search Input */}
                        <div className="p-3 border-b border-gray-200">
                          <div className="relative">
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search countries..."
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
                            />
                            <svg
                              className="absolute right-3 top-2.5 w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>

                        {/* Countries List */}
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => handleCountrySelect(country)}
                                className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
                                  selectedCountry.code === country.code
                                    ? "bg-blue-50"
                                    : ""
                                }`}
                              >
                                <span className="text-lg">{country.flag}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {country.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {country.dialCode}
                                  </div>
                                </div>
                                {selectedCountry.code === country.code && (
                                  <svg
                                    className="w-4 h-4 text-[var(--primary-500)]"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-sm text-gray-500">
                              No countries found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Phone Input */}
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block flex-1 h-12 px-4 py-3 border border-l-0 rounded-r-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                      getFieldError("phone")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="9453234567"
                    maxLength={15}
                  />
                </div>
                {getFieldError("phone") && (
                  <p className="mt-1 text-xs text-red-600">
                    {getFieldError("phone")}
                  </p>
                )}
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                        getFieldError("password") ? "border-red-500" : ""
                      }`}
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5 text-gray-400"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Password validation errors */}
                  {passwordErrors.length > 0 && formData.password && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-red-50 border border-red-200 rounded-lg shadow-lg z-50 p-2">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg
                            className="h-4 w-4 text-red-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="ml-2">
                          <h3 className="text-xs font-medium text-red-800">
                            Password requirements:
                          </h3>
                          <div className="mt-1 text-xs text-red-700">
                            <ul className="list-disc pl-4 space-y-0.5">
                              {passwordErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {getFieldError("password") && (
                    <p className="mt-1 text-xs text-red-600">
                      {getFieldError("password")}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label
                    htmlFor="confirm_password"
                    className="block text-xs font-medium text-gray-700"
                  >
                    Confirm Password
                  </label>
                  <div className="mt-1">
                    <input
                      id="confirm_password"
                      name="confirm_password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={formData.confirm_password}
                      onChange={handleChange}
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] ${
                        getFieldError("confirm_password")
                          ? "border-red-500"
                          : ""
                      }`}
                      placeholder="Confirm your password"
                    />
                  </div>
                  {getFieldError("confirm_password") && (
                    <p className="mt-1 text-xs text-red-600">
                      {getFieldError("confirm_password")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <PrimaryButton onClick={handleSignup} disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </PrimaryButton>
            </div>

            {/* Google login button moved outside the form */}
            <div className="mt-6">
              <GoogleSignupButton />
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <Link
                to="/login"
                className="font-medium text-[var(--primary-500)]"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
