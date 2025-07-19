import { Job } from '../types/jobs.types';

export const completeJobDetails: Job[] = [
  {
    id: "1",
    title: "Senior AI Engineer / Data Scientist",
    company: "CellStrat Inc.",
    companyLogo: "https://via.placeholder.com/60x60/255C79/ffffff?text=CS",
    location: "Bengaluru, Karnataka, India",
    type: "Full-time",
    experienceLevel: "Senior Level",
    salary: {
      min: 600000,
      max: 2400000,
      currency: "INR"
    },
    description: `CellStrat is a dynamic AI startup specializing in comprehensive AI consulting for US-based clients. We are seeking a Senior AI Engineer to lead AI/ML engineering for global client projects and CellVerse product development.

In this role, you will architect and design scalable AI systems from conception to deployment. You'll work with cutting-edge technologies including Large Language Models, RAG architectures, and vector databases to build production-ready AI solutions.

As a key member of our engineering team, you'll collaborate with cross-functional teams to deliver innovative AI products that serve our international clientele. This position offers the opportunity to work on diverse projects ranging from NLP applications to computer vision systems.`,
    requirements: [
      "Deep understanding of Large Language Models (LLMs) internals and architecture",
      "Advanced experience with LLM APIs (OpenAI GPT, Claude, Gemini) and fine-tuning",
      "Proven experience building and optimizing RAG (Retrieval Augmented Generation) architectures",
      "Hands-on experience with vector databases (Pinecone, Weaviate, Qdrant) and similarity search",
      "Expert-level PyTorch and Transformers library proficiency",
      "Advanced FastAPI development and API design patterns",
      "Extensive AWS experience (SageMaker, Lambda, EC2, S3)",
      "Docker containerization for development and deployment",
      "Expert Python skills with strong software engineering practices",
      "Experience with MLOps tools and CI/CD pipelines for ML models",
      "Strong understanding of machine learning fundamentals and statistics",
      "5+ years of experience in AI/ML engineering roles"
    ],
    benefits: [
      "Competitive compensation package with performance bonuses",
      "Employee Stock Ownership Plan (ESOP) options with high growth potential", 
      "Work on cutting-edge AI projects with global impact",
      "Flexible work arrangements and remote-first culture",
      "Professional development budget for conferences and courses",
      "Health insurance and wellness programs",
      "Collaborative and innovative work environment"
    ],
    tags: ["AI", "Machine Learning", "LLM", "Data Science", "Python", "AWS", "Docker"],
    remote: true,
    postedDate: "2024-01-15",
    applicationDeadline: "2024-03-15",
    applicationUrl: "https://cellstrat.com/careers/senior-ai-engineer",
    isBookmarked: false
  },
  {
    id: '2',
    title: 'Expert Frontend Developer',
    company: 'CellStrat Inc.',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=CS',
    location: 'Bengaluru, Karnataka, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 1200000,
      max: 1500000,
      currency: 'INR'
    },
    description: `CellStrat Inc. is seeking an Expert Frontend Developer to lead frontend development for client projects and our flagship CellVerse product platform. 

You will architect and design frontend repositories with optimal performance and scalability in mind. The role involves building pixel-perfect, responsive web applications using our modern tech stack while ensuring excellent user experience across all devices.

As part of our dynamic team, you'll collaborate closely with backend engineers, designers, and product managers to deliver high-quality solutions. You'll also be responsible for establishing best practices and mentoring junior developers.`,
    requirements: [
      'Advanced proficiency in Next.js 13+ with App Router and React.js 18+',
      'Expert-level Tailwind CSS implementation and ShadCn UI component library',
      'Strong experience with React-Query (TanStack Query) for data fetching and caching',
      'Deep understanding of Zustand for state management',
      'Expertise in Server-Side Rendering (SSR), Client-Side Rendering (CSR), and performance optimization',
      'Proficient with Git workflows, GitHub Actions, and collaborative development',
      'Solid experience integrating with RESTful APIs and GraphQL',
      'Ability to create scalable, reusable component libraries',
      'Experience with testing frameworks (Jest, React Testing Library)',
      'Knowledge of web accessibility standards (WCAG)',
      'Understanding of SEO best practices for web applications',
      '4+ years of frontend development experience'
    ],
    benefits: [
      'Competitive compensation with annual increments',
      'Employee Stock Ownership Plan (ESOP) options',
      'Work on cutting-edge frontend technologies and frameworks',
      'Flexible working hours and remote work options',
      'Learning and development budget for skill enhancement',
      'Modern development tools and equipment provided',
      'Health insurance and medical benefits'
    ],
    tags: ['Frontend', 'React', 'Next.js', 'Web Development', 'TypeScript', 'Tailwind CSS'],
    remote: true,
    postedDate: '2024-01-15',
    applicationDeadline: '2024-03-15',
    applicationUrl: 'https://cellstrat.com/careers/expert-frontend-developer',
    isBookmarked: false
  },
  {
    id: '3',
    title: 'AI Developer',
    company: 'TechInnovate',
    companyLogo: 'https://via.placeholder.com/60x60/28A745/ffffff?text=TI',
    location: 'Bengaluru, Karnataka, India',
    type: 'Full-time',
    experienceLevel: 'Mid Level',
    salary: {
      min: 1000000,
      max: 4000000,
      currency: 'INR'
    },
    description: `TechInnovate is at the forefront of AI innovation, developing next-generation solutions using foundation models for Image, Video, and Vision-Language Models (VLLMs). We are seeking a talented AI Developer to join our research and development team.

In this role, you will work on cutting-edge AI projects involving computer vision, video analysis, and multimodal AI systems. You'll collaborate with our research team to develop and deploy state-of-the-art AI models that push the boundaries of what's possible.

The position offers exciting opportunities to work with the latest AI technologies and contribute to products that will shape the future of artificial intelligence.`,
    requirements: [
      'Strong understanding of foundation models in Computer Vision, Video Processing, and Vision-Language Models',
      'Hands-on experience with foundation model fine-tuning and adaptation techniques',
      'Proficiency in Python with strong programming fundamentals',
      'Experience with OpenCV for computer vision tasks and image processing',
      'Solid knowledge of TensorFlow and PyTorch deep learning frameworks',
      'Understanding of transformer architectures and attention mechanisms',
      'Experience with cloud platforms, preferably Microsoft Azure',
      'Knowledge of MLOps practices and model deployment strategies',
      'Familiarity with data preprocessing and augmentation techniques',
      'Experience with version control systems (Git) and collaborative development',
      '3+ years of experience in AI/ML development',
      'Strong problem-solving and analytical thinking skills'
    ],
    benefits: [
      'Competitive salary with performance-based bonuses',
      'Comprehensive learning and development opportunities',
      'Work on innovative AI projects with real-world impact',
      'Access to latest AI research papers and resources',
      'Collaborative work environment with leading AI researchers',
      'Health insurance and medical coverage',
      'Flexible work arrangements and modern office facilities'
    ],
    tags: ['AI', 'Machine Learning', 'Computer Vision', 'Deep Learning', 'Python', 'Azure'],
    remote: false,
    postedDate: '2024-01-15',
    applicationDeadline: '2024-02-28',
    applicationUrl: 'https://techinnovate.com/careers/ai-developer',
    isBookmarked: false
  },
  {
    id: '4',
    title: 'AI Lead',
    company: 'TechInnovate',
    companyLogo: 'https://via.placeholder.com/60x60/6C757D/ffffff?text=TI',
    location: 'Bengaluru, Karnataka, India',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 1500000,
      max: 8000000,
      currency: 'INR'
    },
    description: `TechInnovate is seeking an experienced AI Lead to spearhead our artificial intelligence initiatives and lead a team of talented AI engineers and researchers. This is a strategic leadership role that combines technical expertise with team management responsibilities.

As AI Lead, you will be responsible for developing comprehensive AI solutions using foundation models, driving technological innovation, and establishing best practices for our AI development processes. You'll work closely with executive leadership to shape our AI strategy and roadmap.

This role offers the opportunity to make a significant impact on our company's AI capabilities while building and mentoring a world-class AI team. You'll be at the forefront of AI innovation, working on projects that push the boundaries of what's possible with artificial intelligence.`,
    requirements: [
      'Extensive experience in developing end-to-end solutions with foundation models',
      'Proven expertise in continuous model improvement processes and optimization',
      'Strong leadership skills with experience mentoring teams on AI experiments, KPIs, and benchmarking',
      'Focus on production cost optimization and efficient resource utilization',
      'Deep experience in computer vision algorithm development using deep learning',
      'Comprehensive understanding of foundation models in Image, Video, and Vision-Language Models',
      'Expert-level proficiency in Python, OpenCV, TensorFlow, and PyTorch',
      'Extensive experience with cloud platforms, preferably Microsoft Azure',
      'Strong knowledge of MLOps, model deployment, and production systems',
      'Experience with distributed computing and large-scale AI systems',
      'Excellent communication and stakeholder management skills',
      '7+ years of AI/ML experience with 3+ years in leadership roles',
      'PhD or Master\'s degree in Computer Science, AI, or related field preferred'
    ],
    benefits: [
      'Highly competitive salary with equity participation',
      'Leadership development and executive coaching opportunities',
      'Strategic role with direct impact on company direction',
      'Budget for team building and professional development',
      'Access to cutting-edge AI research and technology',
      'Flexible work arrangements and executive benefits package',
      'Opportunity to build and shape a world-class AI team',
      'Conference speaking and thought leadership opportunities'
    ],
    tags: ['AI Leadership', 'Machine Learning', 'Computer Vision', 'Innovation', 'Team Management'],
    remote: false,
    postedDate: '2024-01-15',
    applicationDeadline: '2024-03-01',
    applicationUrl: 'https://techinnovate.com/careers/ai-lead',
    isBookmarked: false
  },
  {
    id: '5',
    title: 'Founding Engineer, AI',
    company: 'Cenna',
    companyLogo: 'https://via.placeholder.com/60x60/17627A/ffffff?text=CN',
    location: 'Hyderabad, Telangana, India',
    type: 'Full-time',
    experienceLevel: 'Senior Level',
    salary: {
      min: 1500000,
      max: 2500000,
      currency: 'INR'
    },
    description: `Cenna is an early-stage AI startup building revolutionary artificial intelligence solutions. We're looking for a visionary Founding Engineer to join our core team and shape the future of AI technology from the ground up.

As a Founding Engineer, you'll have the unique opportunity to define our technical architecture, build our AI platform from scratch, and establish the engineering culture that will drive our company's success. You'll work directly with the founding team to bring cutting-edge AI research into production-ready products.

This is a rare opportunity to be part of something transformational from day one. You'll have significant equity upside, direct input into product strategy, and the chance to build something truly groundbreaking in the AI space.`,
    requirements: [
      'Extensive experience in AI and machine learning with proven track record of building production systems',
      'Strong technical leadership skills and ability to architect scalable AI solutions from scratch',
      'Proven experience in AI product development from concept to market launch',
      'Expertise in modern AI/ML frameworks (PyTorch, TensorFlow, Hugging Face)',
      'Experience with cloud infrastructure and DevOps practices (AWS, Azure, GCP)',
      'Strong software engineering fundamentals with ability to write production-quality code',
      'Experience with LLMs, foundation models, and cutting-edge AI research',
      'Ability to mentor and guide technical teams as the company scales',
      'Entrepreneurial mindset with comfort in ambiguous, fast-paced startup environment',
      'Strong communication skills and ability to work with non-technical stakeholders',
      'Experience with fundraising and technical due diligence processes preferred',
      '6+ years of AI/ML experience with at least 2 years in senior technical roles',
      'Advanced degree in Computer Science, AI, or related field preferred'
    ],
    benefits: [
      'Significant equity stake with high growth potential',
      'Competitive base salary with performance bonuses',
      'Direct exposure to cutting-edge AI technology and research',
      'Opportunity to shape company culture and technical direction',
      'Flexible work arrangements and unlimited PTO policy',
      'Budget for professional development and conference attendance',
      'Health insurance and comprehensive benefits package',
      'Access to investor network and startup ecosystem',
      'Opportunity to build and lead technical teams as company grows'
    ],
    tags: ['AI', 'Founding Engineer', 'Leadership', 'Innovation', 'Startup', 'Equity'],
    remote: false,
    postedDate: '2024-01-09',
    applicationDeadline: '2024-02-15',
    applicationUrl: 'https://cenna.com/apply/founding-ai-engineer',
    isBookmarked: false
  },
  {
    id: '6',
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
    id: '7',
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
    id: '8',
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
    id: '9',
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
    id: '10',
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
    id: '11',
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
    id: '12',
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
    id: '13',
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
    id: '14',
    title: 'Artificial Intelligence Engineer',
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
    id: '15',
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
    id: '16',
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
    id: '17',
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