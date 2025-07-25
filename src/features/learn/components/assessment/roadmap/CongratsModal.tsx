import React, { useState, useEffect, useRef } from "react";

interface CongratsModalProps {
    open: boolean;
    onClose: () => void;
}

const CongratsModal: React.FC<CongratsModalProps> = ({ open, onClose }) => {
    const [, setCountdown] = useState(3);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!open) {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            return;
        }

        // Reset countdown
        setCountdown(3);

        const startCountdown = () => {
            timerRef.current = setTimeout(() => {
                setCountdown(prevCount => {
                    const newCount = prevCount - 1;

                    if (newCount <= 0) {
                        if (timerRef.current) {
                            clearTimeout(timerRef.current);
                            timerRef.current = null;
                        }
                        onClose();
                        return 0;
                    }

                    // Schedule next countdown
                    startCountdown();
                    return newCount;
                });
            }, 1000);
        };

        // Start the initial countdown
        startCountdown();

        // Cleanup function
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-blue-100 p-8 max-w-md w-full mx-4 text-center relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Content */}
                <h2 className="text-3xl font-bold text-blue-700 mb-4">🎉 Assessment Submitted!</h2>
                <p className="text-gray-600 mb-6">
                    You did it! Now it's time to see where you shine. Download your Certificate and Check your Placement Report.
                </p>

                {/* Link */}
                <a
                    href="https://ailinc.com/flagship-course"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
                >
                   Apply for scholarship
                </a>

                {/* Progress Bar */}
                {/* <div className="w-full bg-blue-100 rounded-full h-3 mb-4 overflow-hidden">
                    <div
                        className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                        style={{
                            width: `${Math.max(0, ((3 - countdown) / 3) * 100)}%`
                        }}
                    />
                </div> */}

                {/* Countdown Display */}
                {/* <div className="text-sm text-gray-600">
                    <span className="font-medium">Auto-closing in </span>
                    <span className="font-bold text-blue-600 text-lg">
                        {Math.max(0, countdown)}
                    </span>
                    <span className="font-medium"> second{countdown !== 1 ? 's' : ''}</span>
                </div> */}
            </div>
        </div>
    );
};

export default CongratsModal;
