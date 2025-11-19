import { v4 as uuidv4 } from "uuid";
import { ResumeData, ColorScheme, SkillCategory } from "../types/resume";

export const getDummyResumeData = (): ResumeData => {
  return {
    personalInfo: {
      firstName: "Alex",
      lastName: "Johnson",
      imageUrl: "https://via.placeholder.com/150?text=AJ",
      title: "Senior Full Stack Developer",
      email: "alex.johnson@example.com",
      phone: "+1 (555) 987-6543",
      address: "456 Tech Avenue, San Francisco, CA 94105",
      location: "San Francisco, CA",
      website: "https://alexjohnson.dev",
      relevantExperience: "8",
      totalExperience: "10",
      // Links
      linkedin: "https://linkedin.com/in/alexjohnson",
      twitter: "https://twitter.com/alexjohnson",
      github: "https://github.com/alexjohnson",
      hackerrank: "https://www.hackerrank.com/alexjohnson",
      hackerearth: "https://www.hackerearth.com/@alexjohnson",
      codechef: "https://www.codechef.com/users/alexjohnson",
      leetcode: "https://leetcode.com/alexjohnson",
      cssbattle: "https://cssbattle.dev/player/alexjohnson",
      // About
      summary:
        "Experienced full-stack developer with a passion for building scalable web applications. Specialized in React, Node.js, and cloud technologies. Led multiple projects from conception to deployment, resulting in improved user engagement and system performance. Strong background in algorithms and data structures with competitive programming experience.",
      careerObjective:
        "To leverage my technical expertise and leadership skills in a challenging role where I can contribute to innovative projects and drive technological advancements. Seeking opportunities to work with cutting-edge technologies and mentor junior developers.",
    },
    experience: [
      {
        id: uuidv4(),
        jobTitle: "Senior Software Engineer",
        company: "Tech Solutions Inc.",
        location: "San Francisco, CA",
        startDate: "2021-01",
        endDate: "",
        isCurrentJob: true,
        years: 3,
        description:
          "• Led a team of 5 developers to build scalable microservices architecture\n• Improved application performance by 40% through optimization and caching strategies\n• Architected and implemented CI/CD pipelines reducing deployment time by 60%\n• Mentored junior developers and conducted code reviews\n• Collaborated with product managers to define technical roadmaps",
      },
      {
        id: uuidv4(),
        jobTitle: "Software Engineer",
        company: "Innovation Labs",
        location: "New York, NY",
        startDate: "2018-06",
        endDate: "2020-12",
        isCurrentJob: false,
        years: 2.5,
        description:
          "• Developed full-stack web applications using React, Node.js, and PostgreSQL\n• Collaborated with product managers and designers to implement new features\n• Reduced bug reports by 25% through improved testing and code quality\n• Participated in agile sprints and daily standups\n• Built RESTful APIs serving 1M+ requests daily",
      },
      {
        id: uuidv4(),
        jobTitle: "Junior Developer",
        company: "StartupXYZ",
        location: "Austin, TX",
        startDate: "2016-08",
        endDate: "2018-05",
        isCurrentJob: false,
        years: 1.75,
        description:
          "• Built responsive web applications using HTML, CSS, and JavaScript\n• Worked closely with senior developers to learn best practices\n• Fixed bugs and implemented minor features\n• Participated in code reviews and team meetings\n• Maintained legacy codebase and documentation",
      },
    ],
    education: [
      {
        id: uuidv4(),
        degree: "Master of Science in Computer Science",
        institution: "Stanford University",
        location: "Stanford, CA",
        area: "Machine Learning & Distributed Systems",
        grade: "3.9/4.0",
        startDate: "2014-09",
        graduationDate: "2016-05",
        isCurrentlyStudying: false,
        gpa: "3.9/4.0",
        description:
          "• Specialized in Machine Learning and Distributed Systems\n• Thesis: 'Scalable Recommendation Systems using Deep Learning'\n• Graduate Teaching Assistant for Algorithms course\n• Member of Graduate Student Council\n• Published 2 research papers in top-tier conferences",
      },
      {
        id: uuidv4(),
        degree: "Bachelor of Science in Computer Science",
        institution: "University of California, Berkeley",
        location: "Berkeley, CA",
        area: "Computer Science",
        grade: "3.8/4.0",
        startDate: "2010-09",
        graduationDate: "2014-05",
        isCurrentlyStudying: false,
        gpa: "3.8/4.0",
        description:
          "• Relevant coursework: Data Structures, Algorithms, Database Systems, Operating Systems\n• Dean's List: Fall 2012, Spring 2013, Fall 2013, Spring 2014\n• Senior Project: Built a real-time collaborative code editor\n• Vice President of Computer Science Student Association\n• Participated in ACM programming contests",
      },
    ],
    skills: [
      // Language
      { id: uuidv4(), name: "JavaScript", category: "Language" as SkillCategory, level: "Expert", priority: 1 },
      { id: uuidv4(), name: "TypeScript", category: "Language" as SkillCategory, level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "HTML5", category: "Language" as SkillCategory, level: "Expert", priority: 3 },
      { id: uuidv4(), name: "CSS3", category: "Language" as SkillCategory, level: "Expert", priority: 4 },
      { id: uuidv4(), name: "Python", category: "Language" as SkillCategory, level: "Advanced", priority: 5 },
      { id: uuidv4(), name: "Java", category: "Language" as SkillCategory, level: "Intermediate", priority: 6 },
      // Framework
      { id: uuidv4(), name: "React", category: "Framework" as SkillCategory, level: "Expert", priority: 1 },
      { id: uuidv4(), name: "Angular", category: "Framework" as SkillCategory, level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "Vue.js", category: "Framework" as SkillCategory, level: "Intermediate", priority: 3 },
      { id: uuidv4(), name: "Node.js", category: "Framework" as SkillCategory, level: "Expert", priority: 4 },
      { id: uuidv4(), name: "Express.js", category: "Framework" as SkillCategory, level: "Expert", priority: 5 },
      // Technologies
      { id: uuidv4(), name: "Algorithms", category: "Technologies" as SkillCategory, level: "Expert", priority: 1 },
      { id: uuidv4(), name: "Progressive Web Apps", category: "Technologies" as SkillCategory, level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "SQL", category: "Technologies" as SkillCategory, level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Data Structures", category: "Technologies" as SkillCategory, level: "Expert", priority: 4 },
      { id: uuidv4(), name: "GraphQL", category: "Technologies" as SkillCategory, level: "Advanced", priority: 5 },
      { id: uuidv4(), name: "RESTful APIs", category: "Technologies" as SkillCategory, level: "Expert", priority: 6 },
      // Libraries
      { id: uuidv4(), name: "jQuery", category: "Libraries" as SkillCategory, level: "Advanced", priority: 1 },
      { id: uuidv4(), name: "Redux", category: "Libraries" as SkillCategory, level: "Expert", priority: 2 },
      { id: uuidv4(), name: "Axios", category: "Libraries" as SkillCategory, level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Lodash", category: "Libraries" as SkillCategory, level: "Advanced", priority: 4 },
      { id: uuidv4(), name: "React Query", category: "Libraries" as SkillCategory, level: "Advanced", priority: 5 },
      // Database
      { id: uuidv4(), name: "Firebase", category: "Database" as SkillCategory, level: "Advanced", priority: 1 },
      { id: uuidv4(), name: "MongoDB", category: "Database" as SkillCategory, level: "Advanced", priority: 2 },
      { id: uuidv4(), name: "PostgreSQL", category: "Database" as SkillCategory, level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "MySQL", category: "Database" as SkillCategory, level: "Intermediate", priority: 4 },
      { id: uuidv4(), name: "Redis", category: "Database" as SkillCategory, level: "Intermediate", priority: 5 },
      // Practices
      { id: uuidv4(), name: "Component Based Architecture", category: "Practices" as SkillCategory, level: "Expert", priority: 1 },
      { id: uuidv4(), name: "Agile Methodologies", category: "Practices" as SkillCategory, level: "Expert", priority: 2 },
      { id: uuidv4(), name: "Design Patterns", category: "Practices" as SkillCategory, level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Test Driven Development", category: "Practices" as SkillCategory, level: "Advanced", priority: 4 },
      { id: uuidv4(), name: "MVC", category: "Practices" as SkillCategory, level: "Advanced", priority: 5 },
      { id: uuidv4(), name: "Microservices", category: "Practices" as SkillCategory, level: "Advanced", priority: 6 },
      // Tools
      { id: uuidv4(), name: "Git", category: "Tools" as SkillCategory, level: "Expert", priority: 1 },
      { id: uuidv4(), name: "VS Code", category: "Tools" as SkillCategory, level: "Expert", priority: 2 },
      { id: uuidv4(), name: "Jira", category: "Tools" as SkillCategory, level: "Advanced", priority: 3 },
      { id: uuidv4(), name: "Webpack", category: "Tools" as SkillCategory, level: "Advanced", priority: 4 },
      { id: uuidv4(), name: "Eclipse", category: "Tools" as SkillCategory, level: "Intermediate", priority: 5 },
      { id: uuidv4(), name: "Bitbucket", category: "Tools" as SkillCategory, level: "Advanced", priority: 6 },
      { id: uuidv4(), name: "Docker", category: "Tools" as SkillCategory, level: "Advanced", priority: 7 },
      { id: uuidv4(), name: "AWS", category: "Tools" as SkillCategory, level: "Advanced", priority: 8 },
    ],
    projects: [
      {
        id: uuidv4(),
        name: "E-Commerce Platform",
        description:
          "• Built a full-stack e-commerce platform with user authentication and payment processing\n• Implemented responsive design ensuring optimal user experience across all devices\n• Integrated Stripe API for secure payment processing with real-time order tracking\n• Deployed on AWS with CI/CD pipeline using GitHub Actions\n• Achieved 99.9% uptime and processed 10,000+ orders in first month",
        technologies: ["React", "Node.js", "MongoDB", "Express.js", "Stripe API", "AWS"],
        link: "https://github.com/alexjohnson/ecommerce-platform",
        startDate: "2023-01",
        endDate: "2023-06",
      },
      {
        id: uuidv4(),
        name: "Task Management App",
        description:
          "• Developed a collaborative task management application with real-time updates\n• Implemented drag-and-drop functionality for task organization\n• Built RESTful API backend with JWT authentication\n• Used WebSockets for real-time collaboration features\n• Achieved 50% reduction in team task completion time",
        technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "Socket.io"],
        link: "https://taskapp-demo.vercel.app",
        startDate: "2022-08",
        endDate: "2022-12",
      },
      {
        id: uuidv4(),
        name: "Machine Learning Price Predictor",
        description:
          "• Created a machine learning model to predict real estate prices using Python\n• Scraped and cleaned dataset of 50,000+ property listings\n• Achieved 85% prediction accuracy using Random Forest algorithm\n• Built interactive web dashboard for visualizing predictions\n• Presented findings to local real estate professionals",
        technologies: ["Python", "Scikit-learn", "Pandas", "Flask", "D3.js"],
        link: "https://github.com/alexjohnson/ml-price-predictor",
        startDate: "2022-03",
        endDate: "2022-07",
      },
    ],
    activities: [
      {
        id: uuidv4(),
        name: "Student Council President",
        organization: "University of Technology",
        startDate: "2021-09",
        endDate: "2022-05",
        isCurrent: false,
        involvements: [
          "Led a team of 15 council members to organize campus-wide events",
          "Managed annual budget of $15,000 for student activities",
          "Organized 10+ events with total attendance of 2,000+ students",
          "Improved communication between administration and student body",
        ],
        achievements: [
          "Increased student participation in campus events by 40%",
          "Successfully organized the largest career fair in university history",
          "Received 'Outstanding Student Leader' award from university administration",
        ],
      },
      {
        id: uuidv4(),
        name: "Hackathon Organizer",
        organization: "Computer Science Club",
        startDate: "2020-01",
        endDate: "2022-05",
        isCurrent: false,
        involvements: [
          "Organized annual hackathons with 200+ participants",
          "Coordinated with 10+ tech companies for sponsorships",
          "Managed logistics, scheduling, and event execution",
        ],
        achievements: [
          "Increased participation by 40% over two years",
          "Secured $50,000 in sponsorships from tech companies",
          "Won 'Best Hackathon Event' award at regional competition",
        ],
      },
    ],
    volunteering: [
      {
        id: uuidv4(),
        organization: "Habitat for Humanity",
        role: "Volunteer Coordinator",
        startDate: "2020-03",
        endDate: "2022-08",
        isCurrent: false,
        description:
          "• Coordinated volunteer activities for 50+ volunteers weekly\n• Organized 20+ community build events helping 15 families\n• Managed communication between volunteers and organization staff\n• Trained new volunteers on safety protocols and building techniques",
      },
      {
        id: uuidv4(),
        organization: "Local Food Bank",
        role: "Food Distribution Volunteer",
        startDate: "2019-01",
        endDate: "",
        isCurrent: true,
        description:
          "• Assist with food distribution to 200+ families weekly\n• Help organize and sort donations from local businesses\n• Coordinate with team to ensure efficient operations\n• Maintained positive relationships with community members",
      },
    ],
    awards: [
      {
        id: uuidv4(),
        title: "Outstanding Student Award",
        organization: "University of Technology",
        date: "2022-05",
        description:
          "Recognized for academic excellence, leadership, and contributions to campus community. Awarded to top 5% of graduating class.",
      },
      {
        id: uuidv4(),
        title: "Dean's List",
        organization: "University of Technology",
        date: "2021-12",
        description:
          "Achieved GPA of 3.9/4.0 for three consecutive semesters (Fall 2020, Spring 2021, Fall 2021).",
      },
      {
        id: uuidv4(),
        title: "Best Hackathon Project",
        organization: "TechFest 2021",
        date: "2021-10",
        description:
          "Won first place in annual hackathon competition for developing an innovative healthcare management system.",
      },
    ],
    selectedTemplate: "modern",
    colorScheme: "Professional Blue" as ColorScheme,
    sectionOrder: ["personal", "skills", "experience", "education", "projects", "activities", "volunteering", "awards"],
  };
};

