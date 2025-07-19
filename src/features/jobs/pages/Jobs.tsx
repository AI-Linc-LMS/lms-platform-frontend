import React, { useState, useMemo,} from "react";
import { useNavigate } from "react-router-dom";
import JobCard from "../components/JobCard";
import JobFilters from "../components/JobFilters";
import { Job } from "../types/jobs.types";
import { mockJobs } from "../data/mockJobs";
// import {
//   bookmarkJob,
//   getBookmarkedJobs,
// } from "../../../api/jobsApiService";
import JobApplicationModal from "../components/JobApplicationModal";

const Jobs: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [salaryFilter, setSalaryFilter] = useState({ min: 0, max: 200000 });
  const [remoteFilter, setRemoteFilter] = useState(false);
  // const [bookmarkedJobs, setBookmarkedJobs] = useState<string[]>([]);
  const [jobs] = useState<Job[]>(mockJobs);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  // Load bookmarked jobs on component mount
  // useEffect(() => {
  //   setBookmarkedJobs(getBookmarkedJobs());
  // }, []);

  const handleSearch = () => {
  };

  const handleApplyToJob = (job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    // Placeholder for application success logic
  };

  // const isBookmarked = (jobId: string) => {
  //   return bookmarkedJobs.includes(jobId);
  // };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // Search query filter
      if (
        searchQuery &&
        !job.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !job.company.toLowerCase().includes(searchQuery.toLowerCase())
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

      // Salary filter
      if (
        job.salary &&
        (job.salary.min < salaryFilter.min || job.salary.max > salaryFilter.max)
      ) {
        return false;
      }

      return true;
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
                {`${jobs.length} jobs found`} {searchQuery && `for "${searchQuery}"`}
              </p>
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
              </div>
            </div>

            <div className="lg:col-span-3">
              {filteredJobs.length === 0 ? (
                <div className="text-center py-12 sm:py-16">
                  <h3 className="text-lg sm:text-xl font-semibold text-[#343A40] mb-2">No jobs found</h3>
                  <p className="text-[#6C757D] mb-4 text-sm sm:text-base">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {filteredJobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      // onBookmark={() => handleBookmarkJob(job.id)}
                      // isBookmarked={isBookmarked(job.id)}
                      onApply={handleApplyToJob}
                    />
                  ))}
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
