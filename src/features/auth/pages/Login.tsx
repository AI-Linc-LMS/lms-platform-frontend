import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../../../commonComponents/common-buttons/primary-button/PrimaryButton';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // Login logic here
    console.log('Login with:', email, password);
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

      {/* Right Section - Login Form */}
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
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Login to your account</h2>
          </div>
          
          <div className="mt-8 space-y-6">
            <div className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-[#255C79]">Forgot?</Link>
                </div>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
                    placeholder="Enter Your Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <PrimaryButton onClick={handleLogin}>
                Login now
              </PrimaryButton>
            </div>
            
            <div className="mt-6">
              <button
                type="button"
                className="w-full flex items-center justify-center border border-gray-300 h-14 rounded-xl bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <g clipPath="url(#clip0_3547_342)">
                    <path d="M19.805 10.2303C19.805 9.55056 19.7499 8.86711 19.6323 8.19836H10.2V12.0492H15.6014C15.3773 13.2911 14.6571 14.3898 13.5791 15.0879V17.5866H16.8001C18.6534 15.8449 19.805 13.2728 19.805 10.2303Z" fill="#4285F4"/>
                    <path d="M10.1999 20.0001C12.897 20.0001 15.1714 19.1147 16.8 17.5866L13.579 15.0879C12.6863 15.6918 11.5347 16.0403 10.1999 16.0403C7.5937 16.0403 5.38088 14.2832 4.58797 11.9167H1.26318V14.4927C2.88263 17.7588 6.30649 20.0001 10.1999 20.0001Z" fill="#34A853"/>
                    <path d="M4.58797 11.9166C4.39597 11.3124 4.2876 10.6658 4.2876 9.99984C4.2876 9.33384 4.39597 8.68724 4.58797 8.08306V5.50708H1.26318C0.57051 6.857 0.199951 8.39078 0.199951 9.99984C0.199951 11.609 0.57051 13.1427 1.26318 14.4926L4.58797 11.9166Z" fill="#FBBC05"/>
                    <path d="M10.1999 3.95981C11.6543 3.95981 12.9661 4.4842 14.0048 5.46934L16.8774 2.59662C15.1684 0.98921 12.8939 0 10.1999 0C6.30649 0 2.88263 2.24126 1.26318 5.50732L4.58797 8.0833C5.38088 5.71682 7.5937 3.95981 10.1999 3.95981Z" fill="#EA4335"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_3547_342">
                      <rect width="20" height="20" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
                Sign in with Google
              </button>
            </div>
            
            <div className="text-center text-sm">
              <span className="text-gray-500">Don't have an account? </span>
              <Link to="/signup" className="font-medium text-[#255C79]">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 