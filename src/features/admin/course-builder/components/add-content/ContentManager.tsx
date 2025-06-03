import React, { useEffect, useState } from "react";
import AddContent from "./AddContent";
import AddVideoContent from "./AddVideoContent";
import AddArticleContent from "./AddArticleContent";
import { TabKey } from "../../types/course";
import AddProblemContent from "./AddProblemContent";
import AddDevelopmentContent from "./AddDevelopmentContent";
import AddSubjectiveContent from "./AddSubjectiveContent";
import AddQuizContent from "./AddQuizContent";
import { useMutation } from "@tanstack/react-query";
import { ContentData } from "../../../../../services/admin/courseApis";
import { addSubmoduleContent } from "../../../../../services/admin/courseApis";
import { ContentIdType } from "../../../../../services/admin/contentApis";

const contentIdFieldMap: Record<TabKey, ContentIdType | undefined> = {
  videos: "video_content",
  articles: "article_content",
  problems: "coding_problem_content",
  quizzes: "quiz_content",
  subjective: "assignment_content",
  development: undefined, // No contentId field for development
};

const contentTypeMap: Record<TabKey, string> = {
  videos: "VideoTutorial",
  articles: "Article",
  problems: "CodingProblem",
  quizzes: "Quiz",
  subjective: "Assignment",
  development: "Development",
};

const ContentManager: React.FC<{
  tabKey: TabKey;
  courseId: number;
  submoduleId: number;
}> = ({ tabKey, courseId, submoduleId }) => {
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const [showAddNew, setShowAddNew] = useState(false);
  const [autoTriggerSave, setAutoTriggerSave] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<number | null>(
    null
  );
  const [selectedContent, setSelectedContent] = useState<{
    id: number;
    title: string;
  } | null>(null);

  const uploadMutation = useMutation({
    mutationFn: (data: ContentData) =>
      addSubmoduleContent(clientId, courseId, submoduleId, data),
    onSuccess: () => {
      alert("Content saved!");
      setShowAddNew(false);
    },
    onError: (error: Error) => {
      alert(error.message || "Failed to save content");
    },
  });

  useEffect(() => {
    setShowAddNew(false);
  }, [tabKey]);

  // Helper to get the correct contentId field name
  const getContentIdField = (tabKey: TabKey) => contentIdFieldMap[tabKey];

  const handleSave = () => {
    const contentIdField = getContentIdField(tabKey);
    const body: Record<string, unknown> = {
      title: selectedContent?.title,
      content_type: contentTypeMap[tabKey],
    };
    if (contentIdField) {
      body[contentIdField] = selectedContentId;
    }
    console.log("body", body);
    uploadMutation.mutate(body as unknown as ContentData);
  };

  const handleAddNew = () => {
    setShowAddNew(true);
  };

  const handleBack = () => {
    setShowAddNew(false);
  };

  const handleContentSelect = (content: { id: number; title: string }) => {
    console.log("content", content);
    setSelectedContentId(content.id);
    setSelectedContent(content);
    setAutoTriggerSave(true);
  };

  useEffect(() => {
    if (autoTriggerSave) {
      handleSave();
      setAutoTriggerSave(false); // Reset the trigger
    }
  }, [autoTriggerSave]);

  if (showAddNew) {
    switch (tabKey) {
      case "videos":
        return <AddVideoContent onBack={handleBack} clientId={clientId} />;
      case "articles":
        return <AddArticleContent onBack={handleBack} clientId={clientId} />;
      case "problems":
        return <AddProblemContent onBack={handleBack} clientId={clientId} />;
      case "development":
        return <AddDevelopmentContent onBack={handleBack} />;
      case "subjective":
        return <AddSubjectiveContent onBack={handleBack} clientId={clientId} />;
      case "quizzes":
        return <AddQuizContent onBack={handleBack} clientId={clientId} />;
      default:
        return null;
    }
  }

  return (
    <AddContent
      tabKey={tabKey}
      onAddNew={handleAddNew}
      clientId={clientId}
      onContentSelect={handleContentSelect}
    />
  );
};

export default ContentManager;
