import { quizData } from "./data/mockQuizData";

const QuizContent = ({ onSelectQuiz, selectedQuizId }: { onSelectQuiz: (id: number) => void; selectedQuizId: number | null }) => {
  const handleQuizSelect = (id: number) => {
    onSelectQuiz(id); // Call the parent-provided function to update the quiz ID
  };

  console.log("selectedQuizId", selectedQuizId);

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">Quiz</h2>
      <p className="text-gray-500 mb-6">
        Solve real world questions and gain insight knowledge.
      </p>

      <div className="flex justify-evenly mb-6">
        {quizData.map((quiz) => (
          <button
            key={quiz.id}
            className={`px-12 py-3 rounded border text-md font-medium ${
              selectedQuizId === quiz.id
                ? "text-[#007B9F]"
                : "bg-white text-gray-800"
            }`}
            onClick={() => handleQuizSelect(quiz.id)}
          >
            {quiz.id}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizContent;