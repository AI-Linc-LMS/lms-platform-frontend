import React, { useState } from "react";
import { Volunteering } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";
import RichTextEditor from "./RichTextEditor";

interface VolunteeringFormProps {
  data: Volunteering[];
  onChange: (data: Volunteering[]) => void;
}

const VolunteeringForm: React.FC<VolunteeringFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSampleData = () => {
    const sampleData: Volunteering[] = [
      {
        id: uuidv4(),
        organization: "Habitat for Humanity",
        role: "Volunteer Coordinator",
        startDate: "2020-03",
        endDate: "2022-08",
        isCurrent: false,
        description:
          "• Coordinated volunteer activities for 50+ volunteers weekly\n• Organized 20+ community build events helping 15 families\n• Managed communication between volunteers and organization staff\n• Trained new volunteers on safety protocols and building techniques",
      },
      {
        id: uuidv4(),
        organization: "Local Food Bank",
        role: "Food Distribution Volunteer",
        startDate: "2019-01",
        endDate: "",
        isCurrent: true,
        description:
          "• Assist with food distribution to 200+ families weekly\n• Help organize and sort donations from local businesses\n• Coordinate with team to ensure efficient operations\n• Maintained positive relationships with community members",
      },
    ];
    onChange(sampleData);
  };

  const addVolunteering = () => {
    const newVolunteering: Volunteering = {
      id: uuidv4(),
      organization: "",
      role: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      description: "",
    };
    onChange([...data, newVolunteering]);
    setEditingId(newVolunteering.id);
  };

  const updateVolunteering = (
    id: string,
    field: keyof Volunteering,
    value: string | boolean
  ) => {
    onChange(
      data.map((volunteering) => (volunteering.id === id ? { ...volunteering, [field]: value } : volunteering))
    );
  };

  const deleteVolunteering = (id: string) => {
    onChange(data.filter((volunteering) => volunteering.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveVolunteering = (id: string, direction: "up" | "down") => {
    const index = data.findIndex((volunteering) => volunteering.id === id);
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
        title="Volunteering"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
      />

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No volunteering experience added yet.</p>
          <p className="text-sm text-gray-500 mb-6">Click "Add Volunteering" to get started.</p>
          <button
            onClick={addVolunteering}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Volunteering
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((volunteering, index) => (
            <div
              key={volunteering.id}
              className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                editingId === volunteering.id
                  ? "ring-2 ring-blue-500 border-blue-500 shadow-lg bg-blue-50/30"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {volunteering.role || "Untitled Role"}
                    {volunteering.organization && ` at ${volunteering.organization}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {volunteering.startDate} -{" "}
                    {volunteering.isCurrent ? "Present" : volunteering.endDate}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveVolunteering(volunteering.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveVolunteering(volunteering.id, "down")}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === volunteering.id ? null : volunteering.id
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
                    onClick={() => deleteVolunteering(volunteering.id)}
                    className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingId === volunteering.id && (
                <div className="space-y-6 border-t-2 border-gray-200 pt-6 mt-6">
                  {/* Organization & Role */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Organization & Role
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Organization *
                        </label>
                        <input
                          type="text"
                          value={volunteering.organization}
                          onChange={(e) =>
                            updateVolunteering(
                              volunteering.id,
                              "organization",
                              e.target.value
                            )
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Habitat for Humanity"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Name of the non-profit or organization
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Role / Position *
                        </label>
                        <input
                          type="text"
                          value={volunteering.role}
                          onChange={(e) =>
                            updateVolunteering(volunteering.id, "role", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Volunteer Coordinator"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Your role or position title
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Volunteering Period
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="month"
                          value={volunteering.startDate}
                          onChange={(e) =>
                            updateVolunteering(
                              volunteering.id,
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
                          value={volunteering.endDate}
                          onChange={(e) =>
                            updateVolunteering(
                              volunteering.id,
                              "endDate",
                              e.target.value
                            )
                          }
                          disabled={volunteering.isCurrent}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
                        />
                        
                        <div className="flex items-center gap-2 mt-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={volunteering.isCurrent}
                              onChange={(e) =>
                                updateVolunteering(
                                  volunteering.id,
                                  "isCurrent",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-[#257195] focus:ring-[#257195]"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Currently volunteering
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Description & Impact
                      </h5>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Responsibilities & Achievements *
                      </label>
                      <RichTextEditor
                        value={volunteering.description}
                        onChange={(html) =>
                          updateVolunteering(
                            volunteering.id,
                            "description",
                            html
                          )
                        }
                        placeholder="• Coordinated volunteer activities for 50+ members weekly&#10;• Organized 20+ community events reaching 200+ participants&#10;• Managed communication between volunteers and organization staff&#10;• Helped raise $5,000 for community initiatives"
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
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
              onClick={addVolunteering}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Volunteering
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteeringForm;

