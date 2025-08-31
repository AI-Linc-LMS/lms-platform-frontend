// CreateLiveAdmin.tsx
import React, { useState } from "react";
import {
  createLiveSession,
  updateLiveSession,
  LiveSession,
} from "../../../services/live/liveServicesApis";
import { useMutation } from "@tanstack/react-query";
import PermissionDeniedModal from "../workshop-registrations/components/modals/PermissionDeniedModal";

interface CreateLiveAdminProps {
  onClose: () => void;
  refetch: () => void;
  editSession?: LiveSession | null; // Add edit session prop
  isEditMode?: boolean; // Add edit mode flag
}

enum Trainers {
  Shubham_lal = "Shubham lal",
  Balbir_Yadav = "Balbir Yadav",
  Soumic_Sarkar = "Soumic Sarkar",
}

const CreateLiveAdmin: React.FC<CreateLiveAdminProps> = ({
  onClose,
  refetch,
  editSession = null,
  isEditMode = false,
}) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const initialForm: Omit<LiveSession, "id"> = {
    topic_name: "",
    description: "",
    instructor: "",
    class_datetime: "",
    duration_minutes: 60,
    join_link: "",
    recording_link: "",
  };

  // Initialize form with edit data if in edit mode
  const getInitialFormData = () => {
    if (isEditMode && editSession) {
      return {
        topic_name: editSession.topic_name || "",
        description: editSession.description || "",
        instructor: editSession.instructor || "",
        class_datetime: editSession.class_datetime || "",
        duration_minutes: editSession.duration_minutes || 60,
        join_link: editSession.join_link || "",
        recording_link: editSession.recording_link || "",
      };
    }
    return initialForm;
  };

  const [form, setForm] = useState(getInitialFormData());

  // useMutation for create
  const { mutateAsync: createLiveSessionMutate } = useMutation({
    mutationFn: (sessionData: Omit<LiveSession, "id">) => {
      return createLiveSession(clientId, sessionData);
    },
  });

  // useMutation for update
  const { mutateAsync: updateLiveSessionMutate } = useMutation({
    mutationFn: (sessionData: LiveSession) => {
      if (!sessionData.id) {
        throw new Error("Session ID is required for update");
      }
      return updateLiveSession(
        clientId,
        sessionData.id.toString(),
        sessionData
      );
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const [permissionDeniedOpen, setPermissionDeniedOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPermissionDeniedOpen(true);
    return;
    try {
      if (isEditMode && editSession) {
        // Update existing session
        const updatedSession: LiveSession = {
          ...form,
          id: editSession?.id,
        };
        await updateLiveSessionMutate(updatedSession);
      } else {
        // Create new session
        await createLiveSessionMutate(form);
      }

      setForm(initialForm);
      onClose();
      refetch();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} live session:`,
        error
      );
      onClose();
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl w-full max-w-2xl">
      <h2 className="text-xl font-bold text-[#255C79] mb-4">
        {isEditMode ? "Edit Live Session" : "Create Upcoming Session"}
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
            <div className="space-y-2">
              {/* Dropdown */}
              <select
                name="instructor"
                value={form.instructor}
                onChange={handleChange}
                className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
              >
                <option value="">Select a Trainer</option>
                {Object.values(Trainers).map((trainer) => (
                  <option key={trainer} value={trainer}>
                    {trainer}
                  </option>
                ))}
              </select>

              {/* OR divider */}
              <div className="flex items-center">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-2 text-xs text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Input box */}
              <input
                type="text"
                name="instructor"
                value={form.instructor}
                onChange={handleChange}
                placeholder="Enter trainer name manually"
                className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2"
              />
            </div>
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
            {isEditMode ? "Update" : "Create"}
          </button>
        </div>
      </form>
      <PermissionDeniedModal
        isOpen={permissionDeniedOpen}
        onClose={() => setPermissionDeniedOpen(false)}
      />+
    </div>
  );
};

export default CreateLiveAdmin;
