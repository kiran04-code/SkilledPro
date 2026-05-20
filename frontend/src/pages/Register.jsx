import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  'IT & Software': ['Web Developer', 'App Developer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer', 'Database Administrator', 'Cloud Architect', 'Cybersecurity Analyst', 'Quality Assurance', 'Systems Admin', 'Data Scientist', 'AI/ML Engineer'],
  'Design & Creative': ['Graphic Designer', 'UI/UX Designer', 'Logo Designer', 'Illustrator', 'Video Editor', 'Animator', 'Photographer', 'Interior Designer', 'Fashion Designer', '3D Modeler', 'Art Director', 'Voice Actor'],
  'Writing & Translation': ['Copywriter', 'Translator', 'Proofreader', 'Content Writer', 'Technical Writer', 'Ghostwriter', 'Grant Writer', 'Transcriptionist', 'Resume Writer'],
  'Sales & Marketing': ['SEO Specialist', 'Social Media Manager', 'Email Marketer', 'Sales Representative', 'Market Researcher', 'Digital Marketer', 'PR Specialist', 'Telemarketer', 'Lead Generator'],
  'Admin & Support': ['Virtual Assistant', 'Data Entry', 'Customer Support', 'Project Manager', 'Transcription', 'Research', 'Tech Support', 'HR Specialist'],
  'Finance & Accounting': ['Accountant', 'Bookkeeper', 'Financial Analyst', 'Tax Preparer', 'Business Consultant', 'Payroll Specialist', 'Auditor'],
  'Engineering & Architecture': ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Architect', 'CAD Designer', 'Structural Engineer'],
  'Home & Maintenance': ['Plumber', 'Painter', 'Electrician', 'Carpenter', 'Gardener', 'Mason', 'Cleaner', 'Pest Control', 'HVAC Technician', 'Roofing', 'Landscaping'],
  'Repair & Automotive': ['AC Repair', 'Mobile Repair', 'Laptop Repair', 'Welder', 'Mechanic', 'Appliance Repair', 'Auto Detailing', 'Plumbing Repair'],
  'Personal & Event Services': ['Fitness Trainer', 'Tutor', 'Chef', 'Pet Sitter', 'Driver', 'Event Planner', 'DJ', 'Caterer', 'Make-up Artist', 'Photographer'],
  'Legal Services': ['Lawyer', 'Paralegal', 'Contract Drafting', 'Intellectual Property', 'Corporate Law', 'Legal Research']
};

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', location: '', lat: null, lng: null, category: '', skills: [], role: 'client' });
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [step, setStep] = useState(1);
  const { register } = useAuth();
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
      navigate(`/verify-email?email=${encodeURIComponent(finalForm.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col">
      {/* Main content - split layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Branding panel */}
        <div className="hidden lg:flex flex-col justify-center px-16 py-20 bg-surface">
          <h1 className="font-manrope text-display text-on-surface tracking-tight mb-6" style={{ fontSize: 42, lineHeight: 1.15 }}>
            Join the world's most elite professional marketplace.
          </h1>
          <p className="text-body-lg text-slate-600 mb-12 max-w-md">
            Access high-tier projects or hire verified industry experts through our secure, glass-transparent ecosystem.
          </p>

          {/* Trust items */}
          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
              <div>
                <p className="font-manrope font-bold text-on-surface text-body-sm">Verified Credentials</p>
                <p className="text-slate-500 text-body-sm">Every professional profile is rigorously vetted.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="material-symbols-outlined text-secondary text-xl flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
              <div>
                <p className="font-manrope font-bold text-on-surface text-body-sm">Secure Escrow</p>
                <p className="text-slate-500 text-body-sm">Payments are protected until work is approved.</p>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-body-sm">Join 50k+ verified professionals today.</p>
        </div>

        {/* Right: Form panel */}
        <div className="flex items-start justify-center px-8 py-10 bg-white">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="font-manrope text-h1 text-on-surface mb-2">Create your account</h2>
              <p className="text-slate-500 text-body-sm">Step {step} of 2: {step === 1 ? 'Basic Information' : 'Location & Skills'}</p>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                {/* Role selector */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'client', icon: 'hub', label: 'I want to hire' },
                    { value: 'worker', icon: 'engineering', label: 'I want to work' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm({ ...form, role: r.value })}
                      className={`relative p-6 border rounded-xl text-center transition-all ${
                        form.role === r.value
                          ? 'border-primary bg-white shadow-md'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {form.role === r.value && (
                        <span className="absolute top-2 right-2 material-symbols-outlined text-secondary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                      <span className="material-symbols-outlined text-3xl text-primary mb-2 block">{r.icon}</span>
                      <span className="font-manrope font-semibold text-on-surface text-body-sm">{r.label}</span>
                    </button>
                  ))}
                </div>

                {/* Form fields */}
                <div>
                  <label className="block text-label-caps text-slate-500 mb-2 font-inter">FULL NAME</label>
                  <input
                    type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-body-sm font-inter"
                    placeholder="Johnathan Doe"
                  />
                </div>

                <div>
                  <label className="block text-label-caps text-slate-500 mb-2 font-inter">BUSINESS EMAIL</label>
                  <input
                    type="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-body-sm font-inter"
                    placeholder="john@company.com"
                  />
                </div>

                <div>
                  <label className="block text-label-caps text-slate-500 mb-2 font-inter">PASSWORD</label>
                  <input
                    type="password" required value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-body-sm font-inter"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-label-caps text-slate-500 mb-2 font-inter">PHONE NUMBER <span className="text-slate-300 font-normal">(optional)</span></label>
                  <input
                    type="tel" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-body-sm font-inter"
                    placeholder="10-digit number"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!form.name || !form.email || !form.password) { toast.error('Please fill all required fields'); return; }
                    setStep(2);
                  }}
                  className="w-full py-3.5 bg-primary text-on-primary rounded-lg font-manrope font-semibold text-button shadow-lg shadow-primary/20 hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Create Account <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>

                <div className="text-center mt-4">
                  <div className="flex items-center justify-center gap-2 text-secondary text-label-caps mb-3">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                    SECURE 256-BIT ENCRYPTION
                  </div>
                  <p className="text-body-sm text-slate-500">
                    Already have an account? <Link to="/login" className="font-bold text-primary hover:underline">Log In</Link>
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location */}
                <div>
                  <label className="block text-label-caps text-slate-500 mb-2 font-inter">LOCATION</label>
                  <input
                    required value={form.location}
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-body-sm font-inter mb-2"
                    placeholder="Enter your address"
                  />
                  <div className="flex gap-2">
                    <button type="button" onClick={handleGetLocation}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-body-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-lg">my_location</span> Use GPS
                    </button>
                    <button type="button" onClick={() => setShowMap(!showMap)}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-body-sm text-slate-600 hover:bg-slate-50 transition-colors">
                      <span className="material-symbols-outlined text-lg">map</span> Pick on Map
                    </button>
                  </div>
                  {form.lat && (
                    <p className="text-xs text-secondary mt-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Coordinates: {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Map modal */}
                {showMap && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden" style={{ height: 250 }}>
                    <MapContainer center={[form.lat || 18.5, form.lng || 73.8]} zoom={13} style={{ height: '100%', width: '100%' }}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker onLocationSelect={handleMapSelect} />
                      {form.lat && <Marker position={[form.lat, form.lng]} />}
                    </MapContainer>
                  </div>
                )}

                {/* Worker-specific fields */}
                {form.role === 'worker' && (
                  <>
                    <div>
                      <label className="block text-label-caps text-slate-500 mb-2 font-inter">CATEGORY</label>
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(CATEGORY_SKILLS).map(cat => (
                          <button
                            key={cat} type="button"
                            onClick={() => setForm({ ...form, category: cat, skills: [] })}
                            className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all border ${
                              form.category === cat
                                ? 'bg-primary text-white border-primary'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-primary'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {form.category && (
                      <div>
                        <label className="block text-label-caps text-slate-500 mb-2 font-inter">SKILLS <span className="text-slate-300 font-normal">(max 2)</span></label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORY_SKILLS[form.category]?.map(skill => (
                            <button
                              key={skill} type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`px-3 py-1.5 rounded-lg text-body-sm font-medium transition-all border ${
                                form.skills.includes(skill)
                                  ? 'bg-secondary text-white border-secondary'
                                  : 'bg-white text-slate-600 border-slate-200 hover:border-secondary'
                              }`}
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-slate-200 text-on-surface rounded-lg font-manrope font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit" disabled={loading}
                    className={`flex-1 py-3 bg-primary text-on-primary rounded-lg font-manrope font-semibold shadow-lg shadow-primary/20 transition-all active:scale-[0.98] ${loading ? 'opacity-60' : 'hover:bg-primary-container'}`}
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="font-manrope font-bold text-slate-900 text-sm">SkilledPro</span>
        <div className="flex gap-6 text-xs text-slate-500">
          {['Terms of Service', 'Privacy Policy', 'Trust & Safety', 'Help Center'].map(l => (
            <a key={l} href="#" className="hover:text-slate-800 transition-colors">{l}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
