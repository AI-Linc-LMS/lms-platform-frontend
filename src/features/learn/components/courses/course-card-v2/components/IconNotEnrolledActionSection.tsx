import React from "react";
import { List, FolderOpen, MessageCircle, Award } from "lucide-react";

interface ActionButton {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  onClick?: () => void;
}

interface IconActionsSectionProps {
  onContinueLearning?: () => void;
  onViewSyllabus?: () => void;
  onViewResources?: () => void;
  onViewDiscussions?: () => void;
  onViewCertificate?: () => void;
}

export const IconActionsNotEnrolledSection: React.FC<
  IconActionsSectionProps
> = ({
  onViewSyllabus,
  onViewResources,
  onViewDiscussions,
  onViewCertificate,
}) => {
  const actions: ActionButton[] = [
    {
      id: "syllabus",
      icon: List,
      tooltip: "View Syllabus",
      onClick: onViewSyllabus,
    },
    {
      id: "resources",
      icon: FolderOpen,
      tooltip: "Course Resources",
      onClick: onViewResources,
    },
    {
      id: "discussions",
      icon: MessageCircle,
      tooltip: "Discussions",
      onClick: onViewDiscussions,
    },
    {
      id: "certificate",
      icon: Award,
      tooltip: "View Certificate",
      onClick: onViewCertificate,
    },
  ];

  // Define hover colors for each action
  const getHoverClasses = (actionId: string) => {
    switch (actionId) {
      case "continue":
        return "hover:bg-green-50 hover:border-green-200 hover:text-green-600";
      case "syllabus":
        return "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600";
      case "resources":
        return "hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600";
      case "discussions":
        return "hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600";
      case "certificate":
        return "hover:bg-yellow-50 hover:border-yellow-200 hover:text-yellow-600";
      default:
        return "hover:bg-[#e2e8f0] hover:border-[#cbd5e1] hover:text-[#374151]";
    }
  };

  return (
    <div className="px-6 pb-5">
      <div className="flex justify-center gap-3 py-4 overflow-visible">
        {actions.map((action) => {
          const IconComponent = action.icon;
          const hoverClasses = getHoverClasses(action.id);

          return (
            <button
              key={action.id}
              className={`w-10 h-10 rounded-full border border-[#e2e8f0] bg-[#f8fafc] flex items-center justify-center cursor-pointer transition-all duration-200 text-[var(--font-secondary)] relative hover:-translate-y-0.5 group ${hoverClasses}`}
              onClick={action.onClick}
              aria-label={action.tooltip}
            >
              <IconComponent className="w-4 h-4" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-[#374151] text-[var(--font-light)] px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap opacity-0 invisible transition-all duration-200 z-[1000] mb-2 min-w-max text-center group-hover:opacity-100 group-hover:visible">
                {action.tooltip}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
