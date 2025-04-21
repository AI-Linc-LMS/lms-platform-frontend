export interface ContentQuizItem {
  type: string; 
  content: QuizQuestion; 
}


export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

export const quizData: QuizQuestion[] = [
  {
    id: 1,
    question: "What is machine learning?",
    options: [
      "A. A programming language",
      "B. A method to teach machines using data",
      "C. A computer virus",
      "D. A type of hardware",
    ],
    correctAnswer: 1,
    explanation:
      "Machine learning is a method of data analysis that automates analytical model building.",
    marks: 1,
  },
  {
    id: 2,
    question: "Which algorithm is used for classification problems?",
    options: [
      "A. Linear Regression",
      "B. K-Means Clustering",
      "C. Logistic Regression",
      "D. Apriori",
    ],
    correctAnswer: 2,
    explanation:
      "Logistic Regression is used for binary and multi-class classification problems.",
    marks: 1,
  },
  {
    id: 3,
    question: "What is overfitting in machine learning?",
    options: [
      "A. Model performs well on new data",
      "B. Model fits training data too well but fails on test data",
      "C. Model has low accuracy on training data",
      "D. Model doesn't train at all",
    ],
    correctAnswer: 1,
    explanation:
      "Overfitting means the model learns noise and details from the training data to an extent that it negatively impacts performance on new data.",
    marks: 1,
  },
];
