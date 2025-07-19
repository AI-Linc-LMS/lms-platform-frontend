export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance';
  experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior Level' | 'Executive';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits?: string[];
  tags: string[];
  remote: boolean;
  postedDate: string;
  applicationDeadline?: string;
  applicationUrl?: string;
  isBookmarked?: boolean;
  about?: string;
}

export interface JobFilters {
  search: string;
  location: string;
  jobType: string[];
  experienceLevel: string[];
  salaryRange: {
    min: number;
    max: number;
  };
  skills: string[];
  company: string;
  remote: boolean;
  datePosted: 'any' | 'today' | 'week' | 'month';
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  description: string;
  website?: string;
  size?: string;
  industry?: string;
  openPositions?: number;
} 