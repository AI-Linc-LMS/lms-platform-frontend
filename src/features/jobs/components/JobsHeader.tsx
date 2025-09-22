import React from "react";

const JobsHeader: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#DEE2E6] p-6 md:p-8 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Content */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-[var(--default-primary)] rounded-full"></div>
            <span className="text-[var(--default-primary)] font-medium text-sm uppercase tracking-wide">
              Career Opportunities
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-[#343A40] mb-4 leading-tight">
            Find Your Dream Job
            <span className="block text-[var(--default-primary)]">Today</span>
          </h1>

          <p className="text-[var(--netural-300)] text-lg mb-6 leading-relaxed">
            Discover thousands of job opportunities from top companies. Take the
            next step in your career journey with positions that match your
            skills and aspirations.
          </p>

          <div className="flex flex-wrap gap-4 mb-6">
            <button className="px-6 py-3 bg-[var(--default-primary)] text-white rounded-lg hover:bg-[#1E4A63] transition-colors font-medium">
              Upload Resume
            </button>
            <button className="px-6 py-3 border border-[var(--default-primary)] text-[var(--default-primary)] rounded-lg hover:bg-[var(--default-primary)] hover:text-white transition-colors font-medium">
              Career Tips
            </button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--default-primary)]">
                1,200+
              </div>
              <div className="text-[var(--netural-300)] text-sm">
                Active Jobs
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#28A745]">850+</div>
              <div className="text-[var(--netural-300)] text-sm">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#17627A]">95%</div>
              <div className="text-[var(--netural-300)] text-sm">
                Success Rate
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Illustration/Visual */}
        <div className="relative">
          <div className="bg-gradient-to-br from-[var(--default-primary)] to-[#17627A] rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M20 6h-2V4c0-1.11-.89-2-2-2H8c-1.11 0-2 .89-2 2v2H4c-1.11 0-2 .89-2 2v11c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM8 4h8v2H8V4zm12 15H4V8h16v11z" />
                    <path d="M12 9c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Ready to Start?</h3>
                  <p className="text-white text-opacity-80 text-sm">
                    Join thousands of professionals
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">AI-powered job matching</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Direct company connections</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm">Career growth insights</span>
                </div>
              </div>

              <button className="mt-6 w-full py-3 bg-white text-[var(--default-primary)] rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Get Started Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobsHeader;
