import React from 'react';

export default function Stepper({ step = 1, labels = [], onStepClick = () => {} }) {
  return (
    <div className="flex items-center gap-4">
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex items-center gap-3">
            <button onClick={() => onStepClick(idx)} className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? 'bg-indigo-600 text-white' : done ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'} border`}>{done ? '✓' : idx}</button>
            <div className={`text-sm ${active ? 'text-slate-900' : 'text-slate-500'}`}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
