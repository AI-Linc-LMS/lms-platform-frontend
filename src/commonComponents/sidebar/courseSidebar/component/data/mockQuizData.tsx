export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  marks: number;
}

export interface Quiz {
  id: number;
  title: string;
  marks: number;
  submissions: number;
  questions: QuizQuestion[];
}

export const quizData: Quiz[] = [
  {
    id: 1,
    title: "Introduction to Machine Learning",
    marks: 10,
    submissions: 7234,
    questions: [
      {
        id: 101,
        question: "What is machine learning?",
        options: [
          "A. A programming language",
          "B. A method to teach machines using data",
          "C. A computer virus",
          "D. A type of hardware",
        ],
        correctAnswer: 1,
        explanation: "Machine learning is a method of data analysis that automates analytical model building.",
        marks: 2,
      },
      {
        id: 102,
        question: "What is supervised learning?",
        options: [
          "A. Learning without labels",
          "B. Learning with labeled data",
          "C. Learning with reinforcement",
          "D. Unstructured learning",
        ],
        correctAnswer: 1,
        explanation: "Supervised learning uses labeled datasets to train models.",
        marks: 3,
      },
      {
        id: 103,
        question: "Which algorithm is used for classification problems?",
        options: [
          "A. Linear Regression",
          "B. K-Means Clustering",
          "C. Logistic Regression",
          "D. Apriori",
        ],
        correctAnswer: 2,
        explanation: "Logistic Regression is used for binary and multi-class classification problems.",
        marks: 2,
      },
    ],
  },
  {
    id: 2,
    title: "Supervised Learning Algorithms",
    marks: 15,
    submissions: 5678,
    questions: [
      {
        id: 201,
        question: "Which metric is best for classification accuracy?",
        options: ["A. MAE", "B. RMSE", "C. F1 Score", "D. SSE"],
        correctAnswer: 2,
        explanation: "F1 Score balances precision and recall for classification tasks.",
        marks: 5,
      },
      {
        id: 202,
        question: "Decision Trees are prone to:",
        options: ["A. Underfitting", "B. Noise removal", "C. Overfitting", "D. Gradient vanishing"],
        correctAnswer: 2,
        explanation: "Decision trees can overfit if not pruned properly.",
        marks: 5,
      },
      {
        id: 203,
        question: "What does ROC curve represent?",
        options: [
          "A. Regression error",
          "B. Classification accuracy",
          "C. True Positive vs False Positive Rate",
          "D. Variance",
        ],
        correctAnswer: 2,
        explanation: "ROC curve shows the trade-off between sensitivity and specificity.",
        marks: 5,
      },
    ],
  },
  {
    id: 3,
    title: "Neural Networks Fundamentals",
    marks: 20,
    submissions: 3456,
    questions: [
      {
        id: 301,
        question: "What is a perceptron?",
        options: [
          "A. A neural network layer",
          "B. A single-layer neural unit",
          "C. A clustering method",
          "D. A loss function",
        ],
        correctAnswer: 1,
        explanation: "A perceptron is the basic unit of a neural network.",
        marks: 4,
      },
      {
        id: 302,
        question: "Which activation function is commonly used in hidden layers?",
        options: ["A. Sigmoid", "B. ReLU", "C. Softmax", "D. Tanh"],
        correctAnswer: 1,
        explanation: "ReLU is efficient and works well for most deep networks.",
        marks: 6,
      },
      {
        id: 303,
        question: "Backpropagation is used for:",
        options: [
          "A. Forward pass",
          "B. Model evaluation",
          "C. Updating weights",
          "D. Splitting data",
        ],
        correctAnswer: 2,
        explanation: "Backpropagation helps in updating model weights by calculating gradients.",
        marks: 10,
      },
    ],
  },
  {
    id: 4,
    title: "Model Evaluation Techniques",
    marks: 12,
    submissions: 4321,
    questions: [
      {
        id: 401,
        question: "Which metric is NOT used for model evaluation?",
        options: ["A. Accuracy", "B. Recall", "C. Entropy", "D. Precision"],
        correctAnswer: 2,
        explanation: "Entropy is used in decision trees for splitting, not direct evaluation.",
        marks: 4,
      },
      {
        id: 402,
        question: "What does cross-validation help with?",
        options: [
          "A. Faster training",
          "B. Hyperparameter tuning",
          "C. Reducing overfitting",
          "D. Better visualization",
        ],
        correctAnswer: 2,
        explanation: "Cross-validation helps test model robustness and reduce overfitting.",
        marks: 4,
      },
      {
        id: 403,
        question: "Confusion matrix evaluates:",
        options: ["A. Regression models", "B. Classification models", "C. Clustering", "D. PCA"],
        correctAnswer: 1,
        explanation: "Confusion matrix is used in classification to evaluate predictions.",
        marks: 4,
      },
    ],
  },
  {
    id: 5,
    title: "Deep Learning Applications",
    marks: 18,
    submissions: 2890,
    questions: [
      {
        id: 501,
        question: "CNN is mainly used for:",
        options: [
          "A. Time-series forecasting",
          "B. Image processing",
          "C. Clustering",
          "D. Dimensionality reduction",
        ],
        correctAnswer: 1,
        explanation: "Convolutional Neural Networks (CNNs) are best for images.",
        marks: 6,
      },
      {
        id: 502,
        question: "Which of these is used to prevent overfitting in deep learning?",
        options: ["A. Dropout", "B. ReLU", "C. Learning rate", "D. SGD"],
        correctAnswer: 0,
        explanation: "Dropout randomly deactivates neurons during training to reduce overfitting.",
        marks: 6,
      },
      {
        id: 503,
        question: "What is the function of pooling layers in CNN?",
        options: [
          "A. Increase image size",
          "B. Reduce dimensionality",
          "C. Activate neurons",
          "D. Improve accuracy",
        ],
        correctAnswer: 1,
        explanation: "Pooling layers downsample the image, reducing its dimensions.",
        marks: 6,
      },
    ],
  },
];
