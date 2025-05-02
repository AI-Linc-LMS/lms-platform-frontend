import React from 'react';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

// API function to fetch leaderboard data
const fetchLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
  // Replace this with your actual API endpoint
  const response = await fetch('YOUR_API_ENDPOINT/leaderboard');
  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard data');
  }
  return response.json();
};

const EnrolledLeader: React.FC = () => {
  const { data: leaderboardData, isLoading, error } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboardData,
  });

  const renderSkeleton = () => (
    <tr>
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-200 rounded w-10 animate-pulse"></div>
      </td>
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
      </td>
      <td className="p-3 border-b">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
      </td>
    </tr>
  );

  if (error) {
    return (
      <div className="w-full mt-8 p-4 bg-red-50 text-red-600 rounded">
        Error loading leaderboard data
      </div>
    );
  }

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-bold mb-6">Course Leaderboard</h2>
      
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left font-semibold border-b">Rank</th>
              <th className="p-3 text-left font-semibold border-b">Name</th>
              <th className="p-3 text-left font-semibold border-b">Score</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Show 6 skeleton rows while loading
              Array(6).fill(0).map((_, index) => (
                <React.Fragment key={index}>
                  {renderSkeleton()}
                </React.Fragment>
              ))
            ) : (
              leaderboardData?.map((entry) => (
                <tr 
                  key={entry.rank}
                  className={`${entry.name === 'You' ? 'bg-blue-50' : ''}`}
                >
                  <td className="p-3 border-b">{entry.rank}</td>
                  <td className="p-3 border-b">{entry.name}</td>
                  <td className="p-3 border-b">{entry.score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EnrolledLeader; 