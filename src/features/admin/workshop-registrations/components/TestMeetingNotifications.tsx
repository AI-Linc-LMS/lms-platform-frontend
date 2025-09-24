import React, { useState } from "react";
import { useToast } from "../../../../contexts/ToastContext";

interface TestMeetingNotificationsProps {
  className?: string;
  onDebugMeetings?: () => void;
}

export const TestMeetingNotifications: React.FC<
  TestMeetingNotificationsProps
> = ({ className = "", onDebugMeetings }) => {
  const { success, error } = useToast();
  const [testPersonName, setTestPersonName] = useState("John Doe");
  const [testPersonId, setTestPersonId] = useState("123");

  const handleTest10MinNotification = () => {
    success(
      "Upcoming Meeting",
      `Your meeting with ${testPersonName} (ID: ${testPersonId}) is scheduled in 10 minutes.`,
      10000
    );
  };

  const handleTestNowNotification = () => {
    error(
      "Meeting is happening now!",
      `Your meeting with ${testPersonName} (ID: ${testPersonId}) is scheduled right now.`,
      12000
    );
  };

  const handleTestFollowUpNotification = () => {
    success(
      "Upcoming Follow-up",
      `Your follow-up with ${testPersonName} (ID: ${testPersonId}) is scheduled in 5 minutes.`,
      10000
    );
  };

  return (
    <div
      className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Test Meeting Notifications
      </h3>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={testPersonName}
            onChange={(e) => setTestPersonName(e.target.value)}
            placeholder="Person Name"
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          />
          <input
            type="text"
            value={testPersonId}
            onChange={(e) => setTestPersonId(e.target.value)}
            placeholder="Person ID"
            className="px-3 py-1 border border-gray-300 rounded text-sm w-20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleTest10MinNotification}
            className="px-4 py-2 bg-green-500 text-[var(--font-light)] rounded hover:bg-green-600 transition-colors text-sm"
          >
            Test 10-Min Warning (Green)
          </button>

          <button
            onClick={handleTestNowNotification}
            className="px-4 py-2 bg-red-500 text-[var(--font-light)] rounded hover:bg-red-600 transition-colors text-sm"
          >
            Test Now Alert (Red)
          </button>

          <button
            onClick={handleTestFollowUpNotification}
            className="px-4 py-2 bg-blue-500 text-[var(--font-light)] rounded hover:bg-blue-600 transition-colors text-sm"
          >
            Test Follow-up (Green)
          </button>

          {onDebugMeetings && (
            <button
              onClick={onDebugMeetings}
              className="px-4 py-2 bg-purple-500 text-[var(--font-light)] rounded hover:bg-purple-600 transition-colors text-sm"
            >
              Debug Real Meetings
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-600">
        <p>
          <strong>Green notifications:</strong> 10 minutes before
          meeting/follow-up
        </p>
        <p>
          <strong>Red notifications:</strong> Meeting is happening now
        </p>
        <p>
          <strong>Debug button:</strong> Shows actual meetings from data in
          console
        </p>
      </div>
    </div>
  );
};
