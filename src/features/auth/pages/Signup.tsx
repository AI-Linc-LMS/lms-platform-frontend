import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import GoogleSignupButton from "../../../commonComponents/common-buttons/google-login-button/GoogleSignupButton";
import { signup } from "../../../services/authApis";
import { useToast } from "../../../contexts/ToastContext";

export interface SignupFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  confirm_password: string;
}

interface FieldErrors {
  [key: string]: string;
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [formData, setFormData] = useState<SignupFormData>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

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
        if (digitsOnly.length < 10) {
          return "Phone number must be at least 10 digits";
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof SignupFormData;

    // Limit phone number to 15 digits
    if (fieldName === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 15) {
        return; // Don't update if exceeding 15 digits
      }
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

      // Create API data without confirm_password
      const signupData: SignupFormData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
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
      console.error("Signup error:", error);

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
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Left Section - Background Image */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-[#D7EFF6] to-[#E9F7FC]">
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
            <div className="flex justify-center items-center">
              {/* <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="#000" />
                <path d="M12 13L28 27" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 27L28 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg> */}
              <span className="text-2xl font-bold bg-gradient-to-r from-[#0BC5EA] to-[#6B46C1] bg-clip-text text-transparent">
                AI LINC
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
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#255C79] focus:border-[#255C79] ${getFieldError("first_name") ? "border-red-500" : ""
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
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#255C79] focus:border-[#255C79] ${getFieldError("last_name") ? "border-red-500" : ""
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
                    className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#255C79] focus:border-[#255C79] ${getFieldError("email") ? "border-red-500" : ""
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

              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#255C79] focus:border-[#255C79] ${getFieldError("phone") ? "border-red-500" : ""
                      }`}
                    placeholder="+91 945323XXXX"
                    maxLength={20}
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
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#255C79] focus:border-[#255C79] ${getFieldError("password") ? "border-red-500" : ""
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
                      className={`block w-full h-12 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#255C79] focus:border-[#255C79] ${getFieldError("confirm_password")
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
              <Link to="/login" className="font-medium text-[#255C79]">
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
