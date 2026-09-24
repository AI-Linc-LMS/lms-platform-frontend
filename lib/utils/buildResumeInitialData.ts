import type { UserProfile } from "@/lib/services/profile.service";
import type { ResumeData } from "@/components/profile/resume/types";
import { textToResumeHtml } from "@/components/profile/resume/richText";
import { experienceBullets } from "@/lib/utils/experienceBullets";

/**
 * Maps a saved user profile into the ResumeBuilder's initial data shape.
 *
 * Single source of truth so the resume seeds identically wherever it is opened
 * - the `/profile` Resume tab and the standalone `/resume` route - and so the
 * profile ⇄ resume sync (Phase 2) has one mapping to evolve.
 *
 * One way only: this copies the profile INTO a resume. Nothing in the builder writes back.
 *
 * Two conversions happen here, both at the moment a profile value becomes a resume value:
 *
 *   - Work experience becomes one bullet per point. The profile stores points as a list
 *     (`highlights`); an entry saved before that has only free text, recovered by the rule in
 *     experienceBullets.ts. It used to be `description.split("\n")`, which kept a paragraph typed
 *     as "• A • B • C" as ONE bullet and kept every typed "• " beside the template's own marker.
 *   - The rich fields (summary, bullets, education and project descriptions) are HTML in a resume
 *     and plain text on a profile, so each is escaped exactly once, here. Copied raw, "R&D" was
 *     read back as HTML and "<Button>" disappeared as an unknown tag.
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
      summary: textToResumeHtml(profile.bio),
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
      description: experienceBullets(exp).map(textToResumeHtml),
    })),
    education: profile.education?.map((edu, i) => ({
      id: edu.id ?? String(i + 1),
      degree: [edu.degree, edu.field_of_study].filter(Boolean).join(" in "),
      institution: edu.institution,
      location: "",
      startDate: edu.start_date ?? "",
      endDate: edu.end_date ?? "",
      gpa: edu.gpa ?? "",
      description: textToResumeHtml(edu.description),
    })),
    skills: profile.skills?.map((s, i) => ({
      id: s.id ?? String(i + 1),
      name: s.name,
    })),
    projects: profile.projects?.map((p, i) => ({
      id: p.id ?? String(i + 1),
      name: p.name,
      description: textToResumeHtml(p.description),
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
