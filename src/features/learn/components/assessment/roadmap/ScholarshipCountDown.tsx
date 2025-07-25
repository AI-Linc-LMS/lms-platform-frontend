import React, { useState, useEffect } from "react";
import { differenceInDays, addDays } from 'date-fns';
import { ScholarshipRedemptionData } from "../types/assessmentTypes";
import { useSelector } from "react-redux";
import { UserState } from "../types/assessmentTypes";
import { useQuery } from "@tanstack/react-query";
import { getRoadmapPaymentStatus } from "../../../../../services/assesment/assesmentApis";
import {
    useFlagshipPayment,
} from "../../../../../hooks/useRazorpayPayment";
import { PaymentResult } from "../../../../../services/payment/razorpayService";

interface ScholarshipCountdownProps {
    assessmentDate?: string;
    expiryDays?: number;
    className?: string;
    redeemData: ScholarshipRedemptionData;
    clientId: number;
    assessmentId: string;
    // Callback functions for payment success
    onPaymentSuccess?: (result: PaymentResult, type: 'seat-booking') => void;
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

    // Check payment status
    const { data: flagshipPaymentStatus } = useQuery({
        queryKey: ["roadmap-payment-status-flagship", clientId, assessmentId],
        queryFn: () => getRoadmapPaymentStatus(clientId, "flagship"),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0,
        enabled: !!clientId,
    });

    const { data: flagshipCoursePaymentStatus } = useQuery({
        queryKey: ["flagship-course-payment-status", clientId, assessmentId],
        queryFn: () => getRoadmapPaymentStatus(clientId, "flagship-course"),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        staleTime: 0,
        enabled: !!clientId,
    });

    // Determine payment status
    const isFlagshipSeatBooked = flagshipPaymentStatus?.status === "paid";
    const isFlagshipCoursePaid = flagshipCoursePaymentStatus?.status === "paid";

    // Payment hooks
    const { paymentState: flagshipPaymentState, initiateFlagshipPayment } =
        useFlagshipPayment({
            onSuccess: (result: PaymentResult) => {
                showToast?.("success", "Seat Booked Successfully!", "Your Flagship seat has been reserved.");
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

    // Calculate values 
    const seatBookingPrice = 999;
    const originalPrice = redeemData?.total_amount || 120000;
    const scholarshipPrice = redeemData?.payable_amount || 10000;
    const scholarshipPercentage = redeemData?.percentage_scholarship || 90;
    const savingsAmount = originalPrice - scholarshipPrice;

    // Payment handler
    const handleSeatBookingPayment = () => {
        if (isFlagshipSeatBooked) {
            showToast?.("success", "Seat Already Booked", "Your seat is already reserved.");
            return;
        }

        if (isFlagshipCoursePaid) {
            showToast?.("success", "Course Already Purchased", "You have already purchased the complete Flagship Career Launchpad program.");
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

    // Processing state
    const isSeatBookingProcessing = flagshipPaymentState.isProcessing;

    return (
        <div className={`w-full bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-400 p-4 rounded-r-lg shadow-md ${className}`}>
            <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl"></span>
                    <h1 className="text-lg sm:text-xl font-bold text-yellow-700">
                        Congratulations! You’re eligible for the <span className="text-blue-700">Flagship Program</span> and have <span className="text-green-700">won a scholarship</span>
                    </h1>
                </div>
                {/* <p className="text-sm text-gray-700 mt-1">
                    Unlock your exclusive offer and accelerate your career journey with AILINC’s flagship course.
                </p> */}
                {/* Pricing and Discount Section */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-white rounded-lg p-3 shadow-sm border border-yellow-200 space-y-3 sm:space-y-0 sm:space-x-4">
                    <div className="w-full sm:w-auto text-center sm:text-left">
                    
                        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start space-y-2 sm:space-y-0 sm:space-x-2">
                           
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
                        <p className="text-sm text-gray-600 mt-2 text-center sm:text-left">
                            <strong>Flagship Career Launchpad Course</strong> - Complete program with mentorship & job referrals
                        </p>
                    </div>

                    {/* Seat Booking Button */}
                    <div className="w-full sm:w-auto">
                        {!isFlagshipCoursePaid && !isFlagshipSeatBooked && !isExpired && (
                            <button
                                onClick={handleSeatBookingPayment}
                                disabled={isSeatBookingProcessing}
                                className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {isSeatBookingProcessing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    `Book Seat for ₹${seatBookingPrice}`
                                )}
                            </button>
                        )}

                        {isFlagshipSeatBooked && !isFlagshipCoursePaid && (
                            <div className="text-blue-600 font-semibold text-center">
                                ✅ Seat Booked
                            </div>
                        )}

                        {isFlagshipCoursePaid && (
                            <div className="text-green-600 font-semibold text-center">
                                ✅ Course Purchased
                            </div>
                        )}
                    </div>
                </div>

                {/* Countdown Timer */}
                {!isExpired && !isFlagshipCoursePaid && (
                    <div className="text-center bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm font-semibold text-blue-600 mb-2">
                            ⏰ Scholarship expires in:
                        </p>
                        <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                            {['days', 'hours', 'minutes', 'seconds'].map((unit, index) => (
                                <React.Fragment key={unit}>
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm sm:text-lg font-bold text-blue-700 bg-white rounded-lg px-2 sm:px-3 py-1 shadow-md border-2 border-blue-200">
                                            {countdown[unit as keyof CountdownState].toString().padStart(2, '0')}
                                        </span>
                                        <span className="text-xs text-blue-600 mt-1 font-medium uppercase">
                                            {unit}
                                        </span>
                                    </div>
                                    {index < 3 && (
                                        <div className="text-sm sm:text-lg font-bold text-blue-700">:</div>
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                )}

                {/* Savings Information */}
                {!isFlagshipCoursePaid && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-xs sm:text-sm text-green-700">
                            💰 You save <strong>₹{savingsAmount.toLocaleString()}</strong> with this scholarship!
                        </p>
                    </div>
                )}

                {/* Expiry Notification */}
                {isExpired && !isFlagshipCoursePaid && (
                    <div className="text-center bg-red-50 border border-red-200 rounded-lg p-3">
                        <div className="text-red-600 font-bold text-base sm:text-lg">
                            ❌ Scholarship Offer Expired
                        </div>
                        <p className="text-xs sm:text-sm text-red-500 mt-1">
                            The special pricing is no longer available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScholarshipCountdown;
