
import React from 'react';

const AILoadingIndicator: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-lg shadow-sm text-center">
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-16 h-16 border-4 border-slate-200 rounded-full"></div>
        <div className="absolute w-16 h-16 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
      </div>
      <p className="text-lg font-semibold text-slate-700">{message}</p>
      <p className="text-sm text-slate-500 mt-1">This can take up to 30 seconds. Thanks for your patience!</p>
    </div>
  );
};

export default AILoadingIndicator;
