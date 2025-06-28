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
    <div className="w-full mt-6 sm:mt-8 lg:mt-10 px-4 sm:px-6 lg:px-10">
      <h2 className="text-xl sm:text-2xl font-bold text-[#222] mb-4 sm:mb-6">
        Mentor Feedback
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* What You Did Well */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span role="img" aria-label="well">
              ✨
            </span>
            <span className="font-semibold text-[#2563eb] text-sm sm:text-base">
              What You Did Well:
            </span>
          </div>
          <p className="text-gray-700 text-sm sm:text-base mt-1 leading-relaxed">
            {didWell}
          </p>
        </div>

        {/* What you could have done better */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span role="img" aria-label="better">
              😊
            </span>
            <span className="font-semibold text-[#eab308] text-sm sm:text-base">
              What you could have done better
            </span>
          </div>
          <p className="text-gray-700 text-sm sm:text-base mt-1 leading-relaxed">
            {couldDoBetter}
          </p>
        </div>

        {/* Suggestions for you */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 p-4 sm:p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-[#222] text-sm sm:text-base">
              Suggestions for you
            </span>
          </div>
          <ul className="list-disc pl-4 sm:pl-5 text-gray-700 text-sm sm:text-base mt-1 space-y-1 sm:space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MentorFeedbackSection;
