import React from "react";
import { ResumeData } from "../types/resume";

interface ModernTemplateProps {
  data: ResumeData;
  isPrint?: boolean;
}

const ModernTemplate: React.FC<ModernTemplateProps> = ({
  data,
  isPrint = false,
}) => {
  const { personalInfo, experience, education, skills, projects } = data;

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month] = dateString.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
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

  return (
    <div
      className={`max-w-4xl mx-auto bg-white ${
        isPrint ? "p-6" : "p-8"
      } text-gray-800 leading-relaxed`}
    >
      {/* Header */}
      <header className="mb-8 text-center border-b-4 border-blue-600 pb-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <div className="contact-info flex flex-wrap justify-center gap-4 text-sm text-gray-600">
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
          {personalInfo.address && (
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
              {personalInfo.address}
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-2 text-sm">
          {personalInfo.linkedin && (
            <a
              href={personalInfo.linkedin}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
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
        </div>
      </header>

      {/* Professional Summary */}
      {personalInfo.summary && (
        <section className="resume-section mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b border-gray-300 pb-2">
            Professional Summary
          </h2>
          <p className="text-gray-700 leading-relaxed">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="resume-section mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b border-gray-300 pb-2">
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
                    <p className="text-blue-600 font-medium">{exp.company}</p>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <p className="font-medium">
                      {formatDate(exp.startDate)} -{" "}
                      {exp.isCurrentJob ? "Present" : formatDate(exp.endDate)}
                    </p>
                    {exp.location && <p>{exp.location}</p>}
                  </div>
                </div>
                {exp.description && (
                  <div className="text-gray-700 ml-0">
                    <ul className="list-disc list-outside space-y-1">
                      {renderBulletPoints(exp.description)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className="resume-section mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b border-gray-300 pb-2">
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
                        className="text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Project
                      </a>
                    )}
                  </div>
                </div>
                {project.description && (
                  <div className="text-gray-700 ml-0">
                    <ul className="list-disc list-outside space-y-1">
                      {renderBulletPoints(project.description)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className="resume-section mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b border-gray-300 pb-2">
            Education
          </h2>
          <div className="space-y-4">
            {education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {edu.degree}
                  </h3>
                  <p className="text-blue-600 font-medium">{edu.institution}</p>
                  {edu.location && (
                    <p className="text-sm text-gray-600">{edu.location}</p>
                  )}
                  {edu.description && (
                    <div className="text-gray-700 mt-2">
                      <ul className="list-disc list-outside space-y-1">
                        {renderBulletPoints(edu.description)}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="text-right text-sm text-gray-600 ml-4">
                  <p className="font-medium">
                    {formatDate(edu.graduationDate)}
                  </p>
                  {edu.gpa && <p>GPA: {edu.gpa}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="resume-section mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 border-b border-gray-300 pb-2">
            Technical Skills
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {["Expert", "Advanced", "Intermediate", "Beginner"].map((level) => {
              const skillsAtLevel = skills.filter(
                (skill) => skill.level === level
              );
              if (skillsAtLevel.length === 0) return null;

              return (
                <div key={level} className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">{level}</h4>
                  <div className="flex flex-wrap gap-1">
                    {skillsAtLevel.map((skill) => (
                      <span
                        key={skill.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
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
      )}
    </div>
  );
};

export default ModernTemplate;
