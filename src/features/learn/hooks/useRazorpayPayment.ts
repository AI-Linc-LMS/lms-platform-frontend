import { useState, useCallback } from 'react';
import { verifyPayment, VerifyPaymentRequest } from '../../../services/payment/paymentGatewayApis';

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
  order_id?: string;
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
  onError?: (error: { description?: string; reason?: string; code?: string }) => void;
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

      // Step 2: Create Razorpay order directly (bypass backend for now)
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      
      if (!razorpayKey) {
        throw new Error('Razorpay key is not configured. Please check your environment variables.');
      }

      console.log('=== DIRECT RAZORPAY ORDER CREATION ===');
      console.log('Creating order with amount:', paymentData.amount);
      
      // Step 3: Initialize Razorpay checkout without pre-created order
      return new Promise((resolve) => {
        const options: RazorpayOptions = {
          key: razorpayKey,
          amount: paymentData.amount * 100, // Convert rupees to paise for Razorpay
          currency: 'INR',
          name: 'AI-LINC Course',
          description: 'Course Purchase with Scholarship Applied',
          // Remove order_id - let Razorpay create it automatically
          handler: async (response: RazorpayResponse) => {
            console.log('=== RAZORPAY RESPONSE DEBUG ===');
            console.log('Payment response received:', response);
            console.log('Raw Razorpay response structure:', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            
            // Validate all required fields are present
            if (!response.razorpay_order_id || !response.razorpay_payment_id || !response.razorpay_signature) {
              console.error('=== INCOMPLETE RAZORPAY RESPONSE ===');
              console.error('Missing required fields in Razorpay response:', {
                'Missing order_id': !response.razorpay_order_id,
                'Missing payment_id': !response.razorpay_payment_id,
                'Missing signature': !response.razorpay_signature,
                'Actual values': {
                  'razorpay_order_id': response.razorpay_order_id || 'UNDEFINED',
                  'razorpay_payment_id': response.razorpay_payment_id || 'UNDEFINED',
                  'razorpay_signature': response.razorpay_signature || 'UNDEFINED'
                }
              });
              
              setIsProcessing(false);
              setIsLoading(false);
              resolve({
                success: false,
                message: 'Incomplete payment data received from Razorpay. Please try again.',
                email: userEmail,
              });
              return;
            }
            
            try {
              // Step 4: Verify payment on backend
              const verifyRequest: VerifyPaymentRequest = {
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              };

              console.log('=== VERIFICATION REQUEST DEBUG ===');
              console.log('Sending verification request:', verifyRequest);
              
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
          onError: (error: { description?: string; reason?: string; code?: string }) => {
            console.error('=== RAZORPAY PAYMENT ERROR ===');
            console.error('Razorpay payment error:', error);
            
            setIsProcessing(false);
            setIsLoading(false);
            resolve({
              success: false,
              message: `Payment failed: ${error.description || error.reason || 'Please try again or contact support.'}`,
              email: userEmail,
            });
          },
        };

        console.log('=== RAZORPAY CONFIGURATION DEBUG ===');
        console.log('Razorpay configuration details:', {
          key: razorpayKey,
          amount: paymentData.amount * 100,
          currency: 'INR',
          'Amount validation': {
            'Original amount': paymentData.amount,
            'Converted amount (paise)': paymentData.amount * 100,
            'Is valid number': !isNaN(paymentData.amount * 100),
            'Is positive': (paymentData.amount * 100) > 0
          }
        });
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