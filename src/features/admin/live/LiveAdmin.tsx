import React, { useState } from "react";
import { UpcomingSession } from "../../live/types/live.types";

const initialForm: Omit<UpcomingSession, "id"> = {
  title: "",
  description: "",
  trainer: {
    name: "",
    bio: "",
    linkedIn: "",
    avatar: "",
  },
  scheduledTime: "",
  duration: 60,
  zoomLink: "",
  isLive: false,
};

const LiveAdmin = () => {
  const [form, setForm] = useState<Omit<UpcomingSession, "id">>(initialForm);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (name.startsWith("trainer.")) {
      const trainerField = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        trainer: { ...prev.trainer, [trainerField]: value },
      }));
    } else if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "duration") {
      setForm((prev) => ({ ...prev, duration: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would send form data to backend
    // For now, just log it
    console.log("Upcoming Session Created:", form);
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-8 ring-1 ring-[#B9E4F2] ring-offset-1">
      <h2 className="text-2xl font-bold text-[#255C79] mb-6">
        Create Upcoming Session
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#255C79] mb-1">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
          />
        </div>
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
            className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Trainer Name
            </label>
            <input
              type="text"
              name="trainer.name"
              value={form.trainer.name}
              onChange={handleChange}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Trainer Bio
            </label>
            <input
              type="text"
              name="trainer.bio"
              value={form.trainer.bio}
              onChange={handleChange}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Trainer LinkedIn
            </label>
            <input
              type="url"
              name="trainer.linkedIn"
              value={form.trainer.linkedIn}
              onChange={handleChange}
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Trainer Avatar URL
            </label>
            <input
              type="url"
              name="trainer.avatar"
              value={form.trainer.avatar}
              onChange={handleChange}
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              name="scheduledTime"
              value={form.scheduledTime}
              onChange={handleChange}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#255C79] mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              min={1}
              required
              className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#255C79] mb-1">
            Zoom Link
          </label>
          <input
            type="url"
            name="zoomLink"
            value={form.zoomLink}
            onChange={handleChange}
            required
            className="w-full border border-[#B9E4F2] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#255C79] text-gray-800"
            placeholder="https://zoom.us/j/meeting-id"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isLive"
            checked={form.isLive}
            onChange={handleChange}
            className="h-4 w-4 text-[#255C79] border-gray-300 rounded focus:ring-[#255C79]"
          />
          <label className="text-sm text-[#255C79]">Is Live?</label>
        </div>
        <button
          type="submit"
          className="w-full bg-[#255C79] hover:bg-[#1E4A63] text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors duration-200"
        >
          Create Session
        </button>
        {submitted && (
          <div className="mt-4 text-green-600 font-medium text-center">
            Session created! (Check console for data)
          </div>
        )}
      </form>
    </div>
  );
};

export default LiveAdmin;
