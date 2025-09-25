import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { RootState, useAppSelector } from "../../../redux/store";
import GoogleLoginButton from "../../../commonComponents/common-buttons/google-login-button/GoogleLoginButton";
import logimg from "../../../assets/login-placeholder/login-picture.png";
import { useSelector } from "react-redux";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading } = useAuth();
  const { error } = useAppSelector((state) => state.auth);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };
  const clientInfo = useSelector((state: RootState) => state.clientInfo);

  return (
    <div className="flex flex-col min-h-screen bg-[var(--neutral-50)] relative">
      <div className="flex flex-1">
        {/* Background Image for Mobile */}
        <div className="absolute inset-0 md:hidden">
          {!clientInfo?.data?.login_img_url ? (
            <>
              <img
                src={logimg}
                alt="Office workspace"
                className="w-full h-full object-cover opacity-50"
              />
            </>
          ) : (
            <>
              {" "}
              <img
                src={logimg}
                alt="Office workspace"
                className="w-full h-full object-cover opacity-50"
              />
            </>
          )}
        </div>

        {/* Left Section - Background Image (desktop only) */}
        <div className="hidden md:block md:w-1/2 h-screen bg-gradient-to-r from-[var(--primary-50)] to-[#E9F7FC]">
          <img
            src={clientInfo?.data?.login_img_url ?? logimg}
            alt="Office workspace"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Section - Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="w-full max-w-md space-y-8 bg-white md:bg-transparent p-6 rounded-3xl shadow-sm md:shadow-none">
            <div className="text-center">
              <div className={"flex flex-col justify-center items-center"}>
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
              <h2 className="mt-6 text-3xl font-bold text-gray-900">
                Login to your account
              </h2>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
                      placeholder="example@email.com"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-[var(--primary-500)]"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="mt-1 relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)]"
                      placeholder="Enter Your Password"
                      disabled={isLoading}
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
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-14 rounded-lg text-[var(--font-light)] py-4 px-6 bg-[var(--primary-500)] text-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:bg-[var(--primary-600)] hover:scale-95`}
                >
                  {isLoading ? "Logging in..." : "Login now"}
                </button>
              </div>
            </form>

            {/* Google login button moved outside the form */}
            <div className="mt-6">
              <GoogleLoginButton />
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <Link
                to="/signup"
                className="font-medium text-[var(--primary-500)]"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Hidden on mobile, visible on desktop */}
      {/*  */}
      {clientInfo?.data?.show_footer ? (
        <footer className="hidden md:block w-full bg-gray-900 text-[var(--font-light)] py-6 relative z-10 border-t border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Company Info */}
              <div className="text-center md:text-left">
                <div className="flex justify-center md:justify-start items-center mb-3">
                  <span className="text-xl font-bold bg-gradient-to-r from-[#0BC5EA] to-[#6B46C1] bg-clip-text text-transparent">
                    AI LINC
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Empowering education through innovative AI-powered learning
                  solutions.
                </p>
              </div>

              {/* Quick Links */}
              <div className="text-center">
                <h3 className="font-semibold text-[var(--font-light)] mb-3 text-sm">
                  Quick Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://ailinc.com/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200 text-sm"
                  >
                    About Us
                  </a>
                  <a
                    href="https://ailinc.com/support"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200 text-sm"
                  >
                    Support
                  </a>
                </div>
              </div>

              {/* Contact Info */}
              <div className="text-center md:text-right">
                <h3 className="font-semibold text-[var(--font-light)] mb-3 text-sm">
                  Get in Touch
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <p>communications@ailinc.com</p>
                  <p>9693941136</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="text-sm text-gray-400">
                  © 2025 {clientInfo.data?.name}. All rights reserved.
                </div>
                <div className="flex flex-wrap justify-center md:justify-end gap-4 text-sm">
                  <a
                    href="https://ailinc.com/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200"
                  >
                    Terms
                  </a>
                  <a
                    href="https://ailinc.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200"
                  >
                    Privacy
                  </a>
                  <a
                    href="https://ailinc.com/refund"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200"
                  >
                    Refunds
                  </a>
                  <a
                    href="https://ailinc.com/shipping"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200"
                  >
                    Shipping
                  </a>
                  <a
                    href="https://ailinc.com/contact-us"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-[var(--font-light)] transition-colors duration-200"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </footer>
      ) : null}
    </div>
  );
};

export default Login;
