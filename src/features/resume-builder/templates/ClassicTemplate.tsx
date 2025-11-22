import React from "react";
import { ResumeData, ColorScheme } from "../types/resume";
import { getThemeColors } from "../utils/colorUtils";

interface ClassicTemplateProps {
  data: ResumeData;
  isPrint?: boolean;
  themeColor?: string;
  colorScheme?: ColorScheme;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({
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
          <section className="mb-6" data-section="personal">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              {personalInfo.summary ? "Professional Summary" : "Career Objective"}
            </h2>
            {personalInfo.summary && (
              <div className="text-gray-800 leading-relaxed text-justify mb-3">
                {renderHTML(personalInfo.summary)}
              </div>
            )}
            {personalInfo.careerObjective && (
              <div className="text-gray-800 leading-relaxed text-justify">
                <strong>Career Objective:</strong>{" "}
                <span dangerouslySetInnerHTML={{ __html: personalInfo.careerObjective }} />
              </div>
            )}
          </section>
        ) : null;
      case "experience":
        return experience.length > 0 ? (
          <section className="mb-6" data-section="experience">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Professional Experience
            </h2>
            <div className="space-y-5">
              {experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {exp.jobTitle}
                      </h3>
                      <p className="font-semibold text-gray-800">{exp.company}</p>
                      {exp.location && (
                        <p className="text-sm text-gray-700 italic">
                          {exp.location}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p className="font-semibold">
                        {formatDate(exp.startDate)} -{" "}
                        {exp.isCurrentJob ? "Present" : formatDate(exp.endDate)}
                      </p>
                      {exp.years !== undefined && (
                        <p className="text-xs">{exp.years} {exp.years === 1 ? "year" : "years"}</p>
                      )}
                    </div>
                  </div>
                  {exp.description && (
                    <div className="text-gray-800 mt-2">
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
          <section className="mb-6" data-section="projects">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Notable Projects
            </h2>
            <div className="space-y-5">
              {projects.map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {project.name}
                      </h3>
                      {project.technologies.length > 0 && (
                        <p className="text-sm text-gray-700 italic">
                          Technologies: {project.technologies.join(", ")}
                        </p>
                      )}
                      {project.link && (
                        <a
                          href={project.link}
                          className="text-sm text-gray-700 hover:text-gray-900 underline"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Project
                        </a>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p className="font-semibold">
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </p>
                    </div>
                  </div>
                  {project.description && (
                    <div className="text-gray-800 mt-2">
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
          <section className="mb-6" data-section="education">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Education
            </h2>
            <div className="space-y-4">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {edu.degree}
                      </h3>
                      <p className="font-semibold text-gray-800">
                        {edu.institution}
                      </p>
                      {edu.area && (
                        <p className="text-sm text-gray-700 italic">{edu.area}</p>
                      )}
                      {edu.location && (
                        <p className="text-sm text-gray-700 italic">
                          {edu.location}
                        </p>
                      )}
                      {edu.description && (
                        <div className="text-gray-800 mt-2">
                          {renderHTML(edu.description)}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-700 ml-4">
                      <p className="font-semibold">
                        {edu.startDate && formatDate(edu.startDate)} -{" "}
                        {edu.isCurrentlyStudying ? "Present" : (edu.graduationDate && formatDate(edu.graduationDate))}
                      </p>
                      {(edu.gpa || edu.grade) && (
                        <p>{edu.grade || `GPA: ${edu.gpa}`}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null;
      case "skills":
        return skills.length > 0 ? (
          <section className="mb-6" data-section="skills">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Technical Skills
            </h2>
            <div className="space-y-3">
              {["Language", "Framework", "Technologies", "Libraries", "Database", "Practices", "Tools"].map((category) => {
                const categorySkills = skills
                  .filter((skill) => skill.category === category)
                  .sort((a, b) => (a.priority || 0) - (b.priority || 0));
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category} id={`skill-category-${category}`}>
                    <span className="font-bold text-gray-900" style={{ color: theme.primary }}>{category}: </span>
                    <span className="text-gray-800">
                      {categorySkills.map((skill) => skill.name).join(", ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null;
      case "activities":
        return activities && activities.length > 0 ? (
          <section className="mb-6" data-section="activities">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Activities
            </h2>
            <div className="space-y-5">
              {activities.map((activity) => (
                <div key={activity.id}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {activity.name}
                      </h3>
                      <p className="font-semibold text-gray-800">{activity.organization}</p>
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p className="font-semibold">
                        {formatDate(activity.startDate)} -{" "}
                        {activity.isCurrent ? "Present" : formatDate(activity.endDate)}
                      </p>
                    </div>
                  </div>
                  {(activity.involvements && activity.involvements.length > 0) && (
                    <div className="text-gray-800 mt-2 mb-2">
                      <p className="font-semibold text-sm mb-1">Involvements:</p>
                      <ul className="list-disc list-outside space-y-1 ml-4">
                        {activity.involvements.map((inv, idx) => (
                          <li key={idx}>{inv}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(activity.achievements && activity.achievements.length > 0) && (
                    <div className="text-gray-800 mt-2">
                      <p className="font-semibold text-sm mb-1">Achievements:</p>
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
          <section className="mb-6" data-section="volunteering">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Volunteering
            </h2>
            <div className="space-y-5">
              {volunteering.map((vol) => (
                <div key={vol.id}>
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {vol.role}
                      </h3>
                      <p className="font-semibold text-gray-800">{vol.organization}</p>
                    </div>
                    <div className="text-right text-sm text-gray-700">
                      <p className="font-semibold">
                        {formatDate(vol.startDate)} -{" "}
                        {vol.isCurrent ? "Present" : formatDate(vol.endDate)}
                      </p>
                    </div>
                  </div>
                  {vol.description && (
                    <div className="text-gray-800 mt-2">
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
          <section className="mb-6" data-section="awards">
            <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide pb-1" style={{ color: theme.primary, borderBottom: `2px solid ${theme.border}` }}>
              Awards
            </h2>
            <div className="space-y-4">
              {awards.map((award) => (
                <div key={award.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {award.title}
                      </h3>
                      <p className="font-semibold text-gray-800">
                        {award.organization}
                      </p>
                      {award.description && (
                        <div className="text-gray-800 mt-2" dangerouslySetInnerHTML={{ __html: award.description }} />
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-700 ml-4">
                      <p className="font-semibold">
                        {formatDate(award.date)}
                      </p>
                    </div>
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
      } text-gray-900 leading-relaxed font-serif`}
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
      <header className="mb-8 text-center pb-4" style={{ borderBottom: `2px solid ${theme.border}` }}>
        <div className="flex items-center justify-center gap-4 mb-3">
          {personalInfo.imageUrl && (
            <img
              src={personalInfo.imageUrl}
              alt={`${personalInfo.firstName} ${personalInfo.lastName}`}
              className="w-20 h-20 rounded-full object-cover border-2"
              style={{ borderColor: theme.primary }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-wide">
              {personalInfo.firstName} {personalInfo.lastName}
            </h1>
            {personalInfo.title && (
              <p className="text-lg font-semibold mb-1" style={{ color: theme.primary }}>
                {personalInfo.title}
              </p>
            )}
            {(personalInfo.relevantExperience || personalInfo.totalExperience) && (
              <div className="text-xs text-gray-600 mb-2">
                {personalInfo.relevantExperience && (
                  <span>Relevant Experience: {personalInfo.relevantExperience} years</span>
                )}
                {personalInfo.relevantExperience && personalInfo.totalExperience && <span> | </span>}
                {personalInfo.totalExperience && (
                  <span>Total Experience: {personalInfo.totalExperience} years</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-700 space-y-1">
          {(personalInfo.location || personalInfo.address) && (
            <p>{personalInfo.location || personalInfo.address}</p>
          )}
          <div className="flex justify-center gap-4">
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.email && <span>{personalInfo.email}</span>}
          </div>
          <div className="flex justify-center gap-4">
            {personalInfo.linkedin && (
              <a
                href={personalInfo.linkedin}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                LinkedIn
              </a>
            )}
            {personalInfo.github && (
              <a
                href={personalInfo.github}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            )}
            {personalInfo.website && (
              <a
                href={personalInfo.website}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Website
              </a>
            )}
            {personalInfo.twitter && (
              <a
                href={personalInfo.twitter}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Twitter
              </a>
            )}
            {personalInfo.hackerrank && (
              <a
                href={personalInfo.hackerrank}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hackerrank
              </a>
            )}
            {personalInfo.hackerearth && (
              <a
                href={personalInfo.hackerearth}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hackerearth
              </a>
            )}
            {personalInfo.codechef && (
              <a
                href={personalInfo.codechef}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Codechef
              </a>
            )}
            {personalInfo.leetcode && (
              <a
                href={personalInfo.leetcode}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Leetcode
              </a>
            )}
            {personalInfo.cssbattle && (
              <a
                href={personalInfo.cssbattle}
                className="text-gray-700 hover:text-gray-900 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                CSSBattle
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

export default ClassicTemplate;
