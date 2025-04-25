import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PrimaryButton from '../../../commonComponents/common-buttons/primary-button/PrimaryButton';
import { useSignup } from '../../../hooks/useSignup';
import { toast } from 'react-hot-toast';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    slug: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const signupMutation = useSignup({
    onSuccess: () => {
      toast.success('Account created successfully! Please log in.');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    const { confirmPassword, ...signupData } = formData;
    // Generate slug from name if not provided
    signupData.slug = signupData.slug || signupData.name.toLowerCase().replace(/\s+/g, '-');
    console.log('Submitting signup data:', signupData);
    signupMutation.mutate(signupData);
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

      {/* Right Section - Signup Form */}
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
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Create an account</h2>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
                    placeholder="Create a password"
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

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full h-14 px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79]"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            <div>
              <PrimaryButton
                type="submit"
                disabled={signupMutation.isPending}
                className="w-full"
              >
                {signupMutation.isPending ? 'Creating account...' : 'Create account'}
              </PrimaryButton>
            </div>

            <div className="text-center text-sm">
              <span className="text-gray-500">Already have an account? </span>
              <Link to="/login" className="font-medium text-[#255C79]">
                Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup; 