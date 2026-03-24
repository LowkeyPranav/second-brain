import React, { useCallback, useState } from 'react';

const DAILY_UPLOAD_LIMIT = 888;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getUploadCount(): number {
  const data = localStorage.getItem('lb_upload_count');
  if (!data) return 0;
  const parsed = JSON.parse(data);
  if (parsed.date !== getTodayKey()) return 0;
  return parsed.count;
}

function incrementUploadCount() {
  const count = getUploadCount();
  localStorage.setItem('lb_upload_count', JSON.stringify({ date: getTodayKey(), count: count + 1 }));
}

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCount, setUploadCount] = useState(getUploadCount());

  const limitReached = uploadCount >= DAILY_UPLOAD_LIMIT;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!limitReached) setIsDragging(true);
  }, [limitReached]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (limitReached) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      incrementUploadCount();
      setUploadCount(getUploadCount());
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected, limitReached]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (limitReached) return;
    if (e.target.files && e.target.files.length > 0) {
      incrementUploadCount();
      setUploadCount(getUploadCount());
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#26BAA4]">
          Uploads today
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${limitReached ? 'text-red-400' : 'text-[#26BAA4]'}`}>
          {DAILY_UPLOAD_LIMIT - uploadCount} / {DAILY_UPLOAD_LIMIT} left
        </span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center
          ${limitReached ? 'opacity-50 cursor-not-allowed border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' :
            isDragging ? 'border-[#26BAA4] bg-[#26BAA4]/5 cursor-pointer' :
            'border-[#E5E2D9] dark:border-[#3F3F46] hover:border-[#26BAA4] bg-[#E4E4E7] dark:bg-[#2D2D2D] shadow-sm hover:shadow-md cursor-pointer'}
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          type="file"
          multiple
          accept=".pdf,.txt"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          onChange={handleFileInput}
          disabled={isLoading || limitReached}
        />
        
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${
          limitReached ? 'bg-red-100 dark:bg-red-900/20' :
          isLoading ? 'bg-[#D4D4D8] dark:bg-[#3F3F46]' : 
          'bg-[#D4D4D8] dark:bg-[#3F3F46] group-hover:bg-[#26BAA4]/10'
        }`}>
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26BAA4]"></div>
          ) : limitReached ? (
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-[#26BAA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        <h3 className={`text-lg font-bold mb-1 ${limitReached ? 'text-red-400' : 'text-[#2D2D2D] dark:text-[#E5E5E5]'}`}>
          {isLoading ? 'Reading your notes...' : limitReached ? 'Daily limit reached' : 'Add Your Notes'}
        </h3>
        <p className="text-[#666] dark:text-[#AAA] text-sm max-w-xs font-medium">
          {limitReached ? 'You can upload 8 files per day. Resets at midnight.' : 'Drag and drop your PDFs or text files here to begin.'}
        </p>
      </div>
    </div>
  );
};

export default Dropzone;