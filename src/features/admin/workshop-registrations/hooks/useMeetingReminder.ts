import { useEffect, useCallback } from 'react';
import { useToast } from '../../../../contexts/ToastContext';
import { WorkshopRegistrationData } from '../types';

interface MeetingReminderProps {
  data: WorkshopRegistrationData[];
  isEnabled?: boolean;
}

export const useMeetingReminder = ({ data, isEnabled = true }: MeetingReminderProps) => {
  const { success, error } = useToast();

  const checkMeetingTime = useCallback((
    dateTimeString: string,
    currentTime: number,
    meetingType: string,
    personName: string,
    personId: number
  ) => {
    try {
      // Skip if dateTimeString is empty or invalid
      if (!dateTimeString || dateTimeString.trim() === '') {
        return;
      }

      const meetingTime = new Date(dateTimeString).getTime();
      
      // Skip if the parsed date is invalid
      if (isNaN(meetingTime)) {
        return;
      }

      const timeDifferenceMs = meetingTime - currentTime;
      const timeDifferenceMinutes = Math.floor(timeDifferenceMs / (1000 * 60));

      // Check if meeting is happening now (within 1 minute tolerance) - RED
      if (Math.abs(timeDifferenceMinutes) <= 1) {
        error(
          `${meetingType} is happening now!`,
          `Your ${meetingType.toLowerCase()} with ${personName} (ID: ${personId}) is scheduled right now.`,
          8000 // Show for 8 seconds, then auto-remove
        );
      }
      // Check if meeting is within 10 minutes - GREEN
      else if (timeDifferenceMinutes > 0 && timeDifferenceMinutes <= 10) {
        success(
          `Upcoming ${meetingType}`,
          `Your ${meetingType.toLowerCase()} with ${personName} (ID: ${personId}) is scheduled in ${timeDifferenceMinutes} minute${timeDifferenceMinutes === 1 ? '' : 's'}.`,
          6000 // Show for 6 seconds, then auto-remove
        );
      }
    } catch (error) {
      console.error('Error parsing meeting time:', error, 'for date:', dateTimeString);
    }
  }, [success, error]);

  const checkUpcomingMeetings = useCallback(() => {
    if (!isEnabled || !data?.length) return;

    const now = new Date();
    const currentTime = now.getTime();

    data.forEach((entry) => {
      // Check follow_up_date
      if (entry.follow_up_date) {
        checkMeetingTime(
          entry.follow_up_date,
          currentTime,
          'Follow-up',
          entry.name,
          entry.id
        );
      }

      // Check meeting_scheduled_at
      if (entry.meeting_scheduled_at) {
        checkMeetingTime(
          entry.meeting_scheduled_at,
          currentTime,
          'Meeting',
          entry.name,
          entry.id
        );
      }
    });
  }, [data, isEnabled, checkMeetingTime]);

  // Simple check when data changes - no intervals, no delays
  useEffect(() => {
    if (isEnabled && data?.length > 0) {
      checkUpcomingMeetings();
    }
  }, [data, isEnabled, checkUpcomingMeetings]);

  return {
    checkUpcomingMeetings
  };
};
