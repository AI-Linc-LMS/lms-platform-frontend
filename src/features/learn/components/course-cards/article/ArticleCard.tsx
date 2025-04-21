interface ArticleCardProps {
  title: string;
  content: string;
  marks: number;
  onMarkComplete?: () => void;
  completed?: boolean;
}

const ArticleCard = ({
  title,
  content,
  marks,
  onMarkComplete,
  completed,
}: ArticleCardProps) => {
  return (
    <div className="flex flex-col bg-white shadow-lg p-3 rounded-lg space-y-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-start border-b border-gray-200 py-2 mb-5">
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
        <span className="text-sm px-3 py-1 text-[#264D64] bg-[#EFF9FC] rounded-md ">
          {marks} marks
        </span>
      </div>

      <div
        className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <div className="flex justify-end mt-4">
        {!completed ? (
          <button
            onClick={onMarkComplete}
            className="px-4 py-2 text-white bg-[#12293A] rounded-md hover:bg-[#1e4a61] transition"
          >
            Mark as Completed
          </button>
        ) : (
          <p className="text-green-600 font-medium">✓ Completed</p>
        )}
      </div>
    </div>
  );
};

export default ArticleCard;
