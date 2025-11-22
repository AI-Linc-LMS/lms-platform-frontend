import React, { useState } from "react";
import { Activity } from "../types/resume";
import { v4 as uuidv4 } from "uuid";
import FormHeader from "./FormHeader";

interface ActivitiesFormProps {
  data: Activity[];
  onChange: (data: Activity[]) => void;
}

const ActivitiesForm: React.FC<ActivitiesFormProps> = ({ data, onChange }) => {
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSampleData = () => {
    const sampleData: Activity[] = [
      {
        id: uuidv4(),
        name: "Student Council President",
        organization: "University of Technology",
        startDate: "2021-09",
        endDate: "2022-05",
        isCurrent: false,
        involvements: [
          "Led a team of 15 council members to organize campus-wide events",
          "Managed annual budget of $15,000 for student activities",
          "Organized 10+ events with total attendance of 2,000+ students",
          "Improved communication between administration and student body",
        ],
        achievements: [
          "Increased student participation in campus events by 40%",
          "Successfully organized the largest career fair in university history",
          "Received 'Outstanding Student Leader' award from university administration",
        ],
      },
      {
        id: uuidv4(),
        name: "Hackathon Organizer",
        organization: "Computer Science Club",
        startDate: "2020-01",
        endDate: "2022-05",
        isCurrent: false,
        involvements: [
          "Organized annual hackathons with 200+ participants",
          "Coordinated with 10+ tech companies for sponsorships",
          "Managed logistics, scheduling, and event execution",
        ],
        achievements: [
          "Increased participation by 40% over two years",
          "Secured $50,000 in sponsorships from tech companies",
          "Won 'Best Hackathon Event' award at regional competition",
        ],
      },
    ];
    onChange(sampleData);
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: uuidv4(),
      name: "",
      organization: "",
      startDate: "",
      endDate: "",
      isCurrent: false,
      involvements: [],
      achievements: [],
    };
    onChange([...data, newActivity]);
    setEditingId(newActivity.id);
  };

  const updateActivity = (
    id: string,
    field: keyof Activity,
    value: string | boolean | string[]
  ) => {
    onChange(
      data.map((activity) => (activity.id === id ? { ...activity, [field]: value } : activity))
    );
  };

  const addInvolvement = (id: string) => {
    const activity = data.find((a) => a.id === id);
    if (activity) {
      updateActivity(id, "involvements", [...(activity.involvements || []), ""]);
    }
  };

  const updateInvolvement = (id: string, index: number, value: string) => {
    const activity = data.find((a) => a.id === id);
    if (activity) {
      const updated = [...(activity.involvements || [])];
      updated[index] = value;
      updateActivity(id, "involvements", updated);
    }
  };

  const removeInvolvement = (id: string, index: number) => {
    const activity = data.find((a) => a.id === id);
    if (activity) {
      const updated = (activity.involvements || []).filter((_, i) => i !== index);
      updateActivity(id, "involvements", updated);
    }
  };

  const addAchievement = (id: string) => {
    const activity = data.find((a) => a.id === id);
    if (activity) {
      updateActivity(id, "achievements", [...(activity.achievements || []), ""]);
    }
  };

  const updateAchievement = (id: string, index: number, value: string) => {
    const activity = data.find((a) => a.id === id);
    if (activity) {
      const updated = [...(activity.achievements || [])];
      updated[index] = value;
      updateActivity(id, "achievements", updated);
    }
  };

  const removeAchievement = (id: string, index: number) => {
    const activity = data.find((a) => a.id === id);
    if (activity) {
      const updated = (activity.achievements || []).filter((_, i) => i !== index);
      updateActivity(id, "achievements", updated);
    }
  };

  const deleteActivity = (id: string) => {
    onChange(data.filter((activity) => activity.id !== id));
    if (editingId === id) {
      setEditingId(null);
    }
  };

  const moveActivity = (id: string, direction: "up" | "down") => {
    const index = data.findIndex((activity) => activity.id === id);
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
        title="Activities"
        onLoadSample={loadSampleData}
        icon={
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />

      {data.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 font-medium mb-1">No activities added yet.</p>
          <p className="text-sm text-gray-500 mb-6">Click "Add Activity" to get started.</p>
          <button
            onClick={addActivity}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Activity
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((activity, index) => (
            <div
              key={activity.id}
              className={`border-2 rounded-xl p-5 transition-all duration-200 ${
                editingId === activity.id
                  ? "ring-2 ring-blue-500 border-blue-500 shadow-lg bg-blue-50/30"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">
                    {activity.name || "Untitled Activity"}
                    {activity.organization && ` at ${activity.organization}`}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {activity.startDate} -{" "}
                    {activity.isCurrent ? "Present" : activity.endDate}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => moveActivity(activity.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveActivity(activity.id, "down")}
                    disabled={index === data.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() =>
                      setEditingId(
                        editingId === activity.id ? null : activity.id
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
                    onClick={() => deleteActivity(activity.id)}
                    className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {editingId === activity.id && (
                <div className="space-y-6 border-t-2 border-gray-200 pt-6 mt-6">
                  {/* Activity Details */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h5 className="text-sm font-bold text-gray-900">
                        Activity Details
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Activity Name *
                        </label>
                        <input
                          type="text"
                          value={activity.name}
                          onChange={(e) =>
                            updateActivity(activity.id, "name", e.target.value)
                          }
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                          placeholder="Student Council President"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          The name or title of the activity
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Organization *
                        </label>
                        <input
                          type="text"
                          value={activity.organization}
                          onChange={(e) =>
                            updateActivity(
                              activity.id,
                              "organization",
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
                          The organization, club, or institution
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
                        Duration
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Start Date *
                        </label>
                        <input
                          type="month"
                          value={activity.startDate}
                          onChange={(e) =>
                            updateActivity(
                              activity.id,
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
                          value={activity.endDate}
                          onChange={(e) =>
                            updateActivity(
                              activity.id,
                              "endDate",
                              e.target.value
                            )
                          }
                          disabled={activity.isCurrent}
                          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <div className="flex items-center gap-3 mt-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={activity.isCurrent}
                              onChange={(e) =>
                                updateActivity(
                                  activity.id,
                                  "isCurrent",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-[#257195] focus:ring-[#257195]"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              Currently active
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Involvements */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h5 className="text-sm font-bold text-gray-900">
                          Involvements
                        </h5>
                      </div>
                      <button
                        onClick={() => addInvolvement(activity.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(activity.involvements || []).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No involvements added yet.</p>
                      ) : (
                        (activity.involvements || []).map((involvement, idx) => (
                          <div key={idx} className="flex gap-2 items-start pr-1">
                            <input
                              type="text"
                              value={involvement}
                              onChange={(e) => updateInvolvement(activity.id, idx, e.target.value)}
                              className="flex-1 min-w-0 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                              placeholder="e.g., Led a team of 15 council members to organize campus-wide events"
                            />
                            <button
                              onClick={() => removeInvolvement(activity.id, idx)}
                              className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md flex-shrink-0"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      List your key responsibilities and involvements in this activity.
                    </p>
                  </div>

                  {/* Achievements */}
                  <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                        <h5 className="text-sm font-bold text-gray-900">
                          Achievements
                        </h5>
                      </div>
                      <button
                        onClick={() => addAchievement(activity.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(activity.achievements || []).length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No achievements added yet.</p>
                      ) : (
                        (activity.achievements || []).map((achievement, idx) => (
                          <div key={idx} className="flex gap-2 items-start pr-1">
                            <input
                              type="text"
                              value={achievement}
                              onChange={(e) => updateAchievement(activity.id, idx, e.target.value)}
                              className="flex-1 min-w-0 border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white hover:border-gray-300 text-gray-900 placeholder:text-gray-400"
                              placeholder="e.g., Increased student participation by 40%"
                            />
                            <button
                              onClick={() => removeAchievement(activity.id, idx)}
                              className="p-1.5 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border-2 border-red-200 hover:border-red-600 shadow-sm hover:shadow-md flex-shrink-0"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Highlight your key achievements, awards, or notable accomplishments.
                    </p>
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
              onClick={addActivity}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivitiesForm;

