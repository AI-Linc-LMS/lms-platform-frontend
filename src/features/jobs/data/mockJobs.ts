import { Job } from '../types/jobs.types';

export const mockJobs: Job[] = [
  // {
  //   id: '1',
  //   title: 'Senior Frontend Developer',
  //   company: 'TechCorp Inc.',
  //   companyLogo: 'https://via.placeholder.com/60x60/255C79/ffffff?text=TC',
  //   location: 'San Francisco, CA',
  //   type: 'Full-time',
  //   experienceLevel: 'Senior Level',
  //   salary: {
  //     min: 120000,
  //     max: 160000,
  //     currency: 'USD'
  //   },
  //   description: 'We are looking for a Senior Frontend Developer to join our team and help build amazing user experiences. You will work with React, TypeScript, and modern frontend technologies.',
  //   requirements: [
  //     '5+ years of experience with React',
  //     'Strong TypeScript knowledge',
  //     'Experience with modern CSS frameworks',
  //     'Knowledge of testing frameworks'
  //   ],
  //   benefits: ['Health insurance', 'Flexible hours', 'Remote work options'],
  //   tags: ['React', 'TypeScript', 'CSS', 'JavaScript'],
  //   remote: true,
  //   postedDate: '2024-01-15',
  //   applicationUrl: 'https://techcorp.com/apply/1'
  // },
  // {
  //   id: '2',
  //   title: 'Full Stack Developer',
  //   company: 'StartupXYZ',
  //   companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=SX',
  //   location: 'New York, NY',
  //   type: 'Full-time',
  //   experienceLevel: 'Mid Level',
  //   salary: {
  //     min: 90000,
  //     max: 130000,
  //     currency: 'USD'
  //   },
  //   description: 'Join our fast-growing fintech startup as a Full Stack Developer. Work with cutting-edge technologies and help shape the future of financial services.',
  //   requirements: [
  //     '3+ years of full-stack development',
  //     'Experience with Node.js and React',
  //     'Database design knowledge',
  //     'API development experience'
  //   ],
  //   benefits: ['Equity package', 'Learning budget', 'Gym membership'],
  //   tags: ['Node.js', 'React', 'MongoDB', 'API'],
  //   remote: false,
  //   postedDate: '2024-01-14',
  //   applicationUrl: 'https://startupxyz.com/apply/2'
  // },
  // {
  //   id: '3',
  //   title: 'DevOps Engineer',
  //   company: 'CloudTech Solutions',
  //   companyLogo: 'https://via.placeholder.com/60x60/6C757D/ffffff?text=CT',
  //   location: 'Remote',
  //   type: 'Full-time',
  //   experienceLevel: 'Senior Level',
  //   salary: {
  //     min: 110000,
  //     max: 150000,
  //     currency: 'USD'
  //   },
  //   description: 'We need a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. Experience with AWS and Kubernetes is essential.',
  //   requirements: [
  //     'Strong AWS experience',
  //     'Kubernetes and Docker knowledge',
  //     'CI/CD pipeline setup',
  //     'Infrastructure as Code'
  //   ],
  //   benefits: ['Remote work', 'Conference budget', 'Stock options'],
  //   tags: ['AWS', 'Kubernetes', 'Docker', 'CI/CD'],
  //   remote: true,
  //   postedDate: '2024-01-13',
  //   applicationUrl: 'https://cloudtech.com/apply/3'
  // },
  // {
  //   id: '4',
  //   title: 'Junior Software Developer',
  //   company: 'EduTech Platform',
  //   companyLogo: 'https://via.placeholder.com/60x60/28A745/ffffff?text=EP',
  //   location: 'Austin, TX',
  //   type: 'Full-time',
  //   experienceLevel: 'Entry Level',
  //   salary: {
  //     min: 65000,
  //     max: 85000,
  //     currency: 'USD'
  //   },
  //   description: 'Perfect opportunity for a recent graduate or career changer. Join our education technology team and help build tools that make learning accessible.',
  //   requirements: [
  //     'Basic programming knowledge',
  //     'Willingness to learn',
  //     'Good communication skills',
  //     'Problem-solving mindset'
  //   ],
  //   benefits: ['Mentorship program', 'Learning opportunities', 'Health insurance'],
  //   tags: ['JavaScript', 'Python', 'Learning', 'Growth'],
  //   remote: false,
  //   postedDate: '2024-01-12',
  //   applicationUrl: 'https://edutech.com/apply/4'
  // },
  {
    id: '5',
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
    id: '6',
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
    id: '7',
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
    id: '8',
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
    id: '9',
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
    id: '10',
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
  }
]; 