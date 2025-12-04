import { SidebarLinkInfo } from "./typings";
import { MdOutlineDashboard, MdOutlineEmail, MdPayment } from "react-icons/md";
import { PiStudent } from "react-icons/pi";
import { VscBook } from "react-icons/vsc";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { GoTasklist } from "react-icons/go";
import { BsPersonFillAdd } from "react-icons/bs";
import { RiLiveLine } from "react-icons/ri";
import { GrWorkshop } from "react-icons/gr";
import JobsIconController from "../commonComponents/icons/sidebarIcons/JobsIconController";

export const AdminNavigationLinks: SidebarLinkInfo[] = [
  {
    id: 1,
    title: "Dashboard",
    slug: "admin_dashboard",
    links: [
      {
        id: 1,
        title: "Dashboard",
        href: "/admin/dashboard",
        icon: <MdOutlineDashboard />,
      },
    ],
  },
  {
    id: 2,
    title: "Manage Students",
    slug: "admin_manage_students",
    links: [
      {
        id: 2,
        title: "Manage Students",
        href: "/admin/manage-students",
        icon: <PiStudent />,
      },
    ],
  },
  {
    id: 2,
    title: "Course Builder",
    slug: "admin_course_builder",
    links: [
      {
        id: 1,
        title: "Course Builder",
        href: "/admin/courses",
        icon: <VscBook />,
      },
    ],
  },
  {
    id: 3,
    title: "Workshop Registrations",
    slug: "admin_workshop_reg",
    links: [
      {
        id: 1,
        title: "Workshop Registrations",
        href: "/admin/workshop-registrations",
        icon: <LiaChalkboardTeacherSolid />,
      },
    ],
  },

  {
    id: 5,
    title: "Assessment Management",
    slug: "admin_assessment",
    links: [
      {
        id: 1,
        title: "Assessment Management",
        href: "/admin/assessments",
        icon: <GoTasklist />,
      },
      {
        id: 2,
        title: "MCQ Bank",
        href: "/admin/mcqs",
        icon: <GoTasklist />,
      },
      {
        id: 3,
        title: "Assessment Results",
        href: "/admin/assesment-results",
        icon: <GoTasklist />,
      },
    ],
  },
  {
    id: 6,
    title: "Referrals",
    slug: "admin_referral",
    links: [
      {
        id: 1,
        title: "Referrals",
        href: "/admin/referals",
        icon: <BsPersonFillAdd />,
      },
    ],
  },
  {
    id: 7,
    title: "Emails",
    slug: "admin_emails",
    links: [
      {
        id: 1,
        title: "Emails",
        href: "/admin/email-send",
        icon: <MdOutlineEmail />,
      },
    ],
  },
  {
    id: 8,
    title: "Live",
    slug: "admin_live",
    links: [
      {
        id: 1,
        title: "Live",
        href: "/admin/live",
        icon: <RiLiveLine />,
      },
    ],
  },
  {
    id: 9,
    title: "Payment Links",
    slug: "admin_payment",
    links: [
      {
        id: 1,
        title: "Payment Links",
        href: "/admin/payment-links",

        icon: <MdPayment />,
      },
    ],
  },
  {
    id: 10,
    title: "Webinar Management",
    slug: "admin_webinar_management",
    links: [
      {
        id: 1,
        title: "Webinar Management",
        href: "/admin/webinar-management",
        icon: <GrWorkshop />,
      },
    ],
  },
  {
    id: 7,
    title: "Attendance",
    slug: "admin_attendance",
    links: [
      {
        id: 1,
        title: "Attendance",
        href: "/admin/attendance",
        icon: <JobsIconController />,
      },
    ],
  },
];
