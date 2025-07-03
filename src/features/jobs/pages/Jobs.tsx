import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import JobFilters from '../components/JobFilters';
import FeaturedCompanies from '../components/FeaturedCompanies';
import { mockJobs } from '../data/mockJobs';

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState({ min: 0, max: 200000 });
  const [remoteFilter, setRemoteFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    // Search functionality will be implemented
    console.log('Searching for:', searchQuery);
  };

  const handleClearFilters = () => {
    setJobTypeFilter('');
    setExperienceFilter('');
    setSalaryFilter({ min: 0, max: 200000 });
    setRemoteFilter(false);
  };

  const handleBookmarkJob = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(jobId)) {
        newBookmarks.delete(jobId);
      } else {
        newBookmarks.add(jobId);
      }
      return newBookmarks;
    });
  };

  const filteredJobs = useMemo(() => {
    return mockJobs.filter((job) => {
      // Search query filter
      if (searchQuery && !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !job.company.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Location filter
      if (locationFilter && !job.location.toLowerCase().includes(locationFilter.toLowerCase())) {
        return false;
      }

      // Job type filter
      if (jobTypeFilter && job.type !== jobTypeFilter) {
        return false;
      }

      // Experience filter
      if (experienceFilter && job.experienceLevel !== experienceFilter) {
        return false;
      }

      // Remote filter
      if (remoteFilter && !job.remote) {
        return false;
      }

      // Salary filter
      if (job.salary && (job.salary.min < salaryFilter.min || job.salary.max > salaryFilter.max)) {
        return false;
      }

      return true;
    });
  }, [mockJobs, searchQuery, locationFilter, jobTypeFilter, experienceFilter, remoteFilter, salaryFilter]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#255C79] to-[#17627A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Find Your Dream Job
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 opacity-90 max-w-3xl mx-auto">
              Discover thousands of job opportunities from top companies around the world
            </p>
            
            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white rounded-2xl p-3 sm:p-4 shadow-xl">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#6C757D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Job title, keywords, or company"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-[#343A40] placeholder-[#6C757D] border-0 focus:ring-0 text-base sm:text-lg"
                  />
                </div>
                
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-[#6C757D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Location"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 text-[#343A40] placeholder-[#6C757D] border-0 focus:ring-0 text-base sm:text-lg"
                  />
                </div>
                
                <button
                  onClick={handleSearch}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-[#255C79] text-white rounded-xl hover:bg-[#1E4A63] transition-colors font-semibold text-base sm:text-lg whitespace-nowrap"
                >
                  Search Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white border-b border-[#DEE2E6]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#255C79] mb-2">
                10,000+
              </div>
              <div className="text-sm sm:text-base text-[#6C757D]">Active Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#255C79] mb-2">
                5,000+
              </div>
              <div className="text-sm sm:text-base text-[#6C757D]">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#255C79] mb-2">
                100,000+
              </div>
              <div className="text-sm sm:text-base text-[#6C757D]">Job Seekers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#255C79] mb-2">
                98%
              </div>
              <div className="text-sm sm:text-base text-[#6C757D]">Success Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Companies */}
      {/* <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <FeaturedCompanies />
        </div>
      </div> */}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header with Filters Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#343A40] mb-2">
              Job Opportunities
            </h2>
            <p className="text-[#6C757D] text-sm sm:text-base">
              {filteredJobs.length} jobs found {searchQuery && `for "${searchQuery}"`}
            </p>
          </div>
          
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[#DEE2E6] rounded-lg text-[#495057] hover:bg-[#F8F9FA] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            Filters
            {(jobTypeFilter || experienceFilter || salaryFilter || remoteFilter) && (
              <span className="w-2 h-2 bg-[#255C79] rounded-full"></span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6">
              <JobFilters
                jobType={jobTypeFilter}
                onJobTypeChange={setJobTypeFilter}
                experience={experienceFilter}
                onExperienceChange={setExperienceFilter}
                salary={salaryFilter}
                onSalaryChange={setSalaryFilter}
                remote={remoteFilter}
                onRemoteChange={setRemoteFilter}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#6C757D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#343A40] mb-2">No jobs found</h3>
                <p className="text-[#6C757D] mb-4 text-sm sm:text-base">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onClick={() => navigate(`/jobs/${job.id}`)}
                    onBookmark={() => handleBookmarkJob(job.id)}
                    isBookmarked={bookmarkedJobs.has(job.id)}
                  />
                ))}
              </div>
            )}

            {/* Load More Button */}
            {filteredJobs.length > 0 && (
              <div className="text-center mt-8 sm:mt-12">
                <button className="px-6 sm:px-8 py-3 sm:py-4 border border-[#255C79] text-[#255C79] rounded-lg hover:bg-[#255C79] hover:text-white transition-colors font-medium">
                  Load More Jobs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

       {/* Featured Companies */}
       <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <FeaturedCompanies />
        </div>
      </div>

      {/* Newsletter Section */}
      {/* <div className="bg-[#255C79] text-white mt-12 sm:mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
              Stay Updated with New Opportunities
            </h2>
            <p className="text-lg sm:text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Get the latest job postings delivered directly to your inbox
            </p>
            
            <div className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-lg text-[#343A40] placeholder-[#6C757D] focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <button className="px-6 py-3 bg-white text-[#255C79] rounded-lg hover:bg-[#F8F9FA] transition-colors font-semibold whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default Jobs; 