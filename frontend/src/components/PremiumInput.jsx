import React from 'react';

export default function PremiumInput({ label, value, onChange, type = 'text', textarea = false }) {
  if (textarea) {
    return (
      <div>
        <label className="text-sm font-medium text-slate-600 mb-2 block">{label}</label>
        <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-3 border rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-slate-600 mb-2 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />
    </div>
  );
}
