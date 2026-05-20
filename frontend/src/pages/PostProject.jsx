import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SKILLS = ['Electrician', 'Plumber', 'Carpenter', 'Web Developer', 'Graphic Designer', 'Painter', 'AC Repair', 'Gardener', 'Mason', 'Welder', 'HVAC', 'Handyman'];

const INFO_CARDS = [
  { icon: 'track_changes', title: 'Describe clearly', desc: 'Better descriptions attract better workers' },
  { icon: 'currency_rupee', title: 'Set fair budget', desc: 'Competitive pay gets faster responses' },
  { icon: 'bolt', title: 'Get bids fast', desc: 'Workers typically respond within hours' },
];

export default function PostProject() {
  const [form, setForm] = useState({ title: '', description: '', skill: '', location: '', budget: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/projects', form);
      toast.success('Project posted successfully!');
      navigate(`/projects/${data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post project');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-[720px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-manrope text-h1 text-on-surface">Post a Project</h1>
        <p className="text-slate-500 text-body-sm mt-2">Describe your job and receive competitive bids from skilled workers</p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {INFO_CARDS.map(({ icon, title, desc }) => (
          <div key={title} className="bg-white border border-slate-200 rounded-xl p-5 text-center">
            <div className="w-10 h-10 bg-surface-container-low rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-primary">{icon}</span>
            </div>
            <p className="font-manrope font-bold text-on-surface text-body-sm mb-1">{title}</p>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-white border border-slate-200 rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Title */}
          <div>
            <label className="block text-label-caps text-slate-500 mb-2 font-inter">PROJECT TITLE</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">work</span>
              <input
                required
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-lg text-body-sm font-inter focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                placeholder="e.g. Fix kitchen wiring, Plumbing repair, Website design"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-label-caps text-slate-500 mb-2 font-inter">DESCRIPTION</label>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-3.5 border border-slate-200 rounded-lg text-body-sm font-inter focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10 resize-none"
              placeholder="Describe what needs to be done, any specific requirements, timeline, or materials needed..."
            />
            <p className="text-xs text-slate-400 mt-1.5">{form.description.length}/500 characters</p>
          </div>

          {/* Skill chips */}
          <div>
            <label className="block text-label-caps text-slate-500 mb-3 font-inter">SKILL REQUIRED</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ ...form, skill: s })}
                  className={`px-4 py-2 rounded-lg text-body-sm font-medium border transition-all ${
                    form.skill === s
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {/* Hidden validation input */}
            <input type="text" required value={form.skill} onChange={() => {}} style={{ opacity: 0, height: 0, position: 'absolute', pointerEvents: 'none' }} />
          </div>

          {/* Location */}
          <div>
            <label className="block text-label-caps text-slate-500 mb-2 font-inter">LOCATION</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">location_on</span>
              <input
                required
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-lg text-body-sm font-inter focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                placeholder="e.g. Pune, Maharashtra"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-label-caps text-slate-500 mb-2 font-inter">BUDGET</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-inter">₹</span>
              <input
                required
                type="number"
                min="1"
                value={form.budget}
                onChange={e => setForm({ ...form, budget: e.target.value })}
                className="w-full pl-10 pr-4 py-3.5 border border-slate-200 rounded-lg text-body-sm font-inter focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/10"
                placeholder="Enter your budget amount"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !form.skill}
              className={`w-full py-4 rounded-xl font-manrope font-bold text-button flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
                loading || !form.skill
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-primary text-white hover:bg-primary-container shadow-primary/25'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post Project
                  <span className="material-symbols-outlined">arrow_forward</span>
                </>
              )}
            </button>
            <p className="text-center text-xs text-slate-400 mt-3">
              Workers will be notified and can start bidding immediately
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}