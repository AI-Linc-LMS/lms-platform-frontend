import axiosInstance from "../axiosInstance";

// Define types for activity types and sub types
export type ActivityType = 'Quiz' | 'Article' | 'Assignment' | 'CodingProblem' | 'VideoTutorial';
export type SubType = 'runCode' | 'submitCode' | 'customRunCode';

export const submitContent = async (
  clientId: number,
  courseId: number,
  contentId: number,
  activityType: ActivityType,
  data: any,
  subType?: SubType
) => {
  try {
    let url = `/activity/clients/${clientId}/courses/${courseId}/content/${contentId}/?activity_type=${activityType}`;
    
    // Only add sub_type if activity type is CodingProblem and subType is provided
    if (activityType === 'CodingProblem' && subType) {
      url += `&sub_type=${subType}`;
    }

    const res = await axiosInstance.post(url, data);
    
    console.log("submit content",res);
    return res.data;
  } catch (error: any) {
    console.error("Failed to submit content:", error);
    throw new Error(
      error?.response?.data?.detail ||
        error?.message ||
        "Failed to submit content"
    );
  }
}


