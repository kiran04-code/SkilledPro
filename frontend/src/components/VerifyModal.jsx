import { useEffect, useRef, useState } from 'react';
import OTPInput from './OTPInput';
import api from '../utils/api';
import { Loader, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_COOLDOWN = parseInt(import.meta.env.VITE_OTP_RESEND_COOLDOWN_SECONDS || '30', 10);

export default function VerifyModal({ open, email, onClose, onVerified, devOtp, initialSent = false, flow = 'signup' }) {
  const [otp, setOtp] = useState(devOtp || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    setMessage('');
    setSuccess(false);
    setOtp(devOtp || '');
    // if OTP was just sent during registration, start cooldown to prevent immediate resend
    if (initialSent) {
      setCooldown(DEFAULT_COOLDOWN);
    }
  }, [open, devOtp, initialSent]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const iv = setInterval(() => setCooldown(c => {
      if (c <= 1) { clearInterval(iv); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [cooldown]);

  const handleVerify = async () => {
    if (!email) return setMessage('Email missing');
    if (otp.length !== 6) return setMessage('Enter 6-digit code');
    if (verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    try {
      // call the appropriate verification endpoint depending on flow
      const endpoint = flow === 'login' ? '/auth/verify-login-otp' : '/auth/verify-signup-otp';
      const { data } = await api.post(endpoint, { email, otp });
      setMessage(data.message || 'Verified');
      setSuccess(true);
      toast.success(data.message || 'Email verified');
      // small delay to show success animation
      setTimeout(() => onVerified?.(), 900);
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed';
      setMessage(msg);
      toast.error(msg);
    } finally { setLoading(false); verifyingRef.current = false; }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    try {
      // choose resend endpoint based on flow
      const endpoint = flow === 'login' ? '/auth/send-login-otp' : '/auth/send-signup-otp';
      const { data } = await api.post(endpoint, { email });
      setMessage(data.message || 'OTP sent');
      toast.success(data.message || 'OTP sent');
      setCooldown(parseInt(import.meta.env.VITE_OTP_RESEND_COOLDOWN_SECONDS || '30', 10));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resend';
      setMessage(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  };

  // Do NOT auto-verify; require the user to click Verify per security requirement.

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-lg">
        <h3 className="text-lg font-semibold mb-2">Verify your email</h3>
        <p className="text-sm text-zinc-600 mb-4">Enter the 6-digit code sent to <strong>{email}</strong></p>
        {message && <div className={`mb-3 text-sm ${success ? 'text-green-700' : 'text-red-600'}`}>{message}</div>}
        <OTPInput value={otp} onChange={setOtp} />
        <div className="mt-4 flex gap-3">
          <button onClick={handleResend} disabled={cooldown > 0 || loading} className="flex-1 py-2 border rounded">
            {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}
          </button>
          <button onClick={handleVerify} disabled={otp.length !== 6 || loading} className="flex-1 py-2 bg-indigo-600 text-white rounded">
            {loading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : 'Verify'}</button>
        </div>
        <div className="mt-3 text-right">
          <button onClick={onClose} className="text-sm text-zinc-500">Close</button>
        </div>
      </div>
    </div>
  );
}
