import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { CheckCircle, XCircle, Loader, Mail, RefreshCw } from 'lucide-react';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'expired' | 'pending'
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);

  useEffect(() => {
    if (!token) {
      // No token — user landed on /verify-email after registering
      setStatus('pending');
      return;
    }

    const verify = async () => {
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

    verify();
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) return;
    setResendLoading(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email: resendEmail });
      setResendDone(true);
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-zinc-200 w-full max-w-md p-8">

        {/* LOADING */}
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

        {/* PENDING — registered, waiting for click */}
        {status === 'pending' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <Mail size={32} className="text-indigo-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Check your inbox!</h1>
            <p className="text-zinc-500 mb-6">
              We've sent a verification link to your email address. Click the link to activate your account.
              The link expires in <strong>24 hours</strong>.
            </p>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6 text-left">
              <p className="text-indigo-800 text-sm font-medium mb-1">📬 Didn't receive the email?</p>
              <ul className="text-indigo-700 text-sm space-y-1 list-disc list-inside">
                <li>Check your spam / junk folder</li>
                <li>Make sure you used the correct email</li>
                <li>Use the resend option below</li>
              </ul>
            </div>

            {/* Resend form */}
            {!resendDone ? (
              <form onSubmit={handleResend} className="space-y-3">
                <p className="text-sm text-zinc-600 font-medium text-left">Resend verification email:</p>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resendLoading
                    ? <><Loader size={16} className="animate-spin" /> Sending...</>
                    : <><RefreshCw size={16} /> Resend Email</>
                  }
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
                ✅ {message}
              </div>
            )}

            <Link to="/login" className="block text-center text-indigo-600 text-sm font-medium mt-5 hover:underline">
              ← Back to Login
            </Link>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={36} className="text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Email Verified! 🎉</h1>
            <p className="text-zinc-500 mb-8">{message}</p>
            <Link
              to="/login"
              className="block w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 text-center"
            >
              Continue to Login →
            </Link>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle size={36} className="text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Verification Failed</h1>
            <p className="text-zinc-500 mb-6">{message}</p>
            <Link to="/login" className="block text-center text-indigo-600 font-medium hover:underline">
              ← Back to Login
            </Link>
          </div>
        )}

        {/* EXPIRED — show resend form */}
        {status === 'expired' && (
          <div className="text-center">
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <XCircle size={36} className="text-yellow-600" />
              </div>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">Link Expired</h1>
            <p className="text-zinc-500 mb-6">
              Your verification link has expired. Request a new one below.
            </p>

            {!resendDone ? (
              <form onSubmit={handleResend} className="space-y-3 text-left">
                <label className="block text-xs font-medium uppercase tracking-wide text-zinc-500">Your email address</label>
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full border border-zinc-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resendLoading
                    ? <><Loader size={16} className="animate-spin" /> Sending...</>
                    : <><RefreshCw size={16} /> Send New Link</>
                  }
                </button>
              </form>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm text-left">
                ✅ {message}
              </div>
            )}

            <Link to="/login" className="block text-center text-indigo-600 text-sm font-medium mt-5 hover:underline">
              ← Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
