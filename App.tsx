
import React, { useState, useCallback, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import ChatPanel from './components/ChatPanel';
import QuizView from './components/QuizView';
import ProgressView from './components/ProgressView';
import LessonsView from './components/LessonsView';
import { Note, ChatMessage, AppView, ProgressAnalysis, QuizResult } from './types';
import { extractTextFromPDF, readFileAsText, generateId } from './utils/fileHelpers';
import { summarizeNote, answerQuestion, analyzeProgress } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('repository');
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizHistory, setQuizHistory] = useState<QuizResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [progress, setProgress] = useState<ProgressAnalysis | null>(null);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0F0F0F';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#FDFCF8';
    }
  }, [isDark]);

  useEffect(() => {
    if (notes.length > 0) {
      const timer = setTimeout(async () => {
        try {
          const analysis = await analyzeProgress(notes, quizHistory);
          setProgress(analysis);
        } catch (error) {
          console.error("Failed to update analysis:", error);
        }
      }, 2000); // 2 second debounce

      return () => clearTimeout(timer);
    }
  }, [notes, quizHistory]);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    const newNotes: Note[] = [];

    for (const file of files) {
      try {
        let content = "";
        const type = file.type === 'application/pdf' ? 'pdf' : 'text';
        
        if (type === 'pdf') {
          content = await extractTextFromPDF(file);
        } else {
          content = await readFileAsText(file);
        }

        const note: Note = {
          id: generateId(),
          name: file.name,
          content,
          type,
          timestamp: Date.now(),
        };

        const summaryData = await summarizeNote(note);
        note.summary = summaryData.summary;
        note.keyTakeaways = summaryData.keyTakeaways;

        newNotes.push(note);
      } catch (error) {
        console.error(`Failed to process ${file.name}`, error);
      }
    }

    setNotes(prev => [...prev, ...newNotes]);
    setIsProcessing(false);
  }, []);

  const handleSendMessage = async (content: string) => {
    const userMsg: ChatMessage = { role: 'user', content, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setIsAssistantThinking(true);

    try {
      const { text, sources } = await answerQuestion(content, notes, chatMessages);
      const assistantMsg: ChatMessage = { 
        role: 'assistant', 
        content: text, 
        timestamp: Date.now(),
        sources: sources.length > 0 ? sources : undefined
      };
      setChatMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = { 
        role: 'assistant', 
        content: "An interruption occurred in the strategy engine. Please retry your inquiry.", 
        timestamp: Date.now() 
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizHistory(prev => [...prev, result]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleNextBestAction = (action: NonNullable<ProgressAnalysis['nextBestAction']>) => {
    if (action.type === 'quiz') {
      setView('quiz');
    } else {
      setView('lessons');
    }
  };

  const renderMainContent = () => {
    switch (view) {
      case 'quiz':
        return <QuizView notes={notes} onComplete={handleQuizComplete} />;
      case 'progress':
        return <ProgressView progress={progress} notes={notes} quizHistory={quizHistory} onAction={handleNextBestAction} userEmail="sairampranav410@gmail.com" isDark={isDark} />;
      case 'lessons':
        return <LessonsView notes={notes} progress={progress} />;
      default:
        return (
          <div className="flex flex-col space-y-8">
            <section className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>My Library</h2>
                  <p className={`text-xs sm:text-sm mt-1 sm:mt-2 font-semibold ${isDark ? 'text-[#CCC]' : 'text-[#444]'}`}>Drop your notes. We'll handle the rest.</p>
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-[#26BAA4] font-bold uppercase tracking-widest border border-[#26BAA4]/20 px-3 py-1.5 rounded-full bg-white dark:bg-[#1A1A1A] shadow-sm self-start sm:self-auto whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#26BAA4] animate-pulse"></span>
                  <span>{notes.length} {notes.length === 1 ? 'Note' : 'Notes'}</span>
                </div>
              </div>
              <Dropzone onFilesSelected={handleFilesSelected} isLoading={isProcessing} />
            </section>

            <section className="flex-1 overflow-y-auto space-y-6 pr-2">
              {notes.length === 0 ? (
                <div className="border border-[#E5E2D9] dark:border-[#262626] rounded-xl p-12 bg-white dark:bg-[#1A1A1A] text-center shadow-sm">
                  <p className="text-[#AAA] text-sm italic font-medium">Your library is empty...</p>
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="bg-white dark:bg-[#1A1A1A] border border-[#E5E2D9] dark:border-[#262626] rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:glow-border-brand transition-all duration-300">
                    <div className="px-6 py-4 border-b border-[#E5E2D9] dark:border-[#262626] flex justify-between items-center bg-[#FDFCF8]/50 dark:bg-[#111]/50">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white dark:bg-[#2D2D2D] border border-[#E5E2D9] dark:border-[#262626] rounded shadow-xs glow-brand">
                          {note.type === 'pdf' ? (
                            <svg className="w-4 h-4 text-[#26BAA4]" fill="currentColor" viewBox="0 0 24 24"><path d="M7 2a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V8l-6-6H7zm5 7V3.5L17.5 9H12z"/></svg>
                          ) : (
                            <svg className="w-4 h-4 text-[#26BAA4]" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM13 9V3.5L18.5 9H13z"/></svg>
                          )}
                        </div>
                        <span className="font-bold text-sm text-[#2D2D2D] dark:text-[#E5E5E5] truncate max-w-[250px] tracking-tight">{note.name}</span>
                      </div>
                      <button 
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors group/delete"
                        title="Remove study material"
                        id={`delete-note-${note.id}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <h4 className="text-[9px] uppercase font-black text-[#26BAA4] mb-3 tracking-[0.2em] text-glow-brand">Summary</h4>
                        <div className="text-sm text-[#444] dark:text-[#CCC] leading-relaxed italic border-l-3 border-[#26BAA4]/40 pl-5 prose prose-stone dark:prose-invert prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{note.summary || ""}</ReactMarkdown>
                        </div>
                      </div>
                      {note.keyTakeaways && note.keyTakeaways.length > 0 && (
                        <div>
                          <h4 className="text-[9px] uppercase font-black text-[#26BAA4] mb-3 tracking-[0.2em]">Key Points</h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {note.keyTakeaways.map((k, i) => (
                              <li key={i} className="flex items-start space-x-3 text-xs text-[#666] dark:text-[#AAA] bg-[#FDFCF8]/80 dark:bg-[#111]/80 p-3 rounded-lg border border-[#E5E2D9]/50 dark:border-[#262626]/50">
                                <span className="mt-1 w-1.5 h-1.5 bg-[#26BAA4] rounded-full shrink-0"></span>
                                <div className="prose prose-stone dark:prose-invert prose-xs font-medium">
                                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{k}</ReactMarkdown>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>
        );
    }
  };

  const isQuizView = view === 'quiz';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0F0F0F] text-[#E5E5E5]' : 'bg-[#FDFCF8] text-[#2D2D2D]'}`}>
      <Header 
        currentView={view} 
        onViewChange={setView} 
        isDark={isDark} 
        onToggleTheme={() => setIsDark(!isDark)} 
      />
      
      <main className={`flex-1 max-w-[1440px] mx-auto w-full grid grid-cols-1 ${isQuizView ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8 p-8`}>
        <div className={isQuizView ? 'lg:col-span-1 max-w-6xl mx-auto w-full' : 'lg:col-span-7'}>
          {renderMainContent()}
        </div>

        {!isQuizView && (
          <div className="lg:col-span-5 flex flex-col sticky top-[120px] h-[calc(100vh-160px)]">
            <ChatPanel 
              messages={chatMessages} 
              onSendMessage={handleSendMessage} 
              isThinking={isAssistantThinking}
              disabled={notes.length === 0}
            />
          </div>
        )}
      </main>

      <footer className="py-10 border-t border-[#E5E2D9] dark:border-[#262626] text-center bg-white dark:bg-[#1A1A1A] transition-colors duration-300">
        <p className="text-[#26BAA4] text-[10px] font-black uppercase tracking-[0.3em]">Think Left. Think Smart.</p>
        <p className="text-[#666] dark:text-[#AAA] text-[9px] mt-2 font-medium opacity-60">© Left Brain Study App</p>
      </footer>
    </div>
  );
};

export default App;
