import React, { useState, useEffect, useRef } from "react";
import { PersonalInfo } from "../types/resume";
import FormHeader from "./FormHeader";
import RichTextEditor from "./RichTextEditor";

interface PersonalInfoFormProps {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
  activeSubsection?: string;
  onSubsectionChange?: (subsection: string) => void;
}

const PersonalInfoForm: React.FC<PersonalInfoFormProps> = ({
  data,
  onChange,
  activeSubsection = "contacts",
  onSubsectionChange,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(
    data.imageUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync imagePreview with data.imageUrl when it changes externally
  useEffect(() => {
    setImagePreview(data.imageUrl || null);
  }, [data.imageUrl]);

  const handleChange = (field: keyof PersonalInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handleImageUrlChange = (url: string) => {
    handleChange("imageUrl", url);
    setImagePreview(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      alert("Image size should be less than 2MB. Please select a smaller image.");
      return;
    }

    // Read file and convert to base64 data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        handleChange("imageUrl", dataUrl);
        setImagePreview(dataUrl);
      }
    };
    reader.onerror = () => {
      alert("Failed to read image file. Please try again.");
    };
    reader.readAsDataURL(file);

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const loadSampleData = () => {
    const sampleData: PersonalInfo = {
      firstName: "Alex",
      lastName: "Johnson",
      imageUrl: "https://via.placeholder.com/150?text=AJ",
      title: "Senior Full Stack Developer",
      email: "alex.johnson@example.com",
      phone: "+1 (555) 987-6543",
      address: "456 Tech Avenue, San Francisco, CA 94105",
      location: "San Francisco, CA",
      website: "https://alexjohnson.dev",
      linkedin: "https://linkedin.com/in/alexjohnson",
      twitter: "https://twitter.com/alexjohnson",
      github: "https://github.com/alexjohnson",
      hackerrank: "https://www.hackerrank.com/alexjohnson",
      hackerearth: "https://www.hackerearth.com/@alexjohnson",
      codechef: "https://www.codechef.com/users/alexjohnson",
      leetcode: "https://leetcode.com/alexjohnson",
      cssbattle: "https://cssbattle.dev/player/alexjohnson",
      relevantExperience: "8",
      totalExperience: "10",
      summary:
        "Experienced full-stack developer with a passion for building scalable web applications. Specialized in React, Node.js, and cloud technologies. Led multiple projects from conception to deployment, resulting in improved user engagement and system performance. Strong background in algorithms and data structures with competitive programming experience.",
      careerObjective:
        "To leverage my technical expertise and leadership skills in a challenging role where I can contribute to innovative projects and drive technological advancements. Seeking opportunities to work with cutting-edge technologies and mentor junior developers.",
    };
    onChange(sampleData);
    if (sampleData.imageUrl) {
      setImagePreview(sampleData.imageUrl);
    }
  };

  const renderContacts = () => (
    <div className="space-y-3">
      {/* Name Fields */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="Alex"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="Johnson"
          />
        </div>
      </div>

      {/* Image Upload with Preview */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Profile Image
        </label>
        <div className="space-y-3">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          
          {/* Paste Image URL */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Paste Image URL
            </label>
          <input
            type="url"
            value={data.imageUrl || ""}
            onChange={(e) => handleImageUrlChange(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="https://example.com/profile.jpg"
          />
          </div>

          {/* Upload from Local */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Or Upload from Local
            </label>
            <button
              type="button"
              onClick={handleUploadClick}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-sm font-semibold shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              title="Upload from local device"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span>Upload from Local Device</span>
            </button>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="flex justify-center pt-2">
              <div className="relative w-32 h-32 rounded-full border-4 border-blue-200 shadow-lg overflow-hidden ring-4 ring-blue-100 bg-white p-1">
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover rounded-full"
                  onError={() => {
                    setImagePreview(null);
                    handleChange("imageUrl", "");
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Enter an image URL or upload from your device. Max size: 2MB. Image will be displayed in a circular format.
        </p>
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Title / Job Title
        </label>
        <input
          type="text"
          value={data.title || ""}
          onChange={(e) => handleChange("title", e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
          placeholder="Senior Full Stack Developer"
        />
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your current job title or professional designation
        </p>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="alex.johnson@example.com"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone *
          </label>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="+1 (555) 987-6543"
          />
        </div>
      </div>

      {/* Location and Address */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={data.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="San Francisco, CA"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            City, State, or Country (e.g., New York, NY)
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Address
          </label>
          <input
            type="text"
            value={data.address || ""}
            onChange={(e) => handleChange("address", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="123 Main St, San Francisco, CA 94102"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your full street address (optional)
          </p>
        </div>
      </div>

      {/* Website URL */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Website URL
        </label>
        <input
          type="url"
          value={data.website || ""}
          onChange={(e) => handleChange("website", e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
          placeholder="https://alexjohnson.dev"
        />
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Your personal website or portfolio URL
        </p>
      </div>

      {/* Experience Years */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Relevant Experience (Years)
          </label>
          <input
            type="text"
            value={data.relevantExperience || ""}
            onChange={(e) => handleChange("relevantExperience", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="8"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Years of experience directly related to your target role.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Total Experience (Years)
          </label>
          <input
            type="text"
            value={data.totalExperience || ""}
            onChange={(e) => handleChange("totalExperience", e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
            placeholder="10"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your total professional work experience.
          </p>
        </div>
      </div>
    </div>
  );

  const renderLinks = () => {
    const linkIcons: Record<string, React.ReactNode> = {
      linkedin: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      github: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
        </svg>
      ),
    };

    const links = [
      { key: "linkedin" as const, label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
      { key: "twitter" as const, label: "Twitter", placeholder: "https://twitter.com/username" },
      { key: "github" as const, label: "GitHub", placeholder: "https://github.com/username" },
      { key: "hackerrank" as const, label: "Hackerrank", placeholder: "https://www.hackerrank.com/username" },
      { key: "hackerearth" as const, label: "Hackerearth", placeholder: "https://www.hackerearth.com/@username" },
      { key: "codechef" as const, label: "Codechef", placeholder: "https://www.codechef.com/users/username" },
      { key: "leetcode" as const, label: "Leetcode", placeholder: "https://leetcode.com/username" },
      { key: "cssbattle" as const, label: "CSSBattle", placeholder: "https://cssbattle.dev/player/username" },
    ];

    return (
      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.key}>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              {linkIcons[link.key] || (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              )}
              {link.label}
            </label>
            <input
              type="url"
              value={data[link.key] || ""}
              onChange={(e) => handleChange(link.key, e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
              placeholder={link.placeholder}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderAbout = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          About Me *
        </label>
        <RichTextEditor
          value={data.summary}
          onChange={(html) => handleChange("summary", html)}
          placeholder="Write a brief professional summary that highlights your key skills, experience, and career goals..."
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Use the toolbar to format text with bold, italic, underline, bullet points, and numbered lists.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Career Objective
        </label>
        <RichTextEditor
          value={data.careerObjective || ""}
          onChange={(html) => handleChange("careerObjective", html)}
          placeholder="Write your career objective and professional goals..."
          className="w-full"
        />
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Describe your career goals and what you aim to achieve professionally.
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <FormHeader
        title="Basic Details"
        onLoadSample={loadSampleData}
        icon={
          <svg
            className="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        {[
          { id: "contacts", label: "Contacts" },
          { id: "links", label: "Links" },
          { id: "about", label: "About" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSubsectionChange?.(tab.id)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
              activeSubsection === tab.id
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on active subsection */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
        {activeSubsection === "contacts" && renderContacts()}
        {activeSubsection === "links" && renderLinks()}
        {activeSubsection === "about" && renderAbout()}
      </div>
    </div>
  );
};

export default PersonalInfoForm;
