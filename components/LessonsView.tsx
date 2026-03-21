
import React, { useState } from 'react';
import { Note, ProgressAnalysis, LessonDrill } from '../types';
import { generateLessonDrill } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface LessonsViewProps {
  notes: Note[];
  progress: ProgressAnalysis | null;
}

const LessonsView: React.FC<LessonsViewProps> = ({ notes, progress }) => {
  const [activeDrill, setActiveDrill] = useState<LessonDrill | null>(null);
  const [loadingDrill, setLoadingDrill] = useState(false);
  const [drillTopic, setDrillTopic] = useState<{topic: string, subject: string} | null>(null);
  
  const [showExampleSolution, setShowExampleSolution] = useState(false);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);

  if (notes.length === 0 || !progress) {
    return (
      <div className="bg-white border border-[#E5E2D9] rounded-2xl p-16 text-center shadow-sm">
        <h2 className="text-2xl font-black text-[#2D2D2D] mb-4">No Lessons Yet</h2>
        <p className="text-[#666] max-w-sm mx-auto leading-relaxed">Upload your notes first so we can create lessons for you.</p>
      </div>
    );
  }

  const startReview = async (topic: string, subject: string) => {
    setLoadingDrill(true);
    setDrillTopic({ topic, subject });
    setShowExampleSolution(false);
    setShowPracticeAnswer(false);
    try {
      const drill = await generateLessonDrill(topic, subject, notes);
      setActiveDrill(drill);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrill(false);
    }
  };

  const closeDrill = () => {
    setActiveDrill(null);
    setDrillTopic(null);
  };

  if (loadingDrill) {
    return (
      <div className="bg-white border border-[#E5E2D9] rounded-2xl p-16 text-center shadow-sm flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-[#26BAA4] border-t-transparent rounded-full animate-spin mb-8"></div>
        <h3 className="text-xl font-black text-[#2D2D2D] mb-2">Creating Your Lesson</h3>
        <p className="text-[#AAA] font-medium italic">Getting everything ready for "{drillTopic?.topic}"...</p>
      </div>
    );
  }

  if (activeDrill) {
    return (
      <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
        <div className="bg-[#2D2D2D] text-white rounded-2xl p-8 shadow-2xl relative">
          <button 
            onClick={closeDrill}
            className="absolute top-6 right-6 text-[#666] hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#26BAA4] uppercase tracking-widest">{drillTopic?.subject}</span>
            <h2 className="text-3xl font-black tracking-tight">{drillTopic?.topic}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Exam Tips */}
          {activeDrill.examTips && (
            <section className="bg-gradient-to-br from-[#26BAA4] to-[#219B88] text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Exam Strategy</h3>
              </div>
              <div className="prose prose-invert max-w-none text-lg font-bold italic leading-relaxed">
                <ul className="list-disc pl-5 space-y-2">
                  {activeDrill.examTips.map((tip, i) => (
                    <li key={i}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {tip}
                      </ReactMarkdown>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}

          {/* Concept Explanation */}
          <section className="bg-white border border-[#E5E2D9] rounded-2xl p-8 shadow-sm">
            <h3 className="text-xs font-black text-[#26BAA4] uppercase tracking-[0.2em] mb-6">1. The Main Idea</h3>
            <div className="prose prose-stone max-w-none text-[#444] leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {activeDrill.conceptExplanation}
              </ReactMarkdown>
            </div>
          </section>

          {/* Interactive Check */}
          {activeDrill.interactiveCheck && (
            <section className="bg-[#FDFCF8] border border-[#E5E2D9] rounded-2xl p-8 shadow-sm border-t-8 border-t-[#2D2D2D]">
              <h3 className="text-xs font-black text-[#2D2D2D] uppercase tracking-[0.2em] mb-6">Quick Check</h3>
              <div className="prose prose-stone max-w-none text-lg font-bold mb-4">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {activeDrill.interactiveCheck}
                </ReactMarkdown>
              </div>
              <p className="text-[10px] font-bold text-[#AAA] italic">Think about the answer before moving to the example problem below.</p>
            </section>
          )}

          {/* Example Problem */}
          <section className="bg-white border border-[#E5E2D9] rounded-2xl p-8 shadow-sm border-l-8 border-l-[#26BAA4]">
            <h3 className="text-xs font-black text-[#26BAA4] uppercase tracking-[0.2em] mb-6">2. Example Problem</h3>
            <div className="prose prose-stone max-w-none text-lg font-bold mb-8">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {activeDrill.exampleProblem}
              </ReactMarkdown>
            </div>
            
            {!showExampleSolution ? (
              <button 
                onClick={() => setShowExampleSolution(true)}
                className="bg-[#26BAA4] text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-[#26BAA4]/20"
              >
                Show How to Solve
              </button>
            ) : (
              <div className="bg-[#FDFCF8] border border-[#E5E2D9] rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-400">
                <h4 className="text-[10px] font-black text-[#26BAA4] uppercase tracking-widest mb-4">How to Solve It</h4>
                <div className="prose prose-stone prose-sm max-w-none italic leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {activeDrill.exampleSolution}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </section>

          {/* Practice Challenge */}
          <section className="bg-white border border-[#E5E2D9] rounded-2xl p-8 shadow-sm border-l-8 border-l-orange-400">
            <h3 className="text-xs font-black text-orange-400 uppercase tracking-[0.2em] mb-6">3. Practice Problem</h3>
            <div className="prose prose-stone max-w-none text-lg font-bold mb-8">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {activeDrill.practiceQuestion}
              </ReactMarkdown>
            </div>

            {!showPracticeAnswer ? (
              <button 
                onClick={() => setShowPracticeAnswer(true)}
                className="bg-[#2D2D2D] text-white px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-xl"
              >
                Check My Answer
              </button>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-400">
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h4 className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2">The Correct Answer</h4>
                  <div className="text-2xl font-black text-green-700 prose prose-stone max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {activeDrill.practiceAnswer}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="bg-[#FDFCF8] border border-[#E5E2D9] rounded-xl p-6">
                  <h4 className="text-[10px] font-black text-[#666] uppercase tracking-widest mb-2">Why This Is Correct</h4>
                  <div className="prose prose-stone prose-sm max-w-none text-[#444]">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {activeDrill.practiceExplanation}
                    </ReactMarkdown>
                  </div>
                </div>
                <button 
                  onClick={closeDrill}
                  className="w-full border-2 border-[#E5E2D9] py-4 rounded-xl font-bold text-[#666] hover:bg-[#FDFCF8] transition-all"
                >
                  Finish Lesson
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  const weaknesses = progress.subjects.flatMap(s => s.weakness.map(w => ({ topic: w, subject: s.name })));

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1A1A1A] text-white rounded-3xl p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 p-20 opacity-5 rotate-12">
          <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Your Study Plan</h2>
          <p className="text-[#AAA] text-lg leading-relaxed max-w-xl font-medium">We found <span className="text-[#26BAA4]">{weaknesses.length} topics</span> you can improve on. These lessons will help you learn them faster.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-black text-[#26BAA4] uppercase tracking-[0.3em]">Lessons for You</h3>
          <span className="text-[10px] font-bold text-[#AAA] bg-white border border-[#E5E2D9] px-3 py-1 rounded-full">{weaknesses.length} Lessons Ready</span>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {weaknesses.map((w, i) => (
            <div 
              key={i} 
              onClick={() => startReview(w.topic, w.subject)}
              className="group bg-white border border-[#E5E2D9] rounded-2xl p-6 shadow-sm hover:border-[#26BAA4] hover:shadow-xl hover:shadow-[#26BAA4]/5 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center space-x-6">
                <div className="w-14 h-14 bg-[#FDFCF8] border border-[#E5E2D9] rounded-2xl flex items-center justify-center text-[#2D2D2D] font-black group-hover:bg-[#26BAA4] group-hover:text-white group-hover:border-[#26BAA4] transition-all text-xl">
                  {i + 1}
                </div>
                <div>
                  <span className="text-[10px] font-black text-[#AAA] uppercase tracking-widest mb-1 block group-hover:text-[#26BAA4] transition-colors">{w.subject}</span>
                  <h4 className="text-2xl font-black text-[#2D2D2D] tracking-tight">{w.topic}</h4>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] font-black text-[#AAA] uppercase tracking-tighter">Mode</span>
                  <span className="text-xs font-bold text-[#666]">Lesson</span>
                </div>
                <div className="w-10 h-10 rounded-full border border-[#E5E2D9] flex items-center justify-center text-[#26BAA4] group-hover:bg-[#26BAA4] group-hover:text-white transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          ))}
          
          {weaknesses.length === 0 && (
            <div className="bg-[#26BAA4]/5 border-2 border-dashed border-[#26BAA4]/20 rounded-3xl p-20 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#26BAA4]/20">
                <svg className="w-10 h-10 text-[#26BAA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
              </div>
              <h3 className="text-2xl font-black text-[#2D2D2D] mb-2">Great Job!</h3>
              <p className="text-[#666] font-medium">You're doing great! No weak spots found yet. Keep studying!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonsView;
