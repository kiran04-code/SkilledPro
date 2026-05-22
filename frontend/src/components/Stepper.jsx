import React from 'react';

export default function Stepper({ step = 1, labels = [], onStepClick = () => {} }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 sm:justify-start sm:gap-x-3 lg:gap-x-4">
      {labels.map((label, i) => {
        const idx = i + 1;
        const active = idx === step;
        const done = idx < step;
        return (
          <div key={label} className="flex items-center gap-1.5 lg:gap-2">
            <button onClick={() => onStepClick(idx)} className={`shrink-0 w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-xs lg:text-sm ${active ? 'bg-indigo-600 text-white' : done ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400'} border`}>{done ? '✓' : idx}</button>
            <div className={`text-xs lg:text-sm whitespace-nowrap ${active ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>{label}</div>
          </div>
        );
      })}
    </div>
  );
}
