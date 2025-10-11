import React, { useState } from "react";
import { Experience } from "../types/resume";
import { v4 as uuidv4 } from "uuid";

interface ExperienceFormProps {
  data: Experience[];
  onChange: (data: Experience[]) => void;
}

const ExperienceForm: React.FC<ExperienceFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addExperience = () => {
    const newExperience: Experience = {
      id: uuidv4(),
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      isCurrentJob: false,
      description: "",
    };
    onChange([...data, newExperience]);
    setEditingId(newExperience.id);
  };

  const updateExperience = (
    id: string,
    field: keyof Experience,
    value: string | boolean
  ) => {
    onChange(
      data.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp))
    );
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
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Work Experience</h3>
        <button
          onClick={addExperience}
          className="bg-[#257195] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1e5f7f] transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Experience
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No work experience added yet.</p>
          <p className="text-sm">Click "Add Experience" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((experience, index) => (
            <div
              key={experience.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                editingId === experience.id
                  ? "ring-2 ring-[#257195] border-[#257195]"
                  : ""
              }`}
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
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="Software Engineer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="Tech Company Inc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="San Francisco, CA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2">
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

                        {!experience.isCurrentJob && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              End Date
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
                              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description *
                    </label>
                    <textarea
                      value={experience.description}
                      onChange={(e) =>
                        updateExperience(
                          experience.id,
                          "description",
                          e.target.value
                        )
                      }
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent resize-none"
                      placeholder="• Developed and maintained web applications using React and Node.js&#10;• Collaborated with cross-functional teams to deliver high-quality software&#10;• Improved application performance by 30% through code optimization"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use bullet points to describe your key responsibilities
                      and achievements.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-colors"
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
