import React from 'react';

interface DebugInfoProps {
  data: any;
  label?: string;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ data, label = 'Debug' }) => {
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg max-w-sm max-h-64 overflow-auto text-xs z-50">
      <h3 className="font-bold mb-2">{label}</h3>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};
