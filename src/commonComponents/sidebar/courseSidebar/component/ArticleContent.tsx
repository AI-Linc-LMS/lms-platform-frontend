import articleIcon from "../../../../assets/course_sidebar_assets/article/articleIcon.png";
import tickIcon from "../../../../assets/course_sidebar_assets/tickIcon.png";
import completeTickIcon from "../../../../assets/course_sidebar_assets/completeTickIcon.png";

export interface ArticleItem {
  id: number;
  title: string;
  marks: number;
  duration: number;
  status: string;
}

interface ArticleContentProps {
  articles: ArticleItem[];
  onArticleClick?: (id: number) => void;
  selectedArticleId: number;
}

const ArticleContent = ({
  articles,
  onArticleClick,
  selectedArticleId,
}: ArticleContentProps) => {
  //console.log("articles", articles);
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800">
        Articles ({articles.length})
      </h2>
      <p className="text-[15px] text-gray-500 mb-4">
        A comprehensive detailed study curated by our top mentors only for you.
      </p>

      <div className="flex flex-col border border-gray-300 rounded-lg overflow-hidden">
        {articles.map((item, idx) => {
          const isSelected = selectedArticleId === item.id;
          const isLastItem = idx === articles.length - 1;

          return (
            <div
              key={item.id}
              onClick={() => onArticleClick?.(item.id)}
              className={`cursor-pointer p-3 flex justify-between items-center transition ${
                isSelected ? "bg-blue-50 border-blue-300" : "hover:shadow"
              } ${!isLastItem ? "border-b border-gray-300" : ""}`}
            >
              <div className="flex items-start gap-3">
                <img src={articleIcon} alt="icon" className="w-5 h-5 mt-1" />
                <div>
                  <h3
                    className={`text-sm font-medium ${
                      isSelected
                        ? "text-[var(--secondary-400)]"
                        : "text-gray-800"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500">{item.marks} Marks</p>
                </div>
              </div>

              <div className="w-5 h-5">
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

export default ArticleContent;
