import { useSelector } from "react-redux";
import {
  useFlagshipPayment,
  useNanodegreePayment,
} from "../../../../../hooks/useRazorpayPayment";
import { PaymentResult } from "../../../../../services/payment/razorpayService";
import { ScholarshipRedemptionData, UserState } from "../types/assessmentTypes";
import { useQuery } from "@tanstack/react-query";
import { getRoadmapPaymentStatus } from "../../../../../services/assesment/assesmentApis";

const PaymentCardSection: React.FC<{
  redeemData: ScholarshipRedemptionData;
  clientId: number;
  assessmentId: string;
}> = ({ redeemData, clientId, assessmentId }) => {
  const { data: roadmapPaymentStatus } = useQuery({
    queryKey: ["roadmap-payment-status", clientId, assessmentId],
    queryFn: () => getRoadmapPaymentStatus(clientId, "nanodegree"),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    enabled: !!clientId,
  });

  const { data: roadmapPaymentStatusFlagship } = useQuery({
    queryKey: ["roadmap-payment-status-flagship", clientId, assessmentId],
    queryFn: () => getRoadmapPaymentStatus(clientId, "flagship"),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    enabled: !!clientId,
  });

  const isNanodegreePayment = roadmapPaymentStatus?.status === "paid";
  const isFlagshipPayment = roadmapPaymentStatusFlagship?.status === "paid";

  // Get assessment price in rupees (convert from string)
  const user = useSelector((state: { user: UserState }) => state.user);

  const { initiateNanodegreePayment } = useNanodegreePayment({
    onSuccess: (result: PaymentResult) => {
      console.log("Nanodegree payment successful:", result);
    },
  });

  const { initiateFlagshipPayment } = useFlagshipPayment({
    onSuccess: (result: PaymentResult) => {
      console.log("Flagship payment successful:", result);
    },
  });

  const handleNanodegreePayment = () => {
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
    console.log("Nanodegree payment");
  };

  const handleFlagshipPayment = () => {
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
    console.log("Flagship payment");
  };
  return (
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
          <span className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-500 text-white text-xs font-bold px-2 sm:px-3 py-1 text-center items-center justify-center rounded-lg sm:rounded-xl">
            <h3 className="text-lg sm:text-2xl font-bold">50</h3>
            <h3 className="text-xs">seats only</h3>
          </span>
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
          <div className="w-full border-t border-gray-200 my-3 sm:my-4"></div>
          <span className="text-xs font-bold text-gray-500 mb-2 tracking-wide">
            WHAT YOU GET
          </span>
          <ul className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6 space-y-1 sm:space-y-2 w-full">
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>100+ hours of expert
              video content
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>AI-graded assignments &
              quizzes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>21-day No-Code AI Product
              Builder
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
          <button
            onClick={handleNanodegreePayment}
            className="w-full bg-[#14212B] text-white font-semibold py-2 sm:py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 mb-2 text-sm sm:text-base"
          >
            {isNanodegreePayment ? "Already Booked" : "Book Your Seat for ₹499"}
          </button>
          <span className="text-xs text-gray-400">
            Fully refundable within 7 days
          </span>
        </div>

        {/* Flagship Card */}
        <div className="flex-1 bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow p-4 sm:p-6 lg:p-8 flex flex-col relative">
          <span className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-green-500 text-white text-xs font-bold px-2 sm:px-3 py-1 text-center items-center justify-center rounded-lg sm:rounded-xl">
            <h3 className="text-lg sm:text-2xl font-bold">30</h3>
            <h3 className="text-xs">seats only</h3>
          </span>
          <span className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-yellow-200 text-yellow-800 text-xs font-bold px-2 sm:px-3 py-1 rounded-full">
            ⚡ Eligible for Scholarship ⚡
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-[#2563eb] mb-1 my-14 sm:my-4">
            Flagship Career Launchpad
          </h3>
          <span className="text-xs text-gray-500 mb-2">
            Mentorship · Referrals · Job-Ready
          </span>
          <div className="text-sm sm:text-lg text-[#0ea5e9] font-bold mb-1">
            Claim your <span className="text-xl sm:text-2xl">90%</span>{" "}
            scholarship.
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#14212B]">
              {redeemData?.payable_amount ?? 10000}
            </span>
            <span className="text-sm sm:text-base text-gray-400 line-through">
              {redeemData?.total_amount ?? 120000}
            </span>
          </div>
          <span className="text-xs text-gray-500 mb-1">
            This price is only valid for next 7 days!{" "}
            <a href="#" className="underline text-[#0ea5e9]">
              View Cost Breakup →
            </a>
          </span>
          <div className="w-full border-t border-gray-200 my-3 sm:my-4"></div>
          <span className="text-xs font-bold text-gray-500 mb-2 tracking-wide">
            WHAT YOU GET
          </span>
          <ul className="text-xs sm:text-sm text-gray-700 mb-4 sm:mb-6 space-y-1 sm:space-y-2 w-full">
            <li className="flex items-center gap-2">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Everything in Nanodegree
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Live sessions with MANG
              experts
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Direct referral to hiring
              partners
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>90-Day guided work with
              MANG mentor
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>AI-powered resume &
              branding help
            </li>
            <li className="flex items-center gap-2">
              <span className="text-[#2563eb]">★</span>Portfolio building & mock
              interviews
            </li>
          </ul>
          <button
            onClick={handleFlagshipPayment}
            className="w-full bg-[#14212B] text-white font-semibold py-2 sm:py-3 rounded-lg shadow hover:bg-[#223344] transition-colors duration-200 mb-2 text-sm sm:text-base"
          >
            {isFlagshipPayment ? "Already Booked" : "Book Your Seat for ₹999"}
          </button>
          <span className="text-xs text-gray-400">
            Fully refundable within 7 days
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentCardSection;
