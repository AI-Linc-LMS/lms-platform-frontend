import React, { useState } from "react";
import { Award } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";
import RichTextEditor from "./RichTextEditor";

interface AwardsFormProps {
  data: Award[];
  onChange: (data: Award[]) => void;
}

const AwardsForm: React.FC<AwardsFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSampleData = () => {
    const sampleData: Award[] = [
      {
        id: uuidv4(),
        title: "Outstanding Student Award",
        organization: "University of Technology",
        date: "2022-05",
        description:
          "Recognized for academic excellence, leadership, and contributions to campus community. Awarded to top 5% of graduating class.",
      },
      {
        id: uuidv4(),
        title: "Dean's List",
        organization: "University of Technology",
        date: "2021-12",
        description:
          "Achieved GPA of 3.9/4.0 for three consecutive semesters (Fall 2020, Spring 2021, Fall 2021).",
      },
      {
        id: uuidv4(),
        title: "Best Hackathon Project",
        organization: "TechFest 2021",
        date: "2021-10",
        description:
          "Won first place in annual hackathon competition for developing an innovative healthcare management system.",
      },
    ];
    onChange(sampleData);
  };

  const addAward = () => {
    const newAward: Award = {
      id: uuidv4(),
      title: "",
      organization: "",
      date: "",
      description: "",
    };
    onChange([...data, newAward]);
    setEditingId(newAward.id);
  };

  const updateAward = (
    id: string,
    field: keyof Award,
    value: string
  ) => {
    onChange(
      data.map((award) => (award.id === id ? { ...award, [field]: value } : award))
    );
  };

  const deleteAward = (id: string) => {
    onChange(data.filter((award) => award.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveAward = (id: string, direction: "up" | "down") => {
    const index = data.findIndex((award) => award.id === id);
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
        title="Awards"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        }
      />

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No awards added yet.</p>
          <p className="text-sm text-gray-500 mb-6">Click "Add Award" to get started.</p>
          <button
            onClick={addAward}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Award
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((award, index) => (
            <div
              key={award.id}
              className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                editingId === award.id
                  ? "ring-2 ring-blue-500 border-blue-500 shadow-lg bg-blue-50/30"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {award.title || "Untitled Award"}
                    {award.organization && ` from ${award.organization}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {award.date && `Received: ${award.date}`}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveAward(award.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveAward(award.id, "down")}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === award.id ? null : award.id
                      )
                    }
                    className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border-2 border-blue-200 hover:border-blue-600 shadow-sm hover:shadow-md"
                    title="Edit"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteAward(award.id)}
                    className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingId === award.id && (
                <div className="space-y-6 border-t-2 border-gray-200 pt-6 mt-6">
                  {/* Award Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Award Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Award Title *
                        </label>
                        <input
                          type="text"
                          value={award.title}
                          onChange={(e) =>
                            updateAward(award.id, "title", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Outstanding Student Award"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          The full name of the award or recognition
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Organization / Issuer *
                        </label>
                        <input
                          type="text"
                          value={award.organization}
                          onChange={(e) =>
                            updateAward(award.id, "organization", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="University of Technology"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          The organization or institution that issued the award
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Date Received *
                        </label>
                        <input
                          type="month"
                          value={award.date}
                          onChange={(e) =>
                            updateAward(award.id, "date", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Additional Information
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description (Optional)
                      </label>
                      <RichTextEditor
                        value={award.description || ""}
                        onChange={(html) =>
                          updateAward(award.id, "description", html)
                        }
                        placeholder="Awarded for excellence in academic performance and leadership. Recognized as top 5% of graduating class."
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
          <div className="flex justify-center pt-4">
            <button
              onClick={addAward}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Award
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwardsForm;

