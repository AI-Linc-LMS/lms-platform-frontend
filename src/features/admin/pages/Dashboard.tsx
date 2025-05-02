import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="px-4 py-6">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Total Courses</h3>
          <p className="text-3xl font-bold">24</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Total Students</h3>
          <p className="text-3xl font-bold">2,567</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Course Completions</h3>
          <p className="text-3xl font-bold">892</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-gray-500 font-medium mb-2">Active Users</h3>
          <p className="text-3xl font-bold">1,349</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(item => (
              <div key={item} className="border-b border-gray-100 pb-3">
                <p className="font-medium">New course enrollment</p>
                <p className="text-gray-500 text-sm">User #456 enrolled in Advanced JavaScript</p>
                <p className="text-gray-400 text-xs mt-1">2 hours ago</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Popular Courses</h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(item => (
              <div key={item} className="flex justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="font-medium">Advanced JavaScript</p>
                  <p className="text-gray-500 text-sm">243 students</p>
                </div>
                <div className="bg-blue-100 text-blue-800 h-fit px-2 py-1 rounded text-xs font-medium">
                  Pro
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 