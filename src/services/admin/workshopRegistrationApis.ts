import axiosInstance from "../axiosInstance";
import { ReferralData } from "../../types/referral";

export const getWorkshopRegistrations = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/api/clients/${clientId}/workshop-registrations/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch workshop registrations:', error);
    throw error;
  }
}

export const getAssesmentStudentResults = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/admin-dashboard/api/clients/${clientId}/assessment-submissions/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch assessment student results:', error);
    throw error;
  }
}

export const getRefferalDetails = async (clientId: string) => {
  try {
    const response = await axiosInstance.get(`/api/clients/${clientId}/referral-program/`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch referral details:', error);
    throw error;
  }
}

export const createReferral = async (clientId: string, data: ReferralData) => {
  try {
    const response = await axiosInstance.post(`/api/clients/${clientId}/referral-program/`, data);
    return response.data;
  } catch (error) {
    console.error('Failed to create referral:', error);
    throw error;
  }
}

export const updateReferral = async (clientId: string, referralId: string, data: ReferralData) => {
  try {
    const response = await axiosInstance.put(`/api/clients/${clientId}/referrals-program/${referralId}/`, data);
    return response.data;
  } catch (error) {
    console.error('Failed to update referral:', error);
    throw error;
  }
}

export const deleteReferral = async (clientId: string, referralId: string) => {
  try {
    const response = await axiosInstance.delete(`/api/clients/${clientId}/referrals-program/${referralId}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete referral:', error);
    throw error;
  }
}