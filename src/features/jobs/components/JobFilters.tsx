import React, { useState } from 'react';

interface JobFiltersProps {
  jobType: string;
  onJobTypeChange: (value: string) => void;
  experience: string;
  onExperienceChange: (value: string) => void;
  salary: { min: number; max: number };
  onSalaryChange: (value: { min: number; max: number }) => void;
  remote: boolean;
  onRemoteChange: (value: boolean) => void;
}

const JobFilters: React.FC<JobFiltersProps> = ({
  jobType,
  onJobTypeChange,
  experience,
  onExperienceChange,
  salary,
  onSalaryChange,
  remote,
  onRemoteChange,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const experienceLevels = ['Entry Level', 'Mid Level', 'Senior Level', 'Executive'];
  const salaryRanges = [
    { label: 'Any', min: 0, max: 200000 },
    { label: '$30k - $50k', min: 30000, max: 50000 },
    { label: '$50k - $80k', min: 50000, max: 80000 },
    { label: '$80k - $120k', min: 80000, max: 120000 },
    { label: '$120k+', min: 120000, max: 200000 }
  ];

  const handleClearAllFilters = () => {
    // Reset all filters to their default state
    onJobTypeChange('');  // Reset to 'All Types'
    onExperienceChange('');  // Reset to 'All Levels'
    onSalaryChange({ min: 0, max: 200000 });  // Reset to 'Any'
    onRemoteChange(false);  // Uncheck remote work
    setShowAdvancedFilters(false);  // Close advanced filters
  };

  const hasActiveFilters = jobType || experience || remote || salary.min > 0 || salary.max < 200000;

  return (
    <div className="bg-white rounded-2xl border border-[#DEE2E6] p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg sm:text-xl font-bold text-[#343A40]">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-[#255C79] text-white text-xs px-2 py-1 rounded-full">
              {[jobType, experience, remote, salary.min > 0 || salary.max < 200000].filter(Boolean).length}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={handleClearAllFilters}
            className="text-[#6C757D] hover:text-[#255C79] text-sm font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Remote Work */}
      <div className="mb-4 sm:mb-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={remote}
            onChange={(e) => onRemoteChange(e.target.checked)}
            className="w-4 h-4 text-[#255C79] border-[#DEE2E6] rounded focus:ring-[#255C79] focus:ring-2"
          />
          <span className="text-sm font-medium text-[#343A40]">Remote work only</span>
        </label>
      </div>

      {/* Job Type */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-[#343A40] mb-3">
          Job Type
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="jobType"
              value=""
              checked={jobType === ''}
              onChange={(e) => onJobTypeChange(e.target.value)}
              className="w-4 h-4 text-[#255C79] border-[#DEE2E6] focus:ring-[#255C79] focus:ring-2"
            />
            <span className="text-sm text-[#343A40]">All Types</span>
          </label>
          {jobTypes.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="jobType"
                value={type}
                checked={jobType === type}
                onChange={(e) => onJobTypeChange(e.target.value)}
                className="w-4 h-4 text-[#255C79] border-[#DEE2E6] focus:ring-[#255C79] focus:ring-2"
              />
              <span className="text-sm text-[#343A40]">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-[#343A40] mb-3">
          Experience Level
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="experience"
              value=""
              checked={experience === ''}
              onChange={(e) => onExperienceChange(e.target.value)}
              className="w-4 h-4 text-[#255C79] border-[#DEE2E6] focus:ring-[#255C79] focus:ring-2"
            />
            <span className="text-sm text-[#343A40]">All Levels</span>
          </label>
          {experienceLevels.map((level) => (
            <label key={level} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="experience"
                value={level}
                checked={experience === level}
                onChange={(e) => onExperienceChange(e.target.value)}
                className="w-4 h-4 text-[#255C79] border-[#DEE2E6] focus:ring-[#255C79] focus:ring-2"
              />
              <span className="text-sm text-[#343A40]">{level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Salary Range */}
      <div className="mb-4 sm:mb-6">
        <label className="block text-sm font-medium text-[#343A40] mb-3">
          Salary Range
        </label>
        <div className="space-y-2">
          {salaryRanges.map((range) => (
            <label key={range.label} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="salary"
                value={`${range.min}-${range.max}`}
                checked={salary.min === range.min && salary.max === range.max}
                onChange={() => onSalaryChange({ min: range.min, max: range.max })}
                className="w-4 h-4 text-[#255C79] border-[#DEE2E6] focus:ring-[#255C79] focus:ring-2"
              />
              <span className="text-sm text-[#343A40]">{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
        className="w-full flex items-center justify-between p-3 bg-[#F8F9FA] rounded-lg text-[#495057] hover:bg-[#E9ECEF] transition-colors"
      >
        <span className="text-sm font-medium">Advanced Filters</span>
        <svg 
          className={`w-4 h-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Advanced Filters Content */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-[#F8F9FA] space-y-4">
          {/* Custom Salary Range */}
          <div>
            <label className="block text-sm font-medium text-[#343A40] mb-3">
              Custom Salary Range
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#6C757D] mb-1">Min ($)</label>
                <input
                  type="number"
                  value={salary.min}
                  onChange={(e) => onSalaryChange({ ...salary, min: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#255C79] focus:border-transparent text-sm"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs text-[#6C757D] mb-1">Max ($)</label>
                <input
                  type="number"
                  value={salary.max}
                  onChange={(e) => onSalaryChange({ ...salary, max: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-[#255C79] focus:border-transparent text-sm"
                  placeholder="200000"
                />
              </div>
            </div>
          </div>

          {/* Date Posted */}
          <div>
            <label className="block text-sm font-medium text-[#343A40] mb-3">
              Date Posted
            </label>
            <div className="space-y-2">
              {[
                { value: 'any', label: 'Any time' },
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'Past week' },
                { value: 'month', label: 'Past month' }
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="datePosted"
                    value={option.value}
                    defaultChecked={option.value === 'any'}
                    className="w-4 h-4 text-[#255C79] border-[#DEE2E6] focus:ring-[#255C79] focus:ring-2"
                  />
                  <span className="text-sm text-[#343A40]">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Apply Filters Button (Mobile) */}
      <div className="mt-6 lg:hidden">
        <button 
          onClick={handleClearAllFilters}
          className="w-full px-4 py-3 bg-[#255C79] text-white rounded-lg hover:bg-[#1E4A63] transition-colors font-medium"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
};

export default JobFilters; 