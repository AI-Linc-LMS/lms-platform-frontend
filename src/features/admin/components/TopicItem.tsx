import React, { useEffect, useState } from 'react';
import { Topic, Subtopic, TabKey } from '../types/course';
import SubtopicItem from './SubtopicItem';
import BottomSheet from './BottomSheet';
import ContentManager from './add-content/ContentManager';
import { useQuery } from '@tanstack/react-query';
import { getCourseSubmodules } from '../../../services/admin/courseApis';

interface TopicItemProps {
  courseId: string;
  topic: Topic;
  onDelete: (topicId: string) => void;
  onAddSubtopic: (topicId: string) => void;
}

interface SubmoduleData {
  id: number;
  title: string;
  description: string;
  order: number;
  course: number;
  module: number;
}

export const TopicItem: React.FC<TopicItemProps> = ({ courseId, topic, onDelete, onAddSubtopic }) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { data: submoduleData, isLoading, error } = useQuery({
    queryKey: ['course', topic.id],
    queryFn: () => getCourseSubmodules(clientId, Number(courseId), Number(topic.id)),
  });

  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');

  useEffect(() => {
    if (bottomSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [bottomSheetOpen]);

  const handleAddContent = () => {
    setBottomSheetOpen(true);
    setActiveTab('videos');
  };

  const handleCloseSheet = () => {
    setBottomSheetOpen(false);
  };

  const getStats = (subtopic: Subtopic) => {
    const stats = {
      videos: 0,
      articles: 0,
      problems: 0,
      quiz: 0,
      subjective: 0,
      development: 0,
    };
    if (subtopic.contents) {
      subtopic.contents.forEach((c) => {
        if (stats.hasOwnProperty(c.type)) {
          stats[c.type as keyof typeof stats]++;
        }
      });
    }
    return stats;
  };

  const renderSubtopics = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-white rounded-md border border-gray-200 px-4 py-2 mb-2">
                <div className="h-4 w-48 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600 text-sm">Failed to load subtopics. Please try again later.</p>
        </div>
      );
    }

    if (!submoduleData || submoduleData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-md">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#17627A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h4 className="text-[#17627A] font-medium mb-1">Add Subtopics</h4>
          <button
            onClick={() => onAddSubtopic(topic.id)}
            className="bg-[#17627A] text-white px-4 py-1 rounded-md mt-2 text-sm hover:bg-[#124F65] transition-colors"
          >
            Add Subtopics
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {submoduleData.map((submodule: SubmoduleData) => (
          <SubtopicItem
            key={submodule.id}
            title={submodule.title}
            marks={0}
            stats={getStats({
              id: submodule.id.toString(),
              title: submodule.title,
              description: submodule.description,
              contents: []
            })}
            onEdit={() => { }}
            onDelete={() => { }}
            onAddContent={() => handleAddContent()}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">{topic.title}</h3>
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md">Week {topic.week}</div>
              <button className="text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">Marks: -</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onDelete(topic.id)}
              className="text-red-400 hover:text-red-600 p-2 rounded-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => onAddSubtopic(topic.id)}
              className="bg-[#17627A] text-white px-3 py-1 rounded-md flex items-center hover:bg-[#124F65] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Subtopics
            </button>
          </div>
        </div>

        {renderSubtopics()}
      </div>
      {/* Bottom Sheet for Add Content */}
      <BottomSheet open={bottomSheetOpen} onClose={handleCloseSheet} activeTab={activeTab} setActiveTab={setActiveTab}>
        <ContentManager
          tabKey={activeTab as TabKey}
        />
      </BottomSheet>
    </div>
  );
}; 