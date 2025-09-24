import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { startAssessment } from "../../../services/assesment/assesmentApis";

// Comprehensive country codes data
const countryCodes = [
  { code: "+93", country: "Afghanistan", flag: "🇦🇫" },
  { code: "+355", country: "Albania", flag: "🇦🇱" },
  { code: "+213", country: "Algeria", flag: "🇩🇿" },
  { code: "+1", country: "American Samoa", flag: "🇦🇸" },
  { code: "+376", country: "Andorra", flag: "🇦🇩" },
  { code: "+244", country: "Angola", flag: "🇦🇴" },
  { code: "+1", country: "Anguilla", flag: "🇦🇮" },
  { code: "+1", country: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "+54", country: "Argentina", flag: "🇦🇷" },
  { code: "+374", country: "Armenia", flag: "🇦🇲" },
  { code: "+297", country: "Aruba", flag: "🇦🇼" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+994", country: "Azerbaijan", flag: "🇦🇿" },
  { code: "+1", country: "Bahamas", flag: "🇧🇸" },
  { code: "+973", country: "Bahrain", flag: "🇧🇭" },
  { code: "+880", country: "Bangladesh", flag: "🇧🇩" },
  { code: "+1", country: "Barbados", flag: "🇧🇧" },
  { code: "+375", country: "Belarus", flag: "🇧🇾" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+501", country: "Belize", flag: "🇧🇿" },
  { code: "+229", country: "Benin", flag: "🇧🇯" },
  { code: "+1", country: "Bermuda", flag: "🇧🇲" },
  { code: "+975", country: "Bhutan", flag: "🇧🇹" },
  { code: "+591", country: "Bolivia", flag: "🇧🇴" },
  { code: "+387", country: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "+267", country: "Botswana", flag: "🇧🇼" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+1", country: "British Virgin Islands", flag: "🇻🇬" },
  { code: "+673", country: "Brunei", flag: "🇧🇳" },
  { code: "+359", country: "Bulgaria", flag: "🇧🇬" },
  { code: "+226", country: "Burkina Faso", flag: "🇧🇫" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+237", country: "Cameroon", flag: "🇨🇲" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+238", country: "Cape Verde", flag: "🇨🇻" },
  { code: "+1", country: "Cayman Islands", flag: "🇰🇾" },
  { code: "+236", country: "Central African Republic", flag: "🇨🇫" },
  { code: "+235", country: "Chad", flag: "🇹🇩" },
  { code: "+56", country: "Chile", flag: "🇨🇱" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+57", country: "Colombia", flag: "🇨🇴" },
  { code: "+269", country: "Comoros", flag: "🇰🇲" },
  { code: "+242", country: "Congo", flag: "🇨🇬" },
  { code: "+243", country: "Congo (DRC)", flag: "🇨🇩" },
  { code: "+682", country: "Cook Islands", flag: "🇨🇰" },
  { code: "+506", country: "Costa Rica", flag: "🇨🇷" },
  { code: "+225", country: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "+385", country: "Croatia", flag: "🇭🇷" },
  { code: "+53", country: "Cuba", flag: "🇨🇺" },
  { code: "+357", country: "Cyprus", flag: "🇨🇾" },
  { code: "+420", country: "Czech Republic", flag: "🇨🇿" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+253", country: "Djibouti", flag: "🇩🇯" },
  { code: "+1", country: "Dominica", flag: "🇩🇲" },
  { code: "+1", country: "Dominican Republic", flag: "🇩🇴" },
  { code: "+593", country: "Ecuador", flag: "🇪🇨" },
  { code: "+20", country: "Egypt", flag: "🇪🇬" },
  { code: "+503", country: "El Salvador", flag: "🇸🇻" },
  { code: "+240", country: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "+291", country: "Eritrea", flag: "🇪🇷" },
  { code: "+372", country: "Estonia", flag: "🇪🇪" },
  { code: "+251", country: "Ethiopia", flag: "🇪🇹" },
  { code: "+500", country: "Falkland Islands", flag: "🇫🇰" },
  { code: "+298", country: "Faroe Islands", flag: "🇫🇴" },
  { code: "+679", country: "Fiji", flag: "🇫🇯" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+594", country: "French Guiana", flag: "🇬🇫" },
  { code: "+689", country: "French Polynesia", flag: "🇵🇫" },
  { code: "+241", country: "Gabon", flag: "🇬🇦" },
  { code: "+220", country: "Gambia", flag: "🇬🇲" },
  { code: "+995", country: "Georgia", flag: "🇬🇪" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+233", country: "Ghana", flag: "🇬🇭" },
  { code: "+350", country: "Gibraltar", flag: "🇬🇮" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+299", country: "Greenland", flag: "🇬🇱" },
  { code: "+1", country: "Grenada", flag: "🇬🇩" },
  { code: "+590", country: "Guadeloupe", flag: "🇬🇵" },
  { code: "+1", country: "Guam", flag: "🇬🇺" },
  { code: "+502", country: "Guatemala", flag: "🇬🇹" },
  { code: "+224", country: "Guinea", flag: "🇬🇳" },
  { code: "+245", country: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "+592", country: "Guyana", flag: "🇬🇾" },
  { code: "+509", country: "Haiti", flag: "🇭🇹" },
  { code: "+504", country: "Honduras", flag: "🇭🇳" },
  { code: "+852", country: "Hong Kong", flag: "🇭🇰" },
  { code: "+36", country: "Hungary", flag: "🇭🇺" },
  { code: "+354", country: "Iceland", flag: "🇮🇸" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+98", country: "Iran", flag: "🇮🇷" },
  { code: "+964", country: "Iraq", flag: "🇮🇶" },
  { code: "+353", country: "Ireland", flag: "🇮🇪" },
  { code: "+972", country: "Israel", flag: "🇮🇱" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+1", country: "Jamaica", flag: "🇯🇲" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+962", country: "Jordan", flag: "🇯🇴" },
  { code: "+7", country: "Kazakhstan", flag: "🇰🇿" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+686", country: "Kiribati", flag: "🇰🇮" },
  { code: "+965", country: "Kuwait", flag: "🇰🇼" },
  { code: "+996", country: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "+856", country: "Laos", flag: "🇱🇦" },
  { code: "+371", country: "Latvia", flag: "🇱🇻" },
  { code: "+961", country: "Lebanon", flag: "🇱🇧" },
  { code: "+266", country: "Lesotho", flag: "🇱🇸" },
  { code: "+231", country: "Liberia", flag: "🇱🇷" },
  { code: "+218", country: "Libya", flag: "🇱🇾" },
  { code: "+423", country: "Liechtenstein", flag: "🇱🇮" },
  { code: "+370", country: "Lithuania", flag: "🇱🇹" },
  { code: "+352", country: "Luxembourg", flag: "🇱🇺" },
  { code: "+853", country: "Macao", flag: "🇲🇴" },
  { code: "+389", country: "Macedonia", flag: "🇲🇰" },
  { code: "+261", country: "Madagascar", flag: "🇲🇬" },
  { code: "+265", country: "Malawi", flag: "🇲🇼" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+960", country: "Maldives", flag: "🇲🇻" },
  { code: "+223", country: "Mali", flag: "🇲🇱" },
  { code: "+356", country: "Malta", flag: "🇲🇹" },
  { code: "+692", country: "Marshall Islands", flag: "🇲🇭" },
  { code: "+596", country: "Martinique", flag: "🇲🇶" },
  { code: "+222", country: "Mauritania", flag: "🇲🇷" },
  { code: "+230", country: "Mauritius", flag: "🇲🇺" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+691", country: "Micronesia", flag: "🇫🇲" },
  { code: "+373", country: "Moldova", flag: "🇲🇩" },
  { code: "+377", country: "Monaco", flag: "🇲🇨" },
  { code: "+976", country: "Mongolia", flag: "🇲🇳" },
  { code: "+382", country: "Montenegro", flag: "🇲🇪" },
  { code: "+1", country: "Montserrat", flag: "🇲🇸" },
  { code: "+212", country: "Morocco", flag: "🇲🇦" },
  { code: "+258", country: "Mozambique", flag: "🇲🇿" },
  { code: "+95", country: "Myanmar", flag: "🇲🇲" },
  { code: "+264", country: "Namibia", flag: "🇳🇦" },
  { code: "+674", country: "Nauru", flag: "🇳🇷" },
  { code: "+977", country: "Nepal", flag: "🇳🇵" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+687", country: "New Caledonia", flag: "🇳🇨" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+505", country: "Nicaragua", flag: "🇳🇮" },
  { code: "+227", country: "Niger", flag: "🇳🇪" },
  { code: "+234", country: "Nigeria", flag: "🇳🇬" },
  { code: "+683", country: "Niue", flag: "🇳🇺" },
  { code: "+850", country: "North Korea", flag: "🇰🇵" },
  { code: "+1", country: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+968", country: "Oman", flag: "🇴🇲" },
  { code: "+92", country: "Pakistan", flag: "🇵🇰" },
  { code: "+680", country: "Palau", flag: "🇵🇼" },
  { code: "+970", country: "Palestine", flag: "🇵🇸" },
  { code: "+507", country: "Panama", flag: "🇵🇦" },
  { code: "+675", country: "Papua New Guinea", flag: "🇵🇬" },
  { code: "+595", country: "Paraguay", flag: "🇵🇾" },
  { code: "+51", country: "Peru", flag: "🇵🇪" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
  { code: "+1", country: "Puerto Rico", flag: "🇵🇷" },
  { code: "+974", country: "Qatar", flag: "🇶🇦" },
  { code: "+262", country: "Réunion", flag: "🇷🇪" },
  { code: "+40", country: "Romania", flag: "🇷🇴" },
  { code: "+7", country: "Russia", flag: "🇷🇺" },
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+1", country: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "+1", country: "Saint Lucia", flag: "🇱🇨" },
  { code: "+1", country: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "+685", country: "Samoa", flag: "🇼🇸" },
  { code: "+378", country: "San Marino", flag: "🇸🇲" },
  { code: "+239", country: "São Tomé and Príncipe", flag: "🇸🇹" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+221", country: "Senegal", flag: "🇸🇳" },
  { code: "+381", country: "Serbia", flag: "🇷🇸" },
  { code: "+248", country: "Seychelles", flag: "🇸🇨" },
  { code: "+232", country: "Sierra Leone", flag: "🇸🇱" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+421", country: "Slovakia", flag: "🇸🇰" },
  { code: "+386", country: "Slovenia", flag: "🇸🇮" },
  { code: "+677", country: "Solomon Islands", flag: "🇸🇧" },
  { code: "+252", country: "Somalia", flag: "🇸🇴" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
  { code: "+211", country: "South Sudan", flag: "🇸🇸" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+94", country: "Sri Lanka", flag: "🇱🇰" },
  { code: "+249", country: "Sudan", flag: "🇸🇩" },
  { code: "+597", country: "Suriname", flag: "🇸🇷" },
  { code: "+268", country: "Swaziland", flag: "🇸🇿" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+963", country: "Syria", flag: "🇸🇾" },
  { code: "+886", country: "Taiwan", flag: "🇹🇼" },
  { code: "+992", country: "Tajikistan", flag: "🇹🇯" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+670", country: "Timor-Leste", flag: "🇹🇱" },
  { code: "+228", country: "Togo", flag: "🇹🇬" },
  { code: "+690", country: "Tokelau", flag: "🇹🇰" },
  { code: "+676", country: "Tonga", flag: "🇹🇴" },
  { code: "+1", country: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "+216", country: "Tunisia", flag: "🇹🇳" },
  { code: "+90", country: "Turkey", flag: "🇹🇷" },
  { code: "+993", country: "Turkmenistan", flag: "🇹🇲" },
  { code: "+1", country: "Turks and Caicos Islands", flag: "🇹🇨" },
  { code: "+688", country: "Tuvalu", flag: "🇹🇻" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+380", country: "Ukraine", flag: "🇺🇦" },
  { code: "+971", country: "United Arab Emirates", flag: "🇦🇪" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+598", country: "Uruguay", flag: "🇺🇾" },
  { code: "+998", country: "Uzbekistan", flag: "🇺🇿" },
  { code: "+678", country: "Vanuatu", flag: "🇻🇺" },
  { code: "+379", country: "Vatican City", flag: "🇻🇦" },
  { code: "+58", country: "Venezuela", flag: "🇻🇪" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+1", country: "Virgin Islands (US)", flag: "🇻🇮" },
  { code: "+681", country: "Wallis and Futuna", flag: "🇼🇫" },
  { code: "+967", country: "Yemen", flag: "🇾🇪" },
  { code: "+260", country: "Zambia", flag: "🇿🇲" },
  { code: "+263", country: "Zimbabwe", flag: "🇿🇼" },
];

const PhoneVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get assessment ID from location state or fallback to default
  const assessmentId =
    location.state?.assessmentId || "ai-linc-scholarship-test";
  const referralCode = location.state?.referralCode;

  const [selectedCountryCode, setSelectedCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter countries based on search query
  const filteredCountries = countryCodes.filter(
    (country) =>
      country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchQuery(""); // Clear search when closing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const startAssessmentMutation = useMutation({
    mutationFn: ({
      phone,
      referralCode,
    }: {
      phone: string;
      referralCode: string | undefined;
    }) => startAssessment(clientId, assessmentId, phone, referralCode),
    onSuccess: () => {
      //console.log("Assessment started successfully:", data);
      navigate("/assessment/quiz", { state: { assessmentId } });
    },
    onError: () => {
      //console.error("Error starting assessment:", error);
      alert("Failed to start assessment. Please try again.");
    },
  });

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    setPhoneNumber(value);
    // Basic validation - adjust regex based on selected country
    const isValid =
      selectedCountryCode === "+91"
        ? /^\d{10}$/.test(value) // Indian numbers
        : /^\d{7,15}$/.test(value); // General international format
    setIsPhoneValid(isValid);
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    setIsDropdownOpen(false);
    setSearchQuery(""); // Clear search after selection
    // Revalidate phone number with new country code
    const isValid =
      countryCode === "+91"
        ? /^\d{10}$/.test(phoneNumber)
        : /^\d{7,15}$/.test(phoneNumber);
    setIsPhoneValid(isValid);
  };

  const handleStartAssessment = () => {
    if (isPhoneValid) {
      const fullPhoneNumber = `${selectedCountryCode}${phoneNumber}`;
      startAssessmentMutation.mutate({
        phone: fullPhoneNumber,
        referralCode: referralCode || undefined,
      });
    }
  };

  const selectedCountry = countryCodes.find(
    (c) => c.code === selectedCountryCode
  );

  return (
    <div className="min-h-screen bg-[var(--neutral-50)] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-lg max-w-md w-full mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          {/* Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#E8F4F8] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-[var(--primary-500)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              ></path>
            </svg>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 px-2">
            Before we Begin, Enter your Phone Number!
          </h1>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number<span className="text-red-500 ml-1">*</span>
            </label>

            <div className="flex flex-col sm:flex-row">
              {/* Country Code Dropdown */}
              <div className="relative mb-2 sm:mb-0" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative flex items-center justify-between w-full sm:w-auto px-3 py-3 border border-gray-300 rounded-xl sm:rounded-l-xl sm:rounded-r-none bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">
                      {selectedCountry?.flag}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedCountryCode}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 hidden sm:inline">
                      {selectedCountry?.country}
                    </span>
                  </div>
                  <svg
                    className="w-4 h-4 ml-2 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 sm:right-auto z-10 w-full sm:w-80 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <svg
                          className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          ></path>
                        </svg>
                        <input
                          type="text"
                          placeholder="Search countries..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] outline-none text-sm"
                        />
                      </div>
                    </div>

                    {/* Countries List */}
                    <div className="max-h-48 sm:max-h-60 overflow-y-auto">
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <button
                            key={`${country.code}-${country.country}`}
                            onClick={() => handleCountrySelect(country.code)}
                            className="w-full flex items-center px-3 sm:px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
                          >
                            <span className="mr-3 text-lg">{country.flag}</span>
                            <span className="text-sm font-medium text-gray-900 mr-2 flex-1 truncate">
                              {country.country}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
                              {country.code}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          No countries found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Number Input */}
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="Enter phone number"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl sm:rounded-r-xl sm:rounded-l-none sm:border-l-0 focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] outline-none transition-colors"
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
            className={`w-full py-3 sm:py-4 px-6 rounded-xl font-semibold text-base sm:text-lg transition-colors ${
              isPhoneValid && !startAssessmentMutation.isPending
                ? "bg-[var(--primary-500)] text-[var(--font-light)] hover:bg-[#1a4a5f] active:bg-[#0f3a4f]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {startAssessmentMutation.isPending
              ? "Starting Assessment..."
              : "Start Assessment"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationPage;
