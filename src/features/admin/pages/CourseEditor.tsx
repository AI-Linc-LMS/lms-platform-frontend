import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

// Course sidebar for different content types
const CourseSidebar = ({ activeLabel, onSelect }: { activeLabel: string; onSelect: (label: string) => void }) => {
  const menuItems = [
    { label: "Dashboard", icon: "📊" },
    { label: "All", icon: "📋" },
    { label: "Article", icon: "📝" },
    { label: "Videos", icon: "🎬" },
    { label: "Problems", icon: "⚙️" },
    { label: "Quiz", icon: "❓" },
    { label: "Subjective", icon: "📑" },
    { label: "Development", icon: "💻" },
  ];

  return (
    <div className="bg-[#D9F5FC] rounded-lg inline-flex flex-col items-center h-full max-h-[calc(100vh-150px)] w-20 ml-2 mt-5 mr-1 overflow-y-auto">
      {menuItems.map((item, idx) => {
        const isActive = item.label === activeLabel;

        return (
          <button
            key={idx}
            onClick={() => onSelect(item.label)}
            className={`flex flex-col items-center px-2 py-3 rounded-lg w-full transition-colors duration-200 cursor-pointer ${
              isActive ? "bg-[#0E1F2F]" : "bg-transparent"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span
              className={`text-[11px] font-medium mt-1 ${
                isActive ? "text-white" : "text-[#0E1F2F]"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// Different content sections based on the selected tab
const ContentSection = ({ activeLabel }: { activeLabel: string }) => {
  if (activeLabel === "Dashboard") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Course Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-medium text-gray-500 mb-1">Total Chapters</h3>
            <p className="text-2xl font-bold">12</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-medium text-gray-500 mb-1">Total Content</h3>
            <p className="text-2xl font-bold">48</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <h3 className="font-medium text-gray-500 mb-1">Enrolled Students</h3>
            <p className="text-2xl font-bold">256</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <h3 className="font-medium mb-3">Course Progress</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Articles</span>
                <span>8/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "66%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Videos</span>
                <span>10/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "83%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1 text-sm">
                <span>Problems</span>
                <span>6/12</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: "50%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">{activeLabel} Content</h2>
      <p className="text-gray-500 mb-6">Manage your {activeLabel.toLowerCase()} content here.</p>
      
      <div className="mb-6">
        <button className="bg-[#0E1F2F] text-white px-4 py-2 rounded-lg flex items-center">
          <span className="mr-2">+</span>
          Add New {activeLabel === "All" ? "Content" : activeLabel}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="font-medium">Content List</h3>
        </div>
        <div className="p-0">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="border-b p-4 hover:bg-gray-50 flex justify-between items-center">
              <div>
                <h4 className="font-medium">Sample {activeLabel} Title {item}</h4>
                <p className="text-gray-500 text-sm">Last updated: 2 days ago</p>
              </div>
              <div className="flex space-x-2">
                <button className="text-blue-600 hover:text-blue-800">Edit</button>
                <button className="text-red-600 hover:text-red-800">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CourseEditor: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeLabel, setActiveLabel] = useState("Dashboard");

  const handleSelect = (label: string) => {
    setActiveLabel(label);
  };

  return (
    <div className="px-2 py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Editor</h1>
        <p className="text-gray-500">Editing Course ID: {courseId || "Unknown"}</p>
      </div>
      
      <div className="flex gap-4">
        <CourseSidebar activeLabel={activeLabel} onSelect={handleSelect} />
        <div className="bg-gray-100 flex-grow rounded-lg">
          <ContentSection activeLabel={activeLabel} />
        </div>
      </div>
    </div>
  );
};

export default CourseEditor; 