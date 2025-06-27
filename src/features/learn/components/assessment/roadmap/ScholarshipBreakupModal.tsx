import React, { useEffect, useState } from "react";
import { FiX, FiCheck, FiX as FiClose } from "react-icons/fi";

interface ScholarshipBreakupModalProps {
  isOpen: boolean;
  onClose: () => void;
  scholarshipData?: {
    percentage_scholarship: number;
    total_amount: number;
    payable_amount: number;
  };
}

interface CostComponent {
  name: string;
  originalCost: number;
  scholarshipApplied: boolean;
}

const ScholarshipBreakupModal: React.FC<ScholarshipBreakupModalProps> = ({
  isOpen,
  onClose,
  scholarshipData = {
    percentage_scholarship: 90,
    total_amount: 120000,
    payable_amount: 10000,
  },
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable body scroll when modal closes
      document.body.style.overflow = 'unset';
    }

    // Handle ESC key press
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const costComponents: CostComponent[] = [
    {
      name: "Guided Work Experience (90 Days)",
      originalCost: 35000,
      scholarshipApplied: true,
    },
    {
      name: "MAANG Expert Mentorship",
      originalCost: 25000,
      scholarshipApplied: true,
    },
    {
      name: "Placement Referral Program",
      originalCost: 20000,
      scholarshipApplied: true,
    },
    {
      name: "Resume & Portfolio Support",
      originalCost: 15000,
      scholarshipApplied: true,
    },
    {
      name: "AI Career Resources",
      originalCost: 15000,
      scholarshipApplied: true,
    },
    {
      name: "Platform Fees*",
      originalCost: 10000,
      scholarshipApplied: false,
    },
  ];

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-end z-50 transition-all duration-300 ease-in-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`bg-white h-full w-full max-w-2xl shadow-2xl transform transition-all duration-500 ease-out ${
          isAnimating ? "translate-x-0" : "translate-x-full"
        } overflow-y-auto`}
        style={{
          maxWidth: 'min(640px, 100vw)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Scholarship Cost Breakup
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Detailed breakdown of your program components
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
          >
            <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Scholarship Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
                <FiCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">
                {scholarshipData.percentage_scholarship}% Scholarship Applied!
              </h3>
              <p className="text-green-700 text-sm sm:text-base">
                You've saved{" "}
                <span className="font-bold">
                  ₹{(scholarshipData.total_amount - scholarshipData.payable_amount).toLocaleString()}
                </span>{" "}
                with this scholarship
              </p>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 font-semibold text-gray-700 text-sm sm:text-base">
                <div className="col-span-5">Component</div>
                <div className="col-span-3 text-center">Original Cost</div>
                <div className="col-span-4 text-center">Scholarship Applied?</div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200">
              {costComponents.map((component, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-5">
                    <span className="text-gray-900 font-medium text-sm sm:text-base">
                      {component.name}
                    </span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="text-gray-900 font-semibold text-sm sm:text-base">
                      ₹{component.originalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="col-span-4 text-center">
                    {component.scholarshipApplied ? (
                      <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full">
                        <FiCheck className="h-3 w-3 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-red-100 rounded-full">
                        <FiClose className="h-3 w-3 sm:h-5 sm:w-5 text-red-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Row */}
            <div className="bg-gray-50 border-t-2 border-gray-300">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 font-bold text-gray-900 text-sm sm:text-base">
                <div className="col-span-5">Total Program Value</div>
                <div className="col-span-3 text-center">
                  ₹{scholarshipData.total_amount.toLocaleString()}
                </div>
                <div className="col-span-4 text-center">
                  <span className="text-green-600">
                    {scholarshipData.percentage_scholarship}% Applied
                  </span>
                </div>
              </div>
            </div>

            {/* Final Amount */}
            <div className="bg-blue-50 border-t border-blue-200">
              <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4">
                <div className="col-span-8">
                  <div className="text-base sm:text-lg font-bold text-blue-900">
                    Your Final Amount
                  </div>
                  <div className="text-xs sm:text-sm text-blue-700">
                    After {scholarshipData.percentage_scholarship}% scholarship discount
                  </div>
                </div>
                <div className="col-span-4 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-900">
                    ₹{scholarshipData.payable_amount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Fee Note */}
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs sm:text-sm text-amber-800">
              <span className="font-semibold">*Platform Fees:</span> We charge a platform fee to sustain the tools, mentorship, and real-world project ecosystem that power your learning experience.
            </p>
          </div>

          {/* Benefits Section */}
          <div className="mt-6 sm:mt-8">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              What makes this scholarship special?
            </h4>
            <div className="grid gap-3 sm:gap-4">
              <div className="flex items-start space-x-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                    Merit-Based Discount
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Your scholarship percentage is based on your assessment performance and learning potential.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 sm:p-4 bg-green-50 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                    Limited Time Offer
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-600">
                    This pricing is valid for the next 7 days only. Lock in your seat today!
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">
                    Full Program Access
                  </h5>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Despite the discount, you get complete access to all program components and benefits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-xl text-center">
            <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Ready to claim your scholarship?
            </h4>
            <p className="text-gray-600 mb-4 text-sm sm:text-base">
              Book your seat now and start your journey with AI-LINC Flagship Career Launchpad
            </p>
            <button
              onClick={handleClose}
              className="bg-blue-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg text-sm sm:text-base"
            >
              Book Your Seat for ₹{scholarshipData.payable_amount.toLocaleString()}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScholarshipBreakupModal; 