import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { Star, MapPin, CheckCircle, ExternalLink, Briefcase } from 'lucide-react';

export default function WorkerProfile() {
  const { id } = useParams();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        let lat = null;
        let lng = null;

        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              lat = pos.coords.latitude;
              lng = pos.coords.longitude;
              resolve();
            },
            () => resolve()
          );
        });

        const [wRes, rRes] = await Promise.all([
          api.get(`/users/${id}`, { params: { lat, lng } }),
          api.get(`/reviews/${id}`),
        ]);
        setWorker(wRes.data);
        setReviews(rRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-zinc-400 text-sm">Loading...</div>;
  if (!worker) return <div className="text-center py-20 text-zinc-400 text-sm">Worker not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">
      {/* Profile Card */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6 mb-4">
        <div className="flex items-start gap-5 flex-wrap">
          <div className="w-16 h-16 bg-zinc-100 rounded-full overflow-hidden flex items-center justify-center text-2xl font-bold text-zinc-600 shrink-0">
            {worker.avatar ? <img src={worker.avatar} className="w-16 h-16 rounded-full object-cover" alt="" /> : worker.name[0]}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-zinc-900">{worker.name}</h1>
              {worker.isVerified && (
                <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                  <CheckCircle size={11} /> Verified
                </span>
              )}
              {worker.totalJobsDone < 10 && (
                <span className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded font-medium">New Worker</span>
              )}
              {worker.nearbyJobsCount > 0 && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <CheckCircle size={11} /> Active in your locality
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 mb-1.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={14} fill={s <= Math.round(worker.avgRating) ? 'currentColor' : 'none'} />
              ))}
              <span className="text-zinc-700 text-sm font-medium ml-1">{worker.avgRating || 0}</span>
              <span className="text-zinc-400 text-xs">({worker.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-zinc-400 text-xs">
              <MapPin size={12} /> {worker.location || 'Location not set'}
            </div>
            {worker.bio && <p className="text-zinc-600 text-sm mt-3 leading-relaxed">{worker.bio}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Jobs Done', value: worker.totalJobsDone },
            { label: 'Avg Rating', value: worker.avgRating || '—' },
            { label: 'Profile Score', value: `${worker.completionScore}%` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-50 rounded-md p-4 text-center border border-zinc-100">
              <p className="text-xl font-bold text-zinc-900">{value}</p>
              <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {worker.skills?.map(s => (
              <span key={s} className="border border-zinc-200 text-zinc-600 text-xs px-2.5 py-1 rounded-md font-medium">{s}</span>
            ))}
          </div>
        </div>

        {/* Local Trust Indicator */}
        {worker.nearbyJobsCount > 0 && (
          <div className="mt-5 bg-emerald-50 border border-emerald-200 rounded-md p-4 flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-emerald-800 text-sm">Trusted Local Experience</h3>
              <p className="text-emerald-700 text-xs mt-0.5">
                This worker has successfully completed <strong>{worker.nearbyJobsCount} jobs</strong> near your current area.
              </p>
            </div>
          </div>
        )}

        {/* GitHub */}
        {worker.githubUrl && (
          <a href={worker.githubUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 mt-4 text-xs text-zinc-500 hover:text-indigo-600 transition-colors">
            <ExternalLink size={13} /> {worker.githubUrl}
          </a>
        )}

        {/* Area history */}
        {worker.areaJobHistory?.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-2">Local Work History</h3>
            <div className="flex flex-wrap gap-2">
              {worker.areaJobHistory.map((a, i) => (
                <span key={i} className="bg-zinc-50 border border-zinc-200 text-zinc-600 px-2.5 py-1 rounded-md text-xs">
                  {a.area}: {a.count} jobs
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="font-bold text-zinc-900 text-base mb-5">Client Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-zinc-400 text-center py-8 text-sm">No reviews yet</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {reviews.map(r => (
              <div key={r._id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-zinc-800 text-sm">{r.client?.name}</span>
                  <div className="flex text-amber-400 gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={12} fill={s <= r.rating ? 'currentColor' : 'none'} />)}
                  </div>
                </div>
                <p className="text-zinc-600 text-sm leading-relaxed">{r.comment}</p>
                <p className="text-xs text-zinc-400 mt-1.5">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}