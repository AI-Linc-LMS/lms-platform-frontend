import React from "react";
import { ResumeData } from "../types/resume";

interface ClassicTemplateProps {
  data: ResumeData;
  isPrint?: boolean;
}

const ClassicTemplate: React.FC<ClassicTemplateProps> = ({
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
      } text-gray-900 leading-relaxed font-serif`}
    >
      {/* Header */}
      <header className="mb-8 text-center border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-wide">
          {personalInfo.firstName} {personalInfo.lastName}
        </h1>
        <div className="text-sm text-gray-700 space-y-1">
          {personalInfo.address && <p>{personalInfo.address}</p>}
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
          </div>
        </div>
      </header>

      {/* Professional Summary */}
      {personalInfo.summary && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-400 pb-1">
            Professional Summary
          </h2>
          <p className="text-gray-800 leading-relaxed text-justify">
            {personalInfo.summary}
          </p>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-400 pb-1">
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
                  </div>
                </div>
                {exp.description && (
                  <div className="text-gray-800 mt-2">
                    <ul className="list-disc list-outside space-y-1 ml-4">
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
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-400 pb-1">
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
                    <ul className="list-disc list-outside space-y-1 ml-4">
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
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-400 pb-1">
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
                    {edu.location && (
                      <p className="text-sm text-gray-700 italic">
                        {edu.location}
                      </p>
                    )}
                    {edu.description && (
                      <div className="text-gray-800 mt-2">
                        <ul className="list-disc list-outside space-y-1 ml-4">
                          {renderBulletPoints(edu.description)}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-right text-sm text-gray-700 ml-4">
                    <p className="font-semibold">
                      {formatDate(edu.graduationDate)}
                    </p>
                    {edu.gpa && <p>GPA: {edu.gpa}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3 uppercase tracking-wide border-b border-gray-400 pb-1">
            Technical Skills
          </h2>
          <div className="space-y-3">
            {["Expert", "Advanced", "Intermediate", "Beginner"].map((level) => {
              const skillsAtLevel = skills.filter(
                (skill) => skill.level === level
              );
              if (skillsAtLevel.length === 0) return null;

              return (
                <div key={level}>
                  <span className="font-bold text-gray-900">{level}: </span>
                  <span className="text-gray-800">
                    {skillsAtLevel.map((skill) => skill.name).join(", ")}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default ClassicTemplate;
