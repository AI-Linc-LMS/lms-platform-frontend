import React, { useState } from "react";
import { Experience } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";
import RichTextEditor from "./RichTextEditor";

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const calculateYears = (startDate: string, endDate: string, isCurrentJob: boolean): number => {
    if (!startDate) return 0;
    const start = new Date(startDate + "-01");
    const end = isCurrentJob ? new Date() : new Date(endDate + "-01");
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25);
    return Math.round(diffYears * 10) / 10; // Round to 1 decimal place
  };

  const loadSampleData = () => {
    const sampleData: Experience[] = [
      {
        id: uuidv4(),
        jobTitle: "Senior Software Engineer",
        company: "Tech Solutions Inc.",
        location: "San Francisco, CA",
        startDate: "2021-01",
        endDate: "",
        isCurrentJob: true,
        years: 3,
        description:
          "• Led a team of 5 developers to build scalable microservices architecture\n• Improved application performance by 40% through optimization and caching strategies\n• Architected and implemented CI/CD pipelines reducing deployment time by 60%\n• Mentored junior developers and conducted code reviews",
      },
      {
        id: uuidv4(),
        jobTitle: "Software Engineer",
        company: "Innovation Labs",
        location: "New York, NY",
        startDate: "2018-06",
        endDate: "2020-12",
        isCurrentJob: false,
        years: 2.5,
        description:
          "• Developed full-stack web applications using React, Node.js, and PostgreSQL\n• Collaborated with product managers and designers to implement new features\n• Reduced bug reports by 25% through improved testing and code quality\n• Participated in agile sprints and daily standups",
      },
      {
        id: uuidv4(),
        jobTitle: "Junior Developer",
        company: "StartupXYZ",
        location: "Austin, TX",
        startDate: "2016-08",
        endDate: "2018-05",
        isCurrentJob: false,
        years: 1.75,
        description:
          "• Built responsive web applications using HTML, CSS, and JavaScript\n• Worked closely with senior developers to learn best practices\n• Fixed bugs and implemented minor features\n• Participated in code reviews and team meetings",
      },
    ];
    onChange(sampleData);
  };

  const addExperience = () => {
    const newExperience: Experience = {
      id: uuidv4(),
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrentJob: false,
      years: undefined,
      description: "",
    };
    onChange([...data, newExperience]);
    setEditingId(newExperience.id);
    // Scroll to the newly added experience after a short delay
    setTimeout(() => {
      const element = document.getElementById(`experience-${newExperience.id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("animate-pulse");
        setTimeout(() => {
          element.classList.remove("animate-pulse");
        }, 2000);
      }
    }, 100);
  };

  const updateExperience = (
    id: string,
    field: keyof Experience,
    value: string | boolean | number
  ) => {
    const updatedData = data.map((exp) => {
      if (exp.id === id) {
        const updated = { ...exp, [field]: value };
        // Auto-calculate years when dates change
        if ((field === "startDate" || field === "endDate" || field === "isCurrentJob") && updated.startDate) {
          const calculatedYears = calculateYears(
            updated.startDate,
            updated.endDate,
            updated.isCurrentJob
          );
          updated.years = calculatedYears;
        }
        return updated;
      }
      return exp;
    });
    onChange(updatedData);
  };

  const deleteExperience = (id: string) => {
    onChange(data.filter((exp) => exp.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveExperience = (id: string, direction: "up" | "down") => {
    const index = data.findIndex((exp) => exp.id === id);
    if (
      (direction === "up" && index > 0) ||
      (direction === "down" && index < data.length - 1)
    ) {
      const newData = [...data];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      [newData[index], newData[targetIndex]] = [
        newData[targetIndex],
        newData[index],
      ];
      onChange(newData);
    }
  };

  return (
    <div className="space-y-4">
      <FormHeader
        title="Work Experience"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
          </svg>
        }
      />

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No work experience added yet.</p>
          <p className="text-sm text-gray-500 mb-6">Click "Add Experience" to get started.</p>
          <button
            onClick={addExperience}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Experience
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((experience, index) => (
            <div
              key={experience.id}
              id={`experience-${experience.id}`}
              className={`border-2 rounded-xl p-5 transition-all duration-300 ${
                editingId === experience.id
                  ? "ring-2 ring-blue-500 border-blue-500 shadow-lg bg-blue-50/30 scale-[1.01]"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white hover:scale-[1.005]"
              }`}
              style={{
                animation: "fadeIn 0.3s ease-in",
              }}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {experience.jobTitle || "Untitled Position"}
                    {experience.company && ` at ${experience.company}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {experience.startDate} -{" "}
                    {experience.isCurrentJob ? "Present" : experience.endDate}
                    {experience.years !== undefined && ` • ${experience.years} ${experience.years === 1 ? "year" : "years"}`}
                    {experience.location && ` • ${experience.location}`}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveExperience(experience.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveExperience(experience.id, "down")}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === experience.id ? null : experience.id
                      )
                    }
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteExperience(experience.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingId === experience.id && (
                <div className="space-y-6 border-t-2 border-gray-200 pt-6 mt-6">
                  {/* Position Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Position Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Job Title *
                        </label>
                        <input
                          type="text"
                          value={experience.jobTitle}
                          onChange={(e) =>
                            updateExperience(
                              experience.id,
                              "jobTitle",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Software Engineer"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Your job title or position
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={experience.location}
                          onChange={(e) =>
                            updateExperience(
                              experience.id,
                              "location",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="San Francisco, CA"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          City, State, or Remote
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Company Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Company Details
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={experience.company}
                        onChange={(e) =>
                          updateExperience(
                            experience.id,
                            "company",
                            e.target.value
                          )
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        placeholder="Tech Company Inc."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        The name of the company or organization
                      </p>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Employment Period
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="month"
                          value={experience.startDate}
                          onChange={(e) =>
                            updateExperience(
                              experience.id,
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          End Date *
                        </label>
                        <input
                          type="month"
                          value={experience.endDate}
                          onChange={(e) =>
                            updateExperience(
                              experience.id,
                              "endDate",
                              e.target.value
                            )
                          }
                          disabled={experience.isCurrentJob}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                        />
                        
                        <div className="flex items-center gap-2 mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={experience.isCurrentJob}
                              onChange={(e) =>
                                updateExperience(
                                  experience.id,
                                  "isCurrentJob",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-[#257195] focus:ring-[#257195]"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              I currently work here
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={experience.years !== undefined ? experience.years : ""}
                        onChange={(e) =>
                          updateExperience(
                            experience.id,
                            "years",
                            e.target.value ? parseFloat(e.target.value) : 0
                          )
                        }
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        placeholder="Auto-calculated from dates"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Automatically calculated from dates, or enter manually. Examples: 2.5, 3.0, 1.75
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Job Description
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Responsibilities & Achievements *
                      </label>
                      <RichTextEditor
                        value={experience.description}
                        onChange={(html) =>
                          updateExperience(
                            experience.id,
                            "description",
                            html
                          )
                        }
                        placeholder="• Developed and maintained web applications using React and Node.js&#10;• Collaborated with cross-functional teams to deliver high-quality software&#10;• Improved application performance by 30% through code optimization"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Use the toolbar to format text with bold, italic, underline, bullet points, and numbered lists.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    >
                      Done Editing
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <p className="text-xs text-gray-500">
          💡 Tip: List your experiences in reverse chronological order (most
          recent first)
        </p>
      )}
    </div>
  );
};

export default ExperienceForm;
