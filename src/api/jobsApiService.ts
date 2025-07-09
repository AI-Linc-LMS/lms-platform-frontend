import { Job } from '../features/jobs/types/jobs.types';

// API Response Types
interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  company_logo: string;
  location: string;
  job_type: string;
  description: string;
  url: string;
  publication_date: string;
  salary?: string;
  tags: string[];
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

// Search Filter Types
interface JobFilters {
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  salary?: { min: number; max: number };
  remote?: boolean;
  tags?: string[];
}

// API Configuration - All Free APIs
const API_CONFIG = {
  remotive: {
    baseUrl: 'https://remotive.com/api/remote-jobs',
    // Note: This API may have CORS restrictions when called from browser
    corsEnabled: false,
  },
  // Alternative APIs that might work better
  github: {
    baseUrl: 'https://jobs.github.com/positions.json',
    corsEnabled: false,
  },
  // For production, you'd want to use a backend proxy or serverless function
  useMockData: true, // Default to mock data due to CORS limitations
  fallbackToMock: true
};

// Local Storage Keys
const STORAGE_KEYS = {
  bookmarkedJobs: 'lms_bookmarked_jobs',
  appliedJobs: 'lms_applied_jobs',
  savedSearches: 'lms_saved_searches',
  userProfile: 'lms_user_profile'
};

// Utility Functions
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout: number = 8000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        // Add CORS headers (though they might not help with external APIs)
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        ...options.headers
      },
      // Add mode to handle CORS
      mode: 'cors',
      credentials: 'omit'
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Enhanced error logging
    if (isCORSError(error)) {
      //console.warn('🚫 CORS Error detected - External API blocked by browser security policy');
      //console.warn('💡 In production, use a backend proxy or serverless function to avoid CORS');
    } else if (isNetworkError(error)) {
      //console.warn('🌐 Network Error detected - API may be unreachable');
    }
    
    throw error;
  }
};

const mapJobType = (apiJobType: string | undefined): 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Freelance' => {
  if (!apiJobType) return 'Full-time';
  
  const normalized = apiJobType.toLowerCase();
  if (normalized.includes('part') || normalized.includes('part-time')) return 'Part-time';
  if (normalized.includes('contract')) return 'Contract';
  if (normalized.includes('intern')) return 'Internship';
  if (normalized.includes('freelance') || normalized.includes('consultant')) return 'Freelance';
  return 'Full-time';
};

const mapExperienceLevel = (title: string, description: string): 'Entry Level' | 'Mid Level' | 'Senior Level' => {
  const combined = `${title} ${description}`.toLowerCase();
  if (combined.includes('senior') || combined.includes('lead') || combined.includes('principal') || combined.includes('staff')) return 'Senior Level';
  if (combined.includes('junior') || combined.includes('entry') || combined.includes('graduate') || combined.includes('intern')) return 'Entry Level';
  return 'Mid Level';
};

// Enhanced Mock Data with Real-World Jobs
const generateEnhancedMockJobs = (category: string = 'all'): Job[] => {
  const aiJobs: Job[] = [
    {
      id: 'ai-ml-1',
      title: 'Senior Machine Learning Engineer',
      company: 'OpenAI',
      companyLogo: 'https://via.placeholder.com/40x40/4F46E5/FFFFFF?text=OAI',
      location: 'San Francisco, CA (Remote)',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      salary: { min: 160000, max: 250000, currency: 'USD' },
      description: 'Join our world-class AI research team to develop cutting-edge machine learning models. Work on large-scale language models, computer vision, and reinforcement learning systems that impact millions of users worldwide.',
      requirements: [
        '5+ years of experience in machine learning',
        'PhD in Computer Science, AI, or related field',
        'Strong Python, TensorFlow, and PyTorch skills',
        'Experience with distributed computing and large-scale systems',
        'Published research in top-tier ML conferences (NeurIPS, ICML, ICLR)'
      ],
      benefits: [
        'Competitive salary + significant equity',
        'Flexible remote work policy',
        'Comprehensive health, dental, and vision insurance',
        'Annual learning budget $10,000',
        'Conference attendance and speaking opportunities',
        'Access to cutting-edge computing resources'
      ],
      tags: ['Machine Learning', 'AI', 'Python', 'TensorFlow', 'Research', 'Remote'],
      remote: true,
      postedDate: new Date().toISOString(),
      applicationUrl: 'https://openai.com/careers'
    },
    {
      id: 'ai-cv-2',
      title: 'Computer Vision Engineer',
      company: 'Tesla',
      companyLogo: 'https://via.placeholder.com/40x40/DC2626/FFFFFF?text=T',
      location: 'Palo Alto, CA',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      salary: { min: 140000, max: 200000, currency: 'USD' },
      description: 'Develop computer vision algorithms for autonomous driving. Work on object detection, semantic segmentation, and 3D perception systems for Tesla\'s Full Self-Driving capability.',
      requirements: [
        '3+ years of computer vision experience',
        'Strong C++ and Python skills',
        'Experience with deep learning frameworks',
        'Knowledge of autonomous systems',
        'Experience with CUDA and GPU programming'
      ],
      benefits: [
        'Stock options',
        'Health insurance',
        'Free charging for Tesla vehicles',
        'Gym membership',
        'Free lunch and snacks'
      ],
      tags: ['Computer Vision', 'AI', 'Autonomous Driving', 'C++', 'Python', 'CUDA'],
      remote: false,
      postedDate: new Date(Date.now() - 86400000).toISOString(),
      applicationUrl: 'https://tesla.com/careers'
    },
    {
      id: 'ai-nlp-3',
      title: 'NLP Research Scientist',
      company: 'Google DeepMind',
      companyLogo: 'https://via.placeholder.com/40x40/4285F4/FFFFFF?text=G',
      location: 'London, UK (Remote)',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      salary: { min: 150000, max: 220000, currency: 'USD' },
      description: 'Conduct cutting-edge research in natural language processing and large language models. Publish in top-tier venues and collaborate with world-class researchers.',
      requirements: [
        'PhD in NLP, AI, or related field',
        'Strong publication record',
        'Experience with transformer architectures',
        'Proficiency in Python and ML frameworks',
        'Experience with large-scale distributed training'
      ],
      benefits: [
        'Research freedom',
        'Publication bonuses',
        'Conference travel budget',
        'Comprehensive benefits',
        'Sabbatical opportunities'
      ],
      tags: ['NLP', 'Research', 'Transformers', 'Python', 'Publications', 'Remote'],
      remote: true,
      postedDate: new Date(Date.now() - 172800000).toISOString(),
      applicationUrl: 'https://deepmind.com/careers'
    }
  ];

  const remoteJobs: Job[] = [
    ...aiJobs,
    {
      id: 'remote-fs-1',
      title: 'Senior Full Stack Developer',
      company: 'GitLab',
      companyLogo: 'https://via.placeholder.com/40x40/FCA326/FFFFFF?text=GL',
      location: 'Remote - Global',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      salary: { min: 120000, max: 180000, currency: 'USD' },
      description: 'Build and maintain GitLab\'s web application using Ruby on Rails and Vue.js. Work in a fully remote, async-first environment with a global team.',
      requirements: [
        '5+ years of full-stack development',
        'Strong Ruby on Rails experience',
        'Vue.js or React expertise',
        'Experience with PostgreSQL',
        'Remote work experience'
      ],
      benefits: [
        'Fully remote work',
        'Flexible time zones',
        'Comprehensive health benefits',
        'Home office stipend',
        'Annual company retreat'
      ],
      tags: ['Ruby on Rails', 'Vue.js', 'PostgreSQL', 'Remote', 'Full Stack'],
      remote: true,
      postedDate: new Date().toISOString(),
      applicationUrl: 'https://gitlab.com/careers'
    },
    {
      id: 'remote-dev-2',
      title: 'React Developer',
      company: 'Vercel',
      companyLogo: 'https://via.placeholder.com/40x40/000000/FFFFFF?text=V',
      location: 'Remote - Americas',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      salary: { min: 100000, max: 150000, currency: 'USD' },
      description: 'Work on Next.js and React ecosystem tools. Build developer-first products that help millions of developers deploy and scale their applications.',
      requirements: [
        '3+ years of React development',
        'Strong TypeScript skills',
        'Experience with Next.js',
        'Knowledge of modern web standards',
        'Open source contributions preferred'
      ],
      benefits: [
        'Remote-first culture',
        'Equity participation',
        'Health and dental insurance',
        'Learning and development budget',
        'Conference speaking opportunities'
      ],
      tags: ['React', 'Next.js', 'TypeScript', 'Remote', 'Open Source'],
      remote: true,
      postedDate: new Date(Date.now() - 86400000).toISOString(),
      applicationUrl: 'https://vercel.com/careers'
    },
    {
      id: 'remote-backend-3',
      title: 'Backend Engineer - Python',
      company: 'Stripe',
      companyLogo: 'https://via.placeholder.com/40x40/6772E5/FFFFFF?text=S',
      location: 'Remote - Global',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      salary: { min: 130000, max: 190000, currency: 'USD' },
      description: 'Build and scale payment infrastructure that processes billions of dollars. Work on high-performance, reliable systems using Python and modern technologies.',
      requirements: [
        '4+ years of backend development',
        'Strong Python skills',
        'Experience with distributed systems',
        'Knowledge of databases and caching',
        'Understanding of payment systems preferred'
      ],
      benefits: [
        'Competitive salary + equity',
        'Remote work flexibility',
        'Health benefits',
        'Professional development budget',
        'Annual company offsite'
      ],
      tags: ['Python', 'Backend', 'Distributed Systems', 'Payments', 'Remote'],
      remote: true,
      postedDate: new Date(Date.now() - 259200000).toISOString(),
      applicationUrl: 'https://stripe.com/careers'
    }
  ];

  const techJobs: Job[] = [
    ...remoteJobs,
    {
      id: 'tech-fe-1',
      title: 'Frontend Engineer',
      company: 'Shopify',
      companyLogo: 'https://via.placeholder.com/40x40/96BF48/FFFFFF?text=S',
      location: 'Toronto, ON',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      salary: { min: 90000, max: 130000, currency: 'CAD' },
      description: 'Build beautiful, performant user interfaces for Shopify\'s merchant admin and storefront experiences. Work with React, TypeScript, and GraphQL.',
      requirements: [
        '3+ years of frontend development',
        'Strong React and TypeScript skills',
        'Experience with GraphQL',
        'Knowledge of web performance optimization',
        'E-commerce experience preferred'
      ],
      benefits: [
        'Health and dental benefits',
        'Stock purchase plan',
        'Learning stipend',
        'Flexible work arrangements',
        'Parental leave'
      ],
      tags: ['React', 'TypeScript', 'GraphQL', 'Frontend', 'E-commerce'],
      remote: false,
      postedDate: new Date(Date.now() - 345600000).toISOString(),
      applicationUrl: 'https://shopify.com/careers'
    }
  ];

  const allJobs: Job[] = [
    ...techJobs,
    {
      id: 'pm-1',
      title: 'Product Manager',
      company: 'Notion',
      companyLogo: 'https://via.placeholder.com/40x40/000000/FFFFFF?text=N',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experienceLevel: 'Mid Level',
      salary: { min: 140000, max: 200000, currency: 'USD' },
      description: 'Lead product development for Notion\'s core editing and collaboration features. Define product strategy and work with engineering and design teams.',
      requirements: [
        '3+ years of product management experience',
        'Strong analytical skills',
        'Experience with collaboration tools',
        'Technical background preferred',
        'Customer-focused mindset'
      ],
      benefits: [
        'Competitive salary + equity',
        'Health benefits',
        'Flexible PTO',
        'Professional development',
        'Office perks'
      ],
      tags: ['Product Management', 'Strategy', 'Collaboration', 'Analytics'],
      remote: false,
      postedDate: new Date(Date.now() - 432000000).toISOString(),
      applicationUrl: 'https://notion.so/careers'
    },
    {
      id: 'design-1',
      title: 'Senior UX Designer',
      company: 'Figma',
      companyLogo: 'https://via.placeholder.com/40x40/F24E1E/FFFFFF?text=F',
      location: 'Remote - US',
      type: 'Full-time',
      experienceLevel: 'Senior Level',
      salary: { min: 120000, max: 170000, currency: 'USD' },
      description: 'Design intuitive user experiences for Figma\'s design platform. Conduct user research, create prototypes, and collaborate with engineering teams.',
      requirements: [
        '5+ years of UX design experience',
        'Strong portfolio of design work',
        'Experience with design systems',
        'User research skills',
        'Proficiency in Figma and other design tools'
      ],
      benefits: [
        'Remote work flexibility',
        'Design tool stipends',
        'Health benefits',
        'Professional development',
        'Creative freedom'
      ],
      tags: ['UX Design', 'User Research', 'Design Systems', 'Figma', 'Remote'],
      remote: true,
      postedDate: new Date(Date.now() - 518400000).toISOString(),
      applicationUrl: 'https://figma.com/careers'
    }
  ];

  // Return filtered jobs based on category
  switch (category) {
    case 'ai':
      return aiJobs;
    case 'remote':
      return remoteJobs;
    case 'tech':
      return techJobs;
    case 'all':
    default:
      return allJobs;
  }
};

// Enhanced error detection
const isCORSError = (error: unknown): boolean => {
  return error instanceof Error && error.name === 'TypeError' && 
         (error.message.includes('Failed to fetch') || 
          error.message.includes('Network request failed') ||
          error.message.includes('CORS'));
};

const isNetworkError = (error: unknown): boolean => {
  return error instanceof Error && 
         (error.name === 'TypeError' || 
          error.message.includes('fetch') ||
          error.message.includes('network') ||
          ('code' in error && error.code === 'NETWORK_ERROR'));
};

// Enhanced Remotive API function with better error handling
const fetchRemotiveJobs = async (category: string = ''): Promise<Job[]> => {
  try {
    const url = `${API_CONFIG.remotive.baseUrl}?category=${category}&limit=20`;
    //console.log('🔍 Attempting to fetch from Remotive API:', url);
    //console.log('⚠️  Note: This may fail due to CORS restrictions in browser');

    const response = await fetchWithTimeout(url);
    
    if (!response.ok) {
      throw new Error(`Remotive API HTTP error: ${response.status} ${response.statusText}`);
    }

    const data: RemotiveResponse = await response.json();
    //console.log(`✅ Remotive API success! Returned ${data.jobs?.length || 0} jobs`);

    return data.jobs?.map((job): Job => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      companyLogo: job.company_logo || 'https://via.placeholder.com/40x40/059669/FFFFFF?text=JOB',
      location: job.location,
      type: mapJobType(job.job_type),
      experienceLevel: mapExperienceLevel(job.title, job.description),
      salary: job.salary ? {
        min: 50000,
        max: 150000,
        currency: 'USD'
      } : undefined,
      description: job.description,
      requirements: [
        'Relevant experience in the field',
        'Strong communication skills',
        'Remote work experience',
        'Team collaboration abilities'
      ],
      benefits: [
        'Remote work',
        'Flexible schedule',
        'Health benefits',
        'Professional development'
      ],
      tags: job.tags || ['Remote', 'Technology'],
      remote: true,
      postedDate: job.publication_date,
      applicationUrl: job.url
    })) || [];
  } catch (error) {
    if (isCORSError(error)) {
      //console.warn('🚫 Remotive API blocked by CORS policy');
      //console.warn('💡 This is expected when calling external APIs directly from browser');
      //console.warn('🔄 Falling back to enhanced mock data...');
    } else if (isNetworkError(error)) {
      //console.warn('🌐 Remotive API network error:', error instanceof Error ? error.message : 'Unknown error');
    } else {
      //console.warn('❌ Remotive API failed:', error instanceof Error ? error.message : 'Unknown error');
    }
    throw error;
  }
};

// Simulate network delay for better UX
const simulateNetworkDelay = (min: number = 800, max: number = 2000): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Main API Functions
export const fetchAIJobs = async (): Promise<Job[]> => {
  try {
    //console.log('🤖 Fetching AI jobs from multiple sources...');
    
    // Add realistic loading delay
    await simulateNetworkDelay();
    
    // Try to fetch from real API first
    try {
      const remotiveJobs = await fetchRemotiveJobs('software-dev');
      const aiFilteredJobs = remotiveJobs.filter(job => 
        job.title.toLowerCase().includes('ai') || 
        job.title.toLowerCase().includes('machine learning') ||
        job.title.toLowerCase().includes('data scientist') ||
        job.description.toLowerCase().includes('artificial intelligence')
      );
      
      if (aiFilteredJobs.length > 0) {
        //console.log(`🎉 Found ${aiFilteredJobs.length} real AI jobs`);
        return aiFilteredJobs;
      }
    } catch {
      //console.warn('Real API failed, using enhanced mock data');
    }
    
    // Fallback to enhanced mock data
    //console.log('📋 Using enhanced AI job database');
    return generateEnhancedMockJobs('ai');
  } catch {
    //console.error('❌ AI jobs fetch failed');
    return generateEnhancedMockJobs('ai');
  }
};

export const fetchRemoteJobs = async (): Promise<Job[]> => {
  try {
    //console.log('🌍 Fetching remote jobs from multiple sources...');
    
    await simulateNetworkDelay();
    
    try {
      const remotiveJobs = await fetchRemotiveJobs('');
      if (remotiveJobs.length > 0) {
        //console.log(`🎉 Found ${remotiveJobs.length} real remote jobs`);
        return remotiveJobs.slice(0, 15);
      }
    } catch {
      //console.warn('Real API failed, using enhanced mock data');
    }
    
    //console.log('📋 Using enhanced remote job database');
    return generateEnhancedMockJobs('remote');
  } catch {
    //console.error('❌ Remote jobs fetch failed');
    return generateEnhancedMockJobs('remote');
  }
};

export const fetchAllJobs = async (): Promise<Job[]> => {
  try {
    //console.log('📋 Fetching all jobs from multiple sources...');
    
    await simulateNetworkDelay();
    
    try {
      const remotiveJobs = await fetchRemotiveJobs('');
      if (remotiveJobs.length > 0) {
        // Mix real jobs with enhanced mock data
        const mockJobs = generateEnhancedMockJobs('all');
        const combinedJobs = [...remotiveJobs.slice(0, 10), ...mockJobs.slice(0, 15)];
        //console.log(`🎉 Found ${combinedJobs.length} total jobs (real + enhanced)`);
        return combinedJobs;
      }
    } catch {
      //console.warn('Real API failed, using enhanced mock data');
    }
    
    //console.log('📋 Using enhanced job database');
    return generateEnhancedMockJobs('all');
  } catch {
    //console.error('❌ All jobs fetch failed');
    return generateEnhancedMockJobs('all');
  }
};

export const fetchTechJobs = async (): Promise<Job[]> => {
  try {
    //console.log('💻 Fetching tech jobs from multiple sources...');
    
    await simulateNetworkDelay();
    
    try {
      const remotiveJobs = await fetchRemotiveJobs('software-dev');
      if (remotiveJobs.length > 0) {
        //console.log(`🎉 Found ${remotiveJobs.length} real tech jobs`);
        return remotiveJobs;
      }
    } catch {
      //console.warn('Real API failed, using enhanced mock data');
    }
    
    //console.log('📋 Using enhanced tech job database');
    return generateEnhancedMockJobs('tech');
  } catch {
    //console.error('❌ Tech jobs fetch failed');
    return generateEnhancedMockJobs('tech');
  }
};

// Job Application and Bookmarking Functions
export const bookmarkJob = (jobId: string): boolean => {
  try {
    const bookmarked = getBookmarkedJobs();
    const isBookmarked = bookmarked.includes(jobId);
    
    const updatedBookmarks = isBookmarked 
      ? bookmarked.filter(id => id !== jobId)
      : [...bookmarked, jobId];
    
    localStorage.setItem(STORAGE_KEYS.bookmarkedJobs, JSON.stringify(updatedBookmarks));
    //console.log(`📌 Job ${jobId} ${isBookmarked ? 'removed from' : 'added to'} bookmarks`);
    return !isBookmarked;
  } catch (error) {
    //console.error('❌ Failed to update bookmarks:', error);
    return false;
  }
};

export const getBookmarkedJobs = (): string[] => {
  try {
    const bookmarked = localStorage.getItem(STORAGE_KEYS.bookmarkedJobs);
    return bookmarked ? JSON.parse(bookmarked) : [];
  } catch (error) {
    //console.error('❌ Failed to get bookmarked jobs:', error);
    return [];
  }
};

export const applyToJob = (jobId: string, applicationData: {
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  linkedinProfile?: string;
  portfolioUrl?: string;
}): boolean => {
  try {
    const appliedJobs = getAppliedJobs();
    
    // Check if already applied
    const alreadyApplied = appliedJobs.some(app => app.jobId === jobId);
    if (alreadyApplied) {
      //console.log(`⚠️ Already applied to job ${jobId}`);
      return false;
    }
    
    const application = {
      jobId,
      ...applicationData,
      appliedAt: new Date().toISOString(),
      status: 'submitted' as const
    };
    
    const updatedApplications = [...appliedJobs, application];
    localStorage.setItem(STORAGE_KEYS.appliedJobs, JSON.stringify(updatedApplications));
    //console.log(`✅ Applied to job ${jobId}`);
    return true;
  } catch (error) {
    //console.error('❌ Failed to save job application:', error);
    return false;
  }
};

export const getAppliedJobs = (): Array<{
  jobId: string;
  name: string;
  email: string;
  phone?: string;
  resume?: string;
  coverLetter?: string;
  linkedinProfile?: string;
  portfolioUrl?: string;
  appliedAt: string;
  status: 'submitted' | 'reviewed' | 'interviewed' | 'rejected' | 'accepted';
}> => {
  try {
    const applied = localStorage.getItem(STORAGE_KEYS.appliedJobs);
    return applied ? JSON.parse(applied) : [];
  } catch (error) {
    //console.error('❌ Failed to get applied jobs:', error);
    return [];
  }
};

export const updateApplicationStatus = (jobId: string, status: 'submitted' | 'reviewed' | 'interviewed' | 'rejected' | 'accepted'): boolean => {
  try {
    const appliedJobs = getAppliedJobs();
    const updatedJobs = appliedJobs.map(app => 
      app.jobId === jobId ? { ...app, status } : app
    );
    
    localStorage.setItem(STORAGE_KEYS.appliedJobs, JSON.stringify(updatedJobs));
    //console.log(`✅ Updated application status for job ${jobId} to ${status}`);
    return true;
  } catch (error) {
    //console.error('❌ Failed to update application status:', error);
    return false;
  }
};

export const saveSearch = (searchQuery: string, filters: JobFilters): boolean => {
  try {
    const savedSearches = getSavedSearches();
    const search = {
      id: Date.now().toString(),
      query: searchQuery,
      filters,
      savedAt: new Date().toISOString(),
      alertsEnabled: false
    };
    
    const updatedSearches = [...savedSearches, search];
    localStorage.setItem(STORAGE_KEYS.savedSearches, JSON.stringify(updatedSearches));
    //console.log(`💾 Saved search: ${searchQuery}`);
    return true;
  } catch {
    //console.error('❌ Failed to save search');
    return false;
  }
};

export const getSavedSearches = (): Array<{
  id: string;
  query: string;
  filters: JobFilters;
  savedAt: string;
  alertsEnabled: boolean;
}> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.savedSearches);
    return saved ? JSON.parse(saved) : [];
  } catch {
    //console.error('❌ Failed to get saved searches');
    return [];
  }
};

export const deleteSearch = (searchId: string): boolean => {
  try {
    const savedSearches = getSavedSearches();
    const updatedSearches = savedSearches.filter(search => search.id !== searchId);
    localStorage.setItem(STORAGE_KEYS.savedSearches, JSON.stringify(updatedSearches));
    //console.log(`🗑️ Deleted search ${searchId}`);
    return true;
  } catch (error) {
    //console.error('❌ Failed to delete search:', error);
    return false;
  }
};

// User Profile Functions
export const saveUserProfile = (profile: {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinProfile?: string;
  portfolioUrl?: string;
  resume?: string;
  skills?: string[];
  experience?: string;
  education?: string;
}): boolean => {
  try {
    localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(profile));
    //console.log('✅ User profile saved');
    return true;
  } catch (error) {
    //console.error('❌ Failed to save user profile:', error);
    return false;
  }
};

export const getUserProfile = (): {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedinProfile?: string;
  portfolioUrl?: string;
  resume?: string;
  skills?: string[];
  experience?: string;
  education?: string;
} | null => {
  try {
    const profile = localStorage.getItem(STORAGE_KEYS.userProfile);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    //console.error('❌ Failed to get user profile:', error);
    return null;
  }
};

// Analytics Functions
export const getJobStats = (): {
  totalBookmarked: number;
  totalApplied: number;
  applicationsByStatus: Record<string, number>;
  recentActivity: Array<{
    type: 'bookmark' | 'apply' | 'search';
    jobId?: string;
    timestamp: string;
  }>;
} => {
  try {
    const bookmarked = getBookmarkedJobs();
    const applied = getAppliedJobs();
    
    const applicationsByStatus = applied.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalBookmarked: bookmarked.length,
      totalApplied: applied.length,
      applicationsByStatus,
      recentActivity: [] // Could be enhanced with activity tracking
    };
  } catch (error) {
    //console.error('❌ Failed to get job stats:', error);
    return {
      totalBookmarked: 0,
      totalApplied: 0,
      applicationsByStatus: {},
      recentActivity: []
    };
  }
}; 