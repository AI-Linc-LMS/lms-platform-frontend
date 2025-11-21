import React from "react";
import { ResumeData, ColorScheme } from "../types/resume";
import { getThemeColors } from "../utils/colorUtils";

interface MinimalTemplateProps {
  data: ResumeData;
  isPrint?: boolean;
  themeColor?: string;
  colorScheme?: ColorScheme;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({
  data,
  isPrint = false,
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
          <section className="mb-8" data-section="personal">
            {personalInfo.summary && (
              <div className="text-gray-800 leading-relaxed mb-2">
                {renderHTML(personalInfo.summary)}
              </div>
            )}
            {personalInfo.careerObjective && (
              <div className="text-gray-700 leading-relaxed italic">
                <strong>Career Objective:</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: personalInfo.careerObjective }} />
              </div>
            )}
          </section>
        ) : null;
      case "experience":
        return experience.length > 0 ? (
          <section className="mb-8" data-section="experience">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Experience
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {exp.jobTitle}
                    </h3>
                    <div className="text-sm text-gray-600">
                      <div>
                        {formatDate(exp.startDate)} -{" "}
                        {exp.isCurrentJob ? "Present" : formatDate(exp.endDate)}
                      </div>
                      {exp.years !== undefined && (
                        <div className="text-xs">{exp.years} {exp.years === 1 ? "year" : "years"}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-700">{exp.company}</p>
                    {exp.location && (
                      <span className="text-sm text-gray-600">
                        {exp.location}
                      </span>
                    )}
                  </div>
                  {exp.description && (
                    <div className="text-sm text-gray-700">
                      {renderHTML(exp.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "projects":
        return projects.length > 0 ? (
          <section className="mb-8" data-section="projects">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Projects
            </h2>
            <div className="space-y-6">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {project.name}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {formatDate(project.startDate)} -{" "}
                      {formatDate(project.endDate)}
                    </span>
                  </div>
                  <div className="mb-2">
                    {project.technologies.length > 0 && (
                      <p className="text-sm text-gray-600">
                        {project.technologies.join(" • ")}
                      </p>
                    )}
                    {project.link && (
                      <a
                        href={project.link}
                        className="text-sm text-gray-600 hover:text-gray-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {project.link.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>
                  {project.description && (
                    <div className="text-sm text-gray-700">
                      {renderHTML(project.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "education":
        return education.length > 0 ? (
          <section className="mb-8" data-section="education">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {edu.degree}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {edu.startDate && formatDate(edu.startDate)} -{" "}
                      {edu.isCurrentlyStudying ? "Present" : (edu.graduationDate && formatDate(edu.graduationDate))}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <div>
                      <p className="text-sm text-gray-700">{edu.institution}</p>
                      {edu.area && (
                        <p className="text-xs text-gray-600 italic">{edu.area}</p>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {edu.location && <span>{edu.location}</span>}
                      {(edu.gpa || edu.grade) && (
                        <span className="ml-2">{edu.grade || `GPA: ${edu.gpa}`}</span>
                      )}
                    </div>
                  </div>
                  {edu.description && (
                    <div className="text-sm text-gray-700">
                      {renderHTML(edu.description)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "skills":
        return skills.length > 0 ? (
          <section className="mb-8" data-section="skills">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Skills
            </h2>
            <div className="space-y-2 text-sm text-gray-700">
              {["Language", "Framework", "Technologies", "Libraries", "Database", "Practices", "Tools"].map((category) => {
                const categorySkills = skills
                  .filter((skill) => skill.category === category)
                  .sort((a, b) => (a.priority || 0) - (b.priority || 0));
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category} id={`skill-category-${category}`}>
                    <span className="font-medium" style={{ color: theme.primary }}>{category}: </span>
                    <span>{categorySkills.map((skill) => skill.name).join(" • ")}</span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null;
      case "activities":
        return activities && activities.length > 0 ? (
          <section className="mb-8" data-section="activities">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Activities
            </h2>
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {activity.name}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {formatDate(activity.startDate)} -{" "}
                      {activity.isCurrent ? "Present" : formatDate(activity.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-700">{activity.organization}</p>
                  </div>
                  {(activity.involvements && activity.involvements.length > 0) && (
                    <div className="text-sm text-gray-700 mb-2">
                      <p className="font-medium mb-1">Involvements:</p>
                      <ul className="list-disc list-outside space-y-1 ml-4">
                        {activity.involvements.map((inv, idx) => (
                          <li key={idx}>{inv}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(activity.achievements && activity.achievements.length > 0) && (
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Achievements:</p>
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
          <section className="mb-8" data-section="volunteering">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Volunteering
            </h2>
            <div className="space-y-6">
              {volunteering.map((vol) => (
                <div key={vol.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {vol.role}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {formatDate(vol.startDate)} -{" "}
                      {vol.isCurrent ? "Present" : formatDate(vol.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-700">{vol.organization}</p>
                  </div>
                  {vol.description && (
                    <div className="text-sm text-gray-700">
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
          <section className="mb-8" data-section="awards">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1" style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
              Awards
            </h2>
            <div className="space-y-4">
              {awards.map((award) => (
                <div key={award.id}>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="text-base font-medium text-gray-900">
                      {award.title}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {formatDate(award.date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <p className="text-sm text-gray-700">{award.organization}</p>
                  </div>
                  {award.description && (
                    <div className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: award.description }} />
                  )}
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
      } text-gray-900 leading-relaxed`}
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
      <header className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          {personalInfo.imageUrl && (
            <img
              src={personalInfo.imageUrl}
              alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-light text-gray-900 mb-1">
              {personalInfo.firstName} {personalInfo.lastName}
            </h1>
            {personalInfo.title && (
              <p className="text-lg font-normal mb-1 text-gray-700">
                {personalInfo.title}
              </p>
            )}
            {(personalInfo.relevantExperience || personalInfo.totalExperience) && (
              <p className="text-xs text-gray-500 mb-2">
                {personalInfo.relevantExperience && (
                  <span>Relevant: {personalInfo.relevantExperience} yrs</span>
                )}
                {personalInfo.relevantExperience && personalInfo.totalExperience && <span> • </span>}
                {personalInfo.totalExperience && (
                  <span>Total: {personalInfo.totalExperience} yrs</span>
                )}
              </p>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex flex-wrap gap-3">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {(personalInfo.location || personalInfo.address) && (
              <span>{personalInfo.location || personalInfo.address}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {personalInfo.linkedin && (
              <a
                href={personalInfo.linkedin}
                className="text-gray-600 hover:text-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                linkedin.com/in/{personalInfo.linkedin.split("/").pop()}
              </a>
            )}
            {personalInfo.github && (
              <a
                href={personalInfo.github}
                className="text-gray-600 hover:text-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/{personalInfo.github.split("/").pop()}
              </a>
            )}
            {personalInfo.website && (
              <a
                href={personalInfo.website}
                className="text-gray-600 hover:text-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                {personalInfo.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {personalInfo.twitter && (
              <a
                href={personalInfo.twitter}
                className="text-gray-600 hover:text-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                twitter.com/{personalInfo.twitter.split("/").pop()}
              </a>
            )}
            {personalInfo.hackerrank && (
              <a
                href={personalInfo.hackerrank}
                className="text-gray-600 hover:text-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                hackerrank.com/{personalInfo.hackerrank.split("/").pop()}
              </a>
            )}
            {personalInfo.leetcode && (
              <a
                href={personalInfo.leetcode}
                className="text-gray-600 hover:text-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                leetcode.com/{personalInfo.leetcode.split("/").pop()}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Render sections in order */}
      {getSectionOrder().map((sectionId) => renderSection(sectionId))}
    </div>
  );
};

export default MinimalTemplate;
