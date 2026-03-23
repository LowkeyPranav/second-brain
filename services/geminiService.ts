import { Note, SummaryResponse, ProgressAnalysis, QuizResult, ChatMessage } from '../types';

const BASE_URL = 'https://api.siliconflow.cn/v1';
const MODEL = 'openai/gpt-oss-20b';

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_SILICONFLOW_API_KEY;

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`SiliconFlow API error: ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function summarizeNote(note: Note): Promise<SummaryResponse> {
  const system = `You are a study assistant. Always respond with valid JSON only — no markdown, no explanation.`;
  const user = `Summarize this study note and extract key takeaways.
Return ONLY this JSON format:
{
  "summary": "2-3 sentence summary",
  "keyTakeaways": ["point 1", "point 2", "point 3"]
}

Note content:
${note.content.slice(0, 4000)}`;

  const raw = await callAI(system, user);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

export async function answerQuestion(
  question: string,
  notes: Note[],
  history: ChatMessage[]
): Promise<{ text: string; sources: { uri: string; title: string }[] }> {
  const context = notes
    .map(n => `[${n.name}]:\n${n.content.slice(0, 2000)}`)
    .join('\n\n---\n\n');

  const historyText = history
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const system = `You are a helpful study assistant. Answer questions based on the student's notes. Be concise and clear. Use markdown for formatting if helpful.`;
  const user = `Notes context:
${context}

Recent conversation:
${historyText}

Question: ${question}`;

  const text = await callAI(system, user);
  const sources = notes.map(n => ({ uri: '', title: n.name }));
  return { text, sources };
}

export async function analyzeProgress(
  notes: Note[],
  quizHistory: QuizResult[]
): Promise<ProgressAnalysis> {
  const notesSummary = notes.map(n => `- ${n.name}: ${n.summary || 'No summary'}`).join('\n');
  const quizStats = quizHistory.length > 0
    ? `${quizHistory.length} quizzes taken, average score: ${Math.round(quizHistory.reduce((a, q) => a + (q.score / q.total) * 100, 0) / quizHistory.length)}%`
    : 'No quizzes taken yet';

  const system = `You are a learning analytics engine. Always respond with valid JSON only — no markdown, no explanation.`;
  const user = `Analyze this student's progress and return ONLY this JSON:
{
  "overallMastery": <0-100>,
  "studyTimeEstimate": "<e.g. 3 hours>",
  "streakCount": <number>,
  "level": <1-10>,
  "experiencePoints": <number>,
  "weaknessPatterns": ["pattern1", "pattern2"],
  "subjects": [
    {
      "name": "<subject>",
      "strength": ["topic1"],
      "weakness": ["topic2"],
      "masteryScore": <0-100>,
      "completionPercentage": <0-100>,
      "highYieldTopics": ["topic1"]
    }
  ],
  "nextBestAction": {
    "title": "<action title>",
    "description": "<description>",
    "impact": "<impact>",
    "type": "quiz",
    "topic": "<topic>",
    "subject": "<subject>"
  },
  "learningInsights": ["insight1", "insight2"]
}

Notes uploaded:
${notesSummary}

Quiz history: ${quizStats}`;

  const raw = await callAI(system, user);
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}