
export default function AccountInactive() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full bg-white shadow-lg rounded-2xl p-8 text-center">

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 flex items-center justify-center bg-red-100 rounded-full">
                        <svg
                            className="w-10 h-10 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m0-6h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9
                   9-9 9 4.03 9 9z"
                            />
                        </svg>
                    </div>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                    Your account is not active
                </h2>

                {/* Description */}
                <p className="text-gray-600 mb-6">
                    It looks like your account is currently inactive. Please contact our
                    support team to resolve this and regain access to your courses.
                </p>
            </div>
        </div>
    );
}
