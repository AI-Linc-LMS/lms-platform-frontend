import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import JobCard from "../components/JobCard";
import { Job } from "../types/jobs.types";
import JobApplicationModal from "../components/JobApplicationModal";
import AssessmentInvitationModal from "../components/AssessmentInvitationModal";
import { fetchJobsFromAPI, JobsApiFilters } from "../../../api/jobsApiService";
import { Loader2, AlertCircle } from "lucide-react";

const Jobs: React.FC = () => {
  const { t } = useTranslation();
  
  // Filter states
  const [jobTypeFilter, setJobTypeFilter] = useState<'job' | 'internship' | ''>('');
  const [designationFilter, setDesignationFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  
  // Job data states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [allAvailableJobs, setAllAvailableJobs] = useState<Job[]>([]);
  const [loadingAllJobs, setLoadingAllJobs] = useState(false);
  
  // UI states
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [visibleJobsCount, setVisibleJobsCount] = useState(12);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // Autocomplete states
  const [showDesignationSuggestions, setShowDesignationSuggestions] = useState(false);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  
  // Sidebar filter states (client-side filtering) - using arrays for multiple selections
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Extract unique values from loaded jobs for filters (limit locations to 10)
  // Use allAvailableJobs if no jobs found, otherwise use jobs
  const jobsForFilters = jobs.length === 0 && allAvailableJobs.length > 0 
    ? allAvailableJobs 
    : jobs;
  
  // Split comma-separated locations and flatten them
  const uniqueLocations = Array.from(
    new Set(
      jobsForFilters.flatMap(job => 
        job.location.split(',').map(loc => loc.trim())
      )
    )
  ).sort().slice(0, 10);
  
  const uniqueTags = Array.from(new Set(jobsForFilters.flatMap(job => job.tags))).sort();

  // Handlers for checkbox toggles
  const toggleLocation = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedLocations([]);
    setSelectedTags([]);
  };

  // Suggestion lists
  const designationSuggestions = [
    "web developer",
    "web designer",
    "full stack developer",
    "frontend developer",
    "backend developer",
    "software engineer",
    "data scientist",
    "data analyst",
    "machine learning engineer",
    "devops engineer",
    "ui/ux designer",
    "product manager",
    "business analyst",
    "qa engineer",
    "mobile developer",
  ];

  const locationSuggestions = [
    "hyderabad",
    "bangalore",
    "bengaluru",
    "mumbai",
    "delhi",
    "pune",
    "chennai",
    "kolkata",
    "gurgaon",
    "gurugram",
    "noida",
    "ahmedabad",
  ];

  // Location normalization - treat bengaluru and bangalore as the same
  const normalizeLocation = (location: string): string => {
    const normalized = location.toLowerCase().trim();
    if (normalized === 'bengaluru' || normalized === 'banglore') {
      return 'bangalore';
    }
    if (normalized === 'gurugram') {
      return 'gurgaon';
    }
    return normalized;
  };

  // Filter suggestions based on input
  const filteredDesignationSuggestions = designationSuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(designationFilter.toLowerCase())
  );

  const filteredLocationSuggestions = locationSuggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(locationFilter.toLowerCase())
  );

  // Fetch default jobs (all jobs in Hyderabad)
  const fetchDefaultJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all jobs in Hyderabad (no designation filter)
      const apiFilters: JobsApiFilters = {
        location: "hyderabad",
      };
      
      const response = await fetchJobsFromAPI(apiFilters);
      
      // Limit to first 100 jobs
      const limitedJobs = response.jobs.slice(0, 100);
      
      setJobs(limitedJobs);
      setTotalCount(response.count);
      setVisibleJobsCount(100);
    } catch (err) {
      setError("Failed to load jobs. Please try again.");
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch jobs from API with current filters
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // If no filters are set, fetch all jobs
      if (!jobTypeFilter && !designationFilter && !locationFilter && !experienceFilter) {
        await fetchDefaultJobs();
        return;
      }
      
      // If experience filter is empty but other filters exist, make multiple calls for 0, 1, 2 years
      if (!experienceFilter && (designationFilter || locationFilter || jobTypeFilter)) {
        const allJobs: Job[] = [];
        let totalCount = 0;
        
        const experienceLevels = ["0 Yrs", "1 Yrs", "2 Yrs"];
        
        for (const exp of experienceLevels) {
          try {
            const apiFilters: JobsApiFilters = {};
            
            if (jobTypeFilter) {
              apiFilters.job_type = jobTypeFilter;
            }
            
            if (designationFilter && designationFilter.trim()) {
              apiFilters.designation = designationFilter.trim();
            }
            
            if (locationFilter && locationFilter.trim()) {
              apiFilters.location = locationFilter.trim();
            }
            
            apiFilters.experience = exp;
            
            const response = await fetchJobsFromAPI(apiFilters);
            allJobs.push(...response.jobs);
            totalCount += response.count;
          } catch (err) {
            // Continue with other calls even if one fails
          }
        }
        
        // Remove duplicates
        const uniqueJobs = Array.from(
          new Map(allJobs.map(job => [job.id, job])).values()
        );
        
        setJobs(uniqueJobs);
        setTotalCount(uniqueJobs.length);
        setVisibleJobsCount(12);
        return;
      }
      
      // Single API call with all filters
      const apiFilters: JobsApiFilters = {};
      
      if (jobTypeFilter) {
        apiFilters.job_type = jobTypeFilter;
      }
      
      if (designationFilter && designationFilter.trim()) {
        apiFilters.designation = designationFilter.trim();
      }
      
      if (locationFilter && locationFilter.trim()) {
        apiFilters.location = normalizeLocation(locationFilter);
      }
      
      if (experienceFilter && experienceFilter.trim()) {
        apiFilters.experience = experienceFilter.trim();
      }
      
      const response = await fetchJobsFromAPI(apiFilters);
      setJobs(response.jobs);
      setTotalCount(response.count);
      setVisibleJobsCount(12);
    } catch (err) {
      setError("Failed to load jobs. Please try again.");
      setJobs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [jobTypeFilter, designationFilter, locationFilter, experienceFilter, fetchDefaultJobs]);

  // Fetch all available jobs (for "You might be interested in" section)
  const fetchAllAvailableJobs = useCallback(async () => {
    setLoadingAllJobs(true);
    try {
      // Fetch all jobs without any filters
      const response = await fetchJobsFromAPI({});
      setAllAvailableJobs(response.jobs.slice(0, 50)); // Limit to 50 jobs for suggestions
    } catch (err) {
      // Silently fail - we'll just not show suggestions
      setAllAvailableJobs([]);
    } finally {
      setLoadingAllJobs(false);
    }
  }, []);

  // Fetch default jobs on mount
  useEffect(() => {
    fetchDefaultJobs();
    // Also fetch all jobs for suggestions
    fetchAllAvailableJobs();
  }, [fetchDefaultJobs, fetchAllAvailableJobs]);

  const handleSearch = () => {
    fetchJobs();
  };

  const handleApplyToJob = (job: Job) => {
    setSelectedJob(job);
    setShowAssessmentModal(true);
  };

  const handleApplicationSuccess = () => {
    // Application submitted successfully
  };

  const handleLoadMore = () => {
    const remainingJobs = jobs.length - visibleJobsCount;
    const jobsToLoad = Math.min(remainingJobs, 6);
    setVisibleJobsCount((prevCount) => prevCount + jobsToLoad);
  };

  const resetAllFilters = () => {
    setJobTypeFilter('');
    setDesignationFilter("");
    setLocationFilter("");
    setExperienceFilter("");
    // Call fetchDefaultJobs directly since it doesn't depend on state
    fetchDefaultJobs();
  };

  // Client-side filtering (sidebar filters work on already fetched data)
  const filteredAndSortedJobs = [...jobs]
    .filter((job) => {
      // Location Filter (OR logic - match any selected location)
      if (selectedLocations.length > 0) {
        // Split job location by comma and check if any part matches selected locations
        const jobLocations = job.location.split(',').map(loc => normalizeLocation(loc.trim()));
        const matchesLocation = selectedLocations.some(selectedLoc => 
          jobLocations.some(jobLoc => jobLoc === normalizeLocation(selectedLoc))
        );
        if (!matchesLocation) return false;
      }

      // Tag Filter (OR logic - match any selected tag)
      if (selectedTags.length > 0) {
        const hasMatchingTag = selectedTags.some(tag => job.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      return true;
    })
    .sort((a, b) => {
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });

  const sortedJobs = filteredAndSortedJobs;
  
  // Filtered "You might be interested in" jobs (when no main results)
  // Apply sidebar filters to allAvailableJobs when main jobs array is empty
  const filteredSuggestedJobs = jobs.length === 0 && allAvailableJobs.length > 0
    ? [...allAvailableJobs]
        .filter((job) => {
          // Location Filter (OR logic - match any selected location)
          if (selectedLocations.length > 0) {
            const jobLocations = job.location.split(',').map(loc => normalizeLocation(loc.trim()));
            const matchesLocation = selectedLocations.some(selectedLoc => 
              jobLocations.some(jobLoc => jobLoc === normalizeLocation(selectedLoc))
            );
            if (!matchesLocation) return false;
          }

          // Tag Filter (OR logic - match any selected tag)
          if (selectedTags.length > 0) {
            const hasMatchingTag = selectedTags.some(tag => job.tags.includes(tag));
            if (!hasMatchingTag) return false;
          }

          return true;
        })
        .sort((a, b) => {
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
        })
    : [];

  return (
    <div className="min-h-screen bg-[var(--neutral-50)]">
      <div>
        <div className="bg-gradient-to-br from-[var(--primary-500)] to-[#17627A] text-[var(--font-light)] rounded-2xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-16 lg:py-20">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                {t("jobs.title")}
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 opacity-90 max-w-3xl mx-auto">
                {t("jobs.description")}
              </p>

              <div className="max-w-6xl mx-auto">
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    {/* Job Type Dropdown */}
                    <div className="lg:col-span-1">
                      <select
                        value={jobTypeFilter}
                        onChange={(e) => setJobTypeFilter(e.target.value as 'job' | 'internship' | '')}
                        className="w-full px-3 sm:px-4 py-3.5 sm:py-4 text-[var(--neutral-600)] border-2 border-[var(--neutral-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] text-sm sm:text-base font-medium bg-white hover:border-[var(--neutral-300)] transition-all shadow-sm"
                      >
                        <option value="">All Types</option>
                        <option value="job">Job</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>

                    {/* Designation Input with Autocomplete */}
                    <div className="lg:col-span-1 relative">
                      <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-[var(--primary-400)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Role"
                      value={designationFilter}
                      onChange={(e) => {
                        setDesignationFilter(e.target.value);
                        setShowDesignationSuggestions(true);
                      }}
                      onFocus={() => setShowDesignationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowDesignationSuggestions(false), 200)}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-[var(--neutral-600)] placeholder-[var(--neutral-400)] placeholder:text-xs sm:placeholder:text-sm border-2 border-[var(--neutral-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] text-sm sm:text-base font-medium hover:border-[var(--neutral-300)] transition-all shadow-sm"
                    />
                      </div>
                      {/* Suggestions Dropdown */}
                      {showDesignationSuggestions && filteredDesignationSuggestions.length > 0 && designationFilter && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--neutral-200)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredDesignationSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[var(--primary-50)] cursor-pointer text-[var(--neutral-500)] text-base text-left"
                              onClick={() => {
                                setDesignationFilter(suggestion);
                                setShowDesignationSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                    {/* Location Input with Autocomplete */}
                    <div className="lg:col-span-1 relative">
                      <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <svg
                        className="w-5 h-5 text-[var(--primary-400)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="City"
                      value={locationFilter}
                      onChange={(e) => {
                        setLocationFilter(e.target.value);
                        setShowLocationSuggestions(true);
                      }}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-[var(--neutral-600)] placeholder-[var(--neutral-400)] placeholder:text-xs sm:placeholder:text-sm border-2 border-[var(--neutral-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] text-sm sm:text-base font-medium hover:border-[var(--neutral-300)] transition-all shadow-sm"
                    />
                      </div>
                      {/* Suggestions Dropdown */}
                      {showLocationSuggestions && filteredLocationSuggestions.length > 0 && locationFilter && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-[var(--neutral-200)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {filteredLocationSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-[var(--primary-50)] cursor-pointer text-[var(--neutral-500)] text-base text-left"
                              onClick={() => {
                                setLocationFilter(suggestion);
                                setShowLocationSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Experience Input */}
                    <div className="lg:col-span-1">
                      <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                            <svg
                              className="w-5 h-5 text-[var(--primary-400)]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </div>
                          <input
                            type="text"
                            placeholder="Experience (in years)"
                            value={experienceFilter}
                            onChange={(e) => setExperienceFilter(e.target.value)}
                            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-[var(--neutral-600)] placeholder-[var(--neutral-400)] placeholder:text-xs sm:placeholder:text-sm border-2 border-[var(--neutral-200)] rounded-xl focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] text-sm sm:text-base font-medium hover:border-[var(--neutral-300)] transition-all shadow-sm"
                          />
                      </div>
                  </div>

                    {/* Search Button */}
                    <div className="lg:col-span-1">
                    <button
                      onClick={handleSearch}
                      className="w-full px-6 py-4 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-600)] text-white rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 font-bold text-sm sm:text-base flex items-center justify-center gap-2 group"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Search</span>
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex gap-6">
            {/* Filter Sidebar */}
            <div className={`${showFilterSidebar ? 'block' : 'hidden'} lg:block w-full lg:w-64 flex-shrink-0`}>
              <div className="bg-white rounded-xl shadow-sm border border-[var(--neutral-100)] sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="sticky top-0 bg-white z-10 p-6 pb-4 border-b border-[var(--neutral-100)]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[var(--neutral-600)]">Filters</h3>
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-[var(--primary-500)] hover:text-[var(--primary-600)] font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                
                <div className="p-6 pt-4">

                {/* Location Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[var(--neutral-600)] mb-3">
                    Location {selectedLocations.length > 0 && `(${selectedLocations.length})`}
                  </label>
                  <div className="space-y-2">
                    {uniqueLocations.map((location) => (
                      <label key={location} className="flex items-center cursor-pointer group hover:bg-[var(--neutral-50)] p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedLocations.includes(location)}
                          onChange={() => toggleLocation(location)}
                          className="w-4 h-4 text-[var(--primary-500)] border-gray-300 rounded focus:ring-[var(--primary-500)]"
                        />
                        <span className="ml-3 text-sm text-[var(--neutral-600)]">{location}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-[var(--neutral-600)] mb-3">
                    Skills/Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </label>
                  <div className="space-y-2">
                    {uniqueTags.slice(0, 20).map((tag) => (
                      <label key={tag} className="flex items-center cursor-pointer group hover:bg-[var(--neutral-50)] p-2 rounded transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => toggleTag(tag)}
                          className="w-4 h-4 text-[var(--primary-500)] border-gray-300 rounded focus:ring-[var(--primary-500)]"
                        />
                        <span className="ml-3 text-sm text-[var(--neutral-600)]">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--neutral-500)] mb-2">
                {t("jobs.opportunities.title")}
              </h2>
              <p className="text-[var(--neutral-300)] text-sm sm:text-base">
                    {loading ? (
                      `Loading ${jobTypeFilter === 'internship' ? 'internships' : 'jobs'}...`
                    ) : error ? (
                      <span className="text-orange-600">{error}</span>
                    ) : (
                      <>
                        {totalCount || jobs.length} {jobTypeFilter === 'internship' ? 'internships' : 'jobs'} found
                        {designationFilter && ` for ${designationFilter}`}
                      </>
                    )}
              </p>
            </div>

                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white border border-[var(--neutral-200)] rounded-lg hover:bg-[var(--neutral-50)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-medium text-sm">Filters</span>
                </button>
          </div>

              <div>
            {loading ? (
              <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-md">
                <Loader2 className="h-12 w-12 mx-auto text-[var(--primary-500)] animate-spin mb-4" />
                <p className="text-[var(--neutral-500)] text-lg">Loading jobs...</p>
              </div>
            ) : error && jobs.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-md">
                <AlertCircle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-[var(--neutral-500)] mb-2">
                  Error Loading Jobs
                </h3>
                <p className="text-[var(--neutral-300)] mb-4 text-sm sm:text-base max-w-md mx-auto px-4">
                  {error}
                </p>
                <button
                  onClick={fetchJobs}
                  className="mt-4 px-6 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors"
                >
                  Retry
                </button>
            </div>
            ) : sortedJobs.length === 0 ? (
                <div>
                  {/* No Jobs Found Message */}
                  <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-md mb-8">
                    <div className="mb-6">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-16 w-16 mx-auto text-[var(--neutral-300)] opacity-50"
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
                    <h3 className="text-lg sm:text-xl font-semibold text-[var(--neutral-500)] mb-2">
                      No {jobTypeFilter === 'internship' ? 'Internships' : 'Jobs'} Found
                    </h3>
                    <p className="text-[var(--neutral-300)] mb-4 text-sm sm:text-base max-w-md mx-auto px-4">
                      We couldn't find any {jobTypeFilter === 'internship' ? 'internships' : 'jobs'} matching your current search
                      criteria. Try adjusting your filters or search terms.
                    </p>
                    <button
                      onClick={resetAllFilters}
                      className="mt-4 px-6 py-2 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors"
                    >
                      Reset All Filters
                    </button>
                  </div>

                  {/* You Might Be Interested In Section */}
                  {allAvailableJobs.length > 0 && (
                    <div className="mt-8">
                      <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--neutral-600)] mb-2">
                          You Might Be Interested In
                        </h2>
                        <p className="text-[var(--neutral-400)] text-sm sm:text-base">
                          {filteredSuggestedJobs.length > 0 
                            ? `Showing ${filteredSuggestedJobs.length} ${filteredSuggestedJobs.length === 1 ? 'job' : 'jobs'} based on your filters`
                            : `Here are some ${jobTypeFilter === 'internship' ? 'internships' : 'jobs'} you might find interesting`
                          }
                        </p>
                      </div>
                      {loadingAllJobs ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow-md">
                          <Loader2 className="h-12 w-12 mx-auto text-[var(--primary-500)] animate-spin mb-4" />
                          <p className="text-[var(--neutral-500)] text-lg">Loading jobs...</p>
                        </div>
                      ) : filteredSuggestedJobs.length > 0 ? (
                        <div className="space-y-4 sm:space-y-6">
                          {filteredSuggestedJobs.slice(0, visibleJobsCount).map((job, index) => (
                            <JobCard
                              key={job.id}
                              job={job}
                              onApply={handleApplyToJob}
                              className={
                                index === 0
                                  ? "border-2 border-[var(--primary-500)]"
                                  : ""
                              }
                            />
                          ))}
                          {visibleJobsCount < filteredSuggestedJobs.length && (
                            <div className="text-center mt-8 sm:mt-12">
                              <button
                                onClick={() => {
                                  const remainingJobs = filteredSuggestedJobs.length - visibleJobsCount;
                                  const jobsToLoad = Math.min(remainingJobs, 6);
                                  setVisibleJobsCount((prevCount) => prevCount + jobsToLoad);
                                }}
                                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-[var(--primary-500)] text-[var(--primary-500)] rounded-lg hover:bg-[var(--primary-500)] hover:text-[var(--font-light)] transition-colors font-medium flex items-center justify-center mx-auto"
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
                                Load More Jobs ({filteredSuggestedJobs.length - visibleJobsCount} remaining)
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 sm:space-y-6">
                          {allAvailableJobs.slice(0, 12).map((job, index) => (
                            <JobCard
                              key={job.id}
                              job={job}
                              onApply={handleApplyToJob}
                              className={
                                index === 0
                                  ? "border-2 border-[var(--primary-500)]"
                                  : ""
                              }
                            />
                          ))}
                          {allAvailableJobs.length > 12 && (
                            <div className="text-center mt-8">
                              <p className="text-[var(--neutral-400)] text-sm mb-4">
                                Showing 12 of {allAvailableJobs.length} available jobs
                              </p>
                              <button
                                onClick={() => {
                                  setJobs(allAvailableJobs);
                                  setVisibleJobsCount(12);
                                  resetAllFilters();
                                }}
                                className="px-6 py-3 bg-[var(--primary-500)] text-[var(--font-light)] rounded-lg hover:bg-[var(--primary-600)] transition-colors font-medium"
                              >
                                View All Available Jobs
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                {sortedJobs.slice(0, visibleJobsCount).map((job, index) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onApply={handleApplyToJob}
                      className={
                        index === 0
                          ? "border-2 border-[var(--primary-500)]"
                          : ""
                      }
                    />
                  ))}

                {visibleJobsCount < sortedJobs.length && (
                    <div className="text-center mt-8 sm:mt-12">
                      <button
                        onClick={handleLoadMore}
                        className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-[var(--primary-500)] text-[var(--primary-500)] rounded-lg hover:bg-[var(--primary-500)] hover:text-[var(--font-light)] transition-colors font-medium flex items-center justify-center mx-auto"
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
                      Load More Jobs
                      </button>
                    </div>
                  )}
                </div>
              )}
              </div>
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
      {/* Assessment Invitation Modal */}
      {selectedJob && (
        <AssessmentInvitationModal
          job={selectedJob}
          isOpen={showAssessmentModal}
          onClose={() => {
            setShowAssessmentModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default Jobs;
