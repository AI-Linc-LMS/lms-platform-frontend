import React, { useRef, useEffect, useState } from 'react';
import { useTopicForm } from '../hooks/useTopicForm';
import { Topic } from '../types/course';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topic: Topic) => void;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { formData, handleInputChange, handleSubmit } = useTopicForm(onSubmit);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Generate weeks dynamically (1-20)
  const generateWeekOptions = () => {
    const weeks = [];
    for (let i = 1; i <= 20; i++) {
      weeks.push({
        value: i.toString(),
        label: `Week ${i}`
      });
    }
    return weeks;
  };

  const weekOptions = generateWeekOptions();

  const handleWeekSelect = (weekValue: string) => {
    handleInputChange({
      target: {
        name: 'week',
        value: weekValue
      }
    } as React.ChangeEvent<HTMLInputElement>);
    setIsDropdownOpen(false);
  };

  const getSelectedWeekLabel = () => {
    if (!formData.week) return 'Choose a week';
    return `Week ${formData.week}`;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg w-full max-w-md shadow-xl border border-blue-200">
        <div className="p-6 pb-3">
          <h2 className="text-2xl font-bold mb-6">Add Topic</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 text-lg font-medium mb-2">
                Topic Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Data Structures"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 text-lg font-medium mb-2">
                Choose Week<span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white text-left flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#17627A] focus:border-transparent"
                >
                  <span className={formData.week ? 'text-gray-900' : 'text-gray-500'}>
                    {getSelectedWeekLabel()}
                  </span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                    {weekOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleWeekSelect(option.value)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                          formData.week === option.value ? 'bg-[#17627A] text-white hover:bg-[#124F65]' : 'text-gray-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Select from weeks 1-20. Scroll to see all options.
              </p>
              {/* Hidden input for form validation */}
              <input
                type="hidden"
                name="week"
                value={formData.week}
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 text-lg font-medium mb-2">
                Enter Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="e.g., Hills"
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-[#17627A] text-white py-4 rounded-md font-medium hover:bg-[#124F65] transition-colors text-lg"
            >
              Add Topic
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}; 