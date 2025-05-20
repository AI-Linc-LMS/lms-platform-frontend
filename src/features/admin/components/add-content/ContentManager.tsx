import React, { useEffect, useState } from "react";
import AddContent from "./AddContent";
import AddVideoContent from "./AddVideoContent";
import AddArticleContent from "./AddArticleContent";
import { TabKey } from "../../types/course";
import AddProblemContent from "./AddProblemContent";
import AddDevelopmentContent from "./AddDevelopmentContent";
import AddSubjectiveContent from "./AddSubjectiveContent";
import AddQuizContent from "./AddQuizContent";
const ContentManager: React.FC<{ tabKey: TabKey }> = ({ tabKey }) => {
  const [showAddNew, setShowAddNew] = useState(false);

  useEffect(() => {
    setShowAddNew(false);
  }, [tabKey]);
  
  const handleAddNew = () => {
    setShowAddNew(true);
  };

  const handleBack = () => {
    setShowAddNew(false);
  };

  if (showAddNew) {
    switch (tabKey) {
      case "videos":
        return <AddVideoContent onBack={handleBack} />;
      case "articles":
        return <AddArticleContent onBack={handleBack} />;
      case "problems":
        return <AddProblemContent onBack={handleBack} />;
      case "development":
        return <AddDevelopmentContent onBack={handleBack} />;
      case "subjective":
        return <AddSubjectiveContent onBack={handleBack} />;
      case "quiz":
        return <AddQuizContent onBack={handleBack} />;
      default:
        return null;
    }
  }

  return <AddContent tabKey={tabKey} onAddNew={handleAddNew} />;
};

export default ContentManager;
