import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [resendLoading, setResendLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.requiresVerification) {
        toast.error(data.message || 'Please verify your email first.');
        navigate(`/verify-email?email=${encodeURIComponent(data.email || form.email)}`);
      } else {
        toast.error(data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!form.email || !form.email.trim()) {
      toast.error('Enter your email to receive a verification code');
      return;
    }
    setResendLoading(true);
    try {
      const { data } = await api.post('/auth/send-login-otp', { email: form.email });
      toast.success(data.message || 'Verification code sent');
      // If backend returns devOtp in non-production, pass it to the verify page so dev testing works
      const params = new URLSearchParams();
      params.set('email', form.email);
      if (data?.devOtp) params.set('devOtp', data.devOtp);
      navigate(`/verify-email?${params.toString()}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to send verification code';
      toast.error(msg);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0">
        <div className="hidden lg:flex flex-col justify-between bg-primary px-14 py-16 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
              backgroundSize: '28px 28px',
            }}
          />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute top-20 -left-20 w-64 h-64 rounded-full bg-white/5" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
              </div>
              <span className="font-manrope font-extrabold text-white text-xl tracking-tight">SkilledPro</span>
            </div>

            <h2 className="font-manrope font-extrabold text-white leading-tight mb-6" style={{ fontSize: 38 }}>
              The professional marketplace for skilled work.
            </h2>
            <p className="text-primary-fixed-dim text-body-lg mb-12 max-w-sm leading-relaxed">
              Connect with verified contractors or post your next project - all secured by enterprise-grade escrow.
            </p>

            <div className="space-y-5">
              {[
                { icon: 'verified_user', title: '12,400+ Verified Pros', desc: 'Rigorous 5-step vetting process' },
                { icon: 'shield', title: 'Secure Escrow', desc: 'Funds released only on approval' },
                { icon: 'support_agent', title: '24/7 Support', desc: 'Dedicated concierge team' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-white text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <div>
                    <p className="font-manrope font-bold text-white text-body-sm">{title}</p>
                    <p className="text-primary-fixed-dim text-xs">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-16 pt-8 border-t border-white/10">
            <p className="text-primary-fixed-dim text-body-sm italic leading-relaxed">
              "SkilledPro cut our contractor sourcing time by 60%. The escrow system gave us complete confidence."
            </p>
            <p className="text-white font-bold text-body-sm mt-3">Marcus Sterling - Property Manager</p>
          </div>
        </div>

        <div className="flex flex-col justify-center bg-white px-8 md:px-16 py-12">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>construction</span>
            </div>
            <span className="font-manrope font-extrabold text-primary text-lg">SkilledPro</span>
          </div>

          <div className="max-w-md w-full mx-auto">
            <div className="mb-8">
              <p className="text-label-caps text-secondary font-inter mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                SECURE ENTERPRISE LOGIN
              </p>
              <h1 className="font-manrope font-extrabold text-on-surface" style={{ fontSize: 32 }}>
                Welcome back
              </h1>
              <p className="text-slate-500 text-body-sm mt-2">
                Sign in to your SkilledPro account to manage projects and contractors.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-label-caps text-slate-500 mb-2 font-inter tracking-wider">
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    style={{ fontSize: 20 }}
                  >
                    mail
                  </span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{
                      width: '100%',
                      paddingLeft: 48,
                      paddingRight: 16,
                      paddingTop: 14,
                      paddingBottom: 14,
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif',
                      color: '#0b1c30',
                      background: '#fafbff',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#182442';
                      e.target.style.boxShadow = '0 0 0 3px rgba(24,36,66,0.08)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafbff';
                    }}
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="text-label-caps text-slate-500 font-inter tracking-wider">PASSWORD</label>
                    <div className="flex items-center gap-4">
                      <a href="#" className="text-xs font-semibold text-primary hover:underline">Forgot password?</a>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={resendLoading}
                        className="text-xs font-semibold text-indigo-600 hover:underline disabled:opacity-50"
                      >
                        {resendLoading ? 'Sending...' : 'Send verification code'}
                      </button>
                    </div>
                  </div>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    style={{ fontSize: 20 }}
                  >
                    lock
                  </span>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{
                      width: '100%',
                      paddingLeft: 48,
                      paddingRight: 16,
                      paddingTop: 14,
                      paddingBottom: 14,
                      border: '1.5px solid #e2e8f0',
                      borderRadius: 10,
                      fontSize: 14,
                      fontFamily: 'Inter, sans-serif',
                      color: '#0b1c30',
                      background: '#fafbff',
                      outline: 'none',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                      letterSpacing: '0.1em',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#182442';
                      e.target.style.boxShadow = '0 0 0 3px rgba(24,36,66,0.08)';
                      e.target.style.background = 'white';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                      e.target.style.background = '#fafbff';
                    }}
                    placeholder="********"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  background: loading ? '#64748b' : '#182442',
                  color: 'white',
                  borderRadius: 10,
                  fontFamily: 'Manrope, sans-serif',
                  fontWeight: 700,
                  fontSize: 15,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(24,36,66,0.25)',
                  transition: 'all 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In to SkilledPro
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-inter font-medium">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <p className="text-center text-body-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/register" className="font-manrope font-bold text-primary hover:underline">
                Create account
              </Link>
            </p>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: '#006c49' }}>lock</span>
                256-bit SSL
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: '#006c49' }}>verified_user</span>
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1", color: '#006c49' }}>shield</span>
                GDPR Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-slate-100 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-3">
        <span className="font-manrope font-bold text-slate-800 text-sm">SkilledPro</span>
        <div className="flex gap-6 text-xs text-slate-400">
          {['Terms of Service', 'Privacy Policy', 'Trust & Safety', 'Help Center'].map((l) => (
            <a key={l} href="#" className="hover:text-slate-700 transition-colors">{l}</a>
          ))}
        </div>
        <p className="text-xs text-slate-400">Copyright 2024 SkilledPro. All rights reserved.</p>
      </div>
    </div>
  );
}
