import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import {
  useFlagshipPayment,
  useNanodegreePayment,
  useCoursePayment,
} from "../../../../../hooks/useRazorpayPayment";
import { PaymentResult } from "../../../../../services/payment/razorpayService";
import { ScholarshipRedemptionData, UserState } from "../types/assessmentTypes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getRoadmapPaymentStatus } from "../../../../../services/assesment/assesmentApis";
// Import the modal components
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import PaymentProcessingModal from "../PaymentProcessingModal";
import PaymentSuccessModal from "../PaymentSuccessModal";
import PaymentToast from "../PaymentToast";
import ScholarshipBreakupModal from "./ScholarshipBreakupModal";

const PaymentCardSection: React.FC<{
  redeemData: ScholarshipRedemptionData;
  clientId: number;
  assessmentId: string;
}> = ({ redeemData, clientId, assessmentId }) => {
  const queryClient = useQueryClient();

  // Modal states
  const [showNanodegreeModal, setShowNanodegreeModal] = useState(false);
  const [showNanoDegreeCourseModal, setShowNanoDegreeCourseModal] =
    useState(false);
  const [showFlagshipModal, setShowFlagshipModal] = useState(false);
  const [showFlagshipCourseModal, setShowFlagshipCourseModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showScholarshipBreakupModal, setShowScholarshipBreakupModal] =
    useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    paymentId?: string;
    orderId?: string;
    amount: number;
    type: "nanodegree" | "nanodegree-course" | "flagship" | "flagship-course";
  } | null>(null);

  // Toast state
  const [toast, setToast] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "loading";
    title: string;
    message: string;
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  });

  const showToast = (
    type: "success" | "error" | "warning" | "loading",
    title: string,
    message: string
  ) => {
    setToast({ show: true, type, title, message });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast.show && toast.type !== "loading") {
      const timer = setTimeout(() => {
        hideToast();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show, toast.type]);

  // Query for seat booking payment status
  const { data: roadmapPaymentStatus, refetch: refetchNanodegreeStatus } =
    useQuery({
      queryKey: ["roadmap-payment-status", clientId, assessmentId],
      queryFn: () => getRoadmapPaymentStatus(clientId, "nanodegree"),
      refetchOnWindowFocus: false, // Disabled to reduce unnecessary refetches
      refetchOnMount: false, // Only refetch if data is stale
      staleTime: 1000 * 60 * 2, // 2 minutes - cache payment status
      gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache
      enabled: !!clientId,
    });

  // Query for course payment status (separate from seat booking)
  const {
    data: nanodegreeCoursePaymentStatus,
    refetch: refetchNanodegreeCourseStatus,
  } = useQuery({
    queryKey: ["nanodegree-course-payment-status", clientId, assessmentId],
    queryFn: () => getRoadmapPaymentStatus(clientId, "nanodegree-course"),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    enabled: !!clientId,
  });

  const { data: roadmapPaymentStatusFlagship, refetch: refetchFlagshipStatus } =
    useQuery({
      queryKey: ["roadmap-payment-status-flagship", clientId, assessmentId],
      queryFn: () => getRoadmapPaymentStatus(clientId, "flagship"),
      refetchOnWindowFocus: false, // Disabled to reduce unnecessary refetches
      refetchOnMount: false, // Only refetch if data is stale
      staleTime: 1000 * 60 * 2, // 2 minutes - cache payment status
      gcTime: 1000 * 60 * 5, // 5 minutes - keep in cache
      enabled: !!clientId,
    });

  // Query for flagship course payment status (separate from seat booking)
  const {
    data: flagshipCoursePaymentStatus,
    refetch: refetchFlagshipCourseStatus,
  } = useQuery({
    queryKey: ["flagship-course-payment-status", clientId, assessmentId],
    queryFn: () => getRoadmapPaymentStatus(clientId, "flagship-course"),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    enabled: !!clientId,
  });

  const isNanodegreeSeatBooked = roadmapPaymentStatus?.status === "paid";
  const isNanodegreeCoursePaid =
    nanodegreeCoursePaymentStatus?.status === "paid";
  const isFlagshipSeatBooked = roadmapPaymentStatusFlagship?.status === "paid";
  const isFlagshipCoursePaid = flagshipCoursePaymentStatus?.status === "paid";

  // Get user data
  const user = useSelector((state: { user: UserState }) => state.user);

  const { paymentState: nanodegreePaymentState, initiateNanodegreePayment } =
    useNanodegreePayment({
      onSuccess: (result: PaymentResult) => {
        setPaymentResult({
          paymentId: result.paymentId,
          orderId: result.orderId,
          amount: result.amount,
          type: "nanodegree",
        });
        setShowSuccessModal(true);
        showToast(
          "success",
          "Seat Booked Successfully!",
          "Your Nanodegree seat has been reserved. You can now pay for the full course."
        );

        // Invalidate and refetch payment status queries
        queryClient.invalidateQueries({
          queryKey: ["roadmap-payment-status", clientId, assessmentId],
        });
        refetchNanodegreeStatus();

        // Also refetch after a short delay to ensure backend processing is complete
        setTimeout(() => {
          refetchNanodegreeStatus();
        }, 2000);
      },
      onError: (error: string) => {
        showToast("error", "Payment Failed", error);
      },
      onDismiss: () => {
        showToast(
          "warning",
          "Payment Cancelled",
          "Payment was cancelled. You can try again anytime."
        );
      },
    });

  const { paymentState: nanodegreeCoursePaymentState, initiateCoursePayment } =
    useCoursePayment({
      onSuccess: (result: PaymentResult) => {
        setPaymentResult({
          paymentId: result.paymentId,
          orderId: result.orderId,
          amount: result.amount,
          type: "nanodegree-course",
        });
        setShowSuccessModal(true);
        showToast(
          "success",
          "Course Payment Successful!",
          "Your Nanodegree course access has been confirmed."
        );

        // Invalidate and refetch payment status queries
        queryClient.invalidateQueries({
          queryKey: [
            "nanodegree-course-payment-status",
            clientId,
            assessmentId,
          ],
        });
        refetchNanodegreeCourseStatus();

        // Also refetch after a short delay to ensure backend processing is complete
        setTimeout(() => {
          refetchNanodegreeCourseStatus();
        }, 2000);
      },
      onError: (error: string) => {
        showToast("error", "Payment Failed", error);
      },
      onDismiss: () => {
        showToast(
          "warning",
          "Payment Cancelled",
          "Payment was cancelled. You can try again anytime."
        );
      },
    });

  const { paymentState: flagshipPaymentState, initiateFlagshipPayment } =
    useFlagshipPayment({
      onSuccess: (result: PaymentResult) => {
        setPaymentResult({
          paymentId: result.paymentId,
          orderId: result.orderId,
          amount: result.amount,
          type: "flagship",
        });
        setShowSuccessModal(true);
        showToast(
          "success",
          "Seat Booked Successfully!",
          "Your Flagship seat has been reserved. You can now pay for the full course."
        );

        // Invalidate and refetch payment status queries
        queryClient.invalidateQueries({
          queryKey: ["roadmap-payment-status-flagship", clientId, assessmentId],
        });
        refetchFlagshipStatus();

        // Also refetch after a short delay to ensure backend processing is complete
        setTimeout(() => {
          refetchFlagshipStatus();
        }, 2000);
      },
      onError: (error: string) => {
        showToast("error", "Payment Failed", error);
      },
      onDismiss: () => {
        showToast(
          "warning",
          "Payment Cancelled",
          "Payment was cancelled. You can try again anytime."
        );
      },
    });

  // Add flagship course payment hook
  const {
    paymentState: flagshipCoursePaymentState,
    initiateCoursePayment: initiateFlagshipCoursePayment,
  } = useCoursePayment({
    onSuccess: (result: PaymentResult) => {
      setPaymentResult({
        paymentId: result.paymentId,
        orderId: result.orderId,
        amount: result.amount,
        type: "flagship-course",
      });
      setShowSuccessModal(true);
      showToast(
        "success",
        "Course Payment Successful!",
        "Your Flagship Career Launchpad access has been confirmed."
      );

      // Invalidate and refetch payment status queries
      queryClient.invalidateQueries({
        queryKey: ["flagship-course-payment-status", clientId, assessmentId],
      });
      refetchFlagshipCourseStatus();

      // Also refetch after a short delay to ensure backend processing is complete
      setTimeout(() => {
        refetchFlagshipCourseStatus();
      }, 2000);
    },
    onError: (error: string) => {
      showToast("error", "Payment Failed", error);
    },
    onDismiss: () => {
      showToast(
        "warning",
        "Payment Cancelled",
        "Payment was cancelled. You can try again anytime."
      );
    },
  });

  const handleNanodegreePayment = () => {
    if (isNanodegreeCoursePaid) {
      showToast(
        "success",
        "Already Purchased",
        "You have already purchased the complete Nanodegree program."
      );
      return;
    }

    if (isNanodegreeSeatBooked) {
      // Seat is booked, now pay for the course
      setShowNanoDegreeCourseModal(true);
    } else {
      // Book the seat first
      setShowNanodegreeModal(true);
    }
  };

  const handleDirectFullPayment = (programType: "nanodegree" | "flagship") => {
    if (programType === "nanodegree") {
      // If nanodegree course is already paid, show a toast
      if (isNanodegreeCoursePaid) {
        showToast(
          "success",
          "Already Purchased",
          "You have already purchased the complete Nanodegree program."
        );
        return;
      }

      // Directly initiate full course payment without seat booking
      setShowNanoDegreeCourseModal(true);
    } else if (programType === "flagship") {
      // If flagship course is already paid, show a toast
      if (isFlagshipCoursePaid) {
        showToast(
          "success",
          "Already Purchased",
          "You have already purchased the complete Flagship Career Launchpad."
        );
        return;
      }

      // Directly initiate full course payment without seat booking
      setShowFlagshipCourseModal(true);
    }
  };

  const handleFlagshipPayment = () => {
    if (isFlagshipCoursePaid) {
      showToast(
        "success",
        "Already Purchased",
        "You have already purchased the complete Flagship Career Launchpad program."
      );
      return;
    }

    if (isFlagshipSeatBooked) {
      // Seat is booked, now pay for the course
      setShowFlagshipCourseModal(true);
    } else {
      // Book the seat first
      setShowFlagshipModal(true);
    }
  };

  const confirmNanodegreePayment = () => {
    setShowNanodegreeModal(false);
    initiateNanodegreePayment(clientId, 499, "nanodegree", {
      prefill: {
        name: user.full_name || "User",
        email: user.email || "",
      },
      metadata: {
        assessmentId: assessmentId,
        type_id: "nanodegree",
        payment_type: "PREBOOKING",
      },
    });
  };

  const confirmNanodegreeCoursePayment = () => {
    // Only subtract the seat booking amount if the user has actually paid for seat booking
    const courseRemainingAmount = isNanodegreeSeatBooked ? 4999 - 499 : 4999;

    setShowNanoDegreeCourseModal(false);
    initiateCoursePayment(clientId, courseRemainingAmount, {
      prefill: {
        name: user.full_name || "User",
        email: user.email || "",
      },
      metadata: {
        assessmentId: assessmentId,
        type_id: "nanodegree-course",
        payment_type: "COURSE",
      },
    });
  };

  const confirmFlagshipPayment = () => {
    setShowFlagshipModal(false);
    initiateFlagshipPayment(clientId, 999, "flagship", {
      prefill: {
        name: user.full_name || "User",
        email: user.email || "",
      },
      metadata: {
        assessmentId: assessmentId,
        type_id: "flagship",
        payment_type: "PREBOOKING",
      },
    });
  };

  const confirmFlagshipCoursePayment = () => {
    // Only subtract the seat booking amount if the user has actually paid for seat booking
    const courseRemainingAmount = isFlagshipSeatBooked
      ? redeemData?.payable_amount - 999 || 9001
      : redeemData?.payable_amount || 10000;

    setShowFlagshipCourseModal(false);
    initiateFlagshipCoursePayment(clientId, courseRemainingAmount, {
      prefill: {
        name: user.full_name || "User",
        email: user.email || "",
      },
      metadata: {
        assessmentId: assessmentId,
        type_id: "flagship-course",
        payment_type: "COURSE",
      },
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setPaymentResult(null);
  };

  // Create purchase data for modals
  const nanodegreePurchaseData = {
    percentage_scholarship: 0,
    total_amount: 499,
    payable_amount: 499,
  };

  const nanodegreeCoursePurchaseData = {
    percentage_scholarship: 0,
    total_amount: 4999,
    payable_amount: isNanodegreeSeatBooked ? 4500 : 4999, // Only discount if seat is booked
    seat_booking_amount: isNanodegreeSeatBooked ? 499 : 0, // Only show if seat is booked
  };

  const flagshipPurchaseData = {
    percentage_scholarship: 0,
    total_amount: 999,
    payable_amount: 999,
  };

  const flagshipCoursePurchaseData = {
    percentage_scholarship: redeemData?.percentage_scholarship || 90,
    total_amount: redeemData?.total_amount || 120000,
    payable_amount: isFlagshipSeatBooked
      ? redeemData?.payable_amount - 999 || 9001
      : redeemData?.payable_amount || 10000, // Only discount if seat is booked
    seat_booking_amount: isFlagshipSeatBooked ? 999 : 0, // Only show if seat is booked
  };

  // Helper function to get button text and style for Nanodegree
  const getNanodegreeButtonConfig = () => {
    if (isNanodegreeCoursePaid) {
      return {
        text: "Purchased",
        disabled: true,
        className: "bg-green-600 text-[var(--font-light)] cursor-not-allowed",
      };
    } else if (isNanodegreeSeatBooked) {
      return {
        text: `Pay Remaining Course Fee ₹${4500}`,
        disabled: false,
        className: "bg-[#14212B] text-[var(--font-light)] hover:bg-[#223344]",
      };
    } else {
      return {
        text: "Book Your Seat for ₹499",
        disabled: false,
        className: "bg-[#14212B] text-[var(--font-light)] hover:bg-[#223344]",
      };
    }
  };

  // Helper function to get button text and style for Flagship
  const getFlagshipButtonConfig = () => {
    if (isFlagshipCoursePaid) {
      return {
        text: "Purchased",
        disabled: true,
        className: "bg-green-600 text-[var(--font-light)] cursor-not-allowed",
      };
    } else if (isFlagshipSeatBooked) {
      return {
        text: `Pay Remaining Course Fee ₹${
          redeemData?.payable_amount - 999 || 9001
        }`,
        disabled: false,
        className: "bg-[#14212B] text-[var(--font-light)] hover:bg-[#223344]",
      };
    } else {
      return {
        text: "Book Your Seat for ₹999",
        disabled: false,
        className: "bg-[#14212B] text-[var(--font-light)] hover:bg-[#223344]",
      };
    }
  };

  const nanodegreeButtonConfig = getNanodegreeButtonConfig();
  const flagshipButtonConfig = getFlagshipButtonConfig();

  return (
    <>
      <div className="w-full flex flex-col items-center mt-8 sm:mt-12 lg:mt-16 px-2 sm:px-4">
        <span className="text-xs sm:text-sm text-[#0ea5e9] font-semibold tracking-wide mb-2">
          PRICING
        </span>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14212B] text-center mb-2 px-2">
          Choose Your Path.
          <br className="hidden sm:block" />
          Reserve Your Seat Today.
        </h2>
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 mt-6 sm:mt-8 w-full max-w-4xl mx-auto">
          {/* Nanodegree Card */}
          <div className="flex-1 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow p-4 sm:p-6 lg:p-8 flex flex-col relative">
            <span className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-500 text-[var(--font-light)] text-xs font-bold px-2 sm:px-3 py-1 text-center items-center justify-center rounded-lg sm:rounded-xl">
              <h3 className="text-lg sm:text-2xl font-bold">50</h3>
              <h3 className="text-xs">seats only</h3>
            </span>
            {isNanodegreeSeatBooked && !isNanodegreeCoursePaid && (
              <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-blue-100 text-blue-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                ✓ Seat Booked
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-[#2563eb] mb-1">
              Nanodegree Program
            </h3>
            <span className="text-xs text-gray-500 mb-2">
              Career-Ready Training at Best Price
            </span>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14212B] mb-1">
              ₹{4999}
            </div>
            <span className="text-gray-700 text-xs sm:text-sm mb-3 sm:mb-4 text-center">
              Complete Career-Ready Training at an Unbeatable Price
            </span>
            {isNanodegreeSeatBooked && !isNanodegreeCoursePaid && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <p className="text-xs text-blue-700 text-center">
                  <strong>Seat Reserved!</strong> Complete your enrollment by
                  paying for the full course.
                </p>
              </div>
            )}
            <div className="w-full border-t border-gray-200 my-3 sm:my-4"></div>
            <span className="text-xs font-bold text-gray-500 mb-2 tracking-wide">
              WHAT YOU GET
            </span>
            <ul className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6 space-y-1 sm:space-y-2 w-full flex-1">
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>100+ hours of expert
                video content
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>AI-graded assignments &
                quizzes
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>21-day No-Code AI
                Product Builder
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>90-Day Mentored Work
                Experience
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>Weekly performance
                tracking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>Lifetime job portal
                access
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>Certificate + career
                readiness report
              </li>
            </ul>
            <div className="mt-auto">
              <button
                onClick={handleNanodegreePayment}
                disabled={nanodegreeButtonConfig.disabled}
                className={`w-full font-semibold py-2 sm:py-3 rounded-lg shadow transition-colors duration-200 mb-2 text-sm sm:text-base ${nanodegreeButtonConfig.className}`}
              >
                {nanodegreeButtonConfig.text}
              </button>
              <span className="text-xs text-gray-400">
                Fully refundable within 7 days
              </span>
            </div>
            {!isNanodegreeCoursePaid && (
              <div className="mt-2 sm:mt-3 space-y-2">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs sm:text-sm text-green-800 mb-2">
                    {isNanodegreeSeatBooked
                      ? "Complete your enrollment with the remaining course fee"
                      : "Want to skip the seat booking and get full course access immediately?"}
                  </p>
                  <button
                    onClick={() => handleDirectFullPayment("nanodegree")}
                    className="w-full bg-[#14212B] text-[var(--font-light)] font-semibold py-2 sm:py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 text-sm sm:text-base"
                  >
                    {isNanodegreeSeatBooked
                      ? `Pay Remaining Course Fee (₹4500)`
                      : `Pay Full Course Fee (₹4999)`}
                  </button>
                  <p className="text-xs text-green-600 mt-1">
                    {isNanodegreeSeatBooked
                      ? "Complete your Nanodegree program enrollment"
                      : "Instant access to entire Nanodegree program"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Flagship Card */}
          <div className="flex-1 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow p-4 sm:p-6 lg:p-8 flex flex-col relative">
            <span className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-500 text-[var(--font-light)] text-xs font-bold px-2 sm:px-3 py-1 text-center items-center justify-center rounded-lg sm:rounded-xl">
              <h3 className="text-lg sm:text-2xl font-bold">30</h3>
              <h3 className="text-xs">seats only</h3>
            </span>
            <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-yellow-200 text-yellow-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
              ⚡ Eligible for Scholarship ⚡
            </span>
            {isFlagshipSeatBooked && !isFlagshipCoursePaid && (
              <span className="absolute top-12 sm:top-12 left-3 sm:left-4 bg-blue-100 text-blue-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
                ✓ Seat Booked
              </span>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-[#2563eb] mb-1 my-14 sm:my-4">
              Flagship Career Launchpad
            </h3>
            <span className="text-xs text-gray-500 mb-2">
              Mentorship · Referrals · Job-Ready
            </span>
            {!isFlagshipSeatBooked ? (
              <>
                <div className="text-sm sm:text-lg text-[#0ea5e9] font-bold mb-1">
                  Claim your{" "}
                  <span className="text-xl sm:text-2xl">
                    {redeemData?.percentage_scholarship ?? 90}%
                  </span>{" "}
                  scholarship.
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14212B]">
                    ₹{redeemData?.payable_amount ?? 10000}
                  </span>
                  <span className="text-sm sm:text-base text-gray-400 line-through">
                    ₹{redeemData?.total_amount ?? 120000}
                  </span>
                </div>
                <span className="text-xs text-gray-500 mb-1">
                  This price is only valid for next 7 days!{" "}
                  <button
                    onClick={() => setShowScholarshipBreakupModal(true)}
                    className="underline text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
                  >
                    View Cost Breakup →
                  </button>
                </span>
              </>
            ) : !isFlagshipCoursePaid ? (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-700 text-center">
                    <strong>Seat Reserved!</strong> Complete your enrollment by
                    paying for the full course.
                  </p>
                </div>
                <div className="text-sm sm:text-lg text-[#0ea5e9] font-bold mb-1">
                  Your{" "}
                  <span className="text-xl sm:text-2xl">
                    {redeemData?.percentage_scholarship ?? 90}%
                  </span>{" "}
                  scholarship is active.
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14212B]">
                    ₹
                    {isFlagshipSeatBooked
                      ? redeemData?.payable_amount - 999 || 9001
                      : redeemData?.payable_amount ?? 10000}
                  </span>
                  <span className="text-sm sm:text-base text-gray-400 line-through">
                    ₹{redeemData?.total_amount ?? 120000}
                  </span>
                </div>
                <span className="text-xs text-gray-500 mb-1">
                  Complete your enrollment now!{" "}
                  <button
                    onClick={() => setShowScholarshipBreakupModal(true)}
                    className="underline text-[#0ea5e9] hover:text-[#0284c7] transition-colors"
                  >
                    View Cost Breakup →
                  </button>
                </span>
              </>
            ) : (
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-600 mb-1">
                ✓ Purchased
              </div>
            )}
            <div className="w-full border-t border-gray-200 my-3 sm:my-4"></div>
            <span className="text-xs font-bold text-gray-500 mb-2 tracking-wide">
              WHAT YOU GET
            </span>
            <ul className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6 space-y-1 sm:space-y-2 w-full flex-1">
              <li className="flex items-center gap-2">
                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  Everything in Nanodegree
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>Live sessions with
                MAANG experts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>Direct referral to
                hiring partners
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>90-Day guided work with
                MAANG mentor
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>AI-powered resume &
                branding help
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#2563eb]">★</span>Portfolio building &
                mock interviews
              </li>
            </ul>
            <div className="mt-auto">
              <button
                onClick={handleFlagshipPayment}
                disabled={flagshipButtonConfig.disabled}
                className={`w-full font-semibold py-2 sm:py-3 rounded-lg shadow transition-colors duration-200 mb-2 text-sm sm:text-base ${flagshipButtonConfig.className}`}
              >
                {flagshipButtonConfig.text}
              </button>
              <span className="text-xs text-gray-400">
                Fully refundable within 7 days
              </span>
            </div>
            {!isFlagshipCoursePaid && (
              <div className="mt-2 sm:mt-3 space-y-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-xs sm:text-sm text-yellow-800 mb-2">
                    {isFlagshipSeatBooked
                      ? "Complete your enrollment with the remaining course fee"
                      : "Ready to unlock the full Flagship Career Launchpad experience?"}
                  </p>
                  <button
                    onClick={() => handleDirectFullPayment("flagship")}
                    className="w-full bg-[#14212B] text-[var(--font-light)] font-semibold py-2 sm:py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 text-sm sm:text-base"
                  >
                    {isFlagshipSeatBooked
                      ? `Pay Remaining Course Fee (₹${
                          redeemData?.payable_amount - 999 || 9001
                        })`
                      : `Pay Full Course Fee (₹${
                          redeemData?.payable_amount ?? 10000
                        })`}
                  </button>
                  <p className="text-xs text-yellow-600 mt-1">
                    {isFlagshipSeatBooked
                      ? "Complete your Flagship Career Launchpad enrollment"
                      : "Immediate access to mentorship and career support"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show message if payment is done */}
      {(isNanodegreeSeatBooked ||
        isNanodegreeCoursePaid ||
        isFlagshipSeatBooked ||
        isFlagshipCoursePaid) && (
        <div className="w-full flex justify-center mt-6">
          <span className="text-gray-500 text-base text-center w-full max-w-2xl border-t border-gray-200 pt-4 block font-medium">
            {isNanodegreeCoursePaid
              ? "🎉 Congratulations! You have successfully enrolled in the Nanodegree program. Our team will reach out to you soon with access details and next steps."
              : isNanodegreeSeatBooked && !isNanodegreeCoursePaid
              ? "✅ Your seat has been reserved! Complete your enrollment by paying for the full course to get started."
              : isFlagshipCoursePaid
              ? "🎉 Welcome to the Flagship Career Launchpad! Our team will contact you soon with your personalized learning path and mentor assignment."
              : isFlagshipSeatBooked && !isFlagshipCoursePaid
              ? "✅ Your Flagship seat has been reserved! Complete your enrollment by paying for the full course to get started."
              : "Thank you for your payment. Our team will reach out to you soon with next steps and further information."}
          </span>
        </div>
      )}

      {/* Nanodegree Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showNanodegreeModal}
        onClose={() => setShowNanodegreeModal(false)}
        onConfirm={confirmNanodegreePayment}
        programType="nanodegree"
        purchasedData={nanodegreePurchaseData}
      />

      {/* Nanodegree Course Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showNanoDegreeCourseModal}
        onClose={() => setShowNanoDegreeCourseModal(false)}
        onConfirm={confirmNanodegreeCoursePayment}
        programType="nanodegree-course"
        purchasedData={nanodegreeCoursePurchaseData}
      />

      {/* Flagship Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showFlagshipModal}
        onClose={() => setShowFlagshipModal(false)}
        onConfirm={confirmFlagshipPayment}
        programType="flagship"
        purchasedData={flagshipPurchaseData}
      />

      {/* Flagship Course Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showFlagshipCourseModal}
        onClose={() => setShowFlagshipCourseModal(false)}
        onConfirm={confirmFlagshipCoursePayment}
        programType="flagship-course"
        purchasedData={flagshipCoursePurchaseData}
      />

      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={
          nanodegreePaymentState.isProcessing ||
          nanodegreeCoursePaymentState.isProcessing ||
          flagshipPaymentState.isProcessing ||
          flagshipCoursePaymentState.isProcessing
        }
        step={
          nanodegreePaymentState.step === "error" ||
          nanodegreeCoursePaymentState.step === "error" ||
          flagshipPaymentState.step === "error" ||
          flagshipCoursePaymentState.step === "error"
            ? "creating"
            : ((nanodegreePaymentState.step ||
                nanodegreeCoursePaymentState.step ||
                flagshipPaymentState.step ||
                flagshipCoursePaymentState.step) as
                | "creating"
                | "processing"
                | "verifying"
                | "complete")
        }
        onClose={() => {
          // Handle processing modal close if needed
        }}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        paymentId={paymentResult?.paymentId}
        orderId={paymentResult?.orderId}
        amount={paymentResult?.amount || 0}
        paymentType="course"
      />

      {/* Scholarship Breakup Modal */}
      <ScholarshipBreakupModal
        isOpen={showScholarshipBreakupModal}
        onClose={() => setShowScholarshipBreakupModal(false)}
        scholarshipData={{
          percentage_scholarship: redeemData?.percentage_scholarship || 90,
          total_amount: redeemData?.total_amount || 120000,
          payable_amount: redeemData?.payable_amount || 10000,
        }}
        isFlagshipPayment={isFlagshipSeatBooked || isFlagshipCoursePaid}
        isNanodegreePayment={isNanodegreeSeatBooked || isNanodegreeCoursePaid}
      />

      {/* Payment Toast */}
      <PaymentToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={hideToast}
      />
    </>
  );
};

export default PaymentCardSection;
