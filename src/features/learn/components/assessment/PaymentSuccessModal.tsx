import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiX,
  FiAward,
  FiBook,
  FiUsers,
  FiClock,
  FiStar,
  FiFileText,
  FiTarget,
  FiTrendingUp,
} from "react-icons/fi";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId?: string;
  orderId?: string;
  amount: number;
  paymentType?: "assessment" | "course"; // New prop to determine content type
  onDownloadCertificate?: () => void; // New optional prop for certificate download
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  orderId,
  amount,
  paymentType = "course", // Default to course for backward compatibility
  onDownloadCertificate, // New prop
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      // Animate in steps
      const timer1 = setTimeout(() => setAnimationStep(1), 300);
      const timer2 = setTimeout(() => setAnimationStep(2), 600);
      const timer3 = setTimeout(() => setAnimationStep(3), 900);

      // Hide confetti after 3 seconds
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(confettiTimer);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onClose();
    // You can redirect to course dashboard or other page here
    // window.location.href = '/courses';
  };

  // Different benefits based on payment type
  const courseBenefits = [
    {
      icon: FiBook,
      title: "Lifetime Course Access",
      description: "Access all course materials forever",
    },
    {
      icon: FiUsers,
      title: "Community Support",
      description: "Join our exclusive learning community",
    },
    {
      icon: FiAward,
      title: "Certificate of Completion",
      description: "Earn your professional certificate",
    },
    {
      icon: FiClock,
      title: "Learn at Your Pace",
      description: "No time limits or restrictions",
    },
  ];

  const assessmentBenefits = [
    {
      icon: FiFileText,
      title: "Assessment Access",
      description: "Complete your placement assessment",
    },
    {
      icon: FiTarget,
      title: "Performance Analysis",
      description: "Get detailed results and feedback",
    },
    {
      icon: FiTrendingUp,
      title: "Career Opportunities",
      description: "Unlock placement and scholarship chances",
    },
    {
      icon: FiAward,
      title: "Certificate & Recognition",
      description: "Earn your assessment completion certificate",
    },
  ];

  const benefits =
    paymentType === "assessment" ? assessmentBenefits : courseBenefits;

  // Different content based on payment type
  const getContentByType = () => {
    if (paymentType === "assessment") {
      return {
        title: "Certificate Payment Successful!",
        subtitle: "Your certificate is now ready for download",
        timelineNotice: "⏰ Download your certificate immediately",
        achievementText:
          "Congratulations! Your certificate is ready to showcase your achievement!",
        nextStepsTitle: "What's Next?",
        nextSteps: [
          "Download your certificate immediately",
          "Share it on LinkedIn and other professional platforms",
          "Add it to your resume and portfolio",
          "Use it to enhance your career opportunities",
        ],
        supportText:
          "Contact our support team at support@ailinc.com for any query",
      };
    } else {
      return {
        title: "Payment Successful!",
        subtitle: "Welcome to AI-LINC Course! Your journey begins with us.",
        timelineNotice: "⏰ Access your course dashboard within 7 days",
        achievementText:
          "Our team will reach out to you on your registered email and phone number.",
        nextStepsTitle: "What's Next?",
        nextSteps: [
          "Access your course dashboard within 7 days",
          "Join our community and introduce yourself",
        ],
        buttonText: "Congratulations, Go Back 🚀",
        supportText:
          "Need help getting started? Contact our support team 24/7 at support@ailinc.com",
      };
    }
  };

  const content = getContentByType();

  const handleDownloadCertificate = () => {
    if (onDownloadCertificate) {
      onDownloadCertificate();
    } else {
      alert("Certificate download not available.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  [
                    "bg-yellow-400",
                    "bg-green-400",
                    "bg-blue-400",
                    "bg-red-400",
                    "bg-purple-400",
                  ][Math.floor(Math.random() * 5)]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      <div
        className={`bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-500 ${
          animationStep >= 1 ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="relative p-8 text-center bg-gradient-to-br from-green-50 to-blue-50 rounded-t-2xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="h-6 w-6" />
          </button>

          {/* Success Animation */}
          <div
            className={`relative mb-6 transform transition-all duration-700 ${
              animationStep >= 1 ? "scale-100 rotate-0" : "scale-0 rotate-180"
            }`}
          >
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto relative">
              <FiCheck className="h-12 w-12 text-white" />
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-20"></div>
              <div className="absolute inset-2 rounded-full bg-green-400 animate-ping opacity-30 animation-delay-150"></div>
            </div>
          </div>

          <div
            className={`transform transition-all duration-500 delay-300 ${
              animationStep >= 2
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {content.title}
            </h2>
            <p className="text-lg text-gray-600 mb-2">{content.subtitle}</p>

            {/* Important Timeline Notice */}
            {paymentType === "assessment" && onDownloadCertificate && (
              <button onClick={handleDownloadCertificate}>
            <p className="text-orange-600 font-semibold text-base mb-4">
              {content.timelineNotice}
            </p>
            </button>
             )}

            {/* Achievement Badge */}
            <div className="inline-flex items-center bg-emerald-50 text-emerald-800 px-6 py-3 rounded-lg font-medium shadow-md border-l-4 border-emerald-500">
              <FiStar className="h-5 w-5 mr-3 text-emerald-600" />
              <span className="text-sm leading-relaxed">
                {content.achievementText}
              </span>
              {/* {paymentType === "assessment" && onDownloadCertificate && (
                <button 
                  onClick={handleDownloadCertificate}
                  className="ml-4 bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                >
                  Download
                </button>
              )} */}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Payment Details */}
          <div
            className={`bg-gray-50 rounded-xl p-6 mb-8 transform transition-all duration-500 delay-500 ${
              animationStep >= 3
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FiCheck className="h-5 w-5 text-green-600 mr-2" />
              Transaction Details
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-green-600">
                  ₹{amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-green-600">Verified ✓</span>
              </div>
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                    {paymentId}
                  </span>
                </div>
              )}
              {orderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-mono text-xs bg-gray-200 px-2 py-1 rounded">
                    {orderId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Benefits Grid */}
          <div
            className={`mb-8 transform transition-all duration-500 delay-700 ${
              animationStep >= 3
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <h4 className="font-semibold text-gray-900 mb-6 text-center">
              What You Get Access To:
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 mb-1">
                      {benefit.title}
                    </h5>
                    <p className="text-sm text-gray-600">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div
            className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 transform transition-all duration-500 delay-900 ${
              animationStep >= 3
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <FiAward className="h-5 w-5 text-blue-600 mr-2" />
              {content.nextStepsTitle}
            </h4>
            <div className="space-y-3">
              {content.nextSteps.map((step, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-green-600">
                      {index + 1}
                    </span>
                  </div>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 transform transition-all duration-500 delay-1000 ${
              animationStep >= 3
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }`}
          >
            {content.buttonText && (
              <button
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {content.buttonText}
              </button>
            )}
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">{content.supportText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
