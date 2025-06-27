export interface PaymentConfig {
  type: PaymentType;
  type_id: string;
  clientId: number;
  amount: number;
  currency?: string;
  description: string;
  name: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  metadata?: Record<string, string | number | boolean>;
}

export enum PaymentType {
  COURSE = 'course',
  SUBSCRIPTION = 'subscription',
  CERTIFICATION = 'certification',
  PREMIUM_FEATURE = 'premium_feature',
  CONSULTATION = 'consultation',
  ASSESSMENT = 'assessment',
  WORKSHOP = 'workshop'
}

export interface CreateOrderResponse {
  order_id: string;
  amount: number;
  currency: string;
  key: string;
}

export interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentRequest {
  order_id: string;
  payment_id: string;
  signature: string;
  type_id?: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => Promise<void>;
  modal: {
    ondismiss: () => void;
  };
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  notes?: Record<string, string | number | boolean>;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  amount: number;
  error?: string;
  paymentType: PaymentType;
  typeId?: string;
}

export interface PaymentVerificationResponse {
  status: number;
  data?: unknown;
  message?: string;
}

export class RazorpayService {
  private static instance: RazorpayService;
  private isScriptLoaded = false;

  private constructor() {}

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  /**
   * Load Razorpay script if not already loaded
   */
  public async loadScript(): Promise<boolean> {
    if (this.isScriptLoaded || window.Razorpay) {
      return true;
    }

    return new Promise<boolean>((resolve, reject) => {
      try {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          this.isScriptLoaded = true;
          resolve(true);
        };
        script.onerror = () =>
          reject(new Error("Failed to load Razorpay script"));
        document.body.appendChild(script);
      } catch {
        reject(new Error("Failed to initialize Razorpay script"));
      }
    });
  }

  /**
   * Create payment order based on payment type
   */
  public async createOrder(config: PaymentConfig): Promise<CreateOrderResponse> {
    const { createOrder } = await import('./paymentGatewayApis');
    
    try {
      // Include type_id in metadata for the API call
      const enhancedMetadata = {
        ...config.metadata,
        type_id: config.type_id,
        // Add specific metadata keys based on payment type
        ...(config.type === PaymentType.ASSESSMENT && { assessmentId: config.type_id }),
        ...(config.type === PaymentType.WORKSHOP && { workshopId: config.type_id }),
      };

      // Pass payment type and enhanced metadata to createOrder API
      const orderData = await createOrder(
        config.clientId, 
        config.amount, 
        config.type, 
        enhancedMetadata
      );
      
      if (!orderData || !orderData.order_id || !orderData.key) {
        throw new Error("Failed to create payment order. Invalid response from server.");
      }

      return orderData;
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Failed to create payment order"
      );
    }
  }

  /**
   * Verify payment signature
   */
  public async verifyPayment(
    clientId: number,
    paymentData: VerifyPaymentRequest,
    paymentType: PaymentType,
    typeId?: string
  ): Promise<PaymentVerificationResponse> {
    const { verifyPayment } = await import('./paymentGatewayApis');
    
    try {
      // Include payment type and type_id in verification request
      const verificationData = {
        ...paymentData,
        payment_type: paymentType,
        type_id: typeId
      };
      
      const verifyRes = await verifyPayment(clientId, verificationData);
      return verifyRes;
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : "Payment verification failed"
      );
    }
  }

  /**
   * Initialize and open Razorpay payment gateway
   */
  public async initiatePayment(
    config: PaymentConfig,
    orderData: CreateOrderResponse,
    onSuccess: (result: PaymentResult) => void,
    onFailure: (error: string) => void,
    onDismiss?: () => void
  ): Promise<void> {
    try {
      // Ensure script is loaded
      const scriptLoaded = await this.loadScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load");
      }

      const options: RazorpayOptions = {
        key: orderData.key,
        amount: config.amount,
        currency: config.currency || orderData.currency || "INR",
        name: config.name,
        description: config.description,
        order_id: orderData.order_id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Validate Razorpay response
            if (
              !response.razorpay_order_id ||
              !response.razorpay_payment_id ||
              !response.razorpay_signature
            ) {
              throw new Error("Invalid payment response received from Razorpay");
            }

            const paymentVerifyData: VerifyPaymentRequest = {
              order_id: response.razorpay_order_id,
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };

            // Verify payment
            const verifyRes = await this.verifyPayment(config.clientId, paymentVerifyData, config.type, config.type_id);

            if (verifyRes.status === 200) {
              const result: PaymentResult = {
                success: true,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: config.amount,
                paymentType: config.type,
                typeId: config.type_id,
              };
              onSuccess(result);
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Payment verification failed";
            onFailure(errorMessage);
          }
        },
        modal: {
          ondismiss: () => {
            if (onDismiss) {
              onDismiss();
            }
          },
        },
        prefill: {
          name: config.prefill?.name || "User",
          email: config.prefill?.email || "user@example.com",
          contact: config.prefill?.contact || "",
        },
        theme: {
          color: config.theme?.color || "#255C79",
        },
        notes: config.metadata || {},
      };

      const rzp = new (window as unknown as { Razorpay: new (options: RazorpayOptions) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to initialize payment";
      onFailure(errorMessage);
    }
  }

  /**
   * Complete payment flow - create order and initiate payment
   */
  public async processPayment(
    config: PaymentConfig,
    onSuccess: (result: PaymentResult) => void,
    onFailure: (error: string) => void,
    onDismiss?: () => void,
    onOrderCreated?: (orderData: CreateOrderResponse) => void
  ): Promise<void> {
    try {
      // Validate config
      this.validatePaymentConfig(config);

      // Create order
      const orderData = await this.createOrder(config);
      
      if (onOrderCreated) {
        onOrderCreated(orderData);
      }

      // Initiate payment
      await this.initiatePayment(config, orderData, onSuccess, onFailure, onDismiss);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Payment processing failed";
      onFailure(errorMessage);
    }
  }

  /**
   * Validate payment configuration
   */
  private validatePaymentConfig(config: PaymentConfig): void {
    if (!config.clientId || config.clientId <= 0) {
      throw new Error("Invalid client ID provided");
    }

    if (!config.amount || config.amount <= 0) {
      throw new Error("Invalid amount provided");
    }

    if (!config.type || !Object.values(PaymentType).includes(config.type)) {
      throw new Error("Invalid payment type provided");
    }

    if (!config.type_id || config.type_id.trim() === "") {
      throw new Error("Payment type ID is required");
    }

    if (!config.name || config.name.trim() === "") {
      throw new Error("Payment name is required");
    }

    if (!config.description || config.description.trim() === "") {
      throw new Error("Payment description is required");
    }
  }

  /**
   * Get payment configuration templates for different payment types
   */
  public static getPaymentTemplate(type: PaymentType): Partial<PaymentConfig> {
    const templates: Record<PaymentType, Partial<PaymentConfig>> = {
      [PaymentType.COURSE]: {
        name: "AI-LINC Platform",
        description: "Course Access Payment",
        currency: "INR",
        theme: { color: "#255C79" },
      },
      [PaymentType.SUBSCRIPTION]: {
        name: "AI-LINC Platform",
        description: "Subscription Payment",
        currency: "INR",
        theme: { color: "#255C79" },
      },
      [PaymentType.CERTIFICATION]: {
        name: "AI-LINC Platform",
        description: "Certification Fee",
        currency: "INR",
        theme: { color: "#255C79" },
      },
      [PaymentType.PREMIUM_FEATURE]: {
        name: "AI-LINC Platform",
        description: "Premium Feature Access",
        currency: "INR",
        theme: { color: "#255C79" },
      },
      [PaymentType.CONSULTATION]: {
        name: "AI-LINC Platform",
        description: "Consultation Fee",
        currency: "INR",
        theme: { color: "#255C79" },
      },
      [PaymentType.ASSESSMENT]: {
        name: "AI-LINC Platform",
        description: "Assessment Fee",
        currency: "INR",
        theme: { color: "#255C79" },
      },
      [PaymentType.WORKSHOP]: {
        name: "AI-LINC Platform",
        description: "Workshop Registration Fee",
        currency: "INR",
        theme: { color: "#255C79" },
      },
    };

    return templates[type] || templates[PaymentType.COURSE];
  }
}

export default RazorpayService; 