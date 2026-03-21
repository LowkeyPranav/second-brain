
import { GoogleGenAI, Type, GenerateContentParameters } from "@google/genai";
import { Note, SummaryResponse, QuizQuestion, ProgressAnalysis, LessonDrill, QuizDifficulty, QuizResult } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callGeminiWithRetry = async (params: GenerateContentParameters, maxRetries = 3): Promise<any> => {
  const ai = getAIClient();
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await ai.models.generateContent(params);
      return response;
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED' || error?.message?.includes('quota');
      
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 2000 + Math.random() * 1000;
        console.warn(`Gemini Rate Limit hit. Retrying in ${Math.round(waitTime)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

export const summarizeNote = async (note: Note): Promise<SummaryResponse> => {
  const response = await callGeminiWithRetry({
    model: "gemini-3-flash-preview",
    contents: `Please summarize the following educational content. 
    IMPORTANT: Use LaTeX for any mathematical equations or chemical formulas (e.g., use $...$ for inline and $$...$$ for blocks).
    
    Content:
    ${note.content}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: "A 2-3 sentence summary. Use LaTeX for math.",
          },
          keyTakeaways: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "A list of bullet points. Use LaTeX for math.",
          },
        },
        required: ["summary", "keyTakeaways"],
      },
    },
  });

  try {
    return JSON.parse(response.text || "{}") as SummaryResponse;
  } catch (error) {
    console.error("Failed to parse summary JSON", error);
    return { summary: "Failed to generate summary.", keyTakeaways: [] };
  }
};

export const generateQuiz = async (notes: Note[], count: number, difficulty: QuizDifficulty): Promise<QuizQuestion[]> => {
  const context = notes.map(n => n.content).join('\n\n');
  
  const difficultyPrompts = {
    'Easy': 'focus on basic ideas and clear definitions.',
    'Medium': 'normal questions testing understanding and typical problem-solving.',
    'Hard': 'challenging questions that need more thinking and multi-step reasoning.',
    'Expert': 'very difficult questions for experts to test absolute mastery.'
  };

  const response = await callGeminiWithRetry({
    model: "gemini-3-flash-preview",
    contents: `You are a professional academic examiner. 
    TASK: Create a ${count}-question multiple choice quiz based on the provided notes. 
    STRICT REQUIREMENT: You MUST create EXACTLY ${count} questions.
    DIFFICULTY: ${difficulty}. ${difficultyPrompts[difficulty]}
    
    CRITICAL INSTRUCTION: Use LaTeX for EVERY SINGLE instance of a mathematical symbol, variable (like $x$, $y$), formula, equation, or scientific term. 
    
    RULES:
    1. Every question must have exactly 4 distinct options in the "options" array.
    2. Options MUST be individual strings in the array. DO NOT combine them into one string.
    3. Options MUST use LaTeX if they contain values, symbols, or scientific notation.
    4. The explanation MUST detail the logic using LaTeX.
    5. Respond ONLY in English. DO NOT use any other characters or languages.
    6. Ensure the JSON is valid. Escape backslashes correctly (e.g., "\\\\frac").
    
    Notes for context:
    ${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Exactly 4 distinct strings, each representing one option."
            },
            correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
            explanation: { type: Type.STRING },
            conceptTag: { type: Type.STRING, description: "The specific sub-concept tested (e.g., 'Quadratic Formula', 'Cell Mitosis')" }
          },
          required: ["question", "options", "correctAnswer", "explanation", "conceptTag"]
        }
      },
    },
  });

  try {
    const text = response.text || "[]";
    let result = JSON.parse(text);
    
    // Safety check: Ensure options are actually an array of 4 strings
    if (Array.isArray(result)) {
      result = result.map(q => {
        if (q.options && Array.isArray(q.options) && q.options.length === 1) {
          // If the model returned a single string with options separated by something weird
          const singleStr = q.options[0];
          // Try to split by common separators or the weird "উভ" if it appears
          let split = singleStr.split(/উভ|\n|,|;|\|/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          if (split.length >= 4) {
            q.options = split.slice(0, 4);
          }
        }
        return q;
      });
    }
    
    return result.slice(0, count);
  } catch (e) {
    console.error("Quiz generation failed", e);
    return [];
  }
};

export const analyzeProgress = async (notes: Note[], quizHistory: QuizResult[]): Promise<ProgressAnalysis> => {
  const context = notes.map(n => `Topic: ${n.name}\nContent: ${n.content}`).join('\n\n');
  const historyContext = quizHistory.map(h => `Quiz Result: ${h.score}/${h.total} on ${new Date(h.timestamp).toLocaleDateString()}`).join('\n');

  const response = await callGeminiWithRetry({
    model: "gemini-3-pro-preview",
    contents: `Perform a HIGH-IMPACT, ACTIONABLE, and PREDICTIVE study progress analysis.
    
    1. Identify "Weakness Patterns": Are they making careless mistakes (e.g., arithmetic errors) or do they have fundamental concept gaps?
    2. Determine a "Next Best Action": A specific, high-impact task.
    3. Prediction Engine: Estimate future score based on current pace vs potential if weaknesses are fixed.
    4. Student Type Analysis: Classify the student (e.g., "Fast but inaccurate", "Conceptually strong but careless").
    5. Action Plan: Create a 3-day step-by-step improvement plan.
    6. Ranked Weaknesses: Rank topics by priority (High/Medium/Low) with reasons.
    7. Learning Pattern Insights: Convert raw metrics into meaningful conclusions.
    
    Notes:
    ${context}
    
    Quiz History:
    ${historyContext}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallMastery: { type: Type.NUMBER },
          studyTimeEstimate: { type: Type.STRING },
          streakCount: { type: Type.NUMBER },
          level: { type: Type.NUMBER },
          experiencePoints: { type: Type.NUMBER },
          weaknessPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
          nextBestAction: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              impact: { type: Type.STRING },
              type: { type: Type.STRING, enum: ['quiz', 'lesson'] },
              topic: { type: Type.STRING },
              subject: { type: Type.STRING }
            },
            required: ["title", "description", "impact", "type", "topic", "subject"]
          },
          prediction: {
            type: Type.OBJECT,
            properties: {
              currentLevel: { type: Type.NUMBER },
              predictedScore: { type: Type.NUMBER },
              potentialScore: { type: Type.NUMBER },
              timeframeDays: { type: Type.NUMBER }
            },
            required: ["currentLevel", "predictedScore", "potentialScore", "timeframeDays"]
          },
          studentType: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              analysis: { type: Type.STRING }
            },
            required: ["label", "analysis"]
          },
          actionPlan: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.NUMBER },
                tasks: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["day", "tasks"]
            }
          },
          learningInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
          rankedWeaknesses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'] },
                reason: { type: Type.STRING }
              },
              required: ["topic", "priority", "reason"]
            }
          },
          subjects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                strength: { type: Type.ARRAY, items: { type: Type.STRING } },
                weakness: { type: Type.ARRAY, items: { type: Type.STRING } },
                masteryScore: { type: Type.NUMBER },
                completionPercentage: { type: Type.NUMBER },
                highYieldTopics: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "strength", "weakness", "masteryScore", "completionPercentage", "highYieldTopics"]
            }
          }
        },
        required: ["overallMastery", "studyTimeEstimate", "streakCount", "level", "experiencePoints", "weaknessPatterns", "subjects", "nextBestAction", "prediction", "studentType", "actionPlan", "learningInsights", "rankedWeaknesses"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
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
      prediction: {
        currentLevel: 0,
        predictedScore: 0,
        potentialScore: 0,
        timeframeDays: 7
      },
      studentType: {
        label: "New Learner",
        analysis: "Start taking quizzes to identify your learning style."
      },
      actionPlan: [
        { day: 1, tasks: ["Review your notes", "Take a 5-question quiz"] }
      ],
      learningInsights: ["No data yet"],
      rankedWeaknesses: [],
      subjects: [] 
    };
  }
};

export const generateLessonDrill = async (topic: string, subject: string, notes: Note[]): Promise<LessonDrill> => {
  const context = notes.map(n => n.content).join('\n\n');

  const response = await callGeminiWithRetry({
    model: "gemini-3-pro-preview",
    contents: `Create an EXAM-FOCUSED interactive lesson drill for "${topic}" (${subject}).
    
    MANDATORY: 
    1. Use LaTeX ($...$ or $$...$$) for ALL mathematical/scientific notation.
    2. Provide "Exam Tips" (how this appears in exams).
    3. Provide an "Interactive Check" (a quick question for the user to answer in their head).
    
    Context:
    ${context}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          conceptExplanation: { type: Type.STRING },
          exampleProblem: { type: Type.STRING },
          exampleSolution: { type: Type.STRING },
          practiceQuestion: { type: Type.STRING },
          practiceAnswer: { type: Type.STRING },
          practiceExplanation: { type: Type.STRING },
          examTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          interactiveCheck: { type: Type.STRING }
        },
        required: ["conceptExplanation", "exampleProblem", "exampleSolution", "practiceQuestion", "practiceAnswer", "practiceExplanation", "examTips", "interactiveCheck"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to generate lesson drill");
  }
};

export const answerQuestion = async (
  question: string,
  notes: Note[],
  chatHistory: { role: 'user' | 'assistant', content: string }[]
): Promise<{ text: string; sources: { uri: string; title: string }[] }> => {
  const context = notes.map(n => `--- Document: ${n.name} ---\n${n.content}`).join('\n\n');
  const systemInstruction = `You are "Second Brain", a helpful study assistant.
  ALWAYS use LaTeX for math. Use Google Search to find more information if needed.
  
  CONTEXT FROM DOCUMENTS:
  ${context}`;

  const response = await callGeminiWithRetry({
    model: "gemini-3-flash-preview",
    contents: [
      ...chatHistory.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      { role: 'user', parts: [{ text: question }] }
    ],
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "";
  const sources: { uri: string; title: string }[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((c: any) => { if (c.web?.uri) sources.push({ uri: c.web.uri, title: c.web.title }); });
  }
  return { text, sources };
};
