import React, { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { WorkshopRegistrationData } from "../../types";

interface EditFollowUpDateModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: WorkshopRegistrationData;
  field: "follow_up_date" | "meeting_scheduled_at" | "next_payment_date";
  onSave: (date: string, field: "follow_up_date" | "meeting_scheduled_at" | "next_payment_date") => void;
}

export const EditFollowUpDateModal: React.FC<EditFollowUpDateModalProps> = ({
  isOpen,
  onClose,
  entry,
  field,
  onSave,
}) => {
  const [newFollowUpDate, setNewFollowUpDate] = useState(() => {
    switch (field) {
      case "follow_up_date":
        return entry.follow_up_date || "";
      case "meeting_scheduled_at":
        return entry.meeting_scheduled_at || "";
      case "next_payment_date":
        return entry.next_payment_date || "";
    }
  });
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [selectedPeriod, setSelectedPeriod] = useState("AM");

  useEffect(() => {
    if (isOpen) {
      if (entry[field]) {
        const date = new Date(entry[field]);
        // Format date as YYYY-MM-DD for date input
        const formattedDate = date.toISOString().split("T")[0];
        setNewFollowUpDate(formattedDate);

        // Convert to 12-hour format
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const period = hours >= 12 ? "PM" : "AM";

        // Convert to 12-hour format
        if (hours === 0) hours = 12;
        else if (hours > 12) hours -= 12;

        const timeString = `${hours}:${minutes.toString().padStart(2, "0")}`;
        setSelectedTime(timeString);
        setSelectedPeriod(period);
      } else {
        setNewFollowUpDate("");
        setSelectedTime("12:00");
        setSelectedPeriod("AM");
      }
    }
  }, [isOpen, entry[field]]);

  const handleSave = () => {
    if (newFollowUpDate && selectedTime) {
      // Parse the time input
      const [hourStr, minuteStr] = selectedTime.split(":");
      let hour24 = parseInt(hourStr);
      const minute = parseInt(minuteStr) || 0;

      // Convert 12-hour format to 24-hour format
      if (selectedPeriod === "AM" && hour24 === 12) {
        hour24 = 0;
      } else if (selectedPeriod === "PM" && hour24 !== 12) {
        hour24 += 12;
      }

      // Create the time string in 24-hour format
      const timeString = `${hour24.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const combinedDateTime = new Date(
        `${newFollowUpDate}T${timeString}`
      ).toISOString();
      onSave(combinedDateTime, field);
    } else {
      onSave(newFollowUpDate ?? "", field);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-follow-up-date-modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-blue-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close edit follow-up date modal"
        >
          <FiX className="w-6 h-6" />
        </button>

        <h2
          id="edit-follow-up-date-modal-title"
          className="text-xl font-bold mb-4 text-gray-800"
        >
          Edit {field === "follow_up_date" ? "Follow-up Date" : field === "meeting_scheduled_at" ? "Meeting Scheduled Date" : "Next Payment Date"}
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Student: <span className="font-medium">{entry.name}</span>
          </p>
          <p className="text-sm text-gray-600">
            Current Date:{" "}
            <span className="font-medium">
              {entry.follow_up_date
                ? new Date(entry.follow_up_date).toLocaleDateString()
                : "Not set"}
            </span>
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Select {field === "follow_up_date" ? "Follow-up Date" : field === "meeting_scheduled_at" ? "Meeting Scheduled Date" : "Next Payment Date"}
          </label>
          <input
            type="date"
            value={newFollowUpDate}
            onChange={(e) => setNewFollowUpDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm font-medium text-gray-700">
            Select {field === "follow_up_date" ? "Follow-up Time" : field === "meeting_scheduled_at" ? "Meeting Scheduled Time" : "Next Payment Time"}
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              placeholder="12:00"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium transition-colors"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
            onClick={handleSave}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
