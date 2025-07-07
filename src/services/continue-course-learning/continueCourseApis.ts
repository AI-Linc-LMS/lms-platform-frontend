import axiosInstance from "../axiosInstance";

export const getAllContinueCourseLearning = async (clientId: number) => {
    try {
        const response = await axiosInstance.get(`/api/clients/${clientId}/student/continue-learning-courses/`);
        //console.log("get all continue course learning", response);
        return response.data;
    } catch (error) {
        //console.log(error);
        throw error;
    }
};

export const getAllRecommendedCourse = async (clientId: number) => {
    try {
        const res = await axiosInstance.get(`api/clients/${clientId}/student/recommended-courses/`);
        //console.log("get recommended courses", res);
        return res.data
    } catch (error) {
        //console.log(error);
        throw error;
    }
}