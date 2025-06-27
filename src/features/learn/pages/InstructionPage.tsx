import { useQuery } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getInstructions,
  AssessmentDetails,
} from "../../../services/assesment/assesmentApis";
import { useAssessmentPayment } from "../../../hooks/useRazorpayPayment";
import {
  PaymentProcessingModal,
  PaymentSuccessModal,
  PaymentToast
} from "../components/assessment";

import InstructionVector from "../../../../public/updated_illustrations.png";
import linkdln from "../../../../public/linkdln.png";
import certificate from "../../../../public/preview-certificate.png";
import score from "../../../../public/score-card.png";

const InstructionPage: React.FC = () => {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  // Use assessment ID from URL params or redirect to assessments list
  const currentAssessmentId = assessmentId;

  // If no assessment ID is provided, redirect to assessments list
  useEffect(() => {
    if (!currentAssessmentId) {
      navigate("/assessments");
      return;
    }
  }, [currentAssessmentId, navigate]);

  // Toast state for error messages
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'loading';
    title: string;
    message: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  // Payment success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    paymentId?: string;
    orderId?: string;
    amount: number;
  } | null>(null);

  const { data: assessmentData, isLoading, error } = useQuery<AssessmentDetails>({
    queryKey: ["assessment-instructions", currentAssessmentId],
    queryFn: () => currentAssessmentId ? getInstructions(clientId, currentAssessmentId) : Promise.reject(new Error("No assessment ID")),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
    gcTime: 0,
    enabled: !!currentAssessmentId, // Only run query if we have an assessment ID
  });

  // Check if payment is completed based on backend data
  // If the assessment has started (status is "in_progress" or "submitted"), it means payment was completed
  // OR if txn_status is "paid", it means payment was completed
  const isPaymentCompleted = 
    assessmentData?.status === "in_progress" || 
    assessmentData?.status === "submitted" ||
    assessmentData?.txn_status === "paid";

  // Get assessment price in rupees (convert from string)
  const assessmentPrice = assessmentData?.price ? parseFloat(assessmentData.price) : 25;
  
  // Convert to paise for Razorpay (multiply by 100)
  const assessmentPriceInPaise = Math.round(assessmentPrice);
  // const assessmentPriceInPaise = Math.round(1);

  // Payment hook
  const { paymentState, initiateAssessmentPayment } = useAssessmentPayment({
    onSuccess: (result) => {
      console.log('Payment successful:', result);

      setPaymentResult({
        paymentId: result.paymentId,
        orderId: result.orderId,
        amount: result.amount
      });
      setShowSuccessModal(true);
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      setToast({
        show: true,
        type: 'error',
        title: 'Payment Failed',
        message: error || 'Payment failed. Please try again.'
      });
    },
    onDismiss: () => {
      console.log('Payment dismissed by user');
      setToast({
        show: true,
        type: 'warning',
        title: 'Payment Cancelled',
        message: 'Payment was cancelled. You can try again anytime.'
      });
    }
  });

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Early return if no assessment ID - component will redirect
  if (!currentAssessmentId) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#255C79]"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#255C79]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="bg-white rounded-3xl p-6 shadow-sm max-w-md mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#343A40] mb-2">Error Loading Assessment</h2>
            <p className="text-[#6C757D] mb-4">{error.message}</p>
            <button
              onClick={() => navigate("/assessments")}
              className="bg-[#255C79] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
            >
              View All Assessments
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleStartAssessment = () => {
    // Check if payment is already in progress
    if (paymentState.isProcessing) {
      return;
    }

    // If payment is already completed, proceed to phone verification
    if (isPaymentCompleted) {
      navigate("/assessment/phone-verification", { state: { assessmentId: currentAssessmentId } });
      return;
    }

    // If assessment is free, proceed directly
    if (!assessmentData?.is_paid) {
      navigate("/assessment/phone-verification", { state: { assessmentId: currentAssessmentId } });
      return;
    }

    // Otherwise, initiate payment
    initiateAssessmentPayment(
      parseInt(clientId),
      assessmentPriceInPaise,

      {
        prefill: {
          name: "Test User", // You can get this from user context if available
          email: "test@example.com", // You can get this from user context if available
        },
        metadata: {
          assessmentId: currentAssessmentId,
          testType: "placement-assessment",
          type_id: currentAssessmentId // Add type_id as required by backend
        }
      }
    );
  };

  const handleResumeAssessment = () => {
    navigate("/assessment/quiz");
  };

  return (
    <div className="">
      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={paymentState.isProcessing}
        step={paymentState.step === 'error' ? 'creating' : paymentState.step as 'creating' | 'processing' | 'verifying' | 'complete'}
        onClose={() => {
          // Can't close during processing, but we can handle dismiss
          if (paymentState.step === 'creating') {
            setToast({
              show: true,
              type: 'warning',
              title: 'Payment Cancelled',
              message: 'Payment initialization was cancelled.'
            });
          }
        }}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        paymentId={paymentResult?.paymentId}
        orderId={paymentResult?.orderId}
        amount={paymentResult?.amount || assessmentPrice}
      />

      {/* Payment Toast for errors/warnings */}
      <PaymentToast
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      <div className="">
        {/* Hero Section */}
        <div className="bg-white rounded-3xl w-full border border-gray-200 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-4 ">
            {/* Left - Image Section */}
            <div className=" ">
              <img
                src={InstructionVector}
                alt="Instruction Vector"
                className="w-full  object-contain"
              />
            </div>

            {/* Right - Info Section */}
            <div className=" flex flex-col justify-center ">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-[#2C5F7F] ">
                  {assessmentData?.title || "Assessment"}
                </h2>
                <p className="text-gray-700  leading-relaxed">
                  {assessmentData?.instructions || assessmentData?.description || "Complete this assessment to showcase your skills and knowledge."}
                </p>
              </div>

              <div className=" rounded-2xl  flex-1 flex flex-col justify-between">
                <div className="">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">📊</span>
                      <span className="font-medium">Total Questions: <span className="font-bold">30 MCQ</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-600">⏱️</span>
                      <span className="font-medium">Duration: <span className="font-bold">{assessmentData?.duration_minutes || 30} minutes</span></span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                      <span className="font-medium">Topics:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "AI Fundamentals",
                        "JavaScript",
                        "React",
                        "Node.JS",
                        "HTML/CSS",
                        "Cloud Database",
                        "Logic & Aptitude"
                      ].map((topic) => (
                        <span key={topic} className="px-3 py-1 bg-[#EFF9FC] text-gray-700 rounded-full text-sm border border-[#80C9E0]">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  {assessmentData?.is_paid ? (
                    <>
                      <p className="text-lg mb-4">Take this test for only</p>
                      <div className="flex items-baseline gap-2 mb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg text-gray-500 line-through">₹699</span>
                          <span className="text-4xl font-bold text-[#2C5F7F]">₹{assessmentPrice}</span>
                        </div>
                        {isPaymentCompleted && (
                          <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                            ✓ Paid
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="mb-6">
                      <p className="text-lg font-bold text-green-600">Free Assessment</p>
                      <p className="text-sm text-gray-600">No payment required</p>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row gap-3">
                    <button 
                      onClick={() => {
                        const section = document.getElementById('whats-with-this-test');
                        if (section) {
                          section.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start',
                            inline: 'nearest'
                          });
                        }
                      }}
                      className="w-full py-3 px-6 border-2 border-[#2C5F7F] text-[#2C5F7F] rounded-xl font-medium hover:bg-[#2C5F7F] hover:text-white transition-all duration-700 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Why Take This Test?
                    </button>

                    {assessmentData?.status === "submitted" ? (
                      <button
                        onClick={handleResumeAssessment}
                        className="w-full py-3 px-6 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                      >
                        View Results
                      </button>
                    ) : assessmentData?.status === "in_progress" ? (
                      <button
                        onClick={handleResumeAssessment}
                        className="w-full py-3 px-6 bg-[#2C5F7F] text-white rounded-xl font-medium hover:bg-[#1a4a5f] transition-colors"
                      >
                        Resume Quiz
                      </button>
                    ) : (
                      <div className="flex flex-col lg:flex-row gap-3 w-full">
                        <button
                          onClick={handleStartAssessment}
                          disabled={paymentState.isProcessing}
                          className={`w-full py-3 px-6 rounded-xl font-medium transition-colors ${paymentState.isProcessing
                              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              : isPaymentCompleted
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : assessmentData?.is_paid
                                  ? 'bg-[#2C5F7F] text-white hover:bg-[#1a4a5f]'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                        >
                          {paymentState.isProcessing
                            ? 'Processing Payment...'
                            : isPaymentCompleted
                              ? 'Start Assessment Now'
                              : assessmentData?.is_paid
                                ? `Pay ₹${assessmentPrice} & Start Test`
                                : 'Start Free Assessment'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unlock These Perks Section */}
        <div className="my-16">
          <h2 className="text-3xl font-normal text-center text-[#2C5F7F] mb-12">
            UNLOCK THESE PERKS WITH THE TEST
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Certificate Card */}

            <div className="">
              <img
                src={linkdln}
                alt="LinkedIn"
                className="  object-contain"
              />
            </div>

            {/* </div> */}

            {/* LinkedIn Card */}
            <div className="">
              <img
                src={certificate}
                alt="LinkedIn"
                className="  object-contain"
              />
            </div>

            {/* Score Card */}
            <div className="">
              <img
                src={score}
                alt="LinkedIn"
                className="  object-contain"
              />
            </div>
          </div>
        </div>

        {/* What's With This Test Section */}
        <div id="whats-with-this-test" className="mb-16">
          <h2 className="text-3xl font-normal text-center text-[#2C5F7F] mb-12">
            WHAT'S WITH THIS TEST
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Why this matters */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#DADADA]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🔍</span>
                <h3 className="text-xl font-bold text-[#2C5F7F]">Why this matters:</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                We're already in touch with companies actively hiring for AI-powered and no-code roles. If you ace this assessment, you may qualify directly for placement interviews with our partner companies.
              </p>
            </div>

            {/* What if you don't score high */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#DADADA]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">❌</span>
                <h3 className="text-xl font-bold text-[#2C5F7F]">What if you don't score high?</h3>
              </div>
              <p className="text-gray-700 leading-relaxed mb-3">
                <strong>No worries. That's exactly why we're here.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                If your results show there's room to grow, we'll offer you personalized upskilling pathways — through our industry-grade programs — designed to help you become a{" "}
                <strong>high-impact individual in AI and full-stack development.</strong>
              </p>
            </div>

            {/* Your performance can unlock */}
            <div className="bg-white rounded-3xl p-8 shadow-lg border border-[#DADADA]">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🚀</span>
                <h3 className="text-xl font-bold text-[#2C5F7F]">Your performance here can unlock</h3>
              </div>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">🏢</span>
                  <span>Direct access to interviews with hiring partners</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">💡</span>
                  <span>Personalized feedback on your current strengths and areas to grow</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#4A90A4] font-bold">🎯</span>
                  <span>A chance to join our flagship career-launching program and move closer to your dream job</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Final Section - Test Details and Pricing */}
        <div className="bg-gray-50 rounded-3xl p-4 my-8 border border-gray-200 shadow-lg ">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8">
            <div>
              <h2 className="text-3xl font-bold text-[#2C5F7F] mb-4">
                Post-Bootcamp Assessment:<br />
                Your Path Forward Starts Here
              </h2>
              {/* <p className="text-gray-600 max-w-md">
                Take this test to showcase your learning and get personalized career guidance.
              </p> */}
            </div>

            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-gray-600 mb-2">Take this test for only</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-[48px] font-bold text-[#2C5F7F]">₹{assessmentPrice}</span>
                  <span className="text-gray-500 line-through">₹699</span>
                  {isPaymentCompleted && (
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                      ✓ Paid
                    </span>
                  )}
                </div>
              </div>

              {assessmentData?.status === "submitted" ? (
                <button
                  onClick={handleResumeAssessment}
                  className="px-8 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors"
                >
                  View Results
                </button>
              ) : assessmentData?.status === "in_progress" ? (
                <button
                  onClick={handleResumeAssessment}
                  className="px-8 py-4 bg-[#2C5F7F] text-white rounded-xl font-semibold text-lg hover:bg-[#1a4a5f] transition-colors"
                >
                  Resume Test
                </button>
              ) : (
                <button
                  onClick={handleStartAssessment}
                  disabled={paymentState.isProcessing}
                  className={`px-8 py-4 rounded-xl font-semibold text-lg transition-colors ${paymentState.isProcessing
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : isPaymentCompleted
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : assessmentData?.is_paid
                          ? 'bg-[#2C5F7F] text-white hover:bg-[#1a4a5f]'
                          : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {paymentState.isProcessing
                    ? 'Processing Payment...'
                    : isPaymentCompleted
                      ? 'Start Assessment Now'
                      : assessmentData?.is_paid
                        ? `Pay ₹${assessmentPrice} & Start Test`
                        : 'Start Free Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionPage;
