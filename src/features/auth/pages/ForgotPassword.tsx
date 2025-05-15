import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../../../commonComponents/common-buttons/primary-button/PrimaryButton';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleResetPassword = () => {
    // Password reset logic here
    console.log('Reset password for:', email);
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Left Section - Background Image */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-r from-[#D7EFF6] to-[#E9F7FC]">
        <img 
          src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=1170" 
          alt="Office workspace" 
          className="h-full w-full object-cover opacity-70"
        />
      </div>

      {/* Right Section - Forgot Password Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center items-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20C0 31.0457 8.9543 40 20 40Z" fill="#000" />
                <path d="M12 13L28 27" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 27L28 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="ml-2 text-2xl font-semibold">Ai Inc</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {!submitted ? (
            <div className="mt-8 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div>
                <PrimaryButton onClick={handleResetPassword}>
                  Send reset link
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      If an account exists with {email}, we've sent a password reset link.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="text-center text-sm">
            <span className="text-gray-500">Remember your password? </span>
            <Link to="/login" className="font-medium text-[#255C79]">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 