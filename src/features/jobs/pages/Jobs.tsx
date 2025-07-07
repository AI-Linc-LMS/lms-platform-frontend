import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import JobCard from '../components/JobCard';
import JobFilters from '../components/JobFilters';
import FeaturedCompanies from '../components/FeaturedCompanies';
import { Job } from '../types/jobs.types';
import { mockJobs } from '../data/mockJobs';
import { fetchAIJobs, fetchRemoteJobs, fetchAllJobs, fetchTechJobs, bookmarkJob, getBookmarkedJobs } from '../../../api/jobsApiService';
import JobApplicationModal from '../components/JobApplicationModal';

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [salaryFilter, setSalaryFilter] = useState({ min: 0, max: 200000 });
  const [remoteFilter, setRemoteFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState<'sample-jobs' | 'ai-jobs' | 'remote-jobs' | 'all-jobs' | 'tech-jobs'>('sample-jobs');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showComingSoonModal] = useState(true);

  // Fetch jobs based on selected data source
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      try {
        let jobs: Job[] = [];

        switch (dataSource) {
          case 'sample-jobs':
            setError(null);
            jobs = mockJobs;
            break;
          case 'ai-jobs':
            jobs = await fetchAIJobs();
            setSuccessMessage('✅ AI jobs loaded from enhanced database (External APIs blocked by browser security)');
            break;
          case 'remote-jobs':
            jobs = await fetchRemoteJobs();
            setSuccessMessage('✅ Remote jobs loaded from enhanced database (External APIs blocked by browser security)');
            break;
          case 'all-jobs':
            jobs = await fetchAllJobs();
            setSuccessMessage('✅ All jobs loaded from enhanced database (External APIs blocked by browser security)');
            break;
          case 'tech-jobs':
            jobs = await fetchTechJobs();
            setSuccessMessage('✅ Tech jobs loaded from enhanced database (External APIs blocked by browser security)');
            break;
          default:
            jobs = mockJobs;
        }

        setJobs(jobs);
      } catch {
        setError('Unable to load jobs. Using sample data instead.');
        setJobs(mockJobs);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [dataSource]);

  // Load bookmarked jobs on component mount
  useEffect(() => {
    setBookmarkedJobs(getBookmarkedJobs());
  }, []);

  const handleSearch = () => {
  };

  const handleClearFilters = () => {
    setJobTypeFilter('');
    setExperienceFilter('');
    setSalaryFilter({ min: 0, max: 200000 });
    setRemoteFilter(false);
  };

  const handleBookmarkJob = (jobId: string) => {
    const success = bookmarkJob(jobId);
    if (success) {
      setBookmarkedJobs(getBookmarkedJobs());
      setSuccessMessage('Job bookmark updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleApplyToJob = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setSuccessMessage('Application submitted successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const isBookmarked = (jobId: string) => {
    return bookmarkedJobs.includes(jobId);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
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
  }, [jobs, searchQuery, locationFilter, jobTypeFilter, experienceFilter, remoteFilter, salaryFilter]);

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Coming Soon Modal */}
      {showComingSoonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-8 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-[#255C79] to-[#17627A] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Jobs Portal Coming Soon!
              </h2>
              <p className="text-gray-600 mb-6">
                We're working hard to bring you an amazing job search experience.
                Our jobs portal will be launching soon with exciting opportunities from top companies.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Expected Launch: Soon</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* <button
                onClick={() => setShowComingSoonModal(false)}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#255C79] to-[#17627A] text-white rounded-lg font-medium hover:from-[#1E4A63] hover:to-[#144F66] transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Preview Demo
              </button> */}
              <button
                onClick={() => navigate('/')}
                className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - blurred when modal is open */}
      <div className={showComingSoonModal ? 'filter blur-sm pointer-events-none' : ''}>
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

              {/* Data Source Toggle */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center items-center mb-8">
                <span className="text-sm font-medium opacity-90">Data Source:</span>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => setDataSource('sample-jobs')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === 'sample-jobs'
                        ? 'bg-white text-[#255C79]'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    📋 Sample
                  </button>
                  <button
                    onClick={() => setDataSource('ai-jobs')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === 'ai-jobs'
                        ? 'bg-white text-[#255C79]'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    🤖 AI Jobs
                  </button>
                  <button
                    onClick={() => setDataSource('remote-jobs')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === 'remote-jobs'
                        ? 'bg-white text-[#255C79]'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    🌍 Remote
                  </button>
                  <button
                    onClick={() => setDataSource('tech-jobs')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === 'tech-jobs'
                        ? 'bg-white text-[#255C79]'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    💻 Tech
                  </button>
                  <button
                    onClick={() => setDataSource('all-jobs')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dataSource === 'all-jobs'
                        ? 'bg-white text-[#255C79]'
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }`}
                  >
                    🔍 All Jobs
                  </button>
                </div>
              </div>

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

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header with Filters Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#343A40] mb-2">
                Job Opportunities
                {dataSource === 'ai-jobs' && <span className="text-lg ml-2">🤖 AI Jobs</span>}
                {dataSource === 'remote-jobs' && <span className="text-lg ml-2">🌍 Remote Jobs</span>}
                {dataSource === 'tech-jobs' && <span className="text-lg ml-2">💻 Tech Jobs</span>}
                {dataSource === 'all-jobs' && <span className="text-lg ml-2">🔍 All Jobs</span>}
              </h2>
              <p className="text-[#6C757D] text-sm sm:text-base">
                {loading ? 'Loading jobs...' : `${filteredJobs.length} jobs found`} {searchQuery && `for "${searchQuery}"`}
              </p>
              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Jobs...</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Fetching the latest opportunities from our enhanced job database...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Our database includes curated listings from top companies
                  </p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && !loading && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-800 font-medium">{successMessage}</span>
                  </div>
                  {successMessage.includes('External APIs blocked') && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">ℹ️ About External API Access</h4>
                      <div className="text-sm text-blue-800 space-y-1">
                        <p>• Modern browsers block direct API calls to external services for security (CORS policy)</p>
                        <p>• In production, this would be solved with a backend proxy or serverless functions</p>
                        <p>• Our enhanced mock database provides realistic job data for demonstration</p>
                        <p>• The application and bookmarking features work fully with all data sources</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && !loading && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
                  <svg className="w-5 h-5 text-amber-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-amber-800">{error}</span>
                </div>
              )}
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
              {loading ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#255C79]"></div>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#343A40] mb-2">Loading Jobs...</h3>
                  <p className="text-[#6C757D] text-sm sm:text-base mb-2">
                    Fetching the latest opportunities from multiple job APIs
                  </p>
                  <p className="text-[#6C757D] text-xs">
                    If this takes too long, we'll show you enhanced sample jobs instead
                  </p>
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-[#F8F9FA] rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#6C757D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#343A40] mb-2">No jobs found</h3>
                  <p className="text-[#6C757D] mb-4 text-sm sm:text-base">
                    {error ? 'There was an error loading jobs. Please try again.' : 'Try adjusting your search criteria or filters'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleClearFilters}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors font-medium"
                    >
                      Clear Filters
                    </button>
                    {error && (
                      <button
                        onClick={() => setDataSource('sample-jobs')}
                        className="px-4 sm:px-6 py-2 sm:py-3 border border-[#255C79] text-[#255C79] rounded-lg hover:bg-[#255C79] hover:text-white transition-colors font-medium"
                      >
                        View Sample Jobs
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      onBookmark={() => handleBookmarkJob(job.id)}
                      isBookmarked={isBookmarked(job.id)}
                      onApply={handleApplyToJob}
                    />
                  ))}
                </div>
              )}

              {/* Load More Button */}
              {filteredJobs.length > 0 && !loading && (
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

        {/* Application Modal */}
        {selectedJob && (
          <JobApplicationModal
            job={selectedJob}
            isOpen={showApplicationModal}
            onClose={() => {
              setShowApplicationModal(false);
              setSelectedJob(null);
            }}
            onSuccess={handleApplicationSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Jobs; 