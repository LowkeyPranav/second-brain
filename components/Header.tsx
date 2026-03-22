
import React from 'react';
import { AppView } from '../types';
import { Home, Brain, BarChart3, GraduationCap, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, isDark, onToggleTheme }) => {
  return (
    <header className="border-b border-[#E5E2D9] dark:border-[#262626] py-4 sm:py-6 px-4 sm:px-10 flex items-center bg-[#FDFCF8] dark:bg-[#1A1A1A] sticky top-0 z-50 shadow-sm transition-colors duration-300">
      <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0 w-1/4">
        <div 
          className="w-8 h-8 sm:w-10 sm:h-10 bg-[#26BAA4] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-[#26BAA4]/20 overflow-hidden cursor-pointer hover:scale-105 transition-transform glow-brand" 
          onClick={() => onViewChange('repository')}
          title="Return to Dashboard"
        >
          <svg viewBox="0 0 100 100" className="w-5 h-5 sm:w-6 sm:h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="25" y="20" width="16" height="42" fill="white" rx="2" />
            <rect x="25" y="68" width="16" height="12" fill="white" rx="2" />
            <rect x="59" y="20" width="16" height="42" fill="white" rx="2" />
            <rect x="59" y="68" width="16" height="12" fill="white" rx="2" />
          </svg>
        </div>
        <div className="cursor-pointer hidden sm:block" onClick={() => onViewChange('repository')}>
          <h1 className="text-base sm:text-xl font-bold text-[#2D2D2D] dark:text-[#E5E5E5] tracking-tight leading-tight">Left Brain</h1>
          <p className="text-[10px] sm:text-xs text-[#26BAA4] font-medium hidden md:block"> Think Left. Think Smart.</p>
        </div>
      </div>
      
      <nav className="flex-1 flex items-center justify-center space-x-2 sm:space-x-4">
        <button 
          onClick={() => onViewChange('repository')}
          className={`px-6 py-3 rounded-xl flex flex-col items-center transition-all duration-200 hover:bg-[#FDFCF8] dark:hover:bg-[#2D2D2D] ${currentView === 'repository' ? 'text-[#26BAA4] bg-[#FDFCF8] dark:bg-[#2D2D2D] text-glow-brand' : 'text-[#666] dark:text-[#AAA] hover:text-[#26BAA4]'}`}
          title="Home"
        >
          <Home className="w-5 h-5 sm:hidden" />
          <span className={`text-base sm:text-lg font-bold hidden sm:block ${currentView === 'repository' ? 'border-b-2 border-[#26BAA4] text-glow-brand' : ''}`}>Home</span>
        </button>
        
        <button 
          onClick={() => onViewChange('quiz')}
          className={`px-6 py-3 rounded-xl flex flex-col items-center transition-all duration-200 hover:bg-[#FDFCF8] dark:hover:bg-[#2D2D2D] ${currentView === 'quiz' ? 'text-[#26BAA4] bg-[#FDFCF8] dark:bg-[#2D2D2D] text-glow-brand' : 'text-[#666] dark:text-[#AAA] hover:text-[#26BAA4]'}`}
          title="Quizzes"
        >
          <Brain className="w-5 h-5 sm:hidden" />
          <span className={`text-base sm:text-lg font-bold hidden sm:block ${currentView === 'quiz' ? 'border-b-2 border-[#26BAA4] text-glow-brand' : ''}`}>Quizzes</span>
        </button>
        
        <button 
          onClick={() => onViewChange('progress')}
          className={`px-6 py-3 rounded-xl flex flex-col items-center transition-all duration-200 hover:bg-[#FDFCF8] dark:hover:bg-[#2D2D2D] ${currentView === 'progress' ? 'text-[#26BAA4] bg-[#FDFCF8] dark:bg-[#2D2D2D] text-glow-brand' : 'text-[#666] dark:text-[#AAA] hover:text-[#26BAA4]'}`}
          title="My Progress"
        >
          <BarChart3 className="w-5 h-5 sm:hidden" />
          <span className={`text-base sm:text-lg font-bold hidden sm:block ${currentView === 'progress' ? 'border-b-2 border-[#26BAA4] text-glow-brand' : ''}`}>Progress</span>
        </button>
        
        <button 
          onClick={() => onViewChange('lessons')}
          className={`px-6 py-3 rounded-xl flex flex-col items-center transition-all duration-200 hover:bg-[#FDFCF8] dark:hover:bg-[#2D2D2D] ${currentView === 'lessons' ? 'text-[#26BAA4] bg-[#FDFCF8] dark:bg-[#2D2D2D] text-glow-brand' : 'text-[#666] dark:text-[#AAA] hover:text-[#26BAA4]'}`}
          title="Lessons"
        >
          <GraduationCap className="w-5 h-5 sm:hidden" />
          <span className={`text-base sm:text-lg font-bold hidden sm:block ${currentView === 'lessons' ? 'border-b-2 border-[#26BAA4] text-glow-brand' : ''}`}>Lessons</span>
        </button>
      </nav>

      <div className="flex items-center justify-end w-1/4">
        <div className="hidden sm:block h-6 w-[1px] bg-[#E5E2D9] dark:bg-[#262626] mx-4"></div>
        <button 
          onClick={onToggleTheme}
          className="p-2.5 rounded-full hover:bg-[#FDFCF8] dark:hover:bg-[#2D2D2D] transition-all text-[#666] dark:text-[#AAA] border border-transparent hover:border-[#E5E2D9] dark:hover:border-[#3F3F46]"
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>
    </header>
  );
};

export default Header;
