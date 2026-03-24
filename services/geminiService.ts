import { Note, SummaryResponse, QuizQuestion, ProgressAnalysis, LessonDrill, QuizDifficulty, QuizResult } from "../types";

function cleanJSON(raw: string): string {
  return raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\n/g, " ")
    .trim();
}

// 🔥 SINGLE SOURCE OF TRUTH



async function callAI(systemPrompt: string, userPrompt: string): Promise<any> {
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
    console.error("API ERROR:", err);
    throw new Error(err);
  }

  const data = await response.json();

  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    console.error("NO CONTENT:", data);
    throw new Error("No content");
  }

  // 🔥 THIS IS THE IMPORTANT PART
  if (typeof content === "object") {
    return content;
  }

  try {
    return JSON.parse(
      content
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()
    );
  } catch (e) {
    console.error("FINAL PARSE FAILED:", content);
    throw new Error("Invalid JSON");
  }
}

// ================= FUNCTIONS =================

export const summarizeNote = async (note: Note): Promise<SummaryResponse> => {
  const system = `You are a study assistant. Respond with valid JSON only — no markdown.`;
  const user = `Summarize this content.

Return JSON:
{
  "summary": "text",
  "keyTakeaways": ["point1"]
}

${note.content.slice(0, 3000)}`;

  try {
    return await callAI(system, user);
  } catch {
    return { summary: "Failed to generate summary.", keyTakeaways: [] };
  }
};

export const generateQuiz = async (
  notes: Note[],
  count: number,
  difficulty: QuizDifficulty
): Promise<QuizQuestion[]> => {
  const context = notes.map(n => n.content).join("\n\n").slice(0, 5000);

  const system = `You are an examiner. JSON only.`;
  const user = `
Create ${count} MCQs.

Return JSON ARRAY.

${context}
`;
  try {
    const result = await callAI(system, user);
    if (!Array.isArray(result)) return [];

return result.slice(0, count).map((q: any) => {
  let options: string[] = [];

  if (Array.isArray(q.options)) {
    options = q.options.map((opt: any) => {
      if (typeof opt === "string") return opt;
      if (opt?.text) return opt.text;
      return "";
    }).filter(Boolean);
  }

  // fallback if AI gives A,B,C,D instead
  if (options.length === 0 && q.A && q.B && q.C && q.D) {
    options = [q.A, q.B, q.C, q.D];
  }

  // last fallback (prevents blank UI)
  if (options.length === 0) {
    console.error("BROKEN QUESTION:", q);
    options = ["Option A", "Option B", "Option C", "Option D"];
  }

  const correctIndex =
    typeof q.answer === "string"
      ? ["A", "B", "C", "D"].indexOf(q.answer)
      : q.correctAnswer ?? 0;

  return {
    question: q.question || "Invalid question",
    options,
    correctAnswer: correctIndex >= 0 ? correctIndex : 0,
    explanation: q.explanation || "",
    conceptTag: q.conceptTag || "General",
  };
});
} catch {
    return [];
  };
};

export const analyzeProgress = async (
  notes: Note[],
  quizHistory: QuizResult[]
): Promise<ProgressAnalysis> => {
  const system = `Analyze learning. JSON only.`;
  const user = `Notes + history analysis`;

  try {
  const data = await callAI(system, user);

  return {
    overallMastery: data.overallMastery ?? 0,
    studyTimeEstimate: data.studyTimeEstimate ?? "0h",
    streakCount: data.streakCount ?? 0,
    level: data.level ?? 1,
    experiencePoints: data.experiencePoints ?? 0,
    weaknessPatterns: data.weaknessPatterns ?? [],
    nextBestAction: data.nextBestAction ?? {
      title: "Start",
      description: "Take a quiz",
      impact: "High Impact",
      type: "quiz",
      topic: "General",
      subject: "General"
    },
    prediction: data.prediction ?? {
      currentLevel: 0,
      predictedScore: 0,
      potentialScore: 0,
      timeframeDays: 7
    },
    studentType: data.studentType ?? {
      label: "Beginner",
      analysis: "Start learning"
    },
    actionPlan: data.actionPlan ?? [],
    learningInsights: data.learningInsights ?? [],
    rankedWeaknesses: data.rankedWeaknesses ?? [],
    subjects: data.subjects ?? []
  };
} catch (e) {
  return {
    overallMastery: 0,
    studyTimeEstimate: "0h",
    streakCount: 0,
    level: 1,
    experiencePoints: 0,
    weaknessPatterns: [],
    nextBestAction: {
      title: "Start",
      description: "Take a quiz",
      impact: "High Impact",
      type: "quiz",
      topic: "General",
      subject: "General"
    },
    prediction: { currentLevel: 0, predictedScore: 0, potentialScore: 0, timeframeDays: 7 },
    studentType: { label: "Beginner", analysis: "Start learning" },
    actionPlan: [],
    learningInsights: [],
    rankedWeaknesses: [],
    subjects: []
  };
}
};

export const generateLessonDrill = async (
  topic: string,
  subject: string,
  notes: Note[]
): Promise<LessonDrill> => {
  const system = `Teach topic. JSON only.`;
  const user = `${topic} ${subject}`;

  try {
  const data = await callAI(system, user);

  return {
    conceptExplanation: data.conceptExplanation || "",
    exampleProblem: data.exampleProblem || "",
    exampleSolution: data.exampleSolution || "",
    practiceQuestion: data.practiceQuestion || "",
    practiceAnswer: data.practiceAnswer || "",
    practiceExplanation: data.practiceExplanation || "",
    examTips: data.examTips || [],
    interactiveCheck: data.interactiveCheck || "",
  };
} catch {
  return {
    conceptExplanation: "Failed to load lesson.",
    exampleProblem: "",
    exampleSolution: "",
    practiceQuestion: "",
    practiceAnswer: "",
    practiceExplanation: "",
    examTips: [],
    interactiveCheck: "",
  };
}
};

export const answerQuestion = async (
  question: string,
  notes: Note[],
  chatHistory: { role: "user" | "assistant"; content: string }[]
): Promise<{ text: string; sources: { uri: string; title: string }[] }> => {
  const system = `Helpful assistant.`;
  const user = question;

  const result = await callAI(system, user);

const text =
  typeof result === "string"
    ? result
    : JSON.stringify(result);

  return { text, sources: [] };
};