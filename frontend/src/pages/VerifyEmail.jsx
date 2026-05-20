import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle, Loader, Mail, RefreshCw, ShieldCheck } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const emailFromQuery = searchParams.get('email') || '';

  const [status, setStatus] = useState(token ? 'loading' : 'otp');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ email: emailFromQuery, otp: '' });
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

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
      const { data } = await api.post('/auth/resend-verification', { email: form.email });
      setMessage(data.message);
      setResendDone(true);
      setStatus('otp');
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
            <p className="text-indigo-700 text-xs">The code expires in about 10 minutes. You can request a new one below.</p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-4 rounded-lg border p-3 text-sm text-left ${resendDone ? 'border-green-200 bg-green-50 text-green-800' : 'border-zinc-200 bg-zinc-50 text-zinc-700'}`}>
          {message}
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
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          value={form.otp}
          onChange={(e) => setForm((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
          placeholder="123456"
          className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-center tracking-[0.4em] text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

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
          disabled={resendLoading}
          className="w-full bg-white border border-zinc-300 text-zinc-800 py-2.5 rounded-lg font-semibold hover:bg-zinc-50 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {resendLoading ? <><Loader size={16} className="animate-spin" /> Sending...</> : <><RefreshCw size={16} /> Resend OTP</>}
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
