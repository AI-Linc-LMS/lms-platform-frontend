import { lazy } from "react";

const Jobs = lazy(() => import("./features/jobs/pages/Jobs"));
const JobDetail = lazy(() => import("./features/jobs/pages/JobDetail"));
const Learn = lazy(() => import("./features/learn/pages/Learn"));
const Live = lazy(() => import("./features/live/pages/Live"));
// Might have potential bug
const CourseDetailPage = lazy(
  () => import("./features/learn/pages/EnrolledCourseDetailPage")
);
const CourseTopicDetailPage = lazy(
  () => import("./features/learn/pages/CourseTopicDetailPage")
);

const Login = lazy(() => import("./features/auth/pages/Login"));
const ForgotPassword = lazy(
  () => import("./features/auth/pages/ForgotPassword")
);
const Signup = lazy(() => import("./features/auth/pages/Signup"));
const CourseBuilder = lazy(
  () => import("./features/admin/course-builder/pages/CourseBuilder")
);
const AdminCourseDetailPage = lazy(
  () => import("./features/admin/course-builder/pages/CourseDetailPage")
);
const Courses = lazy(() => import("./features/learn/pages/Courses"));
const ContinueLearningAll = lazy(
  () => import("./features/learn/pages/ContinueLearningAll")
);
const RecommendedLearningAll = lazy(
  () => import("./features/learn/pages/RecommendedLearningAll")
);
const Dashboard = lazy(
  () => import("./features/admin/dashboard/pages/Dashboard")
);

const mockInterview = lazy(
  () => import("./features/learn/pages/MockInterview")
);
const ManageStudents = lazy(
  () => import("./features/admin/manage-students/pages/ManageStudents")
);
const StudentDetailPage = lazy(
  () => import("./features/admin/manage-students/pages/StudentDetailPage")
);

const ShortAssessment = lazy(
  () => import("./features/learn/pages/ShortAssessment")
);
const InstructionPage = lazy(
  () => import("./features/learn/pages/InstructionPage")
);
const AssessmentsList = lazy(
  () => import("./features/learn/pages/AssessmentsList")
);
const ProfileSettings = lazy(() => import("./components/UserProfile"));
const AssesmentStudentsResults = lazy(
  () => import("./features/admin/assesment-results/AssesmentStudentsResults")
);
const Otp = lazy(() => import("./features/auth/pages/Otp"));
const WorkshopResistrations = lazy(
  () => import("./features/admin/workshop-registrations/WorkshopResistrations")
);
const CertificatePortal = lazy(
  () => import("./components/certificate/CertificatePortal")
);
const PhoneVerificationPage = lazy(
  () => import("./features/learn/pages/PhoneVerificationPage")
);
const RoadmapPage = lazy(
  () => import("./features/learn/components/assessment/RoadmapPage")
);
const Referals = lazy(() => import("./features/admin/referals/Referals"));
const PartialPaymentPage = lazy(
  () => import("./features/learn/pages/PartialPaymentPage")
);
const PaymentLinkGeneratorPage = lazy(
  () => import("./features/admin/pages/PaymentLinkGeneratorPage")
);
const EmailSelfServe = lazy(
  () => import("./features/admin/emailSend/EmailSelfServe")
);
const LiveAdmin = lazy(() => import("./features/admin/live/LiveAdmin"));
const CommunityPage = lazy(
  () => import("./features/community/pages/CommunityPage")
);
const WebinarManagement = lazy(() => import("./pages/admin/WebinarManagement"));
const AttendanceManagementPage = lazy(
  () => import("./features/admin/pages/AttendanceManagementPage")
);
const AttendancePage = lazy(
  () => import("./features/learn/pages/AttendancePage")
);
import { PWATestPage } from "./components/PWATestPage";
import { IOSPWATestPage } from "./components/IOSPWATestPage";

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  isPrivate: boolean;
  requiredRole?: string;
  hasNestedRoutes?: boolean;
}

const routes: RouteConfig[] = [
  {
    path: "/login",
    component: Login,
    isPrivate: false,
  },
  {
    path: "/forgot-password",
    component: ForgotPassword,
    isPrivate: false,
  },
  {
    path: "/signup",
    component: Signup,
    isPrivate: false,
  },
  {
    path: "/otp",
    component: Otp,
    isPrivate: false,
  },
  {
    path: "/pwa-test",
    component: PWATestPage,
    isPrivate: false,
  },
  {
    path: "/ios-pwa-test",
    component: IOSPWATestPage,
    isPrivate: false,
  },
  {
    path: "/",
    component: Learn,
    isPrivate: true,
  },
  {
    path: "/attendance",
    component: AttendancePage,
    isPrivate: true,
  },

  {
    path: "/learn",
    component: Learn,
    isPrivate: true,
  },
  {
    path: "/courses",
    component: Courses,
    isPrivate: true,
  },
  {
    path: "/assessments",
    component: AssessmentsList,
    isPrivate: true,
  },
  {
    path: "/assessment/quiz",
    component: ShortAssessment,
    isPrivate: true,
  },
  {
    path: "/assessment/phone-verification",
    component: PhoneVerificationPage,
    isPrivate: true,
  },
  {
    path: "/assessment/phone-verification/:ref",
    component: PhoneVerificationPage,
    isPrivate: true,
  },
  {
    path: "/live",
    component: Live,
    isPrivate: true,
  },
  {
    path: "/jobs",
    component: Jobs,
    isPrivate: true,
  },
  {
    path: "/jobs/:jobId",
    component: JobDetail,
    isPrivate: false,
  },
  {
    path: "/courses",
    component: Courses, // Using Learn as placeholder for Community page
    isPrivate: true,
  },
  {
    path: "/mock-interview/*",
    component: mockInterview,
    isPrivate: true,
    hasNestedRoutes: true, // Special flag for routes with their own routing
  },
  {
    path: "/courses/:courseId",
    component: CourseDetailPage,
    isPrivate: true,
  },
  {
    path: "/learn/course/:courseId/:submoduleId",
    component: CourseTopicDetailPage,
    isPrivate: true,
  },
  {
    path: "/admin/courses",
    component: CourseBuilder,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/dashboard",
    component: Dashboard,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },

  {
    path: "/admin/email-send",
    component: EmailSelfServe,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/live",
    component: LiveAdmin,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/workshop-registrations",
    component: WorkshopResistrations,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/referals",
    component: Referals,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/assesment-results",
    component: AssesmentStudentsResults,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/attendance",
    component: AttendanceManagementPage,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/manage-students",
    component: ManageStudents,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/manage-students/:studentId",
    component: StudentDetailPage,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/courses/:courseId",
    component: AdminCourseDetailPage,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },
  {
    path: "/admin/payment-links",
    component: PaymentLinkGeneratorPage,
    isPrivate: true,
    requiredRole: "admin_or_instructor",
  },

  {
    path: "/continue-learning",
    component: ContinueLearningAll,
    isPrivate: true,
  },
  {
    path: "/recommended-learning",
    component: RecommendedLearningAll,
    isPrivate: true,
  },
  {
    path: "/user-profile",
    component: ProfileSettings,
    isPrivate: true,
  },
  {
    path: "/certificates",
    component: CertificatePortal,
    isPrivate: true,
  },
  {
    path: "/assessment/:assessmentId",
    component: InstructionPage,
    isPrivate: true,
  },
  {
    path: "/assessment/:assessmentId/:ref",
    component: InstructionPage,
    isPrivate: true,
  },
  {
    path: "/roadmap/:assessmentId",
    component: RoadmapPage,
    isPrivate: true,
  },
  {
    path: "/flagship-program-payment",
    component: PartialPaymentPage,
    isPrivate: true,
  },
  {
    path: "/nanodegree-program-payment",
    component: PartialPaymentPage,
    isPrivate: true,
  },
  {
    path: "/community",
    component: CommunityPage,
    isPrivate: true,
  },
  {
    path: "/admin/webinar-management",
    component: WebinarManagement,
    isPrivate: true,
  },
];

export default routes;
