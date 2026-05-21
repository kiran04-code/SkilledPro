import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import VerifyModal from '../components/VerifyModal';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion } from '../utils/motion';
import OTPInput from '../components/OTPInput';
import Stepper from '../components/Stepper';
import PremiumInput from '../components/PremiumInput';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationPicker({ onLocationSelect }) {
  useMapEvents({ click(e) { onLocationSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
}

export const CATEGORY_SKILLS = {
  'IT & Software': ['Web Developer', 'App Developer', 'Frontend Developer', 'Backend Developer'],
  'Design & Creative': ['Graphic Designer', 'UI/UX Designer', 'Logo Designer'],
  'Writing & Translation': ['Copywriter', 'Translator', 'Proofreader'],
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: '', lat: null, lng: null, category: '', skills: [], role: 'client', companyName: '', bio: '' });
  const [loading, setLoading] = useState(false);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [serverMessage, setServerMessage] = useState('');
  const [serverDevOtp, setServerDevOtp] = useState('');
  const [serverOtpSent, setServerOtpSent] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [step, setStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const { register, logout } = useAuth();
  const navigate = useNavigate();

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data?.display_name) setForm(prev => ({ ...prev, location: data.display_name }));
    } catch (err) { console.error(err); }
  };

  const handleGetLocation = () => {
    toast.loading('Fetching GPS location...', { id: 'getLoc' });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss('getLoc');
        setForm(prev => ({ ...prev, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        toast.success('📍 GPS Location captured!');
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      () => { toast.dismiss('getLoc'); toast.error('Location access denied.'); }
    );
  };

  const handleMapSelect = (lat, lng) => {
    setForm(prev => ({ ...prev, lat, lng }));
    toast.success('📍 Location pinned!');
    reverseGeocode(lat, lng);
    setTimeout(() => setShowMap(false), 800);
  };

  const toggleSkill = (skill) => {
    setForm(prev => {
      const isSelected = prev.skills.includes(skill);
      if (!isSelected && prev.skills.length >= 2) { toast.error('Maximum 2 skills allowed.'); return prev; }
      return { ...prev, skills: isSelected ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let finalForm = { ...form };
    if (!form.lat && form.location) {
      toast.loading('Verifying address...', { id: 'geocode' });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(form.location)}`);
        const data = await res.json();
        toast.dismiss('geocode');
        if (data?.length > 0) { finalForm.lat = parseFloat(data[0].lat); finalForm.lng = parseFloat(data[0].lon); }
        else { toast.error('Could not locate address. Use map or GPS.'); setLoading(false); return; }
      } catch { toast.dismiss('geocode'); toast.error('Error verifying address.'); setLoading(false); return; }
    }
    try {
      const data = await register(finalForm);
      toast.success(data.message || 'Account created. Please verify your email.');
      setServerMessage(data.message || 'Account created. Please verify your email.');
      if (data?.devOtp) setServerDevOtp(data.devOtp);
      setServerOtpSent(Boolean(data?.otpSent || data?.devOtp));
      try { logout(); } catch (e) { localStorage.removeItem('token'); localStorage.removeItem('user'); }
      setVerifyModalOpen(true);
    } catch (err) { toast.error(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!verifyModalOpen || !serverOtpSent) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('email', form.email);
      if (serverDevOtp) params.set('devOtp', serverDevOtp);
      setVerifyModalOpen(false);
      navigate(`/verify-email?${params.toString()}`);
    }, 2500);
    return () => clearTimeout(t);
  }, [verifyModalOpen, serverOtpSent]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
        {/* Left - branding */}
        <div className="hidden lg:flex flex-col justify-center rounded-2xl p-10 bg-white/40 backdrop-blur-md shadow-2xl border border-white/20">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Join SkilledPro</h1>
          <p className="text-slate-600 mb-6">Create a premium profile to access verified projects and trusted contractors. Choose your role and get started.</p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-600/10 flex items-center justify-center">🔒</div>
              <div>
                <p className="font-semibold">Secure onboarding</p>
                <p className="text-xs text-slate-500">Enterprise-grade security and verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center">⚡</div>
              <div>
                <p className="font-semibold">Fast hiring</p>
                <p className="text-xs text-slate-500">Find or post jobs quickly with smart matching</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right - form */}
        <motion.div initial={{ scale: 0.99 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }} className="bg-white rounded-2xl shadow-xl p-8">
          <Stepper step={step} labels={[ 'Role', 'Details', 'Professional', 'Location', 'Verify' ]} onStepClick={(s) => setStep(s)} />

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {step === 1 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <button type="button" onClick={() => setForm({ ...form, role: 'client' })} className={`w-full p-6 rounded-xl border ${form.role === 'client' ? 'border-indigo-500 bg-indigo-50 shadow' : 'border-slate-200'}`}>
                    <p className="font-semibold">I want to hire</p>
                    <p className="text-xs text-slate-500">Post projects and hire professionals</p>
                  </button>
                </div>
                <div>
                  <button type="button" onClick={() => setForm({ ...form, role: 'worker' })} className={`w-full p-6 rounded-xl border ${form.role === 'worker' ? 'border-indigo-500 bg-indigo-50 shadow' : 'border-slate-200'}`}>
                    <p className="font-semibold">I want to work</p>
                    <p className="text-xs text-slate-500">Find projects and grow your portfolio</p>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
                <PremiumInput label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
                <PremiumInput label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-2 block">Password</label>
                  <div className="relative">
                    <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type={passwordVisible ? 'text' : 'password'} className="w-full px-4 py-3 border rounded-lg" />
                    <button type="button" onClick={() => setPasswordVisible(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">{passwordVisible ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
                <PremiumInput label="Phone (optional)" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
                {form.role === 'worker' ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Category</label>
                      <div className="flex gap-2 flex-wrap">
                        {Object.keys(CATEGORY_SKILLS).map(cat => (
                          <button key={cat} type="button" onClick={() => setForm({ ...form, category: cat })} className={`px-3 py-1.5 rounded-full border ${form.category === cat ? 'bg-indigo-600 text-white' : 'bg-white'}`}>{cat}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Skills (max 2)</label>
                      <div className="flex gap-2 flex-wrap">
                        {CATEGORY_SKILLS[form.category || Object.keys(CATEGORY_SKILLS)[0]]?.map(skill => (
                          <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`px-3 py-1.5 rounded-full border ${form.skills.includes(skill) ? 'bg-secondary text-white' : 'bg-white'}`}>{skill}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600 mb-2 block">Bio</label>
                      <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full p-3 border rounded-lg" />
                    </div>
                  </>
                ) : (
                  <>
                    <PremiumInput label="Company name" value={form.companyName} onChange={(v) => setForm({ ...form, companyName: v })} />
                    <PremiumInput label="Company description" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} textarea />
                  </>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4">
                <PremiumInput label="Address" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
                <div className="flex gap-2">
                  <button type="button" onClick={handleGetLocation} className="flex-1 py-2 border rounded-lg">Use GPS</button>
                  <button type="button" onClick={() => setShowMap(s => !s)} className="flex-1 py-2 border rounded-lg">Pick on Map</button>
                </div>
                {showMap && (
                  <div className="h-56 border rounded-lg overflow-hidden">
                    <MapContainer center={[form.lat || 18.5, form.lng || 73.8]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker onLocationSelect={handleMapSelect} />
                      {form.lat && <Marker position={[form.lat, form.lng]} />}
                    </MapContainer>
                  </div>
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="space-y-4 text-center">
                <p className="text-sm text-slate-600">Enter the verification code sent to <strong>{form.email}</strong></p>
                <OTPInput value="" onChange={() => {}} />
                <div className="flex gap-2 mt-4">
                  <button type="button" onClick={() => setStep(4)} className="flex-1 py-2 border rounded-lg">Back</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">{loading ? 'Creating...' : 'Finish & Verify'}</button>
                </div>
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-indigo-600 font-semibold">Log in</Link></div>
              <div className="flex gap-2">
                {step > 1 && <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} className="text-sm px-3 py-2 border rounded">Back</button>}
                {step < 5 && <button type="button" onClick={() => setStep(s => Math.min(5, s + 1))} className="text-sm px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded">Next</button>}
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>

      <VerifyModal
        open={verifyModalOpen}
        email={form.email}
        devOtp={serverDevOtp}
        initialSent={serverOtpSent}
        onClose={() => setVerifyModalOpen(false)}
        onVerified={() => {
          setVerifyModalOpen(false);
          toast.success('Email verified — you can now log in');
          navigate('/login');
        }}
      />
    </div>
  );
}

