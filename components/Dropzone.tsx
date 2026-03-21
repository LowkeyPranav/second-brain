import React, { useCallback, useState } from 'react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
}

const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  }, [onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group border-2 border-dashed rounded-xl p-10 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer
        ${isDragging ? 'border-[#26BAA4] bg-[#26BAA4]/5' : 'border-[#E5E2D9] dark:border-[#3F3F46] hover:border-[#26BAA4] bg-[#E4E4E7] dark:bg-[#2D2D2D] shadow-sm hover:shadow-md'}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        multiple
        accept=".pdf,.txt"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileInput}
        disabled={isLoading}
      />
      
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 ${isLoading ? 'bg-[#D4D4D8] dark:bg-[#3F3F46]' : 'bg-[#D4D4D8] dark:bg-[#3F3F46] group-hover:bg-[#26BAA4]/10'}`}>
        {isLoading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#26BAA4]"></div>
        ) : (
          <svg className="w-8 h-8 text-[#26BAA4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-bold text-[#2D2D2D] dark:text-[#E5E5E5] mb-1">
        {isLoading ? 'Reading your notes...' : 'Add Your Notes'}
      </h3>
      <p className="text-[#666] dark:text-[#AAA] text-sm max-w-xs font-medium">
        Drag and drop your PDFs or text files here to begin.
      </p>
    </div>
  );
};

export default Dropzone;