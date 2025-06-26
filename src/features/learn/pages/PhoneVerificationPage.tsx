import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { startAssessment } from "../../../services/assesment/assesmentApis";

// Country codes data
const countryCodes = [
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+91", country: "IN", flag: "🇮🇳" },
  { code: "+44", country: "UK", flag: "🇬🇧" },
  { code: "+61", country: "AU", flag: "🇦🇺" },
  { code: "+86", country: "CN", flag: "🇨🇳" },
  { code: "+81", country: "JP", flag: "🇯🇵" },
  { code: "+49", country: "DE", flag: "🇩🇪" },
  { code: "+33", country: "FR", flag: "🇫🇷" },
  { code: "+39", country: "IT", flag: "🇮🇹" },
  { code: "+34", country: "ES", flag: "🇪🇸" },
  { code: "+7", country: "RU", flag: "🇷🇺" },
  { code: "+55", country: "BR", flag: "🇧🇷" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
  { code: "+82", country: "KR", flag: "🇰🇷" },
  { code: "+971", country: "AE", flag: "🇦🇪" },
];

const PhoneVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const startAssessmentMutation = useMutation({
    mutationFn: (phone: string) =>
      startAssessment(clientId, "ai-linc-scholarship-test", phone),
    onSuccess: (data) => {
      console.log("Assessment started successfully:", data);
      navigate("/assessment/quiz");
    },
    onError: (error) => {
      console.error("Error starting assessment:", error);
      alert("Failed to start assessment. Please try again.");
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setPhoneNumber(value);
    // Basic validation - adjust regex based on selected country
    const isValid = selectedCountryCode === "+91" ? 
      /^\d{10}$/.test(value) : // Indian numbers
      /^\d{7,15}$/.test(value); // General international format
    setIsPhoneValid(isValid);
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setIsDropdownOpen(false);
    // Revalidate phone number with new country code
    const isValid = countryCode === "+91" ? 
      /^\d{10}$/.test(phoneNumber) : 
      /^\d{7,15}$/.test(phoneNumber);
    setIsPhoneValid(isValid);
  };

  const handleStartAssessment = () => {
    if (isPhoneValid) {
      const fullPhoneNumber = `${selectedCountryCode}${phoneNumber}`;
      startAssessmentMutation.mutate(fullPhoneNumber);
    }
  };

  const selectedCountry = countryCodes.find(c => c.code === selectedCountryCode);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          {/* Icon */}
          <div className="w-20 h-20 bg-[#E8F4F8] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#255C79]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Before we Begin, Verify your Phone Number!
          </h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number<span className="text-red-500 ml-1">*</span>
            </label>
            
            <div className="flex">
              {/* Country Code Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex items-center px-3 py-3 border border-gray-300 rounded-l-xl bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79] transition-colors"
                >
                  <span className="mr-2">{selectedCountry?.flag}</span>
                  <span className="text-sm font-medium text-gray-700">{selectedCountryCode}</span>
                  <svg className="w-4 h-4 ml-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 z-10 w-64 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {countryCodes.map((country) => (
                      <button
                        key={country.code}
                        onClick={() => handleCountrySelect(country.code)}
                        className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                      >
                        <span className="mr-3">{country.flag}</span>
                        <span className="text-sm font-medium text-gray-900 mr-2">{country.country}</span>
                        <span className="text-sm text-gray-500">{country.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter phone number"
                className="flex-1 px-4 py-3 border border-l-0 border-gray-300 rounded-r-xl focus:ring-2 focus:ring-[#255C79] focus:border-[#255C79] outline-none transition-colors"
                maxLength={15}
              />
            </div>
            
            {phoneNumber && !isPhoneValid && (
              <p className="mt-2 text-sm text-red-600">
                Please enter a valid phone number
              </p>
            )}
          </div>

          <button
            onClick={handleStartAssessment}
            disabled={!isPhoneValid || startAssessmentMutation.isPending}
            className={`w-full py-3 px-6 rounded-xl font-semibold text-lg transition-colors ${
              isPhoneValid && !startAssessmentMutation.isPending
                ? "bg-[#255C79] text-white hover:bg-[#1a4a5f]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {startAssessmentMutation.isPending ? "Starting Assessment..." : "Start Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage; 