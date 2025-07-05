import React, { useState, useEffect } from 'react';
import { Job } from '../types/jobs.types';
import { applyToJob, getUserProfile, saveUserProfile } from '../../../api/jobsApiService';

interface JobApplicationModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    linkedinProfile: '',
    portfolioUrl: '',
    coverLetter: '',
    resume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProfile, setSaveProfile] = useState(false);

  // Load user profile on mount
  useEffect(() => {
    const profile = getUserProfile();
    if (profile) {
      setFormData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        linkedinProfile: profile.linkedinProfile || '',
        portfolioUrl: profile.portfolioUrl || '',
        resume: profile.resume || ''
      }));
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        throw new Error('Name and email are required');
      }

      // Save profile if requested
      if (saveProfile) {
        saveUserProfile({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          linkedinProfile: formData.linkedinProfile,
          portfolioUrl: formData.portfolioUrl,
          resume: formData.resume
        });
      }

      // Apply to job
      const success = applyToJob(job.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        linkedinProfile: formData.linkedinProfile,
        portfolioUrl: formData.portfolioUrl,
        coverLetter: formData.coverLetter,
        resume: formData.resume
      });

      if (success) {
        onSuccess();
        onClose();
      } else {
        setError('You have already applied to this job');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
              <p className="text-gray-600 mt-1">
                {job.title} at {job.company}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Job Summary */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={job.companyLogo} 
                alt={job.company} 
                className="w-10 h-10 rounded-lg"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
              </div>
            </div>
            {job.salary && (
              <p className="text-sm text-green-600 font-medium">
                ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} {job.salary.currency}
              </p>
            )}
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedinProfile"
                  value={formData.linkedinProfile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portfolio URL
              </label>
              <input
                type="url"
                name="portfolioUrl"
                value={formData.portfolioUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://yourportfolio.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resume/CV URL
              </label>
              <input
                type="url"
                name="resume"
                value={formData.resume}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Link to your resume (Google Drive, Dropbox, etc.)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Letter
              </label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Write a brief cover letter explaining why you're interested in this position..."
              />
            </div>

            {/* Save Profile Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saveProfile"
                checked={saveProfile}
                onChange={(e) => setSaveProfile(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="saveProfile" className="ml-2 block text-sm text-gray-700">
                Save this information for future applications
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Application Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your application will be saved locally</li>
              <li>• You can track your application status in your dashboard</li>
              <li>• For real applications, you'll be redirected to the company's application page</li>
              <li>• Consider following up with the company directly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationModal; 