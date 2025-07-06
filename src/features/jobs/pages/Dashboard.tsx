import React, { useState, useEffect } from 'react';
import { Job } from '../types/jobs.types';
import { getAppliedJobs, getBookmarkedJobs, getSavedSearches, bookmarkJob, fetchAllJobs } from '../../../api/jobsApiService';

interface JobFilters {
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: { min: number; max: number };
  remote?: boolean;
  tags?: string[];
}

interface SavedSearch {
  id: string;
  query: string;
  filters: JobFilters;
  savedAt: string;
  alertsEnabled: boolean;
}

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'applications' | 'bookmarks' | 'searches'>('applications');
  const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Job[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Get applied job IDs and match with mock jobs
      const appliedJobData = getAppliedJobs();
      const bookmarkedJobIds = getBookmarkedJobs();
      const savedSearchData = getSavedSearches();
      
      // Get all jobs to match with applied/bookmarked IDs
      const allJobs = await fetchAllJobs();
      
      // Match applied jobs with full job data
      const appliedJobsWithData = appliedJobData.map(app => {
        const jobData = allJobs.find((job: Job) => job.id === app.jobId);
        return jobData || null;
      }).filter((job: Job | null): job is Job => job !== null);
      
      // Match bookmarked jobs with full job data
      const bookmarkedJobsWithData = bookmarkedJobIds.map(jobId => {
        const jobData = allJobs.find((job: Job) => job.id === jobId);
        return jobData || null;
      }).filter((job: Job | null): job is Job => job !== null);
      
      setAppliedJobs(appliedJobsWithData);
      setBookmarkedJobs(bookmarkedJobsWithData);
      setSavedSearches(savedSearchData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = (jobId: string) => {
    // Remove bookmark by toggling it off
    bookmarkJob(jobId);
    setBookmarkedJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const handleRemoveApplication = (jobId: string) => {
    // For now, just remove from local state (could implement removeApplication function)
    setAppliedJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const JobCard: React.FC<{ job: Job; type: 'application' | 'bookmark' }> = ({ job, type }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <img 
            src={job.companyLogo} 
            alt={job.company} 
            className="w-12 h-12 rounded-lg"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600">{job.company}</p>
            <p className="text-sm text-gray-500">{job.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            job.type === 'Full-time' ? 'bg-green-100 text-green-800' :
            job.type === 'Part-time' ? 'bg-blue-100 text-blue-800' :
            job.type === 'Contract' ? 'bg-purple-100 text-purple-800' :
            job.type === 'Internship' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {job.type}
          </span>
          <button
            onClick={() => type === 'application' ? handleRemoveApplication(job.id) : handleRemoveBookmark(job.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title={type === 'application' ? 'Remove application' : 'Remove bookmark'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {job.salary && (
          <p className="text-sm text-green-600 font-medium">
            ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} {job.salary.currency}
          </p>
        )}
        <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {job.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {tag}
              </span>
            ))}
            {job.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                +{job.tags.length - 3} more
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {type === 'application' ? 'Applied' : 'Bookmarked'} {formatDate(job.postedDate)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          View Job
        </a>
        <button
          onClick={() => window.open(job.applicationUrl, '_blank')}
          className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
        >
          Apply Direct
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your job applications, bookmarks, and saved searches</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{appliedJobs.length}</p>
                <p className="text-gray-600">Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{bookmarkedJobs.length}</p>
                <p className="text-gray-600">Bookmarks</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-semibold text-gray-900">{savedSearches.length}</p>
                <p className="text-gray-600">Saved Searches</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Applications ({appliedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('bookmarks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookmarks'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Bookmarks ({bookmarkedJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('searches')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'searches'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Saved Searches ({savedSearches.length})
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'applications' && (
          <div>
            {appliedJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applications yet</h3>
                <p className="mt-1 text-sm text-gray-500">Start applying to jobs to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {appliedJobs.map((job) => (
                  <JobCard key={job.id} job={job} type="application" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div>
            {bookmarkedJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No bookmarks yet</h3>
                <p className="mt-1 text-sm text-gray-500">Save jobs you're interested in to see them here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {bookmarkedJobs.map((job) => (
                  <JobCard key={job.id} job={job} type="bookmark" />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'searches' && (
          <div>
            {savedSearches.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No saved searches</h3>
                <p className="mt-1 text-sm text-gray-500">Save your search queries to quickly find them later.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedSearches.map((search) => (
                  <div key={search.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{search.query}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Saved on {formatDate(search.savedAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          // Here you would typically navigate to the jobs page with these filters
                          window.location.href = `/jobs?q=${encodeURIComponent(search.query)}`;
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Run Search
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 