import { useState, useCallback } from 'react';
import { createOrder, verifyPayment, CreateOrderRequest, VerifyPaymentRequest } from '../../../services/payment/paymentGatewayApis';

// Function to load Razorpay script dynamically
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.getElementById('razorpay-script');
    if (existingScript) {
      existingScript.onload = () => resolve(true);
      existingScript.onerror = () => resolve(false);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Declare Razorpay types for TypeScript
interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayPaymentData {
  amount: number;
  clientId: number;
  assessmentId: string | number;
  scholarshipPercentage: number;
  originalPrice: number;
}

export interface PaymentResult {
  success: boolean;
  message?: string;
  transactionId?: string;
  orderId?: string;
  amount?: number;
  paymentId?: string;
  signature?: string;
  email: string;
}

export const useRazorpayPayment = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processRazorpayPayment = useCallback(async (paymentData: RazorpayPaymentData): Promise<PaymentResult> => {
    setIsProcessing(true);
    setIsLoading(true);

    // Get user email from localStorage
    const userStr = localStorage.getItem('user');
    let userEmail = '';
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        userEmail = user.email || '';
      } catch {
        console.warn('Failed to parse user data from localStorage');
      }
    }

    try {
      // Step 1: Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error('Failed to load Razorpay script. Please check your internet connection.');
      }

      // Step 2: Create order on backend
      const orderRequest: CreateOrderRequest = {
        amount: paymentData.amount, // Send amount in rupees as backend expects
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        assessment_id: paymentData.assessmentId.toString(),
        scholarship_percentage: paymentData.scholarshipPercentage,
        user_email: userEmail,
        notes: {
          assessmentId: paymentData.assessmentId.toString(),
          scholarshipPercentage: paymentData.scholarshipPercentage.toString(),
          originalPrice: paymentData.originalPrice.toString(),
        }
      };

      const order = await createOrder(orderRequest);
      console.log('Order created:', order);

      // Step 3: Initialize Razorpay checkout
      return new Promise((resolve) => {
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
        console.log('Razorpay Key:', razorpayKey ? 'Present' : 'Missing');
        console.log('Order details:', order);
        console.log('Amount conversion:', {
          'Backend amount (rupees)': order.amount,
          'Razorpay amount (paise)': order.amount * 100,
          'Display amount': `₹${order.amount.toLocaleString()}`
        });

        if (!razorpayKey) {
          resolve({
            success: false,
            message: 'Razorpay key is not configured. Please check your environment variables.',
            email: userEmail,
          });
          return;
        }

        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: order.amount * 100, // Convert rupees to paise for Razorpay
          currency: order.currency,
          name: 'AI-LINC Course',
          description: 'Course Purchase with Scholarship Applied',
          order_id: order.id,
          handler: async (response: RazorpayResponse) => {
            console.log('Payment response received:', response);
            try {
              // Step 4: Verify payment on backend
              const verifyRequest: VerifyPaymentRequest = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              };

              const verificationResult = await verifyPayment(verifyRequest);
              console.log('Verification result:', verificationResult);
              
              if (verificationResult.success) {
                setIsProcessing(false);
                setIsLoading(false);
                resolve({
                  success: true,
                  message: 'Payment successful! You now have lifetime access to the course.',
                  transactionId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  amount: paymentData.amount,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  email: userEmail,
                });
              } else {
                setIsProcessing(false);
                setIsLoading(false);
                resolve({
                  success: false,
                  message: verificationResult.message || 'Payment verification failed',
                  email: userEmail,
                });
              }
            } catch (error) {
              console.error('Payment verification error:', error);
              setIsProcessing(false);
              setIsLoading(false);
              resolve({
                success: false,
                message: 'Payment verification failed. Please contact support.',
                email: userEmail,
              });
            }
          },
          prefill: {
            name: userEmail ? userEmail.split('@')[0] : '',
            email: userEmail,
            contact: '',
          },
          theme: {
            color: '#255C79',
          },
          modal: {
            ondismiss: () => {
              console.log('Payment modal dismissed');
              setIsProcessing(false);
              setIsLoading(false);
              resolve({
                success: false,
                message: 'Payment cancelled by user',
                email: userEmail,
              });
            },
          },
        };

        console.log('Razorpay options:', options);
        console.log('Creating Razorpay instance...');
        
        try {
          const razorpay = new window.Razorpay(options);
          console.log('Razorpay instance created, opening checkout...');
          razorpay.open();
        } catch (error) {
          console.error('Error creating Razorpay instance:', error);
          resolve({
            success: false,
            message: 'Failed to open payment gateway. Please try again.',
            email: userEmail,
          });
        }
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      setIsProcessing(false);
      setIsLoading(false);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to initiate payment',
        email: userEmail,
      };
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    isLoading,
    processRazorpayPayment,
  };
}; 