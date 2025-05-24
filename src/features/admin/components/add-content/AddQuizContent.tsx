import React, { useState } from "react";
import backIcon from "../../../../commonComponents/icons/admin/content/backIcon.png";

interface AddQuizContentProps {
    onBack: () => void;
}

interface QuizOption {
    value: string;
}

interface QuizQuestion {
    question: string;
    marks: string;
    options: QuizOption[];
    correctIndex: number | null;
    explanation: string;
}

const defaultOption = () => ({ value: "" });
const defaultQuestion = (): QuizQuestion => ({
    question: "",
    marks: "",
    options: [defaultOption(), defaultOption(), defaultOption(), defaultOption()],
    correctIndex: null,
    explanation: "",
});

const AddQuizContent: React.FC<AddQuizContentProps> = ({ onBack }) => {
    const [title, setTitle] = useState("");
    const [questions, setQuestions] = useState<QuizQuestion[]>([defaultQuestion()]);
    const [activeIndex, setActiveIndex] = useState(0);

    const isQuestionValid = (question: QuizQuestion) => {
        return (
            question.question.trim() !== "" &&
            question.marks.trim() !== "" &&
            question.options.every(opt => opt.value.trim() !== "") &&
            question.correctIndex !== null &&
            question.explanation.trim() !== ""
        );
    };
    

    const handleAddQuestion = () => {
        const currentQuestion = questions[activeIndex];
    
        if (!isQuestionValid(currentQuestion)) {
            alert("Please complete the current question before adding a new one.");
            return;
        }
    
        setQuestions([...questions, defaultQuestion()]);
        setActiveIndex(questions.length);
    };
    

    const handleQuestionChange = (idx: number, field: keyof QuizQuestion, value: any) => {
        setQuestions(qs =>
            qs.map((q, i) =>
                i === idx ? { ...q, [field]: value } : q
            )
        );
    };

    const handleOptionChange = (qIdx: number, optIdx: number, value: string) => {
        setQuestions(qs =>
            qs.map((q, i) =>
                i === qIdx
                    ? { ...q, options: q.options.map((opt, j) => (j === optIdx ? { value } : opt)) }
                    : q
            )
        );
    };

    const handleCorrectChange = (qIdx: number, optIdx: number) => {
        setQuestions(qs =>
            qs.map((q, i) =>
                i === qIdx ? { ...q, correctIndex: optIdx } : q
            )
        );
    };

    const handleSave = () => {
        // Save logic here
        console.log({ title, questions });
        alert("Quiz content saved!");
    };

    const activeQuestion = questions[activeIndex];

    return (
        <div className="w-full">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="text-sm font-medium mb-2 flex items-center"
            >
                <img src={backIcon} alt="Back" className="w-3 h-2 mr-2" />
                Back to Content Library
            </button>

            {/* Quiz Title */}
            <div className="border border-gray-300 rounded-lg p-1 px-4 space-y-4">
                <div className="mb-2">
                    <label className="text-sm font-medium text-gray-700">Quiz Title</label>
                    <input
                        type="text"
                        placeholder="Enter title here"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                    />
                </div>

                <div className="flex items-center justify-center gap-2">
                    <hr className="w-full border-dashed border-gray-300" />
                    <span className="text-gray-500 text-sm">Quiz</span>
                    <hr className="w-full border-dashed border-gray-300" />
                </div>

                {/* Add Quiz Section */}
                <div className="rounded-lg p-2 px-4 flex flex-col md:flex-row gap-6">
                    {/* Left: Question List */}
                    <div className="w-full md:w-1/4">
                        <div className="mb-2 font-medium">Add Quiz</div>
                        <div className="flex flex-wrap gap-2">
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    className={`w-15 h-10 rounded bg-white border ${activeIndex === idx ? 'border-[#255C79] text-[#255C79] font-bold' : 'border-gray-300 text-gray-700'} flex items-center justify-center`}
                                    onClick={() => setActiveIndex(idx)}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            className="mt-4 px-3 py-1 border border-[#255C79] text-[#255C79] rounded flex items-center gap-1 text-sm hover:bg-[#255C79] hover:text-white"
                            onClick={handleAddQuestion}
                        >
                            + Add Question
                        </button>
                    </div>
                    {/* Right: Question Form */}
                    <div className="flex-1">
                        <div className="flex gap-4 mb-1">
                            <div className="flex-1">
                                <label className="text-sm font-medium text-gray-700">Question</label>
                                <input
                                    type="text"
                                    placeholder="Enter Question"
                                    value={activeQuestion.question}
                                    onChange={e => handleQuestionChange(activeIndex, 'question', e.target.value)}
                                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs font-medium text-gray-700">Marks</label>
                                <input
                                    type="number"
                                    placeholder="Enter Marks"
                                    value={activeQuestion.marks}
                                    onChange={e => handleQuestionChange(activeIndex, 'marks', e.target.value)}
                                    className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                />
                            </div>
                        </div>
                        <div className="gap-2">
                            <label className="text-sm font-medium text-gray-700">Enter Options & Choose the Correct one</label>

                            {/* Grid with 2 columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                {activeQuestion.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correctOption-${activeIndex}`}
                                            checked={activeQuestion.correctIndex === optIdx}
                                            onChange={() => handleCorrectChange(activeIndex, optIdx)}
                                        />
                                        <input
                                            type="text"
                                            placeholder={`Option ${optIdx + 1}`}
                                            value={opt.value}
                                            onChange={e => handleOptionChange(activeIndex, optIdx, e.target.value)}
                                            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mb-2">
                            <label className="text-sm font-medium text-gray-700">Answer Explanation</label>
                            <textarea
                                placeholder="Enter the explanation for the answer here..."
                                value={activeQuestion.explanation}
                                onChange={e => handleQuestionChange(activeIndex, 'explanation', e.target.value)}
                                className="w-full mt-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                rows={3}
                            />
                        </div>
                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-[#255C79] text-white rounded-xl transition"
                            >
                                Save Content
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddQuizContent; 