import React, { useState } from "react";
import { Course } from "../../../types/final-course.types";
import { useNavigate } from "react-router-dom";
import {
  InstructorSection,
  WhatsIncludedSection,
} from "./EnrolledExpandedCard";
import { formatPrice } from "./utils/courseDataUtils";
import { CompanyLogosSection } from "./components";
import {
  PaymentType,
  RazorpayOptions,
  RazorpayResponse,
  VerifyPaymentRequest,
} from "../../../../../services/payment/razorpayService";

import { UserState } from "../../assessment/types/assessmentTypes";
import { useSelector } from "react-redux";
import {
  createOrder,
  verifyPayment,
} from "../../../../../services/payment/paymentGatewayApis";
import { IconActionsNotEnrolledSection } from "./components/IconNotEnrolledActionSection";

// Enhanced 3D Star Rating Component
const StarRating = ({
  rating,
  maxStars = 5,
  size = "text-sm",
}: {
  rating: number | undefined;
  maxStars?: number;
  size?: string;
}) => {
  const stars = [];
  const fullStars = (rating && Math.floor(rating)) ?? 0;
  const hasHalfStar = (rating && rating % 1 >= 0.5) ?? 0;

  for (let i = 1; i <= maxStars; i++) {
    if (i <= fullStars) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-full`}
        >
          ⭐
        </span>
      );
    } else if (i === fullStars + 1 && hasHalfStar) {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-half`}
        >
          ⭐
        </span>
      );
    } else {
      stars.push(
        <span
          key={i}
          className={`${size} inline-block leading-none select-none star-empty`}
        >
          ☆
        </span>
      );
    }
  }

  return <div className="flex items-center gap-1">{stars}</div>;
};

interface NotEnrolledExpandedCardProps {
  course: Course;
  className?: string;
  onCollapse: () => void;
}

const NotEnrolledExpandedCard: React.FC<NotEnrolledExpandedCardProps> = ({
  course,
  className = "",
  onCollapse,
}) => {
  const navigate = useNavigate();

  const handlePrimaryClick = () => {
    navigate(`/courses/${course.id}`);
  };

  const clientId = Number(import.meta.env.VITE_CLIENT_ID) || 1;

  const formattedPrice = formatPrice(course?.price || "0");
  const isFree = course?.is_free === true || formattedPrice === "0";
  const courseLevel = course?.difficulty_level;
  const courseDuration = course?.duration_in_hours;
  const courseRating = course?.rating || 4.8;

  const user = useSelector((state: { user: UserState }) => state.user);

  const [, setPaymentResult] = useState<{
    paymentId?: string;
    orderId?: string;
    amount: number;
  } | null>(null);

  const loadRazorpayScript = () =>
    new Promise<boolean>((resolve, reject) => {
      try {
        // Check if Razorpay is already loaded
        if (window.Razorpay) {
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () =>
          reject(new Error("Failed to load Razorpay script"));
        document.body.appendChild(script);
      } catch {
        reject(new Error("Failed to initialize Razorpay script"));
      }
    });

  const handlePayment = async () => {
    try {
      // Validate input parameters
      if (!clientId || clientId <= 0) {
        throw new Error("Invalid client ID provided");
      }

      if (!course.price || Number(course.price) <= 0) {
        throw new Error("Invalid course price provided");
      }

      const res = await loadRazorpayScript();
      if (!res) {
        throw new Error(
          "Razorpay SDK failed to load. Please check your internet connection."
        );
      }

      // 1. Create order from backend - IMPORTANT: Specify COURSE payment type
      const orderData = await createOrder(
        clientId,
        Number(course.price),
        PaymentType.COURSE, // Explicitly specify this is a COURSE payment
        {
          type_id: course.id.toString(), // Pass course ID for reference
        }
      );

      if (!orderData || !orderData.order_id || !orderData.key) {
        throw new Error(
          "Failed to create payment order. Invalid response from server."
        );
      }

      // 2. Launch Razorpay
      const options: RazorpayOptions = {
        key: orderData.key,
        amount: Number(course.price),
        currency: orderData.currency || "INR",
        name: "AI-LINC Platform",
        description: "Course Access Payment",
        order_id: orderData.order_id,
        handler: async function (response: RazorpayResponse) {
          try {
            // Validate Razorpay response
            if (
              !response.razorpay_order_id ||
              !response.razorpay_payment_id ||
              !response.razorpay_signature
            ) {
              throw new Error(
                "Invalid payment response received from Razorpay"
              );
            }

            const paymentResult: VerifyPaymentRequest = {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };

            // 3. Verify signature
            const verifyRes = await verifyPayment(clientId, paymentResult);

            // Check if verification was successful based on the response message
            if (verifyRes.status === 200) {
              // Set payment result for success modal
              setPaymentResult({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: Number(course.price),
              });

              // Wait a moment to show completion, then show success modal
              setTimeout(() => {
                try {
                  navigate(`/courses/${course?.id}`);
                } catch (error) {
                  //console.error("Error showing success modal:", error);
                }
              }, 900);
            }
          } catch (error) {
            //console.error("Payment verification error:", error);
          }
        },
        modal: {
          ondismiss: function () {
            try {
              navigate(`/courses`);
            } catch (error) {}
          },
        },
        prefill: {
          name: user.full_name || "User",
          email: user.email || "",
        },
        theme: {
          color: "var(--primary-500)",
        },
      };

      // Type assertion to handle Razorpay on window object
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      //console.error("Payment error:", error);
    }
  };

  return (
    <div
      className={`course-card w-full max-w-lg bg-white rounded-2xl border border-blue-100 shadow-xl transition-all duration-300 ease-in-out relative overflow-visible ${className}`}
    >
      {/* Card Header */}
      <div className="p-4 sm:p-6 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-700 leading-tight pr-4 flex-1">
            {course.title}
          </h1>

          <button
            className="bg-gray-100 border border-gray-200 rounded-full w-9 h-9 flex items-center justify-center cursor-pointer transition-all duration-300 text-gray-500 hover:bg-gray-200 hover:scale-105 flex-shrink-0"
            onClick={onCollapse}
          >
            <svg
              className="w-3.5 h-3.5 transition-transform duration-300"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Company Logos */}
        <CompanyLogosSection />
      </div>

      {/* Course Info Pills */}
      <div className="p-3 sm:p-4 md:p-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap">
            <svg
              className="w-3 h-3 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {courseLevel}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 border border-gray-200 rounded-full text-xs font-medium text-gray-700 whitespace-nowrap">
            <svg
              className="w-3 h-3 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {courseDuration}
          </span>
          <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-50 border border-yellow-200 rounded-full text-xs font-medium text-yellow-800 whitespace-nowrap">
            {`Enroll Now - ${isFree ? "Free" : `₹${formattedPrice}`}`}
          </span>

          {/* Rating */}
          <div className="flex items-center gap-2 ml-auto">
            <StarRating rating={courseRating} size="text-xs" />
            <span className="text-xs font-semibold text-gray-700">
              {courseRating}/5
            </span>
          </div>
        </div>

        <div className="flex items-center ">
          {/* Primary Action Button */}
          <button
            onClick={isFree ? handlePrimaryClick : handlePayment}
            className={`px-5 py-3 border-none rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 text-center bg-[#10b981] text-[var(--font-light)] hover:bg-[#059669] hover:-translate-y-0.5 ${"w-full"} ${className}`}
          >
            {`Enroll Now - ${isFree ? "Free" : `₹${formattedPrice}`}`}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {/* Course Description */}
        <div className="mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {course.description ||
              "Comprehensive course designed to enhance your skills and boost your career prospects with hands-on projects and industry-recognized certification."}
          </p>
        </div>

        {/* Course Outcomes */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            What you'll learn:
          </h3>
          <ul className="space-y-2">
            {[
              "Learn to build dashboards recruiters love to see in resumes",
              "Master the most in-demand BI tool in just 20 hours",
              "Used by 90% of Fortune 500 companies",
              "Boost your analytics career with real-world skills",
            ].map((outcome, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm text-gray-600"
              >
                <span className="text-green-600 font-bold text-xs mt-0.5 flex-shrink-0">
                  ✓
                </span>
                <span className="leading-relaxed">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["Career Boost", "Hands-On Projects", "Industry Certificate"].map(
            (badge, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-[var(--font-light)] rounded-full text-xs font-semibold whitespace-nowrap"
              >
                {badge}
              </div>
            )
          )}
        </div>

        {/* Rating Section */}
        <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <StarRating rating={courseRating} size="text-sm" />
          <span className="text-sm font-semibold text-gray-700">
            {courseRating}/5 rating from{" "}
            {course.enrolled_students?.total || 500}+ learners
          </span>
        </div>

        {/* Student Profiles & Success Stories */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center">
            {["DE", "TC", "AC"].map((initials, index) => (
              <div
                key={index}
                className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-[var(--font-light)] ${
                  index === 0
                    ? "bg-blue-500 ml-0"
                    : index === 1
                    ? "bg-cyan-500 -ml-2"
                    : "bg-purple-500 -ml-2"
                } relative z-${index + 1}`}
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            Join {course.enrolled_students?.total || 500}+ learners who landed
            jobs at
            <br />
            Deloitte, TCS & Accenture with these skills
          </p>
        </div>

        {/* Instructor Section */}
        <div className="mb-4">
          <InstructorSection course={course} />
        </div>

        {/* What's Included */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-3">
            🎁 What's Included:
          </h4>
          <ul className="space-y-2">
            {[
              "Real datasets & project templates",
              "Free resume template for Data Analyst roles",
              "Lifetime access to course materials",
              "Certificate of completion",
            ].map((item, index) => (
              <li
                key={index}
                className="flex items-center gap-3 text-xs text-blue-800"
              >
                <span className="text-xs text-blue-600">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* What's Included from props */}
        <WhatsIncludedSection course={course} />

        {/* Action Buttons */}
        <IconActionsNotEnrolledSection />
      </div>
    </div>
  );
};

export default NotEnrolledExpandedCard;

// Enhanced FeaturesSection
export const FeaturesSection: React.FC<{ course: Course }> = ({ course }) => {
  return (
    <div>
      {course.features && course.features.length > 0 && (
        <div className="mb-4 bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-gray-800 font-semibold text-sm">
              Key Features
            </h3>
          </div>
          <div className="space-y-2 text-sm">
            {course.features.slice(0, 4).map((feature, index) => (
              <div className="flex items-start gap-2" key={index}>
                <svg
                  className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"
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
                <span className="text-gray-600 leading-relaxed">{feature}</span>
              </div>
            ))}
            {course.features.length > 4 && (
              <div className="text-xs text-gray-500 mt-2 pl-6">
                +{course.features.length - 4} more features
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
