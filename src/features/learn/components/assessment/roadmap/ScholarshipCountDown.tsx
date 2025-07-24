import React, { useState, useEffect } from "react";
import { differenceInDays, addDays } from 'date-fns';
import { ScholarshipRedemptionData } from "../types/assessmentTypes";
import { useSelector } from "react-redux";
import { UserState } from "../types/assessmentTypes";
import {
    useFlagshipPayment,
    useCoursePayment,
} from "../../../../../hooks/useRazorpayPayment";
import { PaymentResult } from "../../../../../services/payment/razorpayService";

interface ScholarshipCountdownProps {
    assessmentDate?: string;
    expiryDays?: number;
    className?: string;
    redeemData: ScholarshipRedemptionData;
    isFlagshipSeatBooked?: boolean;
    isFlagshipCoursePaid?: boolean;
    clientId: number;
    assessmentId: string;
    // Callback functions for payment success
    onPaymentSuccess?: (result: PaymentResult, type: 'seat-booking' | 'course-payment') => void;
    onPaymentError?: (error: string) => void;
    // For showing modals/toasts in parent component
    showToast?: (type: "success" | "error" | "warning" | "loading", title: string, message: string) => void;
}

interface CountdownState {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const ScholarshipCountdown: React.FC<ScholarshipCountdownProps> = ({
    assessmentDate,
    expiryDays = 7,
    className = "",
    redeemData,
    isFlagshipSeatBooked = false,
    isFlagshipCoursePaid = false,
    clientId,
    assessmentId,
    onPaymentSuccess,
    onPaymentError,
    showToast
}) => {
    const [scholarshipExpiryDate, setScholarshipExpiryDate] = useState<Date | null>(null);
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [countdown, setCountdown] = useState<CountdownState>({
        days: expiryDays,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    // Get user data
    const user = useSelector((state: { user: UserState }) => state.user);

    // Payment hooks
    const { paymentState: flagshipPaymentState, initiateFlagshipPayment } =
        useFlagshipPayment({
            onSuccess: (result: PaymentResult) => {
                showToast?.("success", "Seat Booked Successfully!", "Your Flagship seat has been reserved. You can now pay for the full course.");
                onPaymentSuccess?.(result, 'seat-booking');
            },
            onError: (error: string) => {
                showToast?.("error", "Payment Failed", error);
                onPaymentError?.(error);
            },
            onDismiss: () => {
                showToast?.("warning", "Payment Cancelled", "Payment was cancelled. You can try again anytime.");
            },
        });

    const { paymentState: flagshipCoursePaymentState, initiateCoursePayment: initiateFlagshipCoursePayment } =
        useCoursePayment({
            onSuccess: (result: PaymentResult) => {
                showToast?.("success", "Course Payment Successful!", "Your Flagship Career Launchpad access has been confirmed.");
                onPaymentSuccess?.(result, 'course-payment');
            },
            onError: (error: string) => {
                showToast?.("error", "Payment Failed", error);
                onPaymentError?.(error);
            },
            onDismiss: () => {
                showToast?.("warning", "Payment Cancelled", "Payment was cancelled. You can try again anytime.");
            },
        });

    // Set scholarship expiry date
    useEffect(() => {
        const expiryDate = assessmentDate
            ? addDays(new Date(assessmentDate), expiryDays)
            : addDays(new Date(), expiryDays);

        setScholarshipExpiryDate(expiryDate);
    }, [assessmentDate, expiryDays]);

    // Calculate time remaining (detailed format)
    useEffect(() => {
        const updateTimeRemaining = () => {
            if (scholarshipExpiryDate) {
                const now = new Date();
                const daysLeft = differenceInDays(scholarshipExpiryDate, now);

                if (daysLeft >= 0) {
                    const hoursLeft = Math.floor(
                        (scholarshipExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60)
                    ) % 24;

                    const minutesLeft = Math.floor(
                        (scholarshipExpiryDate.getTime() - now.getTime()) / (1000 * 60)
                    ) % 60;

                    let timeRemainingStr = '';
                    if (daysLeft > 0) {
                        timeRemainingStr += `${daysLeft} day${daysLeft !== 1 ? 's' : ''} `;
                    }
                    timeRemainingStr += `${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} `;
                    timeRemainingStr += `${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`;

                    setTimeRemaining(timeRemainingStr.trim());
                } else {
                    setTimeRemaining('Scholarship Expired');
                }
            } else {
                setTimeRemaining(`${expiryDays} days`);
            }
        };

        updateTimeRemaining();
        const intervalId = setInterval(updateTimeRemaining, 60000);

        return () => clearInterval(intervalId);
    }, [scholarshipExpiryDate, expiryDays]);

    // Countdown timer (seconds precision)
    useEffect(() => {
        const expiryDate = scholarshipExpiryDate || addDays(new Date(), expiryDays);

        const countdownInterval = setInterval(() => {
            const now = new Date();
            const difference = expiryDate.getTime() - now.getTime();

            if (difference > 0) {
                const d = Math.floor(difference / (1000 * 60 * 60 * 24));
                const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((difference % (1000 * 60)) / 1000);

                setCountdown({ days: d, hours: h, minutes: m, seconds: s });
            } else {
                clearInterval(countdownInterval);
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [scholarshipExpiryDate, expiryDays]);

    const isExpired = timeRemaining === 'Scholarship Expired';

    // Calculate values same as PaymentCardSection
    const seatBookingPrice = 999;
    const originalPrice = redeemData?.total_amount || 120000;
    const scholarshipPrice = redeemData?.payable_amount || 10000;
    const scholarshipPercentage = redeemData?.percentage_scholarship || 90;
    const savingsAmount = originalPrice - scholarshipPrice;

    // Calculate remaining amount after seat booking (same logic as PaymentCardSection)
    const remainingAmountAfterSeatBooking = isFlagshipSeatBooked
        ? (scholarshipPrice - seatBookingPrice)
        : scholarshipPrice;

    // Payment handlers
    const handleSeatBookingPayment = () => {
        if (isFlagshipCoursePaid) {
            showToast?.("success", "Already Purchased", "You have already purchased the complete Flagship Career Launchpad program.");
            return;
        }

        showToast?.("loading", "Processing Payment", "Initiating seat booking payment...");

        initiateFlagshipPayment(clientId, seatBookingPrice, "flagship", {
            prefill: {
                name: user.full_name || "User",
                email: user.email || "",
            },
            metadata: {
                assessmentId: assessmentId,
                type_id: "flagship",
                payment_type: "PREBOOKING",
            },
        });
    };

    const handleCoursePayment = () => {
        if (isFlagshipCoursePaid) {
            showToast?.("success", "Already Purchased", "You have already purchased the complete Flagship Career Launchpad program.");
            return;
        }

        const courseAmount = isFlagshipSeatBooked
            ? remainingAmountAfterSeatBooking
            : scholarshipPrice;

        showToast?.("loading", "Processing Payment", "Initiating course payment...");

        initiateFlagshipCoursePayment(clientId, courseAmount, {
            prefill: {
                name: user.full_name || "User",
                email: user.email || "",
            },
            metadata: {
                assessmentId: assessmentId,
                type_id: "flagship-course",
                payment_type: "COURSE",
            },
        });
    };

    // Separate processing states for different buttons
    const isSeatBookingProcessing = flagshipPaymentState.isProcessing;
    const isCoursePaymentProcessing = flagshipCoursePaymentState.isProcessing;
    const isAnyPaymentProcessing = isSeatBookingProcessing || isCoursePaymentProcessing;

    return (
        <div className={`w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md ${className}`}>
            <div className="flex flex-col space-y-3">
                {/* Header with Clock Icon */}
                <div className="flex items-center space-x-2">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-yellow-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                        />
                    </svg>
                    <h3 className="text-lg font-bold text-yellow-800">
                        🎓Congratulations, you are eligible for the Flagship Program and you have won the scholarship
                    </h3>
                </div>

                {/* Show status if already purchased or seat booked */}
                {isFlagshipCoursePaid ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <div className="text-green-600 font-bold text-lg">
                            ✅ Course Already Purchased!
                        </div>
                        <p className="text-green-600 text-sm mt-1">
                            You have full access to the Flagship Career Launchpad
                        </p>
                    </div>
                ) : isFlagshipSeatBooked ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <div className="text-blue-600 font-bold text-lg">
                            🎯 Seat Successfully Booked!
                        </div>
                        <p className="text-blue-600 text-sm mt-1">
                            Complete your enrollment by paying the remaining course fee
                        </p>
                    </div>
                ) : null}

                {/* Pricing Information */}
                <div className="bg-white rounded-lg p-3 shadow-sm border border-yellow-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-bold text-green-600">
                                ₹{scholarshipPrice.toLocaleString()}
                            </span>
                            <span className="text-lg text-gray-400 line-through">
                                ₹{originalPrice.toLocaleString()}
                            </span>
                        </div>
                        <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                            {scholarshipPercentage}% OFF
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                        <strong>Flagship Career Launchpad Course</strong> - Complete program with mentorship & job referrals
                    </p>
                    <div className="text-xs text-gray-500">
                        💰 You save ₹{savingsAmount.toLocaleString()} with this scholarship!
                    </div>
                </div>

                {/* Countdown Timer */}
                {!isExpired && !isFlagshipCoursePaid ? (
                    <div className="text-center">
                        <p className="text-sm font-semibold text-red-600 mb-2">
                            ⏰ Scholarship expires in:
                        </p>
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-red-700 bg-white rounded-lg px-3 py-1 shadow-md border-2 border-red-200">
                                    {countdown.days.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs text-red-600 mt-1 font-medium">DAYS</span>
                            </div>
                            <div className="text-lg font-bold text-red-700">:</div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-red-700 bg-white rounded-lg px-3 py-1 shadow-md border-2 border-red-200">
                                    {countdown.hours.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs text-red-600 mt-1 font-medium">HRS</span>
                            </div>
                            <div className="text-lg font-bold text-red-700">:</div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-red-700 bg-white rounded-lg px-3 py-1 shadow-md border-2 border-red-200">
                                    {countdown.minutes.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs text-red-600 mt-1 font-medium">MIN</span>
                            </div>
                            <div className="text-lg font-bold text-red-700">:</div>
                            <div className="flex flex-col items-center">
                                <span className="text-lg font-bold text-red-700 bg-white rounded-lg px-3 py-1 shadow-md border-2 border-red-200">
                                    {countdown.seconds.toString().padStart(2, '0')}
                                </span>
                                <span className="text-xs text-red-600 mt-1 font-medium">SEC</span>
                            </div>
                        </div>
                    </div>
                ) : isExpired && !isFlagshipCoursePaid ? (
                    <div className="text-center bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-red-600 font-bold text-lg">
                            ❌ Scholarship Offer Expired
                        </div>
                        <p className="text-red-500 text-sm mt-1">
                            The special pricing is no longer available
                        </p>
                    </div>
                ) : null}

                {/* Payment Options */}
                {!isExpired && !isFlagshipCoursePaid && (
                    <div className="space-y-3">
                        {/* Primary Payment Option */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white text-center">
                            <div className="mb-3">
                                {isFlagshipSeatBooked ? (
                                    <>
                                        <p className="text-sm opacity-90">🎯 Complete Your Enrollment!</p>
                                        <p className="text-xl font-bold">
                                            Pay Remaining ₹{remainingAmountAfterSeatBooking.toLocaleString()}
                                        </p>
                                        <p className="text-xs opacity-75 mt-1">
                                            Your seat is reserved. Complete the course payment to get full access.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm opacity-90">🚀 Secure your spot now!</p>
                                        <p className="text-xl font-bold">
                                            Book Now with Just ₹{seatBookingPrice}
                                        </p>
                                        <p className="text-xs opacity-75 mt-1">
                                            Reserve your seat and pay the remaining ₹{(scholarshipPrice - seatBookingPrice).toLocaleString()} later
                                        </p>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={isFlagshipSeatBooked ? handleCoursePayment : handleSeatBookingPayment}
                                disabled={isAnyPaymentProcessing}
                                className="w-full bg-white cursor-pointer text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {/* Show specific processing state for this button */}
                                {(isFlagshipSeatBooked ? isCoursePaymentProcessing : isSeatBookingProcessing) ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : isFlagshipSeatBooked ? (
                                    `💳 Pay Remaining ₹${remainingAmountAfterSeatBooking.toLocaleString()}`
                                ) : (
                                    `🎯 Book My Seat for ₹${seatBookingPrice}`
                                )}
                            </button>

                            <div className="flex items-center justify-center mt-2 text-xs opacity-75">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                100% Secure Payment | 7-day Money Back Guarantee
                            </div>
                        </div>

                        {/* Alternative Payment Option - Full Course Payment */}
                        {!isFlagshipSeatBooked && (
                            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white text-center">
                                <div className="mb-3">
                                    <p className="text-sm opacity-90">💎 Skip seat booking and get full access!</p>
                                    <p className="text-lg font-bold">
                                        Pay Full Course Fee ₹{scholarshipPrice.toLocaleString()}
                                    </p>
                                    <p className="text-xs opacity-75 mt-1">
                                        Instant access to the complete Flagship Career Launchpad program
                                    </p>
                                </div>

                                <button
                                    onClick={handleCoursePayment}
                                    disabled={isAnyPaymentProcessing}
                                    className="w-full bg-white cursor-pointer text-green-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {/* Show specific processing state for this button */}
                                    {isCoursePaymentProcessing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-600 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : (
                                        `🚀 Pay Full Amount ₹${scholarshipPrice.toLocaleString()}`
                                    )}
                                </button>

                                <p className="text-xs opacity-75 mt-2">
                                    ⚡ Recommended for immediate access
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Additional Info */}
                {!isFlagshipCoursePaid && (
                    <div className="text-center">
                        <p className="text-xs text-gray-500">
                            ⚡ Only <strong>30 seats</strong> available at this price |
                            <strong> {Math.max(0, countdown.days)} days</strong> left to claim
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScholarshipCountdown;
