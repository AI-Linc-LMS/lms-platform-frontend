# Razorpay Payment Service & Hooks

A reusable payment system for handling different types of payments using Razorpay gateway. This system provides a service class and React hooks for easy integration across your application.

## Features

- 🔧 **Reusable Service**: Single service class for all payment types
- 🎣 **React Hooks**: Type-specific hooks for different payment scenarios
- 🔒 **Type Safety**: Full TypeScript support with proper typing
- 🎯 **Payment Types**: Support for courses, subscriptions, certifications, consultations, and premium features
- 🛡️ **Error Handling**: Comprehensive error handling and validation
- 📱 **State Management**: Built-in payment state management
- 🔄 **Callbacks**: Customizable success, error, and dismiss callbacks

## Payment Types

The system supports the following payment types:

- `COURSE` - Course access payments
- `SUBSCRIPTION` - Subscription payments
- `CERTIFICATION` - Certification fee payments
- `CONSULTATION` - Consultation booking payments
- `PREMIUM_FEATURE` - Premium feature unlock payments

## Quick Start

### 1. Using Type-Specific Hooks

```tsx
import { useCoursePayment } from '../../hooks/useRazorpayPayment';

const CoursePaymentComponent = () => {
  const { paymentState, initiateCoursePayment } = useCoursePayment({
    onSuccess: (result) => {
      //console.log('Payment successful:', result);
      // Handle success (e.g., redirect to course)
    },
    onError: (error) => {
      //console.error('Payment failed:', error);
      // Handle error (e.g., show error message)
    }
  });

  const handlePayment = () => {
    initiateCoursePayment(
      12345, // clientId
      5999,  // amount in paise
      {
        prefill: {
          name: "John Doe",
          email: "john@example.com",
          contact: "9876543210"
        },
        metadata: {
          courseId: "react-advanced",
          discountApplied: 10
        }
      }
    );
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={paymentState.isProcessing}
    >
      {paymentState.isProcessing ? 'Processing...' : 'Pay Now'}
    </button>
  );
};
```

### 2. Using Generic Hook

```tsx
import { useRazorpayPayment, PaymentType } from '../../hooks/useRazorpayPayment';

const GenericPaymentComponent = () => {
  const { paymentState, initiatePayment, createPaymentConfig } = useRazorpayPayment({
    onSuccess: (result) => //console.log('Success:', result),
    onError: (error) => //console.error('Error:', error)
  });

  const handlePayment = () => {
    const config = createPaymentConfig(
      PaymentType.SUBSCRIPTION,
      12345, // clientId
      999,   // amount
      {
        description: "Monthly Premium Subscription",
        metadata: { planType: "premium" }
      }
    );
    
    initiatePayment(config);
  };

  return <button onClick={handlePayment}>Subscribe</button>;
};
```

### 3. Using Service Directly

```tsx
import RazorpayService, { PaymentType } from '../services/payment/razorpayService';

const paymentService = RazorpayService.getInstance();

const handleDirectPayment = async () => {
  const config = {
    type: PaymentType.COURSE,
    clientId: 12345,
    amount: 5999,
    name: "AI-LINC Platform",
    description: "Course Access Payment",
    prefill: {
      name: "John Doe",
      email: "john@example.com"
    }
  };

  await paymentService.processPayment(
    config,
    (result) => //console.log('Success:', result),
    (error) => //console.error('Error:', error)
  );
};
```

## Available Hooks

### Core Hook
- `useRazorpayPayment()` - Generic payment hook for all payment types

### Type-Specific Hooks
- `useCoursePayment()` - For course payments
- `useSubscriptionPayment()` - For subscription payments
- `useCertificationPayment()` - For certification payments
- `useConsultationPayment()` - For consultation payments
- `usePremiumFeaturePayment()` - For premium feature payments

## Hook Options

All hooks accept the same options:

```tsx
interface UseRazorpayPaymentOptions {
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  onDismiss?: () => void;
  onOrderCreated?: (orderData: CreateOrderResponse) => void;
}
```

## Payment State

The payment state provides comprehensive information about the current payment:

```tsx
interface PaymentState {
  isProcessing: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  result: PaymentResult | null;
  step: 'idle' | 'creating' | 'processing' | 'verifying' | 'complete' | 'error';
}
```

## Payment Configuration

### Basic Configuration

```tsx
interface PaymentConfig {
  type: PaymentType;
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
```

### Configuration Templates

The service provides pre-configured templates for each payment type:

```tsx
const courseTemplate = RazorpayService.getPaymentTemplate(PaymentType.COURSE);
// Returns: { name: "AI-LINC Platform", description: "Course Access Payment", ... }
```

## Error Handling

The system provides comprehensive error handling:

```tsx
const { paymentState } = useCoursePayment({
  onError: (error) => {
    // Handle specific error types
    if (error.includes('network')) {
      // Handle network errors
    } else if (error.includes('verification')) {
      // Handle verification errors
    } else {
      // Handle general errors
    }
  }
});

// Check error state
if (paymentState.isError) {
  //console.log('Payment error:', paymentState.error);
}
```

## Payment Flow

1. **Initialization**: Hook is initialized with callbacks
2. **Order Creation**: Payment order is created on backend
3. **Razorpay Launch**: Razorpay checkout is opened
4. **Payment Processing**: User completes payment
5. **Verification**: Payment signature is verified
6. **Success/Error**: Appropriate callback is triggered

## Migration from Existing Code

### Before (Old PaymentModal)
```tsx
const handlePayment = async () => {
  // 100+ lines of payment logic
  // Manual script loading
  // Manual order creation
  // Manual verification
  // Manual error handling
};
```

### After (New System)
```tsx
const { initiateCoursePayment } = useCoursePayment({
  onSuccess: (result) => handleSuccess(result),
  onError: (error) => handleError(error)
});

const handlePayment = () => {
  initiateCoursePayment(clientId, amount, overrides);
};
```

## Best Practices

1. **Use Type-Specific Hooks**: Use `useCoursePayment`, `useSubscriptionPayment`, etc. for better type safety
2. **Handle All Callbacks**: Always provide `onSuccess` and `onError` callbacks
3. **Validate Inputs**: Validate clientId and amount before initiating payment
4. **Show Payment State**: Use `paymentState` to show loading, success, and error states
5. **Provide User Feedback**: Show appropriate messages during payment flow
6. **Handle Dismissal**: Provide `onDismiss` callback for when user cancels payment

## Examples

See the `examples/PaymentExamples.tsx` file for comprehensive examples of all payment types and usage patterns.

## API Reference

### RazorpayService

#### Methods
- `getInstance()` - Get singleton instance
- `loadScript()` - Load Razorpay script
- `createOrder(config)` - Create payment order
- `verifyPayment(clientId, paymentData)` - Verify payment
- `initiatePayment(config, orderData, callbacks)` - Open Razorpay checkout
- `processPayment(config, callbacks)` - Complete payment flow

#### Static Methods
- `getPaymentTemplate(type)` - Get configuration template for payment type

### Hook Return Values

All hooks return:
- `paymentState` - Current payment state
- `initiatePayment` - Function to start payment (generic hook)
- `initiate[Type]Payment` - Function to start specific payment type
- `resetPayment` - Function to reset payment state
- `createPaymentConfig` - Function to create payment configuration

## Troubleshooting

### Common Issues

1. **Script Loading Failed**
   - Check internet connection
   - Verify Razorpay script URL is accessible

2. **Order Creation Failed**
   - Verify clientId is valid
   - Check amount is greater than 0
   - Ensure backend API is accessible

3. **Payment Verification Failed**
   - Check payment signature
   - Verify backend verification endpoint
   - Ensure payment was actually completed

4. **TypeScript Errors**
   - Ensure all required fields are provided in PaymentConfig
   - Check that callback functions match expected signatures

### Debug Mode

Enable debug logging by setting:
```tsx
const paymentService = RazorpayService.getInstance();
// Service automatically logs detailed information to //console
```

## License

This payment system is part of the AI-LINC platform and follows the same license terms. 