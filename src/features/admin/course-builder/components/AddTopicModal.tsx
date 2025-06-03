import React, { useRef, useEffect } from 'react';
import { useTopicForm } from '../hooks/useTopicForm';
import { Topic } from '../types/course';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (topic: Topic) => void;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const { formData, handleInputChange, handleSubmit } = useTopicForm(onSubmit);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
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
              <div className="relative">
                <select
                  name="week"
                  value={formData.week}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md bg-white appearance-none pr-8"
                  required
                >
                  <option value="">Choose a week</option>
                  <option value="1">Week 1</option>
                  <option value="2">Week 2</option>
                  <option value="3">Week 3</option>
                  <option value="4">Week 4</option>
                  <option value="5">Week 5</option>
                  <option value="6">Week 6</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
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