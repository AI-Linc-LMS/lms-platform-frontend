import React from "react";
import { ResumeData } from "../types/resume";

interface MinimalTemplateProps {
  data: ResumeData;
  isPrint?: boolean;
}

const MinimalTemplate: React.FC<MinimalTemplateProps> = ({
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
      } text-gray-900 leading-relaxed`}
    >
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-light text-gray-900 mb-2">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex flex-wrap gap-3">
            {personalInfo.email && <span>{personalInfo.email}</span>}
            {personalInfo.phone && <span>{personalInfo.phone}</span>}
            {personalInfo.address && <span>{personalInfo.address}</span>}
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
          </div>
        </div>
      </header>

      {/* Professional Summary */}
      {personalInfo.summary && (
        <section className="mb-8">
          <p className="text-gray-800 leading-relaxed">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1 border-b border-gray-200">
            Experience
          </h2>
          <div className="space-y-6">
            {experience.map((exp) => (
              <div key={exp.id}>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="text-base font-medium text-gray-900">
                    {exp.jobTitle}
                  </h3>
                  <span className="text-sm text-gray-600">
                    {formatDate(exp.startDate)} -{" "}
                    {exp.isCurrentJob ? "Present" : formatDate(exp.endDate)}
                  </span>
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
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1 border-b border-gray-200">
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
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1 border-b border-gray-200">
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
                    {formatDate(edu.graduationDate)}
                  </span>
                </div>
                <div className="flex justify-between items-baseline mb-2">
                  <p className="text-sm text-gray-700">{edu.institution}</p>
                  <div className="text-sm text-gray-600">
                    {edu.location && <span>{edu.location}</span>}
                    {edu.gpa && <span className="ml-2">GPA: {edu.gpa}</span>}
                  </div>
                </div>
                {edu.description && (
                  <div className="text-sm text-gray-700">
                    <ul className="list-disc list-outside space-y-1">
                      {renderBulletPoints(edu.description)}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4 pb-1 border-b border-gray-200">
            Skills
          </h2>
          <div className="text-sm text-gray-700">
            {skills.map((skill) => skill.name).join(" • ")}
          </div>
        </section>
      )}
    </div>
  );
};

export default MinimalTemplate;
