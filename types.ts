
export interface Note {
  id: string;
  name: string;
  content: string;
  type: 'pdf' | 'text';
  timestamp: number;
  summary?: string;
  keyTakeaways?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  sources?: { uri: string; title: string }[];
}

export interface SummaryResponse {
  summary: string;
  keyTakeaways: string[];
}

export type QuizDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  conceptTag: string; // The specific concept this question tests
}

export interface QuizResult {
  score: number;
  total: number;
  timestamp: number;
  timeTaken: number; // Total time in seconds
  errors?: { questionIndex: number; type: 'concept' | 'careless'; conceptTag: string }[];
}

export interface LessonDrill {
  conceptExplanation: string;
  exampleProblem: string;
  exampleSolution: string;
  practiceQuestion: string;
  practiceAnswer: string;
  practiceExplanation: string;
  examTips: string[]; // Exam-focused tips
  interactiveCheck: string; // A quick interactive question
}

export interface ProgressAnalysis {
  overallMastery: number;
  studyTimeEstimate: string;
  streakCount: number;
  level: number;
  experiencePoints: number;
  weaknessPatterns: string[];
  nextBestAction?: {
    title: string;
    description: string;
    impact: string;
    type: 'quiz' | 'lesson';
    topic: string;
    subject: string;
  };
  prediction?: {
    currentLevel: number;
    predictedScore: number;
    potentialScore: number;
    timeframeDays: number;
  };
  studentType?: {
    label: string;
    analysis: string;
  };
  actionPlan?: {
    day: number;
    tasks: string[];
  }[];
  learningInsights?: string[];
  rankedWeaknesses?: {
    topic: string;
    priority: 'High' | 'Medium' | 'Low';
    reason: string;
  }[];
  subjects: {
    name: string;
    strength: string[];
    weakness: string[];
    masteryScore: number;
    completionPercentage: number;
    highYieldTopics: string[];
  }[];
}

export type PlanType = 'Basic' | 'Brain Plus+' | 'Brain Ultra';

export type AppView = 'repository' | 'quiz' | 'progress' | 'lessons';
