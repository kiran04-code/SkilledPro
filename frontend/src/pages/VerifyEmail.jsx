import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle, Loader, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import OTPInput from '../components/OTPInput';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const emailFromQuery = searchParams.get('email') || '';
  const devOtpFromQuery = searchParams.get('devOtp') || '';

  const [status, setStatus] = useState(token ? 'loading' : 'otp');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ email: emailFromQuery, otp: '' });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const verifyLegacyLink = async () => {
      try {
        const { data } = await api.get(`/auth/verify-email?token=${token}`);
        setMessage(data.message);
        setStatus('success');
      } catch (err) {
        const data = err.response?.data;
        setMessage(data?.message || 'Something went wrong. Please try again.');
        setStatus(data?.expired ? 'expired' : 'error');
      }
    };

    verifyLegacyLink();
  }, [token]);

  useEffect(() => {
    if (status === 'otp') {
      // autofocus OTP input when visible
      setTimeout(() => otpInputRef.current?.focus(), 120);
    }
  }, [status]);

  useEffect(() => {
    // if devOtp is provided via query (dev only), prefill OTP and show as message
    if (devOtpFromQuery) {
      setForm((prev) => ({ ...prev, otp: devOtpFromQuery }));
      setMessage((m) => (m ? m + ' ' : '') + `Dev OTP prefilled for testing.`);
    }
  }, [devOtpFromQuery]);

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setVerifyLoading(true);

    try {
      const { data } = await api.post('/auth/verify-email-otp', {
        email: form.email,
        otp: form.otp,
      });
      setMessage(data.message);
      setStatus('success');
    } catch (err) {
      const data = err.response?.data;
      setMessage(data?.message || 'Verification failed. Please try again.');
      setStatus(data?.expired ? 'expired' : 'otp');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;

    setResendLoading(true);
    setResendDone(false);

    try {
      // prefer explicit send-login-otp endpoint so the server sends an OTP for this email
      const { data } = await api.post('/auth/send-login-otp', { email: form.email });
      setMessage(data.message);
      setResendDone(true);
      setStatus('otp');
      // start cooldown (use environment value if provided, otherwise 60s)
      const cooldown = parseInt(import.meta.env.VITE_OTP_RESEND_COOLDOWN_SECONDS || '60', 10);
      setResendCooldown(cooldown);
      const iv = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) { clearInterval(iv); return 0; }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const renderOtpForm = (title, subtitle) => (
    <div className="text-center">
      <div className="flex justify-center mb-5">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <Mail size={32} className="text-indigo-600" />
        </div>
      </div>
      <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{title}</h1>
      <p className="text-zinc-500 mb-6">{subtitle}</p>

      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-left">
        <div className="flex items-start gap-3">
          <ShieldCheck size={18} className="text-indigo-600 mt-0.5" />
          <div>
            <p className="text-indigo-800 text-sm font-medium mb-1">Enter the 6-digit OTP from your email</p>
            <p className="text-indigo-700 text-xs">The code expires in about 5 minutes. You can request a new one below.</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border p-3 text-sm text-left ${resendDone ? 'border-green-200 bg-green-50 text-green-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700'}`}>
          {message}
        </div>
      )}

      {/* Developer OTP hint (visible only when devOtp present in query) */}
      {devOtpFromQuery && (
        <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-left">
          <strong className="text-indigo-700">Dev OTP:</strong> <span className="font-mono ml-2 text-indigo-900">{devOtpFromQuery}</span>
          <div className="text-xs text-zinc-500 mt-1">Displayed only in non-production for local testing.</div>
        </div>
      )}

      <form onSubmit={handleOtpSubmit} className="space-y-3 text-left">
        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Email address</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          placeholder="you@example.com"
          className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Verification code</label>
        <div className="mb-2"><OTPInput value={form.otp} onChange={(v) => setForm((p) => ({ ...p, otp: v }))} /></div>

        <button
          type="submit"
          disabled={verifyLoading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {verifyLoading ? <><Loader size={16} className="animate-spin" /> Verifying...</> : 'Verify Email'}
        </button>
      </form>

      <div className="my-5 h-px bg-zinc-200" />

      <form onSubmit={handleResend} className="space-y-3 text-left">
        <p className="text-sm text-zinc-600 font-medium">Need a new code?</p>
        <button
          type="submit"
          disabled={resendLoading || resendCooldown > 0}
          className="w-full bg-white border border-zinc-300 text-zinc-800 py-2.5 rounded-lg font-semibold hover:bg-zinc-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {resendLoading ? (
            <><Loader size={16} className="animate-spin" /> Sending...</>
          ) : resendCooldown > 0 ? (
            <>Wait {resendCooldown}s</>
          ) : (
            <><RefreshCw size={16} /> Resend OTP</>
          )}
        </button>
      </form>

      <Link to="/login" className="block text-center text-indigo-600 text-sm font-medium mt-5 hover:underline">
        Back to Login
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-zinc-200 w-full max-w-md p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Loader size={32} className="text-indigo-600 animate-spin" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Verifying your email...</h1>
            <p className="text-zinc-500">Please wait a moment.</p>
          </div>
        )}

        {status === 'otp' && renderOtpForm('Verify your email', 'Enter the one-time code sent to your inbox to activate your SkilledPro account.')}

        {status === 'expired' && renderOtpForm('Code expired', 'Your previous code expired. Enter a fresh OTP after requesting a new one below.')}

        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={36} className="text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Email Verified</h1>
            <p className="text-zinc-500 mb-8">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 text-center"
            >
              Continue to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={36} className="text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Verification Failed</h1>
            <p className="text-zinc-500 mb-6">{message}</p>
            <button
              onClick={() => setStatus('otp')}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700"
            >
              Enter OTP Instead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
