import { Note, SummaryResponse, QuizQuestion, ProgressAnalysis, LessonDrill, QuizDifficulty, QuizResult } from "../types";

const MODEL = 'openai/gpt-oss-20b';

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  
  const response = await fetch("/api/ai", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    systemPrompt,
    userPrompt,
  }),
});

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Backend API error: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Error generating response";
}

function cleanJSON(raw: string): string {
  return raw.replace(/```json|```/g, '').trim();
}

export const summarizeNote = async (note: Note): Promise<SummaryResponse> => {
  const system = `You are a study assistant. Respond with valid JSON only — no markdown, no explanation.`;
  const user = `Summarize this educational content. Use LaTeX for all math ($...$ inline, $$...$$ for blocks).
Return ONLY this JSON:
{
  "summary": "2-3 sentence summary",
  "keyTakeaways": ["point 1", "point 2", "point 3"]
}

Content:
${note.content.slice(0, 3000)}`;

  try {
    const raw = await callAI(system, user);
    return JSON.parse(cleanJSON(raw));
  } catch (e) {
    return { summary: "Failed to generate summary.", keyTakeaways: [] };
  }
};

export const generateQuiz = async (notes: Note[], count: number, difficulty: QuizDifficulty): Promise<QuizQuestion[]> => {
  const context = notes.map(n => n.content).join('\n\n').slice(0, 5000);

  const difficultyPrompts = {
    'Easy': 'focus on basic ideas and clear definitions.',
    'Medium': 'normal questions testing understanding and typical problem-solving.',
    'Hard': 'challenging questions that need more thinking and multi-step reasoning.',
    'Expert': 'very difficult questions for experts to test absolute mastery.'
  };

  const system = `You are a professional academic examiner. Respond with valid JSON only — no markdown, no explanation.`;
  const user = `Create EXACTLY ${count} multiple choice questions. Difficulty: ${difficulty} — ${difficultyPrompts[difficulty]}
Use LaTeX for ALL mathematical symbols, variables, formulas (e.g. $x$, $\\frac{a}{b}$).

Return ONLY a JSON array:
[
  {
    "question": "question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 0,
    "explanation": "why this is correct",
    "conceptTag": "specific concept tested"
  }
]

Notes:
${context}`;

  try {
    const raw = await callAI(system, user);
    const result = JSON.parse(cleanJSON(raw));
    return Array.isArray(result) ? result.slice(0, count) : [];
  } catch (e) {
    console.error("Quiz generation failed", e);
    return [];
  }
};

export const analyzeProgress = async (notes: Note[], quizHistory: QuizResult[]): Promise<ProgressAnalysis> => {
  const context = notes.map(n => `Topic: ${n.name}\nContent: ${n.content.slice(0, 1000)}`).join('\n\n');
  const historyContext = quizHistory.map(h => `Quiz Result: ${h.score}/${h.total} on ${new Date(h.timestamp).toLocaleDateString()}`).join('\n');

  const system = `You are a learning analytics engine. Respond with valid JSON only — no markdown, no explanation.`;
  const user = `Perform a detailed study progress analysis.

Notes:
${context}

Quiz History:
${historyContext || 'No quizzes taken yet.'}

Return ONLY this JSON:
{
  "overallMastery": 0,
  "studyTimeEstimate": "2 hours",
  "streakCount": 0,
  "level": 1,
  "experiencePoints": 0,
  "weaknessPatterns": ["pattern1"],
  "nextBestAction": {
    "title": "action title",
    "description": "description",
    "impact": "High Impact",
    "type": "quiz",
    "topic": "topic",
    "subject": "subject"
  },
  "prediction": {
    "currentLevel": 0,
    "predictedScore": 0,
    "potentialScore": 0,
    "timeframeDays": 7
  },
  "studentType": {
    "label": "label",
    "analysis": "analysis"
  },
  "actionPlan": [
    { "day": 1, "tasks": ["task1", "task2"] }
  ],
  "learningInsights": ["insight1"],
  "rankedWeaknesses": [
    { "topic": "topic", "priority": "High", "reason": "reason" }
  ],
  "subjects": [
    {
      "name": "subject name",
      "strength": ["topic1"],
      "weakness": ["topic2"],
      "masteryScore": 0,
      "completionPercentage": 0,
      "highYieldTopics": ["topic1"]
    }
  ]
}`;

  try {
    const raw = await callAI(system, user);
    return JSON.parse(cleanJSON(raw));
  } catch (e) {
    return {
      overallMastery: 0,
      studyTimeEstimate: "0h",
      streakCount: 0,
      level: 1,
      experiencePoints: 0,
      weaknessPatterns: [],
      nextBestAction: {
        title: "Take your first quiz",
        description: "Complete a quiz to start your progress analysis.",
        impact: "High Impact",
        type: 'quiz',
        topic: "General",
        subject: "General"
      },
      prediction: { currentLevel: 0, predictedScore: 0, potentialScore: 0, timeframeDays: 7 },
      studentType: { label: "New Learner", analysis: "Start taking quizzes to identify your learning style." },
      actionPlan: [{ day: 1, tasks: ["Review your notes", "Take a 5-question quiz"] }],
      learningInsights: ["No data yet"],
      rankedWeaknesses: [],
      subjects: []
    };
  }
};

export const generateLessonDrill = async (topic: string, subject: string, notes: Note[]): Promise<LessonDrill> => {
  const context = notes.map(n => n.content).join('\n\n').slice(0, 4000);

  const system = `You are an expert tutor. Respond with valid JSON only — no markdown, no explanation.`;
  const user = `Create an exam-focused lesson drill for "${topic}" (${subject}).
Use LaTeX ($...$ or $$...$$) for ALL mathematical/scientific notation.

Return ONLY this JSON:
{
  "conceptExplanation": "explanation",
  "exampleProblem": "problem",
  "exampleSolution": "solution",
  "practiceQuestion": "question",
  "practiceAnswer": "answer",
  "practiceExplanation": "explanation",
  "examTips": ["tip1", "tip2"],
  "interactiveCheck": "quick question for the student"
}

Context:
${context}`;

  try {
    const raw = await callAI(system, user);
    return JSON.parse(cleanJSON(raw));
  } catch (e) {
    throw new Error("Failed to generate lesson drill");
  }
};

export const answerQuestion = async (
  question: string,
  notes: Note[],
  chatHistory: { role: 'user' | 'assistant', content: string }[]
): Promise<{ text: string; sources: { uri: string; title: string }[] }> => {
  const context = notes.map(n => `--- Document: ${n.name} ---\n${n.content.slice(0, 1500)}`).join('\n\n');

  const recentHistory = chatHistory
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const system = `You are "Left Brain", a helpful study assistant. Always use LaTeX for math ($...$ inline, $$...$$ for blocks).

CONTEXT FROM DOCUMENTS:
${context}`;

  const user = `${recentHistory ? `Recent conversation:\n${recentHistory}\n\n` : ''}Question: ${question}`;

  const text = await callAI(system, user);
  return { text, sources: [] };
};
