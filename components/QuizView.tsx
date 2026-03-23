import React, { useState, useEffect, useRef } from 'react';
import { Note, QuizQuestion, QuizDifficulty, QuizResult } from '../types';
import { generateQuiz } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import confetti from 'canvas-confetti';

const DAILY_QUIZ_LIMIT = 6;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getQuizCount(): number {
  const data = localStorage.getItem('lb_quiz_count');
  if (!data) return 0;
  const parsed = JSON.parse(data);
  if (parsed.date !== getTodayKey()) return 0;
  return parsed.count;
}

function incrementQuizCount() {
  const count = getQuizCount();
  localStorage.setItem('lb_quiz_count', JSON.stringify({ date: getTodayKey(), count: count + 1 }));
}

interface QuizViewProps {
  notes: Note[];
  onComplete: (result: QuizResult) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ notes, onComplete }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [manualExplanationVisible, setManualExplanationVisible] = useState(false);
  const [errors, setErrors] = useState<QuizResult['errors']>([]);
  const [showReflection, setShowReflection] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('Medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [autoShowExplanation, setAutoShowExplanation] = useState(true);
  const [quizCount, setQuizCount] = useState(getQuizCount());

  const limitReached = quizCount >= DAILY_QUIZ_LIMIT;
  
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !isConfiguring && !quizComplete && !showExplanation && !showReflection) {
      timerRef.current = setInterval(() => {
        setTotalTimeTaken(prev => prev + 1);
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSelect(-1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, isConfiguring, quizComplete, showExplanation, showReflection, currentIndex]);

  const startQuiz = async () => {
    if (limitReached) return;
    incrementQuizCount();
    setQuizCount(getQuizCount());
    setIsConfiguring(false);
    setLoading(true);
    const qs = await generateQuiz(notes, questionCount, difficulty);
    setQuestions(qs);
    setCurrentIndex(0);
    setScore(0);
    setQuizComplete(false);
    setSelectedOption(null);
    setShowExplanation(false);
    setManualExplanationVisible(false);
    setErrors([]);
    setStreak(0);
    setTimeLeft(30);
    setTotalTimeTaken(0);
    setLoading(false);
  };

  const handleFinalize = () => {
    const result: QuizResult = {
      score,
      total: questions.length,
      timestamp: Date.now(),
      timeTaken: totalTimeTaken,
      errors
    };
    onComplete(result);
    setQuizComplete(true);
    if (score / questions.length > 0.7) {
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }
  };

  const resetToSetup = () => {
    setQuestions([]);
    setIsConfiguring(true);
    setQuizComplete(false);
  };

  if (notes.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-20 text-center shadow-sm">
        <div className="w-24 h-24 bg-[#26BAA4]/10 rounded-full flex items-center justify-center mx-auto mb-10">
          <svg className="w-12 h-12 text-[#26BAA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-[#2D2D2D] dark:text-[#E5E5E5] mb-4">No Quizzes Yet</h2>
        <p className="text-[#666] dark:text-[#AAA] mb-10 max-w-sm mx-auto leading-relaxed">Please upload some notes first so we can create a quiz for you.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-12 sm:p-32 text-center shadow-sm flex flex-col items-center glow-brand">
        <div className="relative w-16 h-16 sm:w-24 sm:h-24 mb-8 sm:mb-12">
          <div className="absolute inset-0 border-4 border-[#26BAA4]/10 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[#26BAA4] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_#26BAA4]"></div>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#2D2D2D] dark:text-[#E5E5E5] mb-4 animate-pulse uppercase text-glow-brand">
          CREATING YOUR {questionCount}-QUESTION QUIZ
        </h3>
        <p className="text-[#666] dark:text-[#AAA] text-base sm:text-lg font-medium italic">
          Setting up your {difficulty} quiz...
        </p>
      </div>
    );
  }

  if (isConfiguring) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-6 sm:p-10 shadow-sm animate-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <div className="w-10 h-10 bg-[#26BAA4] text-white rounded-xl flex items-center justify-center shadow-sm mx-auto mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tight">Quiz Setup</h2>
          <p className="text-[#26BAA4] text-[10px] font-bold uppercase tracking-widest mt-1">Practice & Mastery</p>
          <div className={`mt-3 text-[10px] font-bold uppercase tracking-widest ${limitReached ? 'text-red-400' : 'text-[#26BAA4]'}`}>
            {limitReached ? 'Daily limit reached — resets at midnight' : `${DAILY_QUIZ_LIMIT - quizCount} / ${DAILY_QUIZ_LIMIT} quizzes left today`}
          </div>
        </div>

        <div className="space-y-10 sm:space-y-14">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-[#666] dark:text-[#AAA] uppercase tracking-widest">Questions</h3>
              <span className="text-[10px] font-bold text-[#26BAA4]">{questionCount} Qs</span>
            </div>
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[10, 20, 30, 40].map(count => (
                <button
                  key={count}
                  onClick={() => setQuestionCount(count)}
                  disabled={limitReached}
                  className={`py-2.5 rounded-lg border font-bold text-xs sm:text-sm transition-all ${
                    questionCount === count 
                      ? 'bg-[#26BAA4] text-white border-[#26BAA4] shadow-sm' 
                      : 'bg-white dark:bg-[#222] border-[#E5E2D9] dark:border-[#333] text-[#666] dark:text-[#AAA] hover:border-[#26BAA4]/50'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  {count}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-[#666] dark:text-[#AAA] uppercase tracking-widest">Difficulty</h3>
              <span className="text-[10px] font-bold text-[#2D2D2D] dark:text-[#E5E5E5]">{difficulty}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {(['Easy', 'Medium', 'Hard', 'Expert'] as QuizDifficulty[]).map(diff => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  disabled={limitReached}
                  className={`py-3 rounded-lg border text-center transition-all ${
                    difficulty === diff 
                      ? 'bg-[#2D2D2D] dark:bg-[#E5E5E5] text-white dark:text-[#0F0F0F] border-[#2D2D2D] dark:border-white shadow-sm' 
                      : 'bg-white dark:bg-[#222] border-[#E5E2D9] dark:border-[#333] text-[#666] dark:text-[#AAA] hover:border-[#2D2D2D]/50 dark:hover:border-white/50'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <div className="font-bold text-[10px] uppercase tracking-wider">{diff}</div>
                </button>
              ))}
            </div>
          </section>

          <div className="flex items-center justify-between py-4 border-y border-[#E5E2D9] dark:border-[#262626]">
            <div>
              <h3 className="text-xs font-bold text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tight">Auto-Show Answers</h3>
              <p className="text-[9px] text-[#666] dark:text-[#AAA] font-medium">Instant feedback after selection</p>
            </div>
            <button 
              onClick={() => setAutoShowExplanation(!autoShowExplanation)}
              className={`w-9 h-5 rounded-full transition-all relative shrink-0 ${autoShowExplanation ? 'bg-[#26BAA4]' : 'bg-[#E5E2D9] dark:bg-[#333]'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${autoShowExplanation ? 'left-4.5' : 'left-0.5'}`}></div>
            </button>
          </div>

          {limitReached ? (
            <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl py-4 text-center">
              <p className="text-xs font-bold text-red-500">Daily quiz limit reached (6 quizzes)</p>
              <p className="text-[10px] text-red-400 mt-1">Resets at midnight. Upgrade for unlimited access.</p>
            </div>
          ) : (
            <button
              onClick={startQuiz}
              className="w-full bg-[#26BAA4] text-white py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm uppercase tracking-widest active:scale-[0.98]"
            >
              Start Quiz
            </button>
          )}
        </div>
      </div>
    );
  }

  if (quizComplete) {
    const carelessErrors = errors?.filter(e => e.type === 'careless').length || 0;
    const conceptErrors = errors?.filter(e => e.type === 'concept').length || 0;
    const weakSpots = Array.from(new Set(errors?.map(e => e.conceptTag) || []));
    const correctIndices = questions.map((_, i) => i).filter(i => !errors?.some(e => e.questionIndex === i));
    const strongSpots = Array.from(new Set(correctIndices.map(i => questions[i].conceptTag)));

    return (
      <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-8 sm:p-12 text-center shadow-sm animate-in zoom-in-95 duration-500 max-w-3xl mx-auto glow-brand">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#26BAA4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md glow-brand">
          <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] mb-1 tracking-tight uppercase text-glow-brand">Quiz Complete</h2>
        <p className="text-[#26BAA4] mb-8 font-bold text-[10px] uppercase tracking-widest">{difficulty} • {questions.length} Questions</p>
        
        <div className="text-6xl sm:text-8xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] mb-10 tabular-nums tracking-tighter leading-none text-glow-brand">
          {score} <span className="text-xl sm:text-2xl text-[#AAA] dark:text-[#444] font-medium align-middle ml-1">/ {questions.length}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10 text-left">
          <div className="bg-[#FDFCF8] dark:bg-[#111] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.2em] mb-4">Mistake Analysis</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#666] dark:text-[#AAA]">Careless Errors</span>
                <span className="text-sm font-bold text-orange-500">{carelessErrors}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-[#666] dark:text-[#AAA]">Concept Gaps</span>
                <span className="text-sm font-bold text-red-500">{conceptErrors}</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FDFCF8] dark:bg-[#111] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-6">
            <h3 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-[0.2em] mb-4">Topic Mastery</h3>
            <div className="space-y-4">
              {weakSpots.length > 0 && (
                <div>
                  <span className="text-[8px] font-bold uppercase text-red-500 tracking-widest mb-1.5 block">Weak Spots</span>
                  <div className="flex flex-wrap gap-1">
                    {weakSpots.map((s, i) => (
                      <span key={i} className="text-[9px] font-bold bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/20">#{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {strongSpots.length > 0 && (
                <div>
                  <span className="text-[8px] font-bold uppercase text-[#26BAA4] tracking-widest mb-1.5 block">Strong Spots</span>
                  <div className="flex flex-wrap gap-1">
                    {strongSpots.slice(0, 3).map((s, i) => (
                      <span key={i} className="text-[9px] font-bold bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-100 dark:border-green-900/20">#{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button 
            onClick={startQuiz}
            disabled={getQuizCount() >= DAILY_QUIZ_LIMIT}
            className="bg-[#26BAA4] text-white px-10 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Try Again
          </button>
          <button 
            onClick={resetToSetup}
            className="bg-[#2D2D2D] dark:bg-[#E5E5E5] text-white dark:text-[#0F0F0F] px-10 py-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm uppercase tracking-widest"
          >
            Finish
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setManualExplanationVisible(false);
      setShowReflection(false);
      setTimeLeft(30);
    } else {
      handleFinalize();
    }
  };

  const handleSelect = (idx: number) => {
    if (showExplanation || showReflection) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelectedOption(idx);
    const isCorrect = idx === currentQ.correctAnswer;
    if (isCorrect) {
      setScore(score + 1);
      setStreak(prev => prev + 1);
      if ((streak + 1) % 5 === 0) {
        confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 }, colors: ['#26BAA4', '#FFD700'] });
      }
      setShowExplanation(true);
      if (autoShowExplanation) setManualExplanationVisible(true);
    } else {
      setStreak(0);
      setShowReflection(true);
    }
  };

  const handleReflection = (type: 'concept' | 'careless') => {
    setErrors(prev => [...(prev || []), { questionIndex: currentIndex, type, conceptTag: currentQ.conceptTag }]);
    setShowReflection(false);
    setShowExplanation(true);
    if (autoShowExplanation) setManualExplanationVisible(true);
  };

  const toggleExplanation = () => setManualExplanationVisible(!manualExplanationVisible);

  return (
    <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-2xl p-6 sm:p-10 shadow-sm animate-in slide-in-from-right-4 duration-500 transition-colors max-w-4xl mx-auto glow-border-brand">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 sm:mb-12 space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border transition-all ${timeLeft < 10 ? 'border-red-500 bg-red-50 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-[#26BAA4] bg-[#26BAA4]/5 shadow-[0_0_10px_rgba(38,186,164,0.3)]'}`}>
            <span className={`text-lg font-bold ${timeLeft < 10 ? 'text-red-600' : 'text-[#26BAA4]'}`}>{timeLeft}s</span>
            <span className="text-[7px] font-bold uppercase tracking-widest opacity-60">Timer</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-widest block mb-0.5 text-glow-brand">{difficulty} Quiz</span>
            <span className="text-lg sm:text-xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5]">Question {currentIndex + 1} <span className="text-[#AAA] dark:text-[#444] font-medium text-sm ml-1">/ {questions.length}</span></span>
          </div>
        </div>
        <div className="flex flex-col items-start sm:items-end w-full sm:w-auto">
          <div className="flex items-center space-x-2 mb-2">
            {streak >= 3 && (
              <div className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                🔥 {streak} STREAK
              </div>
            )}
          </div>
          <div className="w-full sm:w-48 h-1.5 bg-[#FDFCF8] dark:bg-[#111] rounded-full overflow-hidden border border-[#E5E2D9] dark:border-[#262626] glow-brand">
            <div className="h-full bg-[#26BAA4] transition-all duration-700 ease-out shadow-[0_0_10px_#26BAA4]" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="mb-8 sm:mb-12 min-h-[60px]">
        <div className="text-lg sm:text-2xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] leading-snug prose prose-stone dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{currentQ.question}</ReactMarkdown>
        </div>
        <div className="mt-3 inline-block bg-[#26BAA4]/5 text-[#26BAA4] text-[9px] font-bold px-2 py-0.5 rounded border border-[#26BAA4]/10 uppercase tracking-wider">
          {currentQ.conceptTag}
        </div>
      </div>

      {showReflection && (
        <div className="bg-white dark:bg-[#222] border border-[#2D2D2D] dark:border-white rounded-xl p-6 sm:p-8 mb-8 shadow-sm animate-in zoom-in-95 duration-300">
          <h4 className="text-lg font-bold text-[#2D2D2D] dark:text-[#E5E5E5] mb-1 uppercase tracking-tight">Self-Reflection</h4>
          <p className="text-xs text-[#666] dark:text-[#AAA] mb-6 font-medium">Why did you get this wrong?</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleReflection('careless')} className="bg-orange-500 text-white p-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm uppercase tracking-wider">Careless</button>
            <button onClick={() => handleReflection('concept')} className="bg-red-600 text-white p-4 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm uppercase tracking-wider">Concept Gap</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 mb-8">
        {currentQ.options.map((opt, i) => {
          let styles = "bg-[#FDFCF8] dark:bg-[#222] border-[#E5E2D9] dark:border-[#333] text-[#2D2D2D] dark:text-[#E5E5E5] hover:border-[#26BAA4] hover:bg-white dark:hover:bg-[#2A2A2A]";
          if (showExplanation) {
            if (i === currentQ.correctAnswer) styles = "bg-green-50 dark:bg-green-900/10 border-green-500 text-green-700 dark:text-green-400 font-bold";
            else if (i === selectedOption) styles = "bg-red-50 dark:bg-red-900/10 border-red-500 text-red-700 dark:text-red-400 opacity-60";
            else styles = "bg-[#FDFCF8] dark:bg-[#111] border-[#E5E2D9] dark:border-[#222] opacity-30 grayscale pointer-events-none";
          } else if (selectedOption === i) {
            styles = "bg-[#26BAA4]/5 border-[#26BAA4] text-[#26BAA4] font-bold";
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={showExplanation} className={`w-full text-left px-5 py-4 rounded-xl border transition-all flex items-center justify-between group ${styles}`}>
              <div className="prose prose-stone dark:prose-invert text-sm sm:text-base font-medium overflow-hidden leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{opt}</ReactMarkdown>
              </div>
              {showExplanation && i === currentQ.correctAnswer && (
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0 ml-3 animate-in zoom-in-50">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {showExplanation && (
        <div className="flex justify-center mb-6">
          <button onClick={toggleExplanation} className="flex items-center space-x-2 text-[9px] font-bold uppercase tracking-widest text-[#26BAA4] bg-[#26BAA4]/5 px-3 py-1.5 rounded-full border border-[#26BAA4]/10 hover:bg-[#26BAA4]/10 transition-all">
            <span>{manualExplanationVisible ? 'Hide Explanation' : 'Show Explanation'}</span>
            <svg className={`w-3 h-3 transition-transform ${manualExplanationVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      )}

      {showExplanation && manualExplanationVisible && (
        <div className="bg-[#26BAA4]/5 border border-[#26BAA4]/10 rounded-xl p-6 sm:p-8 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-[#26BAA4] text-white rounded-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
            </div>
            <h4 className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-widest">Explanation</h4>
          </div>
          <div className="text-sm sm:text-base text-[#444] dark:text-[#AAA] leading-relaxed italic prose prose-stone dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{currentQ.explanation}</ReactMarkdown>
          </div>
        </div>
      )}

      {showExplanation && (
        <button onClick={handleNext} className="w-full bg-[#2D2D2D] dark:bg-[#E5E5E5] text-white dark:text-[#0F0F0F] py-4 sm:py-5 rounded-xl font-bold text-base sm:text-lg hover:opacity-90 transition-all shadow-md active:scale-[0.98] uppercase tracking-widest mt-2">
          {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
        </button>
      )}
    </div>
  );
};

export default QuizView;