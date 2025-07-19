import { Job } from '../types/jobs.types';

export const mockJobs: Job[] = [
  {
    id: '1',
    title: 'AI Engineer',
    company: 'Talent Basket',
    companyLogo: 'https://via.placeholder.com/60x60/255C79/ffffff?text=TB',
    location: 'Trivandrum, Kerala, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 80000,
      max: 120000,
      currency: 'INR'
    },
    description: 'We are seeking a talented AI Engineer to join our innovative team at Talent Basket. Help us develop cutting-edge AI solutions and drive technological innovation.',
    requirements: [
      'Strong background in machine learning',
      'Proficiency in Python and AI frameworks',
      'Experience with neural networks',
      'Knowledge of deep learning techniques'
    ],
    benefits: ['Hybrid work model', 'Learning opportunities', 'Competitive compensation'],
    tags: ['AI', 'Machine Learning', 'Python', 'Deep Learning'],
    remote: false,
    postedDate: '2024-01-10',
    applicationUrl: 'https://talentbasket.com/apply/ai-engineer'
  },
  {
    id: '2',
    title: 'Founding Engineer, AI',
    company: 'Cenna',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=CN',
    location: 'Hyderabad, Telangana, India',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 150000,
      max: 250000,
      currency: 'INR'
    },
    description: 'Exciting opportunity for a visionary AI Founding Engineer to shape the future of AI technology at Cenna. Be a key player in building groundbreaking AI solutions.',
    requirements: [
      'Extensive experience in AI and machine learning',
      'Strong leadership and technical skills',
      'Proven track record of AI product development',
      'Ability to mentor and guide technical teams'
    ],
    benefits: ['Equity stake', 'Cutting-edge technology exposure', 'Competitive compensation'],
    tags: ['AI', 'Founding Engineer', 'Leadership', 'Innovation'],
    remote: false,
    postedDate: '2024-01-09',
    applicationUrl: 'https://cenna.com/apply/founding-ai-engineer'
  },
  {
    id: '3',
    title: 'Artificial Intelligence Engineer',
    company: 'UltraSafe AI',
    companyLogo: 'https://via.placeholder.com/60x60/6C757D/ffffff?text=UA',
    location: 'India',
    type: 'Contract',
    experienceLevel: 'Mid Level',
    salary: {
      min: 100000,
      max: 180000,
      currency: 'INR'
    },
    description: 'Join UltraSafe AI in developing innovative AI solutions focused on security and safety technologies. Help create intelligent systems that protect and empower.',
    requirements: [
      'Strong AI and machine learning background',
      'Experience with security-focused AI applications',
      'Proficiency in Python and AI frameworks',
      'Understanding of ethical AI principles'
    ],
    benefits: ['Full remote work', 'Cutting-edge security projects', 'Continuous learning'],
    tags: ['AI', 'Security', 'Remote', 'Machine Learning'],
    remote: true,
    postedDate: '2024-01-08',
    applicationUrl: 'https://ultrasafeai.com/apply/ai-engineer'
  },
  {
    id: '4',
    title: 'Sr. AI Engineer',
    company: 'Genloop',
    companyLogo: 'https://via.placeholder.com/60x60/28A745/ffffff?text=GL',
    location: 'Noida, Uttar Pradesh, India',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 200000,
      max: 350000,
      currency: 'INR'
    },
    description: 'Genloop is seeking a Senior AI Engineer to lead complex AI projects and drive technological innovation. Ideal for experienced professionals looking to make a significant impact.',
    requirements: [
      '5+ years of AI and machine learning experience',
      'Advanced knowledge of deep learning techniques',
      'Experience with large-scale AI systems',
      'Strong research and development skills'
    ],
    benefits: ['Competitive salary', 'Research opportunities', 'Career growth'],
    tags: ['Senior AI', 'Machine Learning', 'Deep Learning', 'Research'],
    remote: false,
    postedDate: '2024-01-07',
    applicationUrl: 'https://genloop.com/apply/senior-ai-engineer'
  },
  {
    id: '5',
    title: 'Artificial Intelligence Engineer',
    company: 'Velodata Global Pvt Ltd',
    companyLogo: 'https://via.placeholder.com/60x60/255C79/ffffff?text=VG',
    location: 'Thiruvananthapuram Taluk, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 90000,
      max: 150000,
      currency: 'INR'
    },
    description: 'Velodata Global is looking for a talented AI Engineer to contribute to innovative data-driven solutions. Help us transform complex data into actionable insights.',
    requirements: [
      'Strong background in AI and data science',
      'Proficiency in Python and machine learning libraries',
      'Experience with data preprocessing and analysis',
      'Knowledge of cloud AI platforms'
    ],
    benefits: ['Hybrid work model', 'Data-driven projects', 'Continuous learning'],
    tags: ['AI', 'Data Science', 'Python', 'Machine Learning'],
    remote: false,
    postedDate: '2024-01-06',
    applicationUrl: 'https://velodata.com/apply/ai-engineer'
  },
  {
    id: '6',
    title: 'Artificial Intelligence Engineer',
    company: 'AiSensy',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=AS',
    location: 'Gurugram, Haryana, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 100000,
      max: 200000,
      currency: 'INR'
    },
    description: 'AiSensy is expanding its AI team and seeking a skilled Artificial Intelligence Engineer. Contribute to developing intelligent communication and automation solutions.',
    requirements: [
      'Solid understanding of AI and machine learning',
      'Experience with natural language processing',
      'Proficiency in Python and AI frameworks',
      'Knowledge of chatbot and conversational AI technologies'
    ],
    benefits: ['Innovative projects', 'Career growth', 'Competitive compensation'],
    tags: ['AI', 'NLP', 'Chatbots', 'Automation'],
    remote: false,
    postedDate: '2024-01-05',
    applicationUrl: 'https://aisensy.com/apply/ai-engineer'
  },
  {
    id: '7',
    title: 'Artificial Intelligence Engineer',
    company: 'KLA',
    companyLogo: 'https://via.placeholder.com/60x60/255C79/ffffff?text=KL',
    location: 'Chennai, Tamil Nadu, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 120000,
      max: 220000,
      currency: 'INR'
    },
    description: 'KLA is seeking a talented Artificial Intelligence Engineer to join our innovative team. Help develop cutting-edge AI solutions and drive technological advancement.',
    requirements: [
      'Strong background in machine learning',
      'Experience with AI verification techniques',
      'Proficiency in Python and AI frameworks',
      'Knowledge of advanced AI validation methods'
    ],
    benefits: ['Hybrid work model', 'Learning opportunities', 'Competitive compensation'],
    tags: ['AI', 'Machine Learning', 'Verification', 'Innovation'],
    remote: false,
    postedDate: '2024-01-04',
    applicationUrl: 'https://kla.com/apply/ai-engineer'
  },
  {
    id: '8',
    title: 'ML Engineer',
    company: 'Hike',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=HK',
    location: 'India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 100000,
      max: 200000,
      currency: 'INR'
    },
    description: 'Hike is looking for a skilled ML Engineer to work on innovative remote projects. Help develop machine learning solutions that push the boundaries of technology.',
    requirements: [
      'Strong machine learning background',
      'Experience with remote collaboration',
      'Proficiency in Python and ML libraries',
      'Understanding of distributed machine learning systems'
    ],
    benefits: ['Full remote work', 'Flexible hours', 'Continuous learning'],
    tags: ['Machine Learning', 'Remote', 'Python', 'AI'],
    remote: true,
    postedDate: '2024-01-03',
    applicationUrl: 'https://hike.com/apply/ml-engineer'
  },
  {
    id: '9',
    title: 'Artificial Intelligence Engineer',
    company: 'Indsafri',
    companyLogo: 'https://via.placeholder.com/60x60/6C757D/ffffff?text=IS',
    location: 'Chennai, Tamil Nadu, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 90000,
      max: 180000,
      currency: 'INR'
    },
    description: 'Indsafri is expanding its AI team and seeking a passionate Artificial Intelligence Engineer. Contribute to developing innovative AI solutions across various domains.',
    requirements: [
      'Strong foundation in artificial intelligence',
      'Experience with machine learning projects',
      'Proficiency in Python and AI frameworks',
      'Creative problem-solving skills'
    ],
    benefits: ['Hybrid work model', 'Innovative projects', 'Professional growth'],
    tags: ['AI', 'Machine Learning', 'Innovation', 'Technology'],
    remote: false,
    postedDate: '2024-01-02',
    applicationUrl: 'https://indsafri.com/apply/ai-engineer'
  },
  {
    id: '10',
    title: 'AI Engineer',
    company: 'Eudia',
    companyLogo: 'https://via.placeholder.com/60x60/28A745/ffffff?text=EU',
    location: 'Bengaluru, Karnataka, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 100000,
      max: 200000,
      currency: 'INR'
    },
    description: 'Eudia is seeking an AI Engineer to join our on-site team in Bengaluru. Help develop cutting-edge AI solutions and drive technological innovation.',
    requirements: [
      'Strong background in artificial intelligence',
      'Experience with AI development',
      'Proficiency in programming and AI frameworks',
      'Ability to work in a collaborative environment'
    ],
    benefits: ['On-site work', 'Learning opportunities', 'Competitive compensation'],
    tags: ['AI', 'Engineering', 'Technology', 'Innovation'],
    remote: false,
    postedDate: '2024-01-01',
    applicationUrl: 'https://eudia.com/apply/ai-engineer'
  },
  {
    id: '11',
    title: 'AI Engineer',
    company: 'Predigle',
    companyLogo: 'https://via.placeholder.com/60x60/255C79/ffffff?text=PG',
    location: 'Chennai, Tamil Nadu, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 110000,
      max: 210000,
      currency: 'INR'
    },
    description: 'Predigle is looking for a talented AI Engineer to join our innovative team. Contribute to developing advanced AI solutions and drive technological progress.',
    requirements: [
      'Strong foundation in artificial intelligence',
      'Experience with machine learning projects',
      'Proficiency in Python and AI frameworks',
      'Analytical and creative problem-solving skills'
    ],
    benefits: ['Hybrid work model', 'Cutting-edge projects', 'Professional development'],
    tags: ['AI', 'Machine Learning', 'Innovation', 'Technology'],
    remote: false,
    postedDate: '2023-12-29',
    applicationUrl: 'https://predigle.com/apply/ai-engineer'
  },
  {
    id: '12',
    title: 'AI Fullstack Engineer',
    company: 'Mundos',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=MD',
    location: 'India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 100000,
      max: 200000,
      currency: 'INR'
    },
    description: 'Mundos is seeking an AI Fullstack Engineer to work remotely. Develop comprehensive AI solutions that integrate frontend and backend technologies.',
    requirements: [
      'Strong background in full-stack development',
      'Experience with AI and machine learning',
      'Proficiency in multiple programming languages',
      'Ability to work effectively in a remote environment'
    ],
    benefits: ['Full remote work', 'Flexible hours', 'Comprehensive AI projects'],
    tags: ['AI', 'Fullstack', 'Remote', 'Web Development'],
    remote: true,
    postedDate: '2023-12-28',
    applicationUrl: 'https://mundos.com/apply/ai-fullstack-engineer'
  },
  {
    id: '13',
    title: 'AI Research Engineer',
    company: 'APPSeCONNECT',
    companyLogo: 'https://via.placeholder.com/60x60/6C757D/ffffff?text=AC',
    location: 'Greater Kolkata Area',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 150000,
      max: 300000,
      currency: 'INR'
    },
    description: 'APPSeCONNECT is looking for an AI Research Engineer to lead innovative research projects. Drive technological advancements and develop cutting-edge AI solutions.',
    requirements: [
      'Advanced knowledge of AI and machine learning',
      'Experience in AI research and development',
      'Strong publication record in AI conferences/journals',
      'Ability to translate research into practical applications'
    ],
    benefits: ['On-site work', 'Research opportunities', 'Competitive compensation'],
    tags: ['AI Research', 'Machine Learning', 'Innovation', 'Academic'],
    remote: false,
    postedDate: '2023-12-27',
    applicationUrl: 'https://appsconnect.com/apply/ai-research-engineer'
  },
  {
    id: '14',
    title: 'Artificial Intelligence Engineer',
    company: 'Valuebound',
    companyLogo: 'https://via.placeholder.com/60x60/28A745/ffffff?text=VB',
    location: 'Chennai, Tamil Nadu, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 100000,
      max: 200000,
      currency: 'INR'
    },
    description: 'Valuebound is expanding its AI team and seeking a skilled Artificial Intelligence Engineer. Contribute to developing innovative AI solutions and drive technological innovation.',
    requirements: [
      'Strong foundation in artificial intelligence',
      'Experience with machine learning projects',
      'Proficiency in Python and AI frameworks',
      'Ability to work in a collaborative on-site environment'
    ],
    benefits: ['On-site work', 'Learning opportunities', 'Competitive compensation'],
    tags: ['AI', 'Machine Learning', 'Technology', 'Innovation'],
    remote: false,
    postedDate: '2023-12-26',
    applicationUrl: 'https://valuebound.com/apply/ai-engineer'
  }
]; 