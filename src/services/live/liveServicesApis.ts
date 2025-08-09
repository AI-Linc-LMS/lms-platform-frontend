import axiosInstance from "../axiosInstance";

export interface LiveSession {
  id?: string;
  topic_name: string;
  description: string;
  join_link: string;
  recording_link: string | null;
  class_datetime: string;
  duration_minutes: number;
  instructor: string;
}

export const liveServicesApis = async (clientId: string) => {
  try {
    const res = await axiosInstance.get(
      `/live-class/api/clients/${clientId}/sessions/`
    );
    return res.data;
  } catch (error) {
    console.error("Error in liveServicesApis:", error);
    throw error; // Re-throw the error after logging it
  }
};

export const createLiveSession = async (
  clientId: number,
  sessionData: LiveSession
) => {
  try {
    const res = await axiosInstance.post(
      `/live-class/api/clients/${clientId}/sessions/create/`,
      sessionData
    );
    return res.data;
  } catch (error) {
    console.error("Error in createLiveSession:", error);
    throw error; // Re-throw the error after logging it
  }
};

export const updateLiveSession = async (
  clientId: number,
  sessionId: string,
  sessionData: LiveSession
) => {
  try {
    const res = await axiosInstance.patch(
      `/live-class/api/clients/${clientId}/sessions/${sessionId}/update/`,
      sessionData
    );
    return res.data;
  } catch (error) {
    console.error("Error in updateLiveSession:", error);
    throw error; // Re-throw the error after logging it
  }
};
