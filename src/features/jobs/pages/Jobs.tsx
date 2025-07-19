import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import JobCard from "../components/JobCard";
import JobFilters from "../components/JobFilters";
import { Job } from "../types/jobs.types";
import { mockJobs } from "../data/mockJobs";
import JobApplicationModal from "../components/JobApplicationModal";

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  // Fixed: Increased max salary to accommodate all jobs in mock data
  const [salaryFilter, setSalaryFilter] = useState({ min: 0, max: 10_00_000 });
  const [remoteFilter, setRemoteFilter] = useState(false);
  const [jobs] = useState<Job[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  // Fixed: Set initial visible jobs to show all available jobs
  const [visibleJobsCount, setVisibleJobsCount] = useState(12);

  const handleSearch = () => {
    // Optional: Add search analytics or validation here
    console.log("Search triggered with:", { searchQuery, locationFilter });
  };

  const handleApplyToJob = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    // Placeholder for application success logic
    console.log("Application submitted successfully");
  };

  const handleLoadMore = () => {
    const remainingJobs = filteredJobs.length - visibleJobsCount;
    const jobsToLoad = Math.min(remainingJobs, 6); // Load 6 more jobs at a time
    setVisibleJobsCount(prevCount => prevCount + jobsToLoad);
  };

  const filteredJobs = useMemo(() => {
    const filtered = jobs.filter((job) => {
      // Search query filter
      if (
        searchQuery &&
        !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Location filter
      if (
        locationFilter &&
        !job.location.toLowerCase().includes(locationFilter.toLowerCase())
      ) {
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

      // Fixed: Better salary filter logic - check if job salary range overlaps with filter range
      if (job.salary) {
        const jobMinSalary = job.salary.min;
        const jobMaxSalary = job.salary.max;
        const filterMinSalary = salaryFilter.min;
        const filterMaxSalary = salaryFilter.max;

        // Check if there's any overlap between job salary range and filter range
        const hasOverlap = jobMinSalary <= filterMaxSalary && jobMaxSalary >= filterMinSalary;
        
        if (!hasOverlap) {
          return false;
        }
      }

      return true;
    });

    // Sort filtered jobs: job with id '1' first, then by most recent posted date
    return filtered.sort((a, b) => {
      if (a.id === '1') return -1;
      if (b.id === '1') return 1;
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });
  }, [
    jobs,
    searchQuery,
    locationFilter,
    jobTypeFilter,
    experienceFilter,
    remoteFilter,
    salaryFilter,
  ]);

  // Debug: Log filtered jobs (remove this in production)
  console.log("Total jobs:", jobs.length);
  console.log("Filtered jobs:", filteredJobs.length);
  console.log("Current filters:", {
    searchQuery,
    locationFilter,
    jobTypeFilter,
    experienceFilter,
    remoteFilter,
    salaryFilter
  });

  const resetAllFilters = () => {
    setSearchQuery('');
    setLocationFilter('');
    setJobTypeFilter('');
    setExperienceFilter('');
    setRemoteFilter(false);
    setSalaryFilter({ min: 0, max: 10_00_000 }); // Reset to accommodate all jobs
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div>
        <div className="bg-gradient-to-br from-[#255C79] to-[#17627A] text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                Find Your Dream Job
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 opacity-90 max-w-3xl mx-auto">
                Discover thousands of job opportunities from top companies around the world
              </p>

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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#343A40] mb-2">
                Job Opportunities
              </h2>
              <p className="text-[#6C757D] text-sm sm:text-base">
                {`${filteredJobs.length} jobs found`} {searchQuery && `for "${searchQuery}"`}
              </p>
            </div>
            
            {/* Debug info - remove in production */}
            <div className="text-xs text-[#6C757D] bg-yellow-100 px-2 py-1 rounded">
              Debug: Total: {jobs.length}, Filtered: {filteredJobs.length}, Visible: {Math.min(visibleJobsCount, filteredJobs.length)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
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
                />
                
                {/* Debug filter values - remove in production */}
                <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
                  <h4 className="font-bold mb-2">Current Filters:</h4>
                  <div>Search: "{searchQuery}"</div>
                  <div>Location: "{locationFilter}"</div>
                  <div>Job Type: "{jobTypeFilter}"</div>
                  <div>Experience: "{experienceFilter}"</div>
                  <div>Remote: {remoteFilter ? "Yes" : "No"}</div>
                  <div>Salary: ₹{salaryFilter.min.toLocaleString()} - ₹{salaryFilter.max.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-md">
                  <div className="mb-6">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-16 w-16 mx-auto text-[#6C757D] opacity-50" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-[#343A40] mb-2">
                    No Jobs Found
                  </h3>
                  <p className="text-[#6C757D] mb-4 text-sm sm:text-base max-w-md mx-auto px-4">
                    We couldn't find any jobs matching your current search criteria. 
                    Try adjusting your filters or search terms.
                  </p>
                  <button 
                    onClick={resetAllFilters}
                    className="mt-4 px-6 py-2 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {filteredJobs.slice(0, visibleJobsCount).map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      onApply={handleApplyToJob}
                      className={index === 0 ? 'border-2 border-[#255C79]' : ''}
                    />
                  ))}

                  {visibleJobsCount < filteredJobs.length && (
                    <div className="text-center mt-8 sm:mt-12">
                      <button 
                        onClick={handleLoadMore}
                        className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-[#255C79] text-[#255C79] rounded-lg hover:bg-[#255C79] hover:text-white transition-colors font-medium flex items-center justify-center mx-auto"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 mr-2" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                        Load More Jobs ({filteredJobs.length - visibleJobsCount} remaining)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
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
  );
};

export default Jobs;