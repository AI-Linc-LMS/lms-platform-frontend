import axiosInstance from "../axiosInstance";
import { ReferralData } from "../../types/referral";
import { EditRegistrationData} from "../../features/admin/workshop-registrations/types";
import { JobData } from "../../features/admin/emailSend/EmailForm";

export const getWorkshopRegistrations = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/api/clients/${clientId}/workshop-registrations/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch workshop registrations"
    );
  }
}

export const getAssesmentStudentResults = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/admin-dashboard/api/clients/${clientId}/assessment-submissions/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch assessment student results"
    );
  }
}

export const getRefferalDetails = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/api/clients/${clientId}/referral-program/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to fetch referral details"
    );
  }
}

export const createReferral = async (clientId: string, data: ReferralData) => {
  try {
    const response = await axiosInstance.post(`/api/clients/${clientId}/referral-program/`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create referral"
    );
  }
}

export const updateReferral = async (clientId: string, referralId: string, data: ReferralData) => {
  try {
    const response = await axiosInstance.put(`/api/clients/${clientId}/referrals-program/${referralId}/`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update referral"
    );
  }
}

export const deleteReferral = async (clientId: string, referralId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/clients/${clientId}/referrals-program/${referralId}/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete referral"
    );
  }
}

export const editRegistration = async (clientId: string, registrationId: string, data: EditRegistrationData) => {
  try {
    const response = await axiosInstance.patch(`/api/clients/${clientId}/workshop-registrations/${registrationId}/`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to edit registration"
    );
  }
}

export const uploadAttendanceData = async (clientId: string, attendanceData: any[]) => {
  try {
    const response = await axiosInstance.post(`/api/clients/${clientId}/workshop-attendance/`, {
      attendance_data: attendanceData
    });
    return response.data;
  } catch (error) {
    console.error('Failed to upload attendance data:', error);
    throw error;
  }
}

export const htmlEmail = async (clientId: string, data: string) => {
  try {
    console.log(clientId, data);
    const response = await axiosInstance.post(`/admin-dashboard/api/clients/${clientId}/ai/format-email-body/`,
      {
        "raw_body": data 
      }
    );
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to format email body"
    );
  }
} 

export const createEmailJob = async (clientId: string, data: JobData) => {
  try {
    const response = await axiosInstance.post(`/admin-dashboard/api/clients/${clientId}/email-jobs/`, data);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create email job"
    );
  }
}

export const getEmailJobsStatus = async (clientId: string, jobId: string) => {
  try {
    const response = await axiosInstance.get(`/admin-dashboard/api/clients/${clientId}/email-jobs/${jobId}/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to get email jobs"
    );
  }
}

export const getEmailJobs = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/admin-dashboard/api/clients/${clientId}/email-jobs/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to get email jobs"
    );
  }
}

export const restartFailedJob = async (clientId: string, jobId: string) => {
  try {
    const response = await axiosInstance.post(`/admin-dashboard/api/clients/${clientId}/email-resend-jobs/${jobId}/`);
    return response.data;
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to restart failed job"
    );
  }
}
