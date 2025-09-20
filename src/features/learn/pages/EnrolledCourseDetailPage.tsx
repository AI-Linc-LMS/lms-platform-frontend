import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Home,
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  Menu,
  PlayCircle,
  Star,
  Trophy,
  Target,
  Zap,
} from "lucide-react";
import PrimaryButton from "../../../commonComponents/common-buttons/primary-button/PrimaryButton";
import DashboardPieChart from "../components/enrolled-courses/DashboardPieChart";
import BackToHomeButton from "../../../commonComponents/common-buttons/back-buttons/back-to-home-button/BackToHomeButton";
import CourseContent from "../components/enrolled-courses/CourseContent";
import EnrolledLeaderBoard from "../components/enrolled-courses/EnrolledLeader";
import {
  getCourseById,
  getCourseDashboard,
} from "../../../services/enrolled-courses-content/courseContentApis";
import { useQuery } from "@tanstack/react-query";

const EnrolledCourseDetailPage: React.FC = () => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "content" | "progress" | "leaderboard"
  >("content");

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourseById(clientId, parseInt(courseId!)),
  });

  const {
    data,
    isLoading: isLoadingDashboard,
    error: errorDashboard,
  } = useQuery({
    queryKey: ["DashboardPieChart", courseId],
    queryFn: () => getCourseDashboard(clientId, parseInt(courseId!)),
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const isCourseDataEmpty =
    !course ||
    !course.course_title ||
    !course.course_description ||
    !course.instructors ||
    !course.modules ||
    course.modules.length === 0;

  // Enhanced Mobile Header with Learning Focus
  const MobileHeader = () => (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 backdrop-blur-sm shadow-lg md:hidden"
    >
      <div className="px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">
                {course?.course_title || "Loading Course..."}
              </h1>
              {course?.modules && (
                <div className="flex items-center gap-2 text-xs opacity-90">
                  <span>
                    {course.modules.length} modules • Certificate Ready
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-white/20 rounded-full transition-colors touch-manipulation"
            >
              <Home className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Enhanced Progress Bar */}
        {course && (
          <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-green-500/20 rounded-full px-2 py-1">
                  <Trophy className="w-3 h-3 text-yellow-300" />
                  <span className="font-semibold">Active Learner</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>194 students</span>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-orange-500/20 rounded-full px-2 py-1">
                <Clock className="w-3 h-3 text-orange-300" />
                <span>Updated recently</span>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white/20 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "15%" }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"
                />
              </div>
              <span className="text-xs font-bold">15%</span>
            </div>
          </div>
        )}
      </div>
    </motion.header>
  );

  // Enhanced Mobile Tab Navigation
  const MobileTabNav = () => (
    <nav className="sticky top-[140px] z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 md:hidden">
      <div className="px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {[
            {
              id: "content",
              label: "Course Content",
              icon: BookOpen,
              color: "blue",
            },
            {
              id: "progress",
              label: "My Progress",
              icon: TrendingUp,
              color: "green",
            },
            {
              id: "leaderboard",
              label: "Leaderboard",
              icon: Award,
              color: "purple",
            },
          ].map(({ id, label, icon: Icon, color }) => (
            <motion.button
              key={id}
              onClick={() => setActiveTab(id as any)}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all whitespace-nowrap touch-manipulation rounded-t-xl relative ${
                activeTab === id
                  ? `text-${color}-600 bg-gradient-to-t from-${color}-50 to-transparent shadow-md`
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  activeTab === id ? `text-${color}-600` : ""
                } transition-all`}
              />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{label.split(" ")[0]}</span>

              {/* Active indicator */}
              {activeTab === id && (
                <motion.div
                  layoutId="activeTab"
                  className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-${color}-500 rounded-full`}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
    </nav>
  );

  // Enhanced Quick Actions Bar
  const QuickActionsBar = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 z-40 bg-gradient-to-r from-blue-600 to-indigo-600 backdrop-blur-sm shadow-2xl p-4 md:hidden"
    >
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 px-4 rounded-2xl font-semibold transition-all touch-manipulation flex items-center justify-center gap-2 shadow-xl"
        >
          <PlayCircle className="w-5 h-5" />
          <span>Continue Learning</span>
          <Zap className="w-4 h-4 text-yellow-300" />
        </motion.button>
        <button className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-all touch-manipulation">
          <Menu className="w-5 h-5 text-white" />
        </button>
      </div>
    </motion.div>
  );

  // Error States with Enhanced Design
  if (!courseId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center"
        >
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the course you're looking for. Let's get you back
            to learning!
          </p>
          <PrimaryButton
            onClick={() => navigate("/")}
            className="w-full !py-4 !rounded-xl hover:scale-105 transition-all duration-300"
          >
            <div className="flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Back to Courses
            </div>
          </PrimaryButton>
        </motion.div>
      </div>
    );
  }

  // Enhanced 403 Error with Better UX
  if (error?.message === "Request failed with status code 403") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="hidden md:block">
          <BackToHomeButton />
        </div>
        <div className="md:hidden">
          <MobileHeader />
        </div>

        <div className="p-4 pt-8 flex items-center justify-center min-h-[calc(100vh-120px)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-3xl border-2 border-[#80C9E0] bg-white shadow-2xl overflow-hidden"
          >
            {/* Enhanced Header */}
            <div className="bg-gradient-to-r from-[#2A8CB0] via-[#80C9E0] to-[#2A8CB0] p-8 text-white text-center relative overflow-hidden">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
              >
                <Target className="w-10 h-10" />
              </motion.div>

              <h2 className="text-3xl font-bold mb-2">🎯 Secure Your Seat</h2>
              {course?.course_title ? (
                <h3 className="text-lg font-semibold mb-2">
                  {course.course_title}
                </h3>
              ) : (
                <p className="mb-2">🚀 Transform Your Career Today</p>
              )}
              <div className="flex items-center justify-center gap-2 text-sm opacity-90">
                <Users className="w-4 h-4" />
                <span>Join 194+ successful learners 🌟</span>
              </div>
            </div>

            <div className="p-8">
              {/* Enhanced Pricing */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="rounded-2xl p-8 mb-6 border-2 border-[#80C9E0] bg-gradient-to-br from-[#E9F7FA] to-[#F0FFFE] text-center relative overflow-hidden"
              >
                <div className="absolute top-3 right-3">
                  <motion.span
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs px-3 py-1.5 rounded-full font-bold shadow-lg"
                  >
                    🏆 Best Value
                  </motion.span>
                </div>

                <div className="text-5xl font-bold bg-gradient-to-r from-[#2A8CB0] to-[#80C9E0] bg-clip-text text-transparent mb-3">
                  ₹499
                </div>
                <div className="text-sm text-gray-600 mb-4 font-medium">
                  🎓 Your gateway to SQL mastery & career growth
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-white/70 rounded-full px-4 py-2">
                  <Clock className="w-3 h-3" />
                  <span>⚡ One-time • 🏆 Lifetime access • 📜 Certificate</span>
                </div>
              </motion.div>

              {/* Urgency Section */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <div className="flex items-center mb-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3"
                  ></motion.div>
                  <span className="text-sm font-bold text-yellow-800">
                    🔥 Limited Time Offer!
                  </span>
                </div>
                <p className="text-xs text-yellow-700">
                  ⏰ Only 12 seats left at this special price!
                </p>
              </div>

              {/* Enhanced Benefits */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 mb-8">
                <h4 className="font-bold text-gray-900 mb-4 text-center flex items-center justify-center gap-2">
                  <Star className="w-5 h-5 text-blue-600" />
                  What You'll Master 🎯
                </h4>
                <div className="space-y-3">
                  {[
                    { text: "Live sessions with industry experts", icon: "🎯" },
                    { text: "Priority access to premium content", icon: "⚡" },
                    { text: "1-on-1 mentor guidance", icon: "👨‍🏫" },
                    { text: "Industry-recognized certificate", icon: "🏆" },
                  ].map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center hover:bg-white/50 p-3 rounded-lg transition-all"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-700 text-sm font-medium">
                        {benefit.icon} {benefit.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Enhanced CTAs */}
              <div className="space-y-4">
                <PrimaryButton
                  className="w-full !px-6 !py-5 !rounded-2xl !text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 bg-gradient-to-r from-blue-600 to-indigo-600"
                  onClick={() =>
                    window.open(
                      "https://staging.ailinc.com/flagship-program-payment?data=dv_t0riqr_f.5ac86e41",
                      "_blank"
                    )
                  }
                >
                  <div className="flex items-center justify-center gap-3">
                    <Trophy className="w-6 h-6" />
                    <span>🚀 Secure My Seat Now</span>
                    <Star className="w-5 h-5 text-yellow-300" />
                  </div>
                </PrimaryButton>

                <button
                  onClick={() => navigate("/")}
                  className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 font-semibold transition-all touch-manipulation"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    <span>🤔 I'll decide later</span>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Enhanced Loading State
  if (isCourseDataEmpty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="hidden md:block">
          <BackToHomeButton />
        </div>
        <div className="md:hidden">
          <MobileHeader />
        </div>

        <div className="p-4">
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-800 mb-2">
                    🔍 Course Loading Issue
                  </p>
                  <p className="text-sm text-yellow-700">
                    📡 We're having trouble loading your course content. Your
                    progress is safe! Please refresh or contact support.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Enhanced Skeleton */}
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-xl animate-pulse"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-200 to-purple-200 rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main Course Layout
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <MobileHeader />
      <MobileTabNav />

      <div className="pb-24 md:pb-6">
        {/* Mobile Tabbed Content */}
        <div className="md:hidden p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "content" && (
                <CourseContent
                  course={course}
                  isLoading={isLoading}
                  error={error}
                />
              )}
              {activeTab === "progress" && (
                <DashboardPieChart
                  data={data}
                  isLoading={isLoadingDashboard}
                  error={errorDashboard}
                />
              )}
              {activeTab === "leaderboard" && (
                <EnrolledLeaderBoard courseId={parseInt(courseId)} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Desktop Multi-column Layout */}
        <div className="hidden md:block">
          <BackToHomeButton />
          <div className="flex flex-col md:flex-row w-full gap-6 p-6 max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full"
            >
              <CourseContent
                course={course}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
            <div className="flex flex-col gap-6 w-full md:w-auto md:min-w-[400px]">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <DashboardPieChart
                  data={data}
                  isLoading={isLoadingDashboard}
                  error={errorDashboard}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <EnrolledLeaderBoard courseId={parseInt(courseId)} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <QuickActionsBar />
    </div>
  );
};

export default EnrolledCourseDetailPage;
