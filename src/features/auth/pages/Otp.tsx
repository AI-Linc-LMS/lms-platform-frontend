import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { resendOtp, verifyOtp } from "../../../services/authApis";

function Otp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error, warning } = useToast();
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Get email from URL parameters or localStorage
  const emailFromUrl = searchParams.get("email") || "";
  const emailFromStorage = localStorage.getItem("signupEmail") || "";
  const email = emailFromUrl || emailFromStorage;

  // Auto-focus on first input field
  useEffect(() => {
    inputRefs.current[0]?.focus();
    const handleGlobalPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text").trim();
      if (/^\d{6}$/.test(pastedData)) {
        // Validate 6-digit OTP
        setOtp(pastedData.split(""));

        // Move focus to last box
        inputRefs.current[5]?.focus();
      }
    };

    document.addEventListener(
      "paste",
      handleGlobalPaste as unknown as EventListener
    );
    return () =>
      document.removeEventListener(
        "paste",
        handleGlobalPaste as unknown as EventListener
      );
  }, []);

  // Simple timer countdown effect
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);

        if (newTimeLeft === 0) {
          setIsResendDisabled(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value !== "" && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && !otp.includes("")) {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join("");
    if (!/^\d{6}$/.test(enteredOtp)) {
      warning("Invalid OTP", "Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      //console.log("enteredOtp", enteredOtp);

      // Call the actual OTP verification API
      const clientId = import.meta.env.VITE_CLIENT_ID;
      await verifyOtp(enteredOtp, clientId, email);

      success("OTP Verified", "Your account has been successfully verified!");
      navigate("/login");

      // Clean up localStorage
      localStorage.removeItem("signupEmail");

      // Navigate to next page after successful verification
      // navigate("/dashboard");
    } catch (err) {
      //console.error("OTP verification error:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to verify OTP. Please try again.";
      error("Verification Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      error("Error", "Email address not found. Please go back to signup.");
      return;
    }

    setResendLoading(true);
    try {
      // Reset timer and disable resend
      setTimeLeft(120);
      setIsResendDisabled(true);

      // Call the resend OTP API
      const clientId = import.meta.env.VITE_CLIENT_ID;
      await resendOtp(email, clientId);

      success(
        "OTP Sent",
        `A new OTP has been sent to ${email}. Please check your email.`
      );
    } catch (err: unknown) {
      //console.error("Resend OTP error:", err);

      // Reset timer on error
      setTimeLeft(0);
      setIsResendDisabled(false);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to resend OTP. Please try again.";
      error("Resend Failed", errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-primary flex flex-col lg:flex-row justify-center page-transition">
      {/* Image Section */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-[var(--primary-50)] to-[#E9F7FC]">
        <img
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1170"
          alt="Office workspace"
          className="h-full w-full object-cover opacity-70"
        />
      </div>

      {/* OTP Section */}
      <main className="flex flex-col items-center w-full lg:w-1/2 px-6 sm:px-10 md:px-16 lg:px-15">
        <h1 className="mt-45 text-lg sm:text-xl font-semibold text-green-600 flex items-center gap-2 mb-4">
          ✅ Thank you for choosing us!
        </h1>

        {!email ? (
          <div className="text-center">
            <p className="text-red-600 mb-4">
              Email address not found. Please complete the signup process.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-xl hover:bg-[var(--primary-600)] transition-all duration-200"
            >
              Go to Signup
            </button>
          </div>
        ) : (
          <>
            <p className="text-secondary text-center mb-4">
              We have sent an OTP to{" "}
              <span className="font-semibold text-[var(--primary-500)]">
                {email}
              </span>
              . Please enter the code below to verify your account.
            </p>

            <h1 className="text-2xl font-semibold mb-4">Enter OTP</h1>

            <div className="flex space-x-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  value={digit}
                  onChange={(e) => handleChange(index, e)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  maxLength={1}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  className="border border-gray-300 rounded-lg p-2 text-center text-xl w-10 h-12 focus:outline-none focus:ring-1 focus:from-gray-800 focus:to-gray-600"
                />
              ))}
            </div>

            <div className="flex justify-between w-full max-w-sm">
              {/* Back Button - Custom styling */}
              <button
                onClick={() => navigate("/signup")}
                className="w-auto h-10 px-6 text-sm rounded-xl text-[var(--neutral-500)] bg-[var(--neutral-100)] font-medium transition-all duration-200 hover:bg-[var(--neutral-200)] hover:scale-95"
              >
                Back
              </button>

              {/* Verify Button - Custom styling */}
              <button
                onClick={handleVerify}
                disabled={otp.some((digit) => digit === "") || loading}
                className="w-auto h-10 px-6 text-sm rounded-xl text-[var(--font-light)] bg-[var(--primary-500)] font-medium transition-all duration-200 hover:bg-[var(--primary-600)] hover:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>

            {/* Resend OTP Section */}
            <p className="mt-4 text-gray-600">
              Didn't receive the OTP?{" "}
              <button
                onClick={handleResendOtp}
                disabled={isResendDisabled || resendLoading}
                className={`font-medium ${
                  isResendDisabled || resendLoading
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-[var(--font-dark)] hover:underline"
                }`}
              >
                {resendLoading ? "Sending..." : "Resend OTP"}
              </button>
              {isResendDisabled && (
                <span className="text-gray-500 ml-2">
                  ({Math.floor(timeLeft / 60)}:
                  {(timeLeft % 60).toString().padStart(2, "0")})
                </span>
              )}
            </p>
          </>
        )}
      </main>
    </div>
  );
}

export default Otp;
