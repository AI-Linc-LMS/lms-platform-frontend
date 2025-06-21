import React from "react";
import { FiLoader, FiCheck, FiCreditCard, FiShield, FiAward } from "react-icons/fi";

interface PaymentProcessingModalProps {
  isOpen: boolean;
  step: 'creating' | 'processing' | 'verifying' | 'complete';
  onClose: () => void;
}

const PaymentProcessingModal: React.FC<PaymentProcessingModalProps> = ({
  isOpen,
  step,
  onClose,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      key: 'creating',
      title: 'Creating Order',
      description: 'Setting up your payment...',
      icon: FiCreditCard,
    },
    {
      key: 'processing',
      title: 'Processing Payment',
      description: 'Secure payment in progress...',
      icon: FiLoader,
    },
    {
      key: 'verifying',
      title: 'Verifying Payment',
      description: 'Confirming transaction security...',
      icon: FiShield,
    },
    {
      key: 'complete',
      title: 'Payment Complete',
      description: 'Successfully verified and processed!',
      icon: FiAward,
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  const getStepStatus = (index: number) => {
    if (index < currentStepIndex) return 'completed';
    if (index === currentStepIndex) return 'current';
    return 'pending';
  };

  const getStepIcon = (stepItem: typeof steps[0], status: string) => {
    const IconComponent = stepItem.icon;
    
    if (status === 'completed') {
      return <FiCheck className="h-6 w-6 text-green-600" />;
    }
    
    if (status === 'current') {
      if (stepItem.key === 'processing' || stepItem.key === 'verifying') {
        return <FiLoader className="h-6 w-6 text-blue-600 animate-spin" />;
      }
      return <IconComponent className="h-6 w-6 text-blue-600" />;
    }
    
    return <IconComponent className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 'complete' ? (
              <FiCheck className="h-8 w-8 text-green-600" />
            ) : (
              <FiLoader className="h-8 w-8 text-blue-600 animate-spin" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'complete' ? 'Payment Successful!' : 'Processing Payment'}
          </h2>
          <p className="text-gray-600">
            {step === 'complete' 
              ? 'Your payment has been verified and processed successfully.'
              : 'Please wait while we process your payment securely.'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((stepItem, index) => {
            const status = getStepStatus(index);
            return (
              <div key={stepItem.key} className="flex items-center space-x-4">
                {/* Step Icon */}
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${status === 'completed' 
                    ? 'bg-green-50 border-green-200' 
                    : status === 'current'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                  }
                `}>
                  {getStepIcon(stepItem, status)}
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    status === 'completed' 
                      ? 'text-green-800' 
                      : status === 'current'
                      ? 'text-blue-800'
                      : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </h3>
                  <p className={`text-sm transition-colors duration-300 ${
                    status === 'completed' 
                      ? 'text-green-600' 
                      : status === 'current'
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}>
                    {stepItem.description}
                  </p>
                </div>

                {/* Status Indicator */}
                {status === 'completed' && (
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <FiCheck className="h-4 w-4 text-green-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentStepIndex + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <FiShield className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Secure Transaction</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Your payment is protected by bank-level encryption and security protocols.
          </p>
        </div>

        {/* Cancel Button - only show if not complete */}
        {step !== 'complete' && (
          <div className="text-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessingModal; 