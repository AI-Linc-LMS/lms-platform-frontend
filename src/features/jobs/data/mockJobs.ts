import { Job } from '../types/jobs.types';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Frontend Developer',
    company: 'TechCorp Inc.',
    companyLogo: 'https://via.placeholder.com/60x60/255C79/ffffff?text=TC',
    location: 'San Francisco, CA',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 120000,
      max: 160000,
      currency: 'USD'
    },
    description: 'We are looking for a Senior Frontend Developer to join our team and help build amazing user experiences. You will work with React, TypeScript, and modern frontend technologies.',
    requirements: [
      '5+ years of experience with React',
      'Strong TypeScript knowledge',
      'Experience with modern CSS frameworks',
      'Knowledge of testing frameworks'
    ],
    benefits: ['Health insurance', 'Flexible hours', 'Remote work options'],
    tags: ['React', 'TypeScript', 'CSS', 'JavaScript'],
    remote: true,
    postedDate: '2024-01-15',
    applicationUrl: 'https://techcorp.com/apply/1'
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'StartupXYZ',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=SX',
    location: 'New York, NY',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 90000,
      max: 130000,
      currency: 'USD'
    },
    description: 'Join our fast-growing fintech startup as a Full Stack Developer. Work with cutting-edge technologies and help shape the future of financial services.',
    requirements: [
      '3+ years of full-stack development',
      'Experience with Node.js and React',
      'Database design knowledge',
      'API development experience'
    ],
    benefits: ['Equity package', 'Learning budget', 'Gym membership'],
    tags: ['Node.js', 'React', 'MongoDB', 'API'],
    remote: false,
    postedDate: '2024-01-14',
    applicationUrl: 'https://startupxyz.com/apply/2'
  },
  {
    id: '3',
    title: 'DevOps Engineer',
    company: 'CloudTech Solutions',
    companyLogo: 'https://via.placeholder.com/60x60/6C757D/ffffff?text=CT',
    location: 'Remote',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 110000,
      max: 150000,
      currency: 'USD'
    },
    description: 'We need a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. Experience with AWS and Kubernetes is essential.',
    requirements: [
      'Strong AWS experience',
      'Kubernetes and Docker knowledge',
      'CI/CD pipeline setup',
      'Infrastructure as Code'
    ],
    benefits: ['Remote work', 'Conference budget', 'Stock options'],
    tags: ['AWS', 'Kubernetes', 'Docker', 'CI/CD'],
    remote: true,
    postedDate: '2024-01-13',
    applicationUrl: 'https://cloudtech.com/apply/3'
  },
  {
    id: '4',
    title: 'Junior Software Developer',
    company: 'EduTech Platform',
    companyLogo: 'https://via.placeholder.com/60x60/28A745/ffffff?text=EP',
    location: 'Austin, TX',
    type: 'Full-time',
    experienceLevel: 'Entry Level',
    salary: {
      min: 65000,
      max: 85000,
      currency: 'USD'
    },
    description: 'Perfect opportunity for a recent graduate or career changer. Join our education technology team and help build tools that make learning accessible.',
    requirements: [
      'Basic programming knowledge',
      'Willingness to learn',
      'Good communication skills',
      'Problem-solving mindset'
    ],
    benefits: ['Mentorship program', 'Learning opportunities', 'Health insurance'],
    tags: ['JavaScript', 'Python', 'Learning', 'Growth'],
    remote: false,
    postedDate: '2024-01-12',
    applicationUrl: 'https://edutech.com/apply/4'
  }
]; 