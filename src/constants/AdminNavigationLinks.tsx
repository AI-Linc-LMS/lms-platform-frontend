import { SidebarLinkInfo } from "./typings";
import { MdOutlineDashboard, MdOutlineEmail, MdPayment } from "react-icons/md";
import { PiStudent } from "react-icons/pi";
import { VscBook } from "react-icons/vsc";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { GoTasklist } from "react-icons/go";
import { BsPersonFillAdd } from "react-icons/bs";
import { RiLiveLine } from "react-icons/ri";
import { GrWorkshop } from "react-icons/gr";

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
    slug: "manage_students",
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
    slug: "course_builder",
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
    slug: "workshop_registrations",
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
    title: "Assesment Results",
    slug: "assesment_results",
    links: [
      {
        id: 1,
        title: "Assesment Results",
        href: "/admin/assesment-results",
        icon: <GoTasklist />,
      },
    ],
  },
  {
    id: 6,
    title: "Referrals",
    slug: "referrals",
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
    slug: "emails",
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
    slug: "payment_links",
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
    slug: "webinar_management",
    links: [
      {
        id: 1,
        title: "Webinar Management",
        href: "/admin/webinar-management",
        icon: <GrWorkshop />,
      },
    ],
  },
];