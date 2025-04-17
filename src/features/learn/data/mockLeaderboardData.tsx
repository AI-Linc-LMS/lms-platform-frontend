// leaderboardData.ts

export interface LeaderboardEntry {
  standing: string;
  name: string;
  courseName: string;
  marks: number;
}

export const leaderboardData: LeaderboardEntry[] = [
  { standing: '#1', name: 'Shane', courseName: 'UI/UX Designer', marks: 1200 },
  { standing: '#2', name: 'Wade', courseName: 'Web Development', marks: 800 },
  { standing: '#3', name: 'Darrell', courseName: 'Business Analytics', marks: 765 },
  { standing: '#4', name: 'Dustin', courseName: 'Android Development', marks: 660 },
  { standing: '#5', name: 'Marvin', courseName: 'Artificial Intelligence', marks: 520 },
  { standing: '#8', name: 'You', courseName: 'UI/UX Designer', marks: 358 },
];
