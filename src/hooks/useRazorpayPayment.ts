import { useState, useCallback } from 'react';
import RazorpayService, { 
  PaymentConfig, 
  PaymentResult, 
  PaymentType, 
  CreateOrderResponse 
} from '../services/payment/razorpayService';

export interface PaymentState {
  isProcessing: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  result: PaymentResult | null;
  step: 'idle' | 'creating' | 'processing' | 'verifying' | 'complete' | 'error';
}

export interface UseRazorpayPaymentOptions {
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  onDismiss?: () => void;
  onOrderCreated?: (orderData: CreateOrderResponse) => void;
}

export interface UseRazorpayPaymentReturn {
  paymentState: PaymentState;
  initiatePayment: (config: PaymentConfig) => Promise<void>;
  resetPayment: () => void;
  createPaymentConfig: (
    type: PaymentType,
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>,
    type_id?: string
  ) => PaymentConfig;
}

export const useRazorpayPayment = (
  options: UseRazorpayPaymentOptions = {}
): UseRazorpayPaymentReturn => {
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    error: null,
    result: null,
    step: 'idle',
  });

  const razorpayService = RazorpayService.getInstance();

  const resetPayment = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      isSuccess: false,
      isError: false,
      error: null,
      result: null,
      step: 'idle',
    });
  }, []);

  const updatePaymentState = useCallback((updates: Partial<PaymentState>) => {
    setPaymentState(prev => ({ ...prev, ...updates }));
  }, []);

  const handleSuccess = useCallback((result: PaymentResult) => {
    updatePaymentState({
      isProcessing: false,
      isSuccess: true,
      isError: false,
      error: null,
      result,
      step: 'complete',
    });

    if (options.onSuccess) {
      options.onSuccess(result);
    }
  }, [options, updatePaymentState]);

  const handleError = useCallback((error: string) => {
    updatePaymentState({
      isProcessing: false,
      isSuccess: false,
      isError: true,
      error,
      result: null,
      step: 'error',
    });

    if (options.onError) {
      options.onError(error);
    }
  }, [options, updatePaymentState]);

  const handleDismiss = useCallback(() => {
    updatePaymentState({
      isProcessing: false,
      step: 'idle',
    });

    if (options.onDismiss) {
      options.onDismiss();
    }
  }, [options, updatePaymentState]);

  const handleOrderCreated = useCallback((orderData: CreateOrderResponse) => {
    updatePaymentState({
      step: 'processing',
    });

    if (options.onOrderCreated) {
      options.onOrderCreated(orderData);
    }
  }, [options, updatePaymentState]);

  const initiatePayment = useCallback(async (config: PaymentConfig) => {
    try {
      // Reset state and start processing
      updatePaymentState({
        isProcessing: true,
        isSuccess: false,
        isError: false,
        error: null,
        result: null,
        step: 'creating',
      });

      // Process payment using the service
      await razorpayService.processPayment(
        config,
        handleSuccess,
        handleError,
        handleDismiss,
        handleOrderCreated
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed';
      handleError(errorMessage);
    }
  }, [razorpayService, handleSuccess, handleError, handleDismiss, handleOrderCreated, updatePaymentState]);

  const createPaymentConfig = useCallback((
    type: PaymentType,
    clientId: number,
    amount: number,
    overrides: Partial<PaymentConfig> = {},
    type_id?: string
  ): PaymentConfig => {
    const template = RazorpayService.getPaymentTemplate(type);
    
    // Extract type_id from overrides or metadata - this is the key fix
    const finalTypeId = type_id || 
                       overrides.type_id || 
                       overrides.metadata?.type_id as string || 
                       overrides.metadata?.assessmentId as string ||
                       overrides.metadata?.workshopId as string ||
                       overrides.metadata?.courseId as string ||
                       overrides.metadata?.subscriptionId as string ||
                       overrides.metadata?.certificationId as string ||
                       overrides.metadata?.consultationId as string ||
                       `${type.toLowerCase()}-default-id`;
    
    const finalConfig = {
      type,
      clientId,
      amount,
      ...template,
      ...overrides,
      type_id: finalTypeId,
    } as PaymentConfig;
    
    return finalConfig;
  }, []);

  return {
    paymentState,
    initiatePayment,
    resetPayment,
    createPaymentConfig,
  };
};

// Convenience hooks for specific payment types
export const useCoursePayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateCoursePayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.COURSE,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateCoursePayment,
  };
};

export const useSubscriptionPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateSubscriptionPayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.SUBSCRIPTION,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateSubscriptionPayment,
  };
};

export const useCertificationPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateCertificationPayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.CERTIFICATION,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateCertificationPayment,
  };
};

export const useConsultationPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateConsultationPayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.CONSULTATION,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateConsultationPayment,
  };
};

export const usePremiumFeaturePayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiatePremiumFeaturePayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.PREMIUM_FEATURE,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiatePremiumFeaturePayment,
  };
};

export const useAssessmentPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateAssessmentPayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.ASSESSMENT,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateAssessmentPayment,
  };
};

export const useWorkshopPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateWorkshopPayment = useCallback((
    clientId: number,
    amount: number,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.WORKSHOP,
      clientId,
      amount,
      overrides
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateWorkshopPayment,
  };
};

export const useNanodegreePayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateNanodegreePayment = useCallback((
    clientId: number,
    amount: number,
    type_id?: string,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.PREBOOKING,
      clientId,
      amount,
      overrides,
      type_id || "nanodegree"
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateNanodegreePayment,
  };
};

export const useFlagshipPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiateFlagshipPayment = useCallback((
    clientId: number,
    amount: number,
    type_id?: string,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.PREBOOKING,
      clientId,
      amount,
      overrides,
      type_id || "flagship"
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiateFlagshipPayment,
  };
};

export const usePartialPayment = (options: UseRazorpayPaymentOptions = {}) => {
  const paymentHook = useRazorpayPayment(options);

  const initiatePartialPayment = useCallback((
    clientId: number,
    amount: number,
    type_id: string,
    overrides?: Partial<PaymentConfig>
  ) => {
    const config = paymentHook.createPaymentConfig(
      PaymentType.COURSE,
      clientId,
      amount,
      {
        ...overrides,
        metadata: {
          ...overrides?.metadata,
          partial_amount: amount,
        },
      },
      type_id // Use the type_id directly without modification
    );
    return paymentHook.initiatePayment(config);
  }, [paymentHook]);

  return {
    ...paymentHook,
    initiatePartialPayment,
  };
};

export default useRazorpayPayment; 