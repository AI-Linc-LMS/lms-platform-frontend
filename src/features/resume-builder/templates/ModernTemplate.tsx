import React from "react";
import { ResumeData, ColorScheme } from "../types/resume";
import { getThemeColors } from "../utils/colorUtils";

interface ModernTemplateProps {
  data: ResumeData;
  isPrint?: boolean;
  themeColor?: string;
  colorScheme?: ColorScheme;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({
  data,
  isPrint = false,
  themeColor = "#3b82f6",
  colorScheme = "Professional Blue",
}) => {
  const { personalInfo, experience, education, skills, projects, activities, volunteering, awards, sectionOrder } = data;
  // Use prop colorScheme first, then data.colorScheme, then default
  const activeColorScheme = colorScheme || data.colorScheme || "Professional Blue";
  const theme = getThemeColors(activeColorScheme);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  // Helper function to render HTML content safely
  const renderHTML = (html: string) => {
    if (!html) return null;
    // Check if content contains HTML tags
    const hasHTML = /<[^>]+>/.test(html);
    if (hasHTML) {
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
    // If no HTML, use the bullet points renderer
    return renderBulletPoints(html);
  };

  const renderBulletPoints = (text: string) => {
    return text.split("\n").map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("•") || trimmedLine.startsWith("-")) {
        return (
          <li key={index} className="ml-4">
            {trimmedLine.substring(1).trim()}
          </li>
        );
      }
      return trimmedLine ? (
        <p key={index} className="mb-1">
          {trimmedLine}
        </p>
      ) : null;
    });
  };

  const getSectionOrder = (): string[] => {
    const defaultOrder = ["personal", "skills", "experience", "education", "projects", "activities", "volunteering", "awards"];
    return sectionOrder || defaultOrder;
  };

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case "personal":
        // Personal info is rendered in header, but we can add summary/career objective here
        return (personalInfo.summary || personalInfo.careerObjective) ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              {personalInfo.summary ? "Professional Summary" : "Career Objective"}
            </h2>
            {personalInfo.summary && (
              <div className="leading-relaxed mb-4" style={{ color: theme.textPrimary }}>
                {renderHTML(personalInfo.summary)}
              </div>
            )}
            {personalInfo.careerObjective && (
              <div className="leading-relaxed" style={{ color: theme.textPrimary }}>
                <strong>Career Objective:</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: personalInfo.careerObjective }} />
              </div>
            )}
          </section>
        ) : null;
      case "skills":
        return skills.length > 0 ? (
          <section className="resume-section mb-8" data-section="skills">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Technical Skills
            </h2>
            <div className="space-y-4">
              {["Language", "Framework", "Technologies", "Libraries", "Database", "Practices", "Tools"].map((category) => {
                const categorySkills = skills
                  .filter((skill) => skill.category === category)
                  .sort((a, b) => (a.priority || 0) - (b.priority || 0));
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category} className="mb-4">
                    <h4 className="font-semibold mb-2" style={{ color: theme.primary }}>
                      {category}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {categorySkills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-2 py-1 text-sm rounded-full"
                          style={{ 
                            backgroundColor: theme.skillBg,
                            color: theme.primary 
                          }}
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null;
      case "experience":
        return experience.length > 0 ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Professional Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id} className="entry relative">
                  <div className="entry-header flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {exp.jobTitle}
                      </h3>
                      <p className="font-medium" style={{ color: theme.secondary }}>{exp.company}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p className="font-medium">
                        {formatDate(exp.startDate)} -{" "}
                        {exp.isCurrentJob ? "Present" : formatDate(exp.endDate)}
                      </p>
                      {exp.years !== undefined && (
                        <p className="text-xs">{exp.years} {exp.years === 1 ? "year" : "years"}</p>
                      )}
                      {exp.location && <p>{exp.location}</p>}
                    </div>
                  </div>
                  {exp.description && (
                    <div className="ml-0" style={{ color: theme.textPrimary }}>
                      {renderHTML(exp.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "education":
        return education.length > 0 ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {edu.degree}
                    </h3>
                    <p className="font-medium" style={{ color: theme.secondary }}>{edu.institution}</p>
                    {edu.area && (
                      <p className="text-sm text-gray-600 italic">{edu.area}</p>
                    )}
                    {edu.location && (
                      <p className="text-sm text-gray-600">{edu.location}</p>
                    )}
                    {edu.description && (
                    <div className="mt-2" style={{ color: theme.textPrimary }}>
                      {renderHTML(edu.description)}
                    </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-600 ml-4">
                    <p className="font-medium">
                      {edu.startDate && formatDate(edu.startDate)} -{" "}
                      {edu.isCurrentlyStudying ? "Present" : (edu.graduationDate && formatDate(edu.graduationDate))}
                    </p>
                    {(edu.gpa || edu.grade) && (
                      <p>{edu.grade || `GPA: ${edu.gpa}`}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "projects":
        return projects.length > 0 ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Projects
            </h2>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p className="font-medium">
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </p>
                      {project.link && (
                        <a
                          href={project.link}
                          className="hover:opacity-80"
                          style={{ color: theme.secondary }}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Project
                        </a>
                      )}
                    </div>
                  </div>
                    {project.description && (
                      <div className="ml-0" style={{ color: theme.textPrimary }}>
                        {renderHTML(project.description)}
                      </div>
                    )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "activities":
        return activities && activities.length > 0 ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Activities
            </h2>
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="entry relative">
                  <div className="entry-header flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {activity.name}
                      </h3>
                      <p className="font-medium" style={{ color: theme.secondary }}>{activity.organization}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p className="font-medium">
                        {formatDate(activity.startDate)} -{" "}
                        {activity.isCurrent ? "Present" : formatDate(activity.endDate)}
                      </p>
                    </div>
                  </div>
                  {(activity.involvements && activity.involvements.length > 0) && (
                  <div className="ml-0 mb-2" style={{ color: theme.textPrimary }}>
                    <p className="font-semibold text-sm mb-1" style={{ color: theme.primary }}>Involvements:</p>
                    <ul className="list-disc list-outside space-y-1 ml-4">
                      {activity.involvements.map((inv, idx) => (
                        <li key={idx}>{inv}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(activity.achievements && activity.achievements.length > 0) && (
                  <div className="ml-0" style={{ color: theme.textPrimary }}>
                    <p className="font-semibold text-sm mb-1" style={{ color: theme.primary }}>Achievements:</p>
                    <ul className="list-disc list-outside space-y-1 ml-4">
                      {activity.achievements.map((ach, idx) => (
                        <li key={idx}>{ach}</li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "volunteering":
        return volunteering && volunteering.length > 0 ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Volunteering
            </h2>
            <div className="space-y-6">
              {volunteering.map((vol) => (
                <div key={vol.id} className="entry relative">
                  <div className="entry-header flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {vol.role}
                      </h3>
                      <p className="font-medium" style={{ color: theme.secondary }}>{vol.organization}</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                      <p className="font-medium">
                        {formatDate(vol.startDate)} -{" "}
                        {vol.isCurrent ? "Present" : formatDate(vol.endDate)}
                      </p>
                    </div>
                  </div>
                  {vol.description && (
                  <div className="ml-0" style={{ color: theme.textPrimary }}>
                    {renderHTML(vol.description)}
                  </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "awards":
        return awards && awards.length > 0 ? (
          <section className="resume-section mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Awards
            </h2>
            <div className="space-y-4">
              {awards.map((award) => (
                <div key={award.id} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {award.title}
                    </h3>
                    <p className="font-medium" style={{ color: theme.secondary }}>{award.organization}</p>
                  {award.description && (
                    <div className="mt-2" style={{ color: theme.textPrimary }} dangerouslySetInnerHTML={{ __html: award.description }} />
                  )}
                  </div>
                  <div className="text-right text-sm text-gray-600 ml-4">
                    <p className="font-medium">
                      {formatDate(award.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div
      className={`max-w-4xl mx-auto bg-white ${
        isPrint ? "p-6" : "p-8"
      } text-gray-800 leading-relaxed`}
      style={{ 
        maxWidth: '100%', 
        width: '100%', 
        overflowX: 'hidden',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact',
      }}
    >
      {/* Header */}
      <header className="mb-8 text-center pb-6" style={{ borderBottom: `4px solid ${theme.primary}` }}>
        <div className="flex items-center justify-center gap-4 mb-3">
          {personalInfo.imageUrl && (
            <img
              src={personalInfo.imageUrl}
              alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
              className="w-24 h-24 rounded-full object-cover border-4"
              style={{ borderColor: theme.primary }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-gray-900 mb-1">
              {personalInfo.firstName} {personalInfo.lastName}
            </h1>
            {personalInfo.title && (
              <p className="text-xl font-medium mb-2" style={{ color: theme.primary }}>
                {personalInfo.title}
              </p>
            )}
            {(personalInfo.relevantExperience || personalInfo.totalExperience) && (
              <div className="flex flex-wrap justify-center gap-3 text-sm mb-2" style={{ color: theme.textSecondary }}>
                {personalInfo.relevantExperience && (
                  <span>Relevant Experience: {personalInfo.relevantExperience} years</span>
                )}
                {personalInfo.totalExperience && (
                  <span>Total Experience: {personalInfo.totalExperience} years</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="contact-info flex flex-wrap justify-center gap-4 text-sm" style={{ color: theme.textSecondary }}>
          {personalInfo.email && (
            <span className="contact-item flex items-center gap-1">
              <svg
                className="contact-icon w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="contact-item flex items-center gap-1">
              <svg
                className="contact-icon w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              {personalInfo.phone}
            </span>
          )}
          {(personalInfo.location || personalInfo.address) && (
            <span className="contact-item flex items-center gap-1">
              <svg
                className="contact-icon w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {personalInfo.location || personalInfo.address}
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm">
          {personalInfo.linkedin && (
            <a
              href={personalInfo.linkedin}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: themeColor }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="contact-icon w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6"
                />
              </svg>
              LinkedIn
            </a>
          )}
          {personalInfo.github && (
            <a
              href={personalInfo.github}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: themeColor }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="contact-icon w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              GitHub
            </a>
          )}
          {personalInfo.website && (
            <a
              href={personalInfo.website}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg
                className="contact-icon w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              Website
            </a>
          )}
          {personalInfo.twitter && (
            <a
              href={personalInfo.twitter}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          )}
          {personalInfo.hackerrank && (
            <a
              href={personalInfo.hackerrank}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hackerrank
            </a>
          )}
          {personalInfo.hackerearth && (
            <a
              href={personalInfo.hackerearth}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hackerearth
            </a>
          )}
          {personalInfo.codechef && (
            <a
              href={personalInfo.codechef}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Codechef
            </a>
          )}
          {personalInfo.leetcode && (
            <a
              href={personalInfo.leetcode}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Leetcode
            </a>
          )}
          {personalInfo.cssbattle && (
            <a
              href={personalInfo.cssbattle}
              className="flex items-center gap-1 hover:opacity-80"
              style={{ color: theme.secondary }}
              target="_blank"
              rel="noopener noreferrer"
            >
              CSSBattle
            </a>
          )}
        </div>
      </header>

      {/* Render sections in order */}
      {getSectionOrder().map((sectionId) => renderSection(sectionId))}
    </div>
  );
};

export default ModernTemplate;
