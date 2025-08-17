import axiosInstance from "../axiosInstance";

export const getAllContinueCourseLearning = async (clientId: number) => {
    const response = await axiosInstance.get(`/api/clients/${clientId}/student/continue-learning-courses/`);
    //console.log("get all continue course learning", response);
    return response.data;
};

export const getAllRecommendedCourse = async (clientId: number) => {
    const res = await axiosInstance.get(`api/clients/${clientId}/student/recommended-courses/`);
    //console.log("get recommended courses", res);
    return res.data;
}