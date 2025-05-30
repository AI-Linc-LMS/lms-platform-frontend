import React from "react";

export interface DevelopmentProject {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  completionPercentage: number;
}

interface DevelopmentContentProps {
  projects: DevelopmentProject[];
  selectedProjectId?: string;
  onProjectSelect: (id: string) => void;
}

const DevelopmentContent: React.FC<DevelopmentContentProps> = ({
  projects,
  selectedProjectId,
  onProjectSelect,
}) => {
  const renderDifficulty = (difficulty: string) => {
    let color;
    switch (difficulty.toLowerCase()) {
      case "easy":
        color = "text-green-600";
        break;
      case "medium":
        color = "text-yellow-600";
        break;
      case "hard":
        color = "text-red-600";
        break;
      default:
        color = "text-gray-600";
    }
    return <span className={`${color} font-medium`}>{difficulty}</span>;
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        Development Projects ({projects.length})
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Practical coding projects with live development environments
      </p>

      <div className="flex flex-col gap-3">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => onProjectSelect(project.id)}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedProjectId === project.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-base font-medium text-gray-800">
                {project.title}
              </h3>
              <div className="flex items-center gap-2">
                <div className="text-xs px-2 py-1 rounded-full bg-gray-100">
                  {renderDifficulty(project.difficulty)}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {project.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="w-full max-w-[200px]">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{project.completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${project.completionPercentage}%` }}
                  ></div>
                </div>
              </div>
                <button 
                className="h-[30px] ml-4 px-3 py-1 text-xs bg-[#255C79] hover:bg-[#344b5a] text-white rounded-md transition transform hover:scale-105 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onProjectSelect(project.id);
                }}
                >
                {selectedProjectId === project.id ? 'Continue' : 'Start'}
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevelopmentContent; 