import React from "react";
import { FiCheck, FiX } from "react-icons/fi";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId?: string;
  orderId?: string;
  amount: number;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  orderId,
  amount,
}) => {
  if (!isOpen) return null;

  const handleContinue = () => {
    onClose();
    // You can redirect to course dashboard or other page here
    // window.location.href = '/courses';
  };

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Payment Successful!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to AI-LINC Course!
            </h3>
            <p className="text-gray-600">
              Your payment has been processed successfully. You now have lifetime access to the complete course.
            </p>
          </div>

          {/* Payment Details */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Payment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">₹{amount.toLocaleString()}</span>
              </div>
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-xs">{paymentId}</span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs">{orderId}</span>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center space-x-2">
                <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Access all course content immediately</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Join our community support channels</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Start learning at your own pace</span>
              </li>
              <li className="flex items-center space-x-2">
                <FiCheck className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Earn your certificate upon completion</span>
              </li>
            </ul>
          </div>

          {/* Action Button */}
          <button
            onClick={handleContinue}
            className="w-full bg-[#255C79] text-white py-3 px-6 rounded-lg hover:bg-[#1e4a61] transition-colors font-medium"
          >
            Continue to Course Dashboard
          </button>

          {/* Support Info */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact our support team 24/7
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal; 