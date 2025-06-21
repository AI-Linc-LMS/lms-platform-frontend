import React, { useEffect, useState } from "react";
import { FiCheck, FiX, FiAlertCircle, FiLoader } from "react-icons/fi";

interface PaymentToastProps {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'loading';
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const PaymentToast: React.FC<PaymentToastProps> = ({
  show,
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      if (autoClose && type !== 'loading') {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [show, autoClose, duration, onClose, type]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
      case 'error':
        return <FiX className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
      case 'warning':
        return <FiAlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
      case 'loading':
        return <FiLoader className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 animate-spin" />;
      default:
        return <FiCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'loading':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* Mobile Toast - Top positioned */}
      <div className="fixed top-4 left-4 right-4 z-50 sm:hidden">
        <div className={`
          w-full border rounded-lg shadow-lg p-3 transition-all duration-300 transform
          ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
          ${getColors()}
        `}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {title}
              </p>
              <p className="text-xs mt-1 opacity-90 line-clamp-2">
                {message}
              </p>
            </div>
            {type !== 'loading' && (
              <div className="ml-3 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none p-1"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Toast - Right positioned */}
      <div className="fixed top-4 right-4 z-50 hidden sm:block">
        <div className={`
          max-w-sm w-full min-w-[320px] border rounded-lg shadow-lg p-4 transition-all duration-300 transform
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${getColors()}
        `}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getIcon()}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold">
                {title}
              </p>
              <p className="text-sm mt-1 opacity-90">
                {message}
              </p>
            </div>
            {type !== 'loading' && (
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={handleClose}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 rounded p-1"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentToast; 