import { useEffect, useRef, useState } from 'react';

export default function OTPInput({ length = 6, value = '', onChange, autoFocus = true }) {
  const [values, setValues] = useState(() => Array(length).fill(''));
  const refs = useRef([]);

  useEffect(() => {
    if (value) {
      const chars = value.toString().slice(0, length).split('');
      const newVals = Array(length).fill('');
      chars.forEach((c, i) => (newVals[i] = c));
      setValues(newVals);
    }
  }, [value, length]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (idx, v) => {
    if (!/^[0-9]*$/.test(v)) return;
    const newVals = [...values];
    newVals[idx] = v.slice(-1);
    setValues(newVals);
    onChange(newVals.join(''));
    if (v && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !values[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < length - 1) refs.current[idx + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('Text').replace(/\D/g, '').slice(0, length).split('');
    if (pasted.length === 0) return;
    const newVals = Array(length).fill('');
    pasted.forEach((c, i) => (newVals[i] = c));
    setValues(newVals);
    onChange(newVals.join(''));
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          value={values[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          inputMode="numeric"
          maxLength={1}
          className="w-12 h-12 text-center text-lg font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      ))}
    </div>
  );
}
