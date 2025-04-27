/** @jsxImportSource @emotion/react */
import { jsx } from '@emotion/react';
import React from 'react';
import { QuizContent as QuizContentType, QuizQuestion, QuizOption } from '../types/course.types';

interface QuizContentProps {
  content: QuizContentType;
  onContentChange: (content: QuizContentType) => void;
}

const QuizContent = ({ content, onContentChange }: QuizContentProps) => {
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Date.now().toString(),
      questionText: '',
      marks: 0,
      options: [],
      explanation: ''
    };

    onContentChange({
      ...content,
      questions: [...(content.questions || []), newQuestion]
    });
  };

  const addOption = (questionIndex: number) => {
    const newOption: QuizOption = {
      id: Date.now().toString(),
      text: '',
      isCorrect: false
    };

    const newQuestions = [...(content.questions || [])];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: [...(newQuestions[questionIndex].options || []), newOption]
    };

    onContentChange({
      ...content,
      questions: newQuestions
    });
  };

  const updateQuestion = (questionIndex: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...(content.questions || [])];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      [field]: value
    };

    onContentChange({
      ...content,
      questions: newQuestions
    });
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof QuizOption, value: any) => {
    const newQuestions = [...(content.questions || [])];
    newQuestions[questionIndex] = {
      ...newQuestions[questionIndex],
      options: newQuestions[questionIndex].options.map((option: QuizOption, index: number) => 
        index === optionIndex ? { ...option, [field]: value } : option
      )
    };

    onContentChange({
      ...content,
      questions: newQuestions
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-semibold text-gray-900">Quiz Questions</h4>
        <button
          onClick={addQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      </div>
      {content.questions?.map((question: QuizQuestion, questionIndex: number) => (
        <div key={question.id} className="border border-gray-200 rounded-xl p-6 bg-white">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
              <input
                type="text"
                value={question.questionText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  updateQuestion(questionIndex, 'questionText', e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter question text"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
              <input
                type="number"
                value={question.marks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                  updateQuestion(questionIndex, 'marks', parseInt(e.target.value))
                }
                className="w-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Marks"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
              <textarea
                value={question.explanation}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                  updateQuestion(questionIndex, 'explanation', e.target.value)
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter explanation for the correct answer"
                rows={3}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-sm font-semibold text-gray-900">Options</h5>
                <button
                  onClick={() => addOption(questionIndex)}
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Option
                </button>
              </div>
              <div className="space-y-2">
                {question.options?.map((option: QuizOption, optionIndex: number) => (
                  <div key={option.id} className="flex items-center gap-4">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                        updateOption(questionIndex, optionIndex, 'text', e.target.value)
                      }
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter option text"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={option.isCorrect}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                          updateOption(questionIndex, optionIndex, 'isCorrect', e.target.checked)
                        }
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Correct</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

QuizContent.displayName = 'QuizContent';

export default QuizContent; 