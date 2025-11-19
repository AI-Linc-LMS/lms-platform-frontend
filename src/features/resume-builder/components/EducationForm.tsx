import React, { useState } from "react";
import { Education } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";
import RichTextEditor from "./RichTextEditor";

interface EducationFormProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

const EducationForm: React.FC<EducationFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSampleData = () => {
    const sampleData: Education[] = [
      {
        id: uuidv4(),
        degree: "Master of Science in Computer Science",
        institution: "Stanford University",
        location: "Stanford, CA",
        area: "Machine Learning & Distributed Systems",
        grade: "3.9/4.0",
        startDate: "2014-09",
        graduationDate: "2016-05",
        isCurrentlyStudying: false,
        gpa: "3.9/4.0",
        description:
          "• Specialized in Machine Learning and Distributed Systems\n• Thesis: 'Scalable Recommendation Systems using Deep Learning'\n• Graduate Teaching Assistant for Algorithms course\n• Member of Graduate Student Council",
      },
      {
        id: uuidv4(),
        degree: "Bachelor of Science in Computer Science",
        institution: "University of California, Berkeley",
        location: "Berkeley, CA",
        area: "Computer Science",
        grade: "3.8/4.0",
        startDate: "2010-09",
        graduationDate: "2014-05",
        isCurrentlyStudying: false,
        gpa: "3.8/4.0",
        description:
          "• Relevant coursework: Data Structures, Algorithms, Database Systems, Operating Systems\n• Dean's List: Fall 2012, Spring 2013, Fall 2013, Spring 2014\n• Senior Project: Built a real-time collaborative code editor\n• Vice President of Computer Science Student Association",
      },
    ];
    onChange(sampleData);
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: uuidv4(),
      degree: "",
      institution: "",
      location: "",
      area: "",
      grade: "",
      startDate: "",
      graduationDate: "",
      isCurrentlyStudying: false,
      gpa: "",
      description: "",
    };
    onChange([...data, newEducation]);
    setEditingId(newEducation.id);
  };

  const updateEducation = (
    id: string,
    field: keyof Education,
    value: string | boolean
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
      <FormHeader
        title="Education"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
        }
      />

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No education entries added yet.</p>
          <p className="text-sm text-gray-500 mb-6">Click "Add Education" to get started.</p>
          <button
            onClick={addEducation}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Education
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((education, index) => (
            <div
              key={education.id}
              className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                editingId === education.id
                  ? "ring-2 ring-blue-500 border-blue-500 shadow-lg bg-blue-50/30"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {education.degree || "Degree"}
                    {education.institution && ` from ${education.institution}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {education.startDate && !education.isCurrentlyStudying && `Started: ${education.startDate}`}
                    {education.graduationDate && !education.isCurrentlyStudying && ` • Graduated: ${education.graduationDate}`}
                    {education.isCurrentlyStudying && education.startDate && `Started: ${education.startDate} • Currently Studying`}
                    {education.location && ` • ${education.location}`}
                    {(education.gpa || education.grade) && ` • ${education.gpa || education.grade}`}
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
                <div className="space-y-6 border-t-2 border-gray-200 pt-6 mt-6">
                  {/* Degree Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Degree Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Degree / Qualification *
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
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Bachelor of Science in Computer Science"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Full degree name (e.g., Bachelor of Science, Master of
                          Arts)
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Area / Field of Study
                        </label>
                        <input
                          type="text"
                          value={education.area || ""}
                          onChange={(e) =>
                            updateEducation(
                              education.id,
                              "area",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Computer Science, Machine Learning, etc."
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Your field of study or specialization area
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Institution Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Institution Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Institution Name *
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
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="University of Technology"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Name of the university or educational institution
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Boston, MA"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          City, State, or Country
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Academic Period
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="month"
                          value={education.startDate || ""}
                          onChange={(e) =>
                            updateEducation(
                              education.id,
                              "startDate",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                          disabled={education.isCurrentlyStudying}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                        />
                        
                        <div className="flex items-center gap-2 mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={education.isCurrentlyStudying}
                              onChange={(e) =>
                                updateEducation(
                                  education.id,
                                  "isCurrentlyStudying",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Currently studying here
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Additional Information
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Grade
                        </label>
                        <input
                          type="text"
                          value={education.grade || ""}
                          onChange={(e) =>
                            updateEducation(education.id, "grade", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="A, First Class, Distinction, etc."
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Your grade or classification
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          GPA / Score (Optional)
                        </label>
                        <input
                          type="text"
                          value={education.gpa || ""}
                          onChange={(e) =>
                            updateEducation(education.id, "gpa", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="3.8/4.0 or First Class Honours"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Include GPA if it strengthens your application (3.5+)
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Additional Details (Optional)
                      </label>
                      <RichTextEditor
                        value={education.description || ""}
                        onChange={(html) =>
                          updateEducation(
                            education.id,
                            "description",
                            html
                          )
                        }
                        placeholder="• Relevant coursework: Data Structures, Algorithms, Software Engineering&#10;• Dean's List: Fall 2022, Spring 2023&#10;• Senior Project: Developed a web application for course management&#10;• Member of Computer Science Honor Society"
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
          💡 Tip: List your education in reverse chronological order (most
          recent first)
        </p>
      )}
    </div>
  );
};

export default EducationForm;
