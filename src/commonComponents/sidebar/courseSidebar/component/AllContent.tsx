import articleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import videosIcon from "../../../../assets/course_sidebar_assets/video/vidoesIcon.png";
import problemIcon from "../../../../assets/course_sidebar_assets/problem/problemIcon.png";
import quizIcon from "../../../../assets/course_sidebar_assets/quiz/defaultQuizIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

type ContentType = "article" | "video" | "problem" | "quiz";

export interface ContentItem {
  title: string;
  marks: number;
  duration?: string;
  idealTime?: string;
  questions?: number;
  difficulty?: number;
  type: ContentType;
  completed?: boolean;
}

interface AllContentProps {
  contents: ContentItem[];
}

const AllContent = ({ contents }: AllContentProps) => {
  const getIconByType = (type: string) => {
    switch (type) {
      case "article":
        return articleIcon;
      case "video":
        return videosIcon;
      case "problem":
        return problemIcon;
      case "quiz":
        return quizIcon;
      default:
        return articleIcon;
    }
  };

  const renderDifficulty = (level: number = 0) => {
    return (
      <div className="flex gap-1 items-center">
        <span className="text-sm text-gray-500">Difficulty:</span>
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${
              i < level ? "bg-[#00AEEF]" : "bg-[#E0F3FB]"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        All ({contents.length})
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        A comprehensive detailed studies curated by our top mentors only for you.
      </p>

      <div className="flex flex-col gap-2">
        {contents.map((item, idx) => (
          <div
            key={idx}
            className="border border-gray-300 rounded-lg p-2 flex justify-between items-center hover:shadow transition"
          >
            <div className="flex items-start gap-3">
              <img
                src={getIconByType(item.type)}
                alt={item.type}
                className="w-6 h-6 mt-1"
              />
              <div>
                <h3 className="text-sm font-medium text-gray-800 mb-1">
                  {item.title}
                </h3>
                <div className="text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                  <span>{item.marks} Marks</span>

                  {item.duration && (
                    <>
                      <span>|</span>
                      <span>Duration: {item.duration}</span>
                    </>
                  )}

                  {item.idealTime && (
                    <>
                      <span>|</span>
                      <span>Ideal time - {item.idealTime}</span>
                    </>
                  )}

                  {item.questions && (
                    <>
                      <span>|</span>
                      <span>{item.questions} Questions</span>
                    </>
                  )}

                  {typeof item.difficulty === "number" && (
                    <>
                      <span>|</span>
                      {renderDifficulty(item.difficulty)}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-5 h-5">
              <img
                src={item.completed ? completeTickIcon : tickIcon}
                alt={item.completed ? "Completed" : "Pending"}
                className="w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllContent;
