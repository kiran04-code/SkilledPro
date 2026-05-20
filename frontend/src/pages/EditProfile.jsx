import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Camera, Upload, X } from 'lucide-react';

const SKILLS = ['Electrician','Plumber','Carpenter','Web Developer','Graphic Designer','Painter','AC Repair','Gardener','Mason','Welder'];

export default function EditProfile() {
  const { user, updateUser, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    bio: '',
    location: '',
    skills: [],
    githubUrl: '',
    phone: '',
    category: '',
  });
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState('');
  const [portfolioUrls, setPortfolioUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const avatarRef = useRef();
  const portfolioRef = useRef();

  const isWorker = user?.skills && user.skills.length > 0;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setForm({
          name: data.name || '',
          bio: data.bio || '',
          location: data.location || '',
          skills: data.skills || [],
          githubUrl: data.githubUrl || '',
          phone: data.phone || '',
          category: data.category || '',
        });
        setAvatar(data.avatar || '');
        setPortfolioUrls(data.portfolioUrls || []);
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    };
    loadProfile();
  }, []);

  const toggleSkill = (skill) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await api.post('/uploads/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAvatar(data.avatar);
      updateUser({ avatar: data.avatar, completionScore: data.completionScore });
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error('Failed to upload photo');
    } finally { setUploading(false); }
  };

  const handlePortfolioUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('portfolio', file);
      const { data } = await api.post('/uploads/portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPortfolioUrls(prev => [...prev, data.url]);
      toast.success('Portfolio item added!');
    } catch (err) {
      toast.error('Failed to upload portfolio item');
    } finally { setUploading(false); }
  };

  const removePortfolio = async (url) => {
    try {
      await api.delete('/uploads/portfolio', { data: { url } });
      setPortfolioUrls(prev => prev.filter(u => u !== url));
      toast.success('Removed');
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const [isLocked, setIsLocked] = useState(user?.verificationStatus === 'approved');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user?.verificationStatus === 'approved') {
      const confirmEdit = window.confirm(
        "⚠️ Note: Editing your profile after verification will reset your status to 'Pending' and you will need to be re-verified by an admin. Do you want to continue?"
      );
      if (!confirmEdit) return;
    }

    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', form);
      updateUser(data.user);
      setIsLocked(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setLoading(false); }
  };

  if (fetching) return (
    <div className="text-center py-20 text-zinc-400 text-sm">Loading profile...</div>
  );

  const inputClass = "w-full border border-zinc-300 rounded-md px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-zinc-900 placeholder-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400";
  const labelClass = "block text-sm font-medium text-zinc-700 mb-1.5";
  const sectionClass = "bg-white border border-zinc-200 rounded-lg p-6 mb-4";

  return (
    <div className="max-w-2xl mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 mb-1">Edit Profile</h1>
        <p className="text-zinc-500 text-sm">
          {isWorker
            ? 'Complete your profile to get more visibility and higher ranking'
            : 'Keep your profile up to date to hire the best workers'}
        </p>
      </div>

      {/* Verified lock banner */}
      {isWorker && user?.verificationStatus === 'approved' && isLocked && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4 flex justify-between items-center">
          <p className="text-emerald-700 text-sm font-medium">
            ✓ Your profile is verified. Editing is locked to maintain integrity.
          </p>
          <button
            onClick={() => setIsLocked(false)}
            className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 transition-colors font-medium"
          >
            Unlock to Edit
          </button>
        </div>
      )}

      {/* Profile Photo */}
      <div className={`${sectionClass} ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <h2 className="text-sm font-semibold text-zinc-700 mb-4 uppercase tracking-wide">Profile Photo</h2>
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-zinc-100 rounded-full overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-zinc-500">{user?.name?.[0]}</span>
              )}
            </div>
            {!isLocked && (
              <button
                onClick={() => avatarRef.current.click()}
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full hover:bg-indigo-700 transition-colors"
              >
                <Camera size={12} />
              </button>
            )}
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-sm text-zinc-700 font-medium">Upload a profile photo</p>
            <p className="text-xs text-zinc-400 mt-0.5">JPG, PNG or WebP. Max 5MB.</p>
            {uploading && <p className="text-xs text-indigo-500 mt-1">Uploading...</p>}
          </div>
        </div>
      </div>

      {/* Basic Info Form */}
      <div className={`${sectionClass} ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <h2 className="text-sm font-semibold text-zinc-700 mb-5 uppercase tracking-wide">Basic Info</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            ['name', 'Full Name', 'text', 'Your full name'],
            ['bio', 'Bio', 'text', 'Tell clients about yourself'],
            ['location', 'Location', 'text', 'e.g. Pune, Maharashtra'],
            ['phone', 'Phone Number', 'text', '10-digit number'],
          ].map(([field, label, type, placeholder]) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <input
                type={type}
                value={form[field]}
                disabled={isLocked}
                onChange={e => setForm({ ...form, [field]: e.target.value })}
                placeholder={placeholder}
                className={inputClass}
              />
            </div>
          ))}

          {/* Worker-only fields */}
          {isWorker && (
            <>
              <div>
                <label className={labelClass}>GitHub URL</label>
                <input type="text" value={form.githubUrl} disabled={isLocked}
                  onChange={e => setForm({ ...form, githubUrl: e.target.value })}
                  placeholder="https://github.com/username" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <input type="text" value={form.category} disabled={isLocked}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Tech Services" className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Skills</label>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => !isLocked && toggleSkill(skill)}
                      disabled={isLocked}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                        form.skills.includes(skill)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-400'
                      } disabled:opacity-50`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="pt-1">
            <button
              type="submit"
              disabled={loading || isLocked}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-md font-semibold hover:bg-indigo-700 disabled:opacity-50 text-sm transition-colors"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Portfolio Upload (workers only) */}
      {isWorker && (
        <div className={sectionClass}>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">Portfolio</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Upload your best work — images or PDFs</p>
            </div>
            <button
              onClick={() => portfolioRef.current.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 border border-zinc-300 text-zinc-600 px-3 py-2 rounded-md text-xs font-medium hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              <Upload size={13} /> Upload
            </button>
            <input ref={portfolioRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handlePortfolioUpload} />
          </div>

          {portfolioUrls.length === 0 ? (
            <div className="border-2 border-dashed border-zinc-200 rounded-md p-8 text-center">
              <Upload size={24} className="text-zinc-300 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">No portfolio items yet</p>
              <p className="text-zinc-300 text-xs mt-1">Upload images or PDFs of your work</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {portfolioUrls.map((url, i) => (
                <div key={i} className="relative group">
                  {url.match(/\.(jpg|jpeg|png|webp)/i) ? (
                    <img src={url} alt={`Portfolio ${i + 1}`}
                      className="w-full h-32 object-cover rounded-md border border-zinc-200" />
                  ) : (
                    <div className="w-full h-32 bg-zinc-50 rounded-md border border-zinc-200 flex items-center justify-center">
                      <p className="text-zinc-400 text-sm font-medium">PDF Document</p>
                    </div>
                  )}
                  <button
                    onClick={() => removePortfolio(url)}
                    className="absolute top-2 right-2 bg-zinc-900 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}