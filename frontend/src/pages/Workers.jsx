import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CATEGORY_SKILLS } from './Register';

export default function Workers() {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', skill: '', rating: '', experience: '', distance: '' });
  const userCoordsRef = useRef(null);
  const [searchParams] = useSearchParams();
  const [rotationSeed, setRotationSeed] = useState(0);

  useEffect(() => {
    const skill = searchParams.get('skill') || '';
    setFilters(f => ({ ...f, skill }));
    navigator.geolocation.getCurrentPosition(
      (pos) => { userCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; },
      () => {}
    );
  }, [searchParams]);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);
      try {
        const params = {};
        if (filters.category) params.category = filters.category;
        if (filters.skill) params.skill = filters.skill;
        if (filters.rating) params.minRating = filters.rating;
        const coords = userCoordsRef.current;
        if (filters.distance && coords) params.maxDistance = filters.distance;
        if (coords) { params.lat = coords.lat; params.lng = coords.lng; }
        const { data } = await api.get('/users/workers', { params });
        let filtered = data;
        if (filters.experience === 'entry') filtered = data.filter(w => w.totalJobsDone >= 0 && w.totalJobsDone <= 5);
        else if (filters.experience === 'intermediate') filtered = data.filter(w => w.totalJobsDone > 5 && w.totalJobsDone <= 20);
        else if (filters.experience === 'expert') filtered = data.filter(w => w.totalJobsDone > 20);
        const newWorkers = filtered.filter(w => w.totalJobsDone < 10);
        const experienced = filtered.filter(w => w.totalJobsDone >= 10);
        const rotated = [...newWorkers].sort((a, b) => ((a._id.charCodeAt(0) + rotationSeed) % 10) - ((b._id.charCodeAt(0) + rotationSeed) % 10));
        setWorkers([...rotated, ...experienced.sort((a, b) => b.avgRating - a.avgRating)]);
      } catch (err) {
        console.error(err);
        toast.error('Could not connect to server.');
      } finally { setLoading(false); }
    };
    const t = setTimeout(fetchWorkers, 300);
    return () => clearTimeout(t);
  }, [filters, rotationSeed]);

  const handleDistanceChange = (e) => {
    const val = e.target.value;
    if (val && !userCoordsRef.current) {
      toast.loading('Getting your location...', { id: 'locToast' });
      navigator.geolocation.getCurrentPosition(
        (pos) => { toast.dismiss('locToast'); userCoordsRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }; setFilters(f => ({ ...f, distance: val })); },
        () => { toast.dismiss('locToast'); toast.error('Location access needed for distance filtering.'); setFilters(f => ({ ...f, distance: '' })); }
      );
    } else { setFilters(f => ({ ...f, distance: val })); }
  };

  const resetFilters = () => setFilters({ category: '', skill: '', rating: '', experience: '', distance: '' });

  const filteredWorkers = workers.filter(w =>
    !search || w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.skills?.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  const selectClass = "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-body-sm font-inter text-slate-700 bg-white focus:outline-none focus:border-primary cursor-pointer";

  return (
    <div className="max-w-[1100px]">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div>
          <h1 className="font-manrope text-h1 text-on-surface">Hire Talent</h1>
          <p className="text-body-sm text-slate-500 mt-1">
            {workers.length} verified skilled professionals available
          </p>
        </div>
        <button
          onClick={() => setRotationSeed(s => s + 1)}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-body-sm font-inter text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Refresh Listing
        </button>
      </div>

      {/* New worker notice */}
      <div className="mb-6 p-3 rounded-lg bg-secondary-container/20 border border-secondary-container flex items-center gap-3">
        <span className="material-symbols-outlined text-secondary text-base">new_releases</span>
        <p className="text-body-sm text-on-secondary-container">
          <strong>New workers appear first</strong> — giving fresh talent a fair chance. Click "Refresh" to rotate the order.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex gap-3 flex-wrap items-end">
          {/* Search */}
          <div className="flex-[2] min-w-[180px] relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or skill..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-body-sm font-inter focus:outline-none focus:border-primary"
            />
          </div>

          {/* Category */}
          <div className="flex-1 min-w-[130px]">
            <p className="text-label-caps text-slate-400 mb-1.5">CATEGORY</p>
            <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value, skill: '' }))} className={selectClass}>
              <option value="">All Categories</option>
              {Object.keys(CATEGORY_SKILLS).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          {/* Skill */}
          <div className="flex-1 min-w-[130px]">
            <p className="text-label-caps text-slate-400 mb-1.5">SKILL</p>
            <select value={filters.skill} onChange={e => setFilters(f => ({ ...f, skill: e.target.value }))} disabled={!filters.category} className={`${selectClass} ${!filters.category ? 'opacity-50' : ''}`}>
              <option value="">All Skills</option>
              {filters.category && CATEGORY_SKILLS[filters.category].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Rating */}
          <div className="flex-1 min-w-[110px]">
            <p className="text-label-caps text-slate-400 mb-1.5">RATING</p>
            <select value={filters.rating} onChange={e => setFilters(f => ({ ...f, rating: e.target.value }))} className={selectClass}>
              <option value="">Any</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
          </div>

          {/* Experience */}
          <div className="flex-1 min-w-[130px]">
            <p className="text-label-caps text-slate-400 mb-1.5">EXPERIENCE</p>
            <select value={filters.experience} onChange={e => setFilters(f => ({ ...f, experience: e.target.value }))} className={selectClass}>
              <option value="">Any Level</option>
              <option value="entry">Entry (0–5 jobs)</option>
              <option value="intermediate">Intermediate (5–20)</option>
              <option value="expert">Expert (20+)</option>
            </select>
          </div>

          {/* Distance */}
          <div className="flex-1 min-w-[120px]">
            <p className="text-label-caps text-slate-400 mb-1.5">DISTANCE</p>
            <select value={filters.distance} onChange={handleDistanceChange} className={selectClass}>
              <option value="">Anywhere</option>
              <option value="5">Within 5 km</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
            </select>
          </div>

          {/* Reset */}
          <button onClick={resetFilters} className="flex items-center gap-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-body-sm text-slate-500 hover:bg-slate-50 transition-colors flex-shrink-0">
            <span className="material-symbols-outlined text-base">filter_list_off</span>
            Reset
          </button>
        </div>
      </div>

      {/* Worker Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="flex gap-3 mb-4">
                <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-1"><div className="skeleton h-4 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></div>
              </div>
              <div className="skeleton h-3 w-full mb-2" />
              <div className="skeleton h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-5xl text-slate-200 mb-4 block">engineering</span>
          <p className="text-body-sm text-slate-400 mb-2">No workers found</p>
          <p className="text-xs text-slate-300">Try adjusting your filters</p>
          <button onClick={resetFilters} className="mt-4 px-5 py-2.5 bg-primary text-white rounded-lg text-body-sm font-manrope font-semibold hover:bg-primary-container transition-colors">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkers.map((worker, index) => {
            const initials = worker.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const completionScore = worker.completionScore || 0;
            const segments = 5;
            const filled = Math.round((completionScore / 100) * segments);

            return (
              <Link key={worker._id} to={`/workers/${worker._id}`}>
                <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-lg transition-all h-full relative group">
                  {/* Badge */}
                  {worker.totalJobsDone < 10 && (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-secondary-container text-on-secondary-container rounded-full text-[10px] font-bold">
                      NEW
                    </span>
                  )}
                  {index === 0 && worker.totalJobsDone >= 10 && (
                    <span className="absolute top-4 right-4 px-2.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                      TOP RATED
                    </span>
                  )}

                  {/* Profile */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center font-manrope font-bold text-primary flex-shrink-0">
                      {worker.avatar ? <img src={worker.avatar} className="w-full h-full object-cover" alt="" /> : initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-manrope font-bold text-on-surface text-body-sm truncate">{worker.name}</h3>
                        {worker.isVerified && (
                          <span className="material-symbols-outlined text-secondary text-sm flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        )}
                      </div>
                      {/* Stars */}
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <span key={s} className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1", fontSize: 14, color: s <= Math.round(worker.avgRating) ? '#f59e0b' : '#e2e8f0' }}>star</span>
                        ))}
                        <span className="text-xs text-slate-500 ml-1">{worker.avgRating || 'New'} ({worker.totalReviews || 0})</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {worker.location || 'Location not set'}
                    {worker.distance && <span className="text-slate-300">· {worker.distance.toFixed(1)} mi</span>}
                  </div>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {worker.skills?.slice(0, 3).map(s => (
                      <span key={s} className="px-2.5 py-0.5 border border-slate-200 rounded text-xs text-slate-600 font-medium">{s}</span>
                    ))}
                    {worker.skills?.length > 3 && <span className="text-xs text-slate-400 self-center">+{worker.skills.length - 3} more</span>}
                  </div>

                  {/* Profile strength */}
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                      <span className="font-semibold uppercase tracking-wider">Profile Strength</span>
                      <span>{completionScore}%</span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: segments }).map((_, i) => (
                        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? 'bg-secondary-light' : 'bg-slate-100'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">{worker.totalJobsDone || 0} jobs done</span>
                    <span className="text-primary font-manrope font-semibold text-body-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                      View Profile <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}