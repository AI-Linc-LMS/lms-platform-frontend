// CreateLiveAdmin.tsx
import React, { useState } from "react";
import {
  createLiveSession,
  LiveSession,
} from "../../../services/live/liveServicesApis";

interface CreateLiveAdminProps {
  onClose: () => void;
  refetch: () => void;
}


enum Trainers {
  Shubham_lal = "Shubham lal",
  Balbir_Yadav = "Balbir Yadav",
  Soumic_Sarkar = "Soumic Sarkar",
}

const CreateLiveAdmin: React.FC<CreateLiveAdminProps> = ({
  onClose,
  refetch,
}) => {
  const initialForm: Omit<LiveSession, "id"> = {
    topic_name: "",
    description: "",
    instructor: "",
    class_datetime: "",
    duration_minutes: 60,
    join_link: "",
    recording_link: "",
  };

  const [form, setForm] = useState(initialForm);

  const createMutation = async (sessionData: Omit<LiveSession, "id">) => {
    const clientId = import.meta.env.VITE_CLIENT_ID;
    const response = await createLiveSession(clientId, sessionData);
    return response;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation(form);
      setForm(initialForm);
      onClose();
      refetch();
    } catch (error) {
      console.error("Error creating live session:", error);
      onClose();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
      <h2 className="text-xl font-bold text-[#255C79] mb-4">
        Create Upcoming Session
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Topic Name */}
        <div>
          <label className="block text-sm font-medium text-[#255C79] mb-1">
            Title
          </label>
          <input
            type="text"
            name="topic_name"
            value={form.topic_name}
            onChange={handleChange}
            required
            className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#255C79] mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            required
            rows={3}
            className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
          />
        </div>

        {/* Trainer & DateTime */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Trainer
            </label>
            <select
              name="instructor"
              value={form.instructor}
              onChange={handleChange}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
            >
              <option value="">Select a Trainer</option>
              {Object.values(Trainers).map((trainer) => (
                <option key={trainer} value={trainer}>
                  {trainer}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              name="class_datetime"
              value={form.class_datetime}
              onChange={handleChange}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
            />
          </div>
        </div>

        {/* Duration & Join Link */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={form.duration_minutes}
              onChange={handleChange}
              min={1}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Meeting Link
            </label>
            <input
              type="url"
              name="join_link"
              value={form.join_link}
              onChange={handleChange}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
            />
          </div>
        </div>

        {/* Recording Link */}
        <div>
          <label className="block text-sm font-medium text-[#255C79] mb-1">
            Recording Link (optional)
          </label>
          <input
            type="url"
            name="recording_link"
            value={form.recording_link || ""}
            onChange={handleChange}
            className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-4 space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[#255C79] hover:bg-[#1E4A63] text-white font-medium py-2 px-4 rounded"
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLiveAdmin;
