import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage } from '../types';

const DAILY_MSG_LIMIT = 15;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getMessageCount(): number {
  const data = localStorage.getItem('lb_chat_count');
  if (!data) return 0;
  const parsed = JSON.parse(data);
  if (parsed.date !== getTodayKey()) return 0;
  return parsed.count;
}

function incrementMessageCount() {
  const count = getMessageCount();
  localStorage.setItem('lb_chat_count', JSON.stringify({ date: getTodayKey(), count: count + 1 }));
}

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isThinking: boolean;
  disabled: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isThinking, disabled }) => {
  const [input, setInput] = useState('');
  const [msgCount, setMsgCount] = useState(getMessageCount());
  const scrollRef = useRef<HTMLDivElement>(null);

  const limitReached = msgCount >= DAILY_MSG_LIMIT;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isThinking && !limitReached) {
      incrementMessageCount();
      setMsgCount(getMessageCount());
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E4E4E7] dark:bg-[#2D2D2D] border border-[#E5E2D9] dark:border-[#3F3F46] rounded-xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-[#E5E2D9] dark:border-[#3F3F46] flex items-center justify-between bg-[#E4E4E7] dark:bg-[#2D2D2D]">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#26BAA4] shadow-[0_0_10px_#26BAA4] animate-pulse"></div>
          <h2 className="text-sm font-bold text-[#2D2D2D] dark:text-[#E5E5E5] uppercase tracking-wider text-glow-brand">Cortex Neo</h2>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${limitReached ? 'text-red-400' : 'text-[#26BAA4]'}`}>
          {DAILY_MSG_LIMIT - msgCount} / {DAILY_MSG_LIMIT} left today
        </span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#FDFCF8]/30 dark:bg-black/20"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-[#F4F4F5] rounded-full border border-[#E5E2D9] shadow-sm">
              <svg className="w-8 h-8 text-[#26BAA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-sm text-[#666] font-medium italic">Ask anything about your notes.</p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[95%] lg:max-w-[90%] rounded-2xl px-5 py-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#26BAA4] text-white rounded-tr-none shadow-lg shadow-[#26BAA4]/20 glow-brand' 
                : 'bg-[#F4F4F5] dark:bg-[#3F3F46] text-[#2D2D2D] dark:text-[#E5E5E5] border border-[#E5E2D9] dark:border-[#3F3F46] rounded-tl-none'
            }`}>
              <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'prose-invert' : 'prose-stone'}`}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {msg.content}
                </ReactMarkdown>
              </div>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E5E2D9] space-y-2">
                  <p className="text-[10px] font-bold text-[#26BAA4] uppercase tracking-widest">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {msg.sources.map((src, sIdx) => (
                      <a 
                        key={sIdx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 text-[10px] bg-[#FDFCF8] border border-[#E5E2D9] px-2 py-1 rounded hover:border-[#26BAA4] hover:text-[#26BAA4] transition-all max-w-[200px]"
                      >
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span className="truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <span className="text-[9px] font-bold uppercase mt-3 block text-right opacity-60">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-[#F4F4F5] dark:bg-[#3F3F46] border border-[#E5E2D9] dark:border-[#3F3F46] rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-[#26BAA4] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-[#26BAA4] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-[#26BAA4] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {limitReached && (
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-center">
              <p className="text-xs font-bold text-red-500">Daily limit reached (15 messages)</p>
              <p className="text-[10px] text-red-400 mt-1">Resets at midnight. Upgrade for unlimited access.</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-[#E5E2D9] dark:border-[#3F3F46] bg-[#E4E4E7] dark:bg-[#2D2D2D]">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled || isThinking || limitReached}
            placeholder={limitReached ? "Daily limit reached. Resets at midnight." : disabled ? "Upload notes to start chatting..." : "Ask a question..."}
            className="w-full bg-[#F4F4F5] dark:bg-[#3F3F46] border border-[#E5E2D9] dark:border-[#3F3F46] rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#26BAA4]/30 focus:border-[#26BAA4] focus:glow-border-brand transition-all disabled:opacity-50 placeholder:text-[#AAA] dark:placeholder:text-[#666] dark:text-white"
          />
          <button
            type="submit"
            disabled={!input.trim() || disabled || isThinking || limitReached}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#26BAA4] hover:scale-110 disabled:text-[#CCC] transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;