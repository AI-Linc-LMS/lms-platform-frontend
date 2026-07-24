import type { UserProfile } from "@/lib/services/profile.service";
import type { ResumeData } from "@/components/profile/resume/types";

/**
 * Maps a saved user profile into the ResumeBuilder's initial data shape.
 *
 * Single source of truth so the resume seeds identically wherever it is opened
 * - the `/profile` Resume tab and the standalone `/resume` route - and so the
 * profile ⇄ resume sync (Phase 2) has one mapping to evolve.
 */
export function buildResumeInitialData(profile: UserProfile): Partial<ResumeData> {
  return {
    basicInfo: {
      firstName: profile.first_name,
      lastName: profile.last_name,
      professionalTitle: profile.headline ?? "",
      email: profile.email,
      phone: profile.phone_number,
      location: [profile.city, profile.state].filter(Boolean).join(", "),
      photo: profile.profile_picture,
      summary: profile.bio ?? "",
      github: profile.social_links?.github ?? "",
      linkedin: profile.social_links?.linkedin ?? "",
      portfolio: profile.portfolio_website_url ?? "",
      leetcode: profile.leetcode_url ?? "",
      hackerrank: profile.hackerrank_url ?? "",
      kaggle: profile.kaggle_url ?? "",
      medium: profile.medium_url ?? "",
    },
    workExperience: profile.experience?.map((exp, i) => ({
      id: exp.id ?? String(i + 1),
      position: exp.position,
      company: exp.company,
      location: exp.location ?? "",
      startDate: exp.start_date,
      endDate: exp.end_date ?? "",
      current: exp.current,
      description: exp.description ? exp.description.split("\n").filter(Boolean) : [],
    })),
    education: profile.education?.map((edu, i) => ({
      id: edu.id ?? String(i + 1),
      degree: [edu.degree, edu.field_of_study].filter(Boolean).join(" in "),
      institution: edu.institution,
      location: "",
      startDate: edu.start_date ?? "",
      endDate: edu.end_date ?? "",
      gpa: edu.gpa ?? "",
      description: edu.description ?? "",
    })),
    skills: profile.skills?.map((s, i) => ({
      id: s.id ?? String(i + 1),
      name: s.name,
    })),
    projects: profile.projects?.map((p, i) => ({
      id: p.id ?? String(i + 1),
      name: p.name,
      description: p.description,
      technologies: p.technologies ?? [],
      link: p.url ?? "",
    })),
    certifications: profile.certifications?.map((c, i) => ({
      id: c.id ?? String(i + 1),
      name: c.name,
      issuer: c.issuing_organization,
      date: c.issue_date,
      link: c.credential_url ?? "",
    })),
  };
}
