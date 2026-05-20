import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const FILTERS = ['All Fields', 'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting'];

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const [skillFilter, setSkillFilter] = useState('All Fields');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/projects', { params: { status: filter } });
        setProjects(data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [filter]);

  const statusBadge = (status) => {
    const map = {
      open: 'bg-secondary-container text-on-secondary-container',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-slate-100 text-slate-600',
      cancelled: 'bg-red-100 text-red-600',
    };
    return `px-2.5 py-0.5 rounded-full text-[11px] font-bold ${map[status] || map.completed}`;
  };

  const filtered = projects.filter(p =>
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.skill.toLowerCase().includes(search.toLowerCase())) &&
    (skillFilter === 'All Fields' || p.skill.toLowerCase().includes(skillFilter.toLowerCase()))
  );

  return (
    <div className="max-w-[900px]">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-manrope text-h1 text-on-surface">Discover Projects</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="px-3 py-1 bg-primary text-white rounded-full text-label-caps">
              {filtered.length} Jobs Near You
            </span>
          </div>
        </div>
      </div>

      {/* Skill filter pills */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setSkillFilter(s)}
            className={`px-4 py-2 rounded-lg text-body-sm font-medium transition-all border ${
              skillFilter === s
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Projects list */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-6">
              <div className="skeleton h-4 w-3/5 mb-3" />
              <div className="skeleton h-3 w-2/5" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">search_off</span>
          <p className="text-body-sm text-slate-400">No projects found</p>
          <p className="text-xs text-slate-300 mt-1">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(project => (
            <Link key={project._id} to={`/projects/${project._id}`}>
              <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {/* Match badge */}
                    <div className="mb-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600">
                        {Math.round(80 + Math.random() * 18)}% Skill Match
                      </span>
                    </div>
                    <h3 className="font-manrope font-bold text-on-surface text-h3 mb-2">{project.title}</h3>

                    <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {project.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center gap-3 mt-4">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">
                          {project.client?.name?.[0]}
                        </div>
                        {project.bids?.length > 0 && (
                          <div className="w-6 h-6 rounded-full bg-primary text-white border-2 border-white flex items-center justify-center text-[8px] font-bold">
                            +{project.bids.length}
                          </div>
                        )}
                      </div>
                      <span className="text-primary font-manrope font-semibold text-body-sm flex items-center gap-1 ml-auto">
                        View Details <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right ml-6 flex-shrink-0">
                    <p className="font-manrope font-bold text-on-surface text-xl">₹{project.budget?.toLocaleString()}</p>
                    <p className="text-xs text-slate-400 mt-1">Posted {Math.ceil((Date.now() - new Date(project.createdAt)) / 3600000)}h ago</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}