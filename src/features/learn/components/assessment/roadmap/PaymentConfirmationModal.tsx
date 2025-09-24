import React from "react";
import {
  FiX,
  FiCheck,
  FiShield,
  FiClock,
  FiUsers,
  FiAward,
} from "react-icons/fi";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  programType:
    | "nanodegree"
    | "nanodegree-course"
    | "flagship"
    | "flagship-course";
  purchasedData: {
    percentage_scholarship: number;
    total_amount: number;
    payable_amount: number;
    seat_booking_amount?: number; // Optional field for seat booking amount
  };
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  programType,
  purchasedData,
}) => {
  if (!isOpen) return null;

  const programDetails = {
    nanodegree: {
      title: "AI Linc Nanodegree Program - Seat Booking",
      subtitle: "Reserve Your Seat",
      description: "Book your seat for the Nanodegree program",
      features: [
        "Seat reservation for Nanodegree Program",
        "7-day refund guarantee",
        "Priority access to course materials",
        "Early enrollment benefits",
      ],
      color: "blue",
    },
    "nanodegree-course": {
      title: "AI Linc Nanodegree Program - Full Course",
      subtitle: "Complete Course Access",
      description: "Get full access to the Nanodegree program",
      features: [
        "100+ hours of expert video content",
        "AI-graded assignments & quizzes",
        "21-day No-Code AI Product Builder",
        "90-Day Mentored Work Experience",
        "Weekly performance tracking",
        "Lifetime job portal access",
        "Certificate + career readiness report",
      ],
      color: "blue",
    },
    flagship: {
      title: "AI Linc Flagship Career Launchpad - Seat Booking",
      subtitle: "Reserve Your Seat",
      description: "Book your seat for the Flagship Career Launchpad program",
      features: [
        "Seat reservation for Flagship Program",
        "7-day refund guarantee",
        "Priority access to course materials",
        "Early enrollment benefits",
      ],
      color: "yellow",
    },
    "flagship-course": {
      title: "AI Linc Flagship Career Launchpad - Full Course",
      subtitle: "Mentorship · Referrals · Job-Ready",
      description: "Premium program with MAANG mentorship and direct referrals",
      features: [
        "Everything in Nanodegree Program",
        "Live sessions with MAANG experts",
        "Direct referral to hiring partners",
        "90-Day guided work with MAANG mentor",
        "AI-powered resume & branding help",
        "Portfolio building & mock interviews",
      ],
      color: "yellow",
    },
  };

  const program = programDetails[programType];
  const currency = "₹";
  const hasScholarship = purchasedData.percentage_scholarship > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Confirm Your Program Booking
            </h2>
            <p className="text-gray-600 mt-1">
              Review your selection and proceed with payment
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Scholarship Badge */}
        {hasScholarship && (
          <div className="p-6 pb-0">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
              <FiAward className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">
                  🎉 Scholarship Applied!
                </h3>
                <p className="text-green-700 text-sm">
                  You've earned a {purchasedData.percentage_scholarship}%
                  discount based on your assessment performance
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Program Details */}
        <div className="p-6">
          <div
            className={`border-2 ${
              program.color === "blue"
                ? "border-blue-500 bg-blue-50"
                : "border-yellow-500 bg-yellow-50"
            } rounded-lg p-6 mb-6`}
          >
            <div className="text-center mb-4">
              <h3 className="font-semibold text-xl text-gray-900 mb-2">
                {program.title}
              </h3>
              <p className="text-gray-600 text-sm">{program.subtitle}</p>
              <p className="text-gray-700 text-sm mt-2">
                {program.description}
              </p>
            </div>

            {/* Pricing */}
            <div className="text-center mb-4">
              {purchasedData.seat_booking_amount ? (
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    Seat Booking Amount: {currency}
                    {purchasedData.seat_booking_amount}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {currency}
                    {purchasedData.payable_amount.toLocaleString()}
                    <span className="text-lg font-normal text-gray-500 ml-2">
                      remaining course fee
                    </span>
                  </div>
                  <div className="text-sm text-green-600 font-semibold">
                    Total Course Value: {currency}
                    {(
                      purchasedData.seat_booking_amount +
                      purchasedData.payable_amount
                    ).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {currency}
                  {purchasedData.payable_amount.toLocaleString()}
                  <span className="text-lg font-normal text-gray-500 ml-2">
                    one-time
                  </span>
                </div>
              )}
              {hasScholarship && (
                <>
                  <div className="text-sm text-gray-500 line-through mb-2">
                    Original Price: {currency}
                    {purchasedData.total_amount.toLocaleString()}
                  </div>
                  <div className="text-lg text-green-600 font-semibold">
                    You Save {currency}
                    {(
                      purchasedData.total_amount - purchasedData.payable_amount
                    ).toLocaleString()}{" "}
                    with scholarship!
                  </div>
                </>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">
                What you'll get:
              </h4>
              <div className="space-y-2">
                {program.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Security & Support Info */}
          <div className="mb-6">
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <FiShield className="h-4 w-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiClock className="h-4 w-4" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiUsers className="h-4 w-4" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 px-6 py-3 text-[var(--font-light)] rounded-lg transition-colors font-medium ${
                program.color === "blue"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              Proceed to Payment
              <span className="ml-2">
                {currency}
                {purchasedData.payable_amount.toLocaleString()}
              </span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Secure payment via Razorpay • 7-day money-back guarantee • No
              hidden fees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmationModal;
