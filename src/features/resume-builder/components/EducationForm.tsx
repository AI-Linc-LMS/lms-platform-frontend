import React, { useState } from "react";
import { Education } from "../types/resume";
import { v4 as uuidv4 } from "uuid";

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const EducationForm: React.FC<EducationFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addEducation = () => {
    const newEducation: Education = {
      id: uuidv4(),
      degree: "",
      institution: "",
      location: "",
      graduationDate: "",
      gpa: "",
      description: "",
    };
    onChange([...data, newEducation]);
    setEditingId(newEducation.id);
  };

  const updateEducation = (
    id: string,
    field: keyof Education,
    value: string
  ) => {
    onChange(
      data.map((edu) => (edu.id === id ? { ...edu, [field]: value } : edu))
    );
  };

  const deleteEducation = (id: string) => {
    onChange(data.filter((edu) => edu.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveEducation = (id: string, direction: "up" | "down") => {
    const index = data.findIndex((edu) => edu.id === id);
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
        <h3 className="text-lg font-semibold text-gray-800">Education</h3>
        <button
          onClick={addEducation}
          className="bg-[#257195] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#1e5f7f] transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Education
        </button>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No education entries added yet.</p>
          <p className="text-sm">Click "Add Education" to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((education, index) => (
            <div
              key={education.id}
              className={`border border-gray-200 rounded-lg p-4 ${
                editingId === education.id
                  ? "ring-2 ring-[#257195] border-[#257195]"
                  : ""
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {education.degree || "Degree"}
                    {education.institution && ` from ${education.institution}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {education.graduationDate &&
                      `Graduated: ${education.graduationDate}`}
                    {education.location && ` • ${education.location}`}
                    {education.gpa && ` • GPA: ${education.gpa}`}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveEducation(education.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveEducation(education.id, "down")}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === education.id ? null : education.id
                      )
                    }
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteEducation(education.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingId === education.id && (
                <div className="space-y-4 border-t border-gray-200 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Degree *
                      </label>
                      <input
                        type="text"
                        value={education.degree}
                        onChange={(e) =>
                          updateEducation(
                            education.id,
                            "degree",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="Bachelor of Science in Computer Science"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution *
                      </label>
                      <input
                        type="text"
                        value={education.institution}
                        onChange={(e) =>
                          updateEducation(
                            education.id,
                            "institution",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="University of Technology"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={education.location}
                        onChange={(e) =>
                          updateEducation(
                            education.id,
                            "location",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="Boston, MA"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Graduation Date *
                      </label>
                      <input
                        type="month"
                        value={education.graduationDate}
                        onChange={(e) =>
                          updateEducation(
                            education.id,
                            "graduationDate",
                            e.target.value
                          )
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        GPA (Optional)
                      </label>
                      <input
                        type="text"
                        value={education.gpa || ""}
                        onChange={(e) =>
                          updateEducation(education.id, "gpa", e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent"
                        placeholder="3.8/4.0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details (Optional)
                    </label>
                    <textarea
                      value={education.description || ""}
                      onChange={(e) =>
                        updateEducation(
                          education.id,
                          "description",
                          e.target.value
                        )
                      }
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#257195] focus:border-transparent resize-none"
                      placeholder="• Relevant coursework: Data Structures, Algorithms, Software Engineering&#10;• Dean's List: Fall 2022, Spring 2023&#10;• Senior Project: Developed a web application for course management"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Include relevant coursework, honors, awards, or projects.
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
          💡 Tip: List your education in reverse chronological order (most
          recent first)
        </p>
      )}
    </div>
  );
};

export default EducationForm;
