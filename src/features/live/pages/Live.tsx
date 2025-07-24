import React, { useState, useEffect } from "react";
import UpcomingSessionBanner from "../components/UpcomingSessionBanner";
import PastRecordings from "../components/PastRecordings";
import { UpcomingSession, Recording } from "../types/live.types";

// Mock data - In real app, this would come from API
const mockUpcomingSession: UpcomingSession = {
  id: 1,
  title: "Advanced React Patterns & State Management",
  description:
    "Deep dive into advanced React patterns, hooks, and state management with Redux Toolkit",
  trainer: {
    name: "Sarah Johnson",
    avatar:
      "https://images.unsplash.com/photo-1494790108755-2616b612c3e3?w=150&h=150&fit=crop&crop=face",
    bio: "Senior Frontend Engineer at Google, 8+ years experience",
    linkedIn: "https://linkedin.com/in/sarahjohnson",
  },
  scheduledTime: "2024-01-15T10:00:00Z",
  duration: 120,
  zoomLink: "https://zoom.us/j/123456789",
  banner:
    "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=400&fit=crop",
  isLive: false,
};

const mockPastRecordings: Recording[] = [
  {
    id: 1,
    title: "JavaScript Fundamentals & ES6 Features",
    description: "Complete guide to modern JavaScript and ES6+ features",
    trainer: {
      name: "Alex Chen",
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      bio: "JavaScript Expert at Meta",
    },
    recordedDate: "2024-01-10T14:00:00Z",
    duration: 90,
    views: 1250,
    zoomRecordingLink: "https://zoom.us/rec/play/recording1",
    banner:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=400&fit=crop",
    category: "Frontend Development",
  },
  {
    id: 2,
    title: "Backend Architecture & Database Design",
    description: "Building scalable backend systems and database optimization",
    trainer: {
      name: "Michael Rodriguez",
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      bio: "Senior Backend Engineer at Netflix",
    },
    recordedDate: "2024-01-08T16:30:00Z",
    duration: 135,
    views: 892,
    zoomRecordingLink: "https://zoom.us/rec/play/recording2",
    banner:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=400&fit=crop",
    category: "Backend Development",
  },
  {
    id: 3,
    title: "DevOps & Cloud Deployment Strategies",
    description: "Modern DevOps practices and cloud deployment with AWS/Azure",
    trainer: {
      name: "Emily Wang",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      bio: "DevOps Lead at Amazon",
    },
    recordedDate: "2024-01-05T11:15:00Z",
    duration: 105,
    views: 1100,
    zoomRecordingLink: "https://zoom.us/rec/play/recording3",
    banner:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop",
    category: "DevOps",
  },
  {
    id: 4,
    title: "Mobile App Development with React Native",
    description: "Cross-platform mobile development using React Native",
    trainer: {
      name: "David Kim",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      bio: "Mobile Tech Lead at Uber",
    },
    recordedDate: "2024-01-03T13:45:00Z",
    duration: 150,
    views: 750,
    zoomRecordingLink: "https://zoom.us/rec/play/recording4",
    banner:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=400&fit=crop",
    category: "Mobile Development",
  },
];

const Live: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to check if session is live
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#343A40] mb-4">
            Live Classes
          </h1>
          <p className="text-lg text-[#6C757D] max-w-2xl mx-auto">
            Join live sessions with industry experts and access our library of
            recorded classes
          </p>
        </div>

        {/* Upcoming Session Banner */}
        <UpcomingSessionBanner
          session={mockUpcomingSession}
          currentTime={currentTime}
        />

        {/* Past Recordings Section */}
        <PastRecordings recordings={mockPastRecordings} />
      </div>
    </div>
  );
};

export default Live;
