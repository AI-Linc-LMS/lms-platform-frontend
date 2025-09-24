import subjectiveicon from "../../../../assets/course_sidebar_assets/subjective/subjectiveicon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

export interface AssignmentItem {
  id: number;
  title: string;
  content_type: string;
  duration_in_minutes: number;
  order: number;
  status: string;
}

interface SubjectiveContentProps {
  assignments: AssignmentItem[];
  onAssignmentClick?: (id: number) => void;
  selectedAssignmentId: number;
}

const SubjectiveContent = ({
  assignments,
  onAssignmentClick,
  selectedAssignmentId,
}: SubjectiveContentProps) => {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        Assignments ({assignments.length})
      </h2>
      <p className="text-[15px] text-gray-500 mb-4">
        Complete these assignments to test your understanding and earn marks.
      </p>

      <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden">
        {assignments.map((item, idx) => {
          const isSelected = selectedAssignmentId === item.id;
          const isLastItem = idx === assignments.length - 1;

          return (
            <div
              key={item.id}
              onClick={() => onAssignmentClick?.(item.id)}
              className={`cursor-pointer p-4 flex justify-between items-start transition ${
                isSelected ? "bg-blue-50 border-blue-300" : "hover:shadow"
              } ${!isLastItem ? "border-b border-gray-300" : ""}`}
            >
              <div className="flex items-start gap-3 flex-1">
                <img src={subjectiveicon} alt="icon" className="w-5 h-5 mt-1" />
                <div className="flex-1">
                  <h3
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-[var(--secondary-400)]"
                        : "text-gray-800"
                    } mb-1`}
                  >
                    {item.title}
                  </h3>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>Duration: {item.duration_in_minutes} minutes</p>
                  </div>
                </div>
              </div>

              <div className="w-5 h-5 ml-4">
                <img
                  src={item.status === "complete" ? completeTickIcon : tickIcon}
                  alt={item.status === "complete" ? "Completed" : "Incomplete"}
                  className="w-full h-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectiveContent;
