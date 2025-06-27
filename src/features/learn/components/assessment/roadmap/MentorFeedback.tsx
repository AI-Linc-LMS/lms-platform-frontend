interface MentorFeedbackSectionProps {
  didWell: string;
  couldDoBetter: string;
  suggestions: string[];
}

const MentorFeedbackSection: React.FC<MentorFeedbackSectionProps> = ({
  didWell,
  couldDoBetter,
  suggestions,
}) => {
  return (
    <div className="w-full mt-10 px-10">
      <h2 className="text-2xl font-bold text-[#222] mb-6">Mentor Feedback</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* What You Did Well */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span role="img" aria-label="well">
              ✨
            </span>
            <span className="font-semibold text-[#2563eb]">
              What You Did Well:
            </span>
          </div>
          <p className="text-gray-700 text-base mt-1">{didWell}</p>
        </div>
        {/* What you could have done better */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span role="img" aria-label="better">
              😊
            </span>
            <span className="font-semibold text-[#eab308]">
              What you could have done better
            </span>
          </div>
          <p className="text-gray-700 text-base mt-1">{couldDoBetter}</p>
        </div>
        {/* Suggestions for you */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[#222]">
              Suggestions for you
            </span>
          </div>
          <ul className="list-disc pl-5 text-gray-700 text-base mt-1 space-y-2">
            {suggestions.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MentorFeedbackSection;
