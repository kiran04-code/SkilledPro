import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Shield, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const [verifyFilter, setVerifyFilter] = useState('all');

  const [reviewingId, setReviewingId] = useState(null);
  const [currentRemark, setCurrentRemark] = useState('');

  const baseUrl = 'http://localhost:5001';

  useEffect(() => {
    const fetch = async () => {
      setError(null);
      try {
        const [uRes, rRes] = await Promise.all([
          api.get('/admin/users'),
          api.get('/admin/revenue'),
        ]);
        setUsers(uRes.data);
        setRevenue(rRes.data);
      } catch (err) { 
        console.error('Admin Fetch Error:', err);
        setError(err.response?.data?.message || 'Failed to load admin data. Ensure you are logged in as an admin.');
        toast.error('Session expired or unauthorized');
      }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const verifyWorker = async (userId, status = 'approved', remark = '') => {
    try {
      if ((status === 'rejected' || status === 'in_review') && !remark) {
        toast.error('Please provide a remark for this status');
        return;
      }
      await api.put(`/admin/verify/${userId}`, { status, remark });
      toast.success(`Worker status updated to ${status}`);
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, verificationStatus: status, verificationRemark: remark, isVerified: status === 'approved' } : u
      ));
      setReviewingId(null);
      setCurrentRemark('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const startReviewWorker = async (userId) => {
    try {
      await api.put(`/admin/review/${userId}`);
      toast.success('Started reviewing worker');
      setUsers(prev => prev.map(u =>
        u._id === userId ? { ...u, verificationStatus: 'in_review' } : u
      ));
      setReviewingId(userId);
      setVerifyFilter('in_review');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to start review'); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-zinc-500 text-sm">Loading admin data...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto mt-20 text-center p-8 bg-white rounded-lg border border-zinc-200">
      <Shield className="text-red-500 mx-auto mb-4" size={28} />
      <h2 className="text-lg font-bold text-zinc-900 mb-2">Access Denied</h2>
      <p className="text-zinc-500 text-sm mb-5">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="bg-indigo-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-indigo-700 text-sm transition-colors"
      >
        Retry / Log In Again
      </button>
    </div>
  );

  const workers = users.filter(u => u.skills?.length > 0 && !u.isAdmin);
  const unverifiedWorkers = workers.filter(u => !u.isVerified);
  const verifiedWorkers = workers.filter(u => u.isVerified);
  const clients = users.filter(u => u.skills?.length === 0 && !u.isAdmin);

  const statusColor = (s) => ({
    pending: 'text-amber-600',
    in_review: 'text-blue-600',
    rejected: 'text-red-600',
    approved: 'text-emerald-600',
    not_submitted: 'text-zinc-400',
  }[s] || 'text-zinc-500');

  return (
    <div className="max-w-6xl mx-auto px-5 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage workers, verify skills, track revenue</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-950 text-white p-5 rounded-lg">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wide mb-2">Total Revenue</p>
          <p className="text-2xl font-bold">₹{revenue?.totalRevenue || 0}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-lg">
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">Completed Projects</p>
          <p className="text-2xl font-bold text-zinc-900">{revenue?.totalProjects || 0}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-lg">
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">Total Users</p>
          <p className="text-2xl font-bold text-zinc-900">{users.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-lg">
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wide mb-2">Pending Verify</p>
          <p className="text-2xl font-bold text-zinc-900">{unverifiedWorkers.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b border-zinc-200">
        {[
          { key: 'overview', label: 'Revenue' },
          { key: 'verify', label: `Verify Workers${unverifiedWorkers.length > 0 ? ` (${unverifiedWorkers.length})` : ''}` },
          { key: 'users', label: `All Users (${users.length})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Revenue */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 text-sm">Revenue Breakdown</h2>
            <p className="text-xs text-zinc-400 mt-0.5">All completed & paid projects</p>
          </div>
          {!revenue?.projects?.length ? (
            <div className="p-10 text-center text-zinc-400">
              <DollarSign size={32} className="mx-auto mb-3 opacity-25" />
              <p className="text-sm">No completed projects yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Project</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Client</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Worker</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Total</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Platform Fee</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Worker Got</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {revenue.projects.map(p => (
                    <tr key={p._id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-zinc-900">{p.title}</td>
                      <td className="px-5 py-3.5 text-zinc-500">{p.client?.name}</td>
                      <td className="px-5 py-3.5 text-zinc-500">{p.selectedWorker?.name}</td>
                      <td className="px-5 py-3.5 text-right font-medium text-zinc-900">₹{p.finalPrice}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-600">₹{p.platformFee}</td>
                      <td className="px-5 py-3.5 text-right text-zinc-600">₹{p.workerEarnings}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-zinc-200 bg-zinc-50">
                    <td colSpan={4} className="px-5 py-3.5 font-semibold text-zinc-700 text-sm">Total Platform Revenue</td>
                    <td className="px-5 py-3.5 text-right font-bold text-emerald-600">₹{revenue.totalRevenue}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Verify Workers */}
      {activeTab === 'verify' && (
        <div className="space-y-4">
          <div className="flex gap-1 mb-4 bg-white border border-zinc-200 rounded-lg p-1.5 w-fit">
            {['all', 'pending', 'in_review', 'rejected'].map(f => (
              <button 
                key={f}
                onClick={() => setVerifyFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-medium capitalize transition-colors ${
                  verifyFilter === f ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:bg-zinc-50'
                }`}
              >
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {unverifiedWorkers.filter(u => verifyFilter === 'all' || u.verificationStatus === verifyFilter).length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-lg p-10 text-center text-zinc-400">
              <CheckCircle size={32} className="mx-auto mb-3 text-emerald-300" />
              <p className="font-medium text-emerald-600 text-sm">No workers in this status category!</p>
            </div>
          ) : (
            <>
              {unverifiedWorkers.filter(u => verifyFilter === 'all' || u.verificationStatus === verifyFilter).map(u => (
                <div key={u._id} className="bg-white border border-zinc-200 rounded-lg p-5">
                  <div className="flex justify-between items-start flex-wrap gap-4 border-b border-zinc-100 pb-4 mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-zinc-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-zinc-600 text-lg">
                        {u.avatar
                          ? <img src={u.avatar.startsWith('http') ? u.avatar : `${baseUrl}/${u.avatar}`} className="w-full h-full object-cover" alt="" />
                          : u.name[0]
                        }
                      </div>
                      <div>
                        <h3 className="font-semibold text-zinc-900">{u.name}</h3>
                        <p className="text-zinc-400 text-xs">{u.email}</p>
                        <p className="text-xs mt-0.5">{u.location} · <span className={`font-semibold capitalize ${statusColor(u.verificationStatus)}`}>{u.verificationStatus.replace('_', ' ')}</span></p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 min-w-[240px]">
                      {u.verificationStatus !== 'approved' && reviewingId !== u._id && (
                        <button onClick={() => startReviewWorker(u._id)}
                          className="border border-zinc-300 text-zinc-700 px-4 py-2 rounded-md font-medium hover:bg-zinc-50 text-sm transition-colors">
                          Start Reviewing
                        </button>
                      )}
                      
                      {(u.verificationStatus === 'in_review' || reviewingId === u._id) && (
                        <>
                          <button onClick={() => verifyWorker(u._id, 'approved')}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-emerald-700 text-sm flex items-center justify-center gap-2 transition-colors">
                            <CheckCircle size={14} /> Approve
                          </button>
                          <div className="flex gap-2">
                            <textarea 
                              placeholder="Remark (required for rejection)..." 
                              className="border border-zinc-300 rounded-md px-3 py-2 text-xs flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              rows={2}
                              value={currentRemark}
                              onChange={(e) => setCurrentRemark(e.target.value)}
                            />
                            <div className="flex flex-col gap-1.5">
                              <button onClick={() => verifyWorker(u._id, 'rejected', currentRemark)}
                                className="border border-red-200 text-red-600 bg-red-50 px-3 py-1.5 rounded-md font-medium hover:bg-red-100 text-xs transition-colors">
                                Reject
                              </button>
                              <button onClick={() => verifyWorker(u._id, 'in_review', currentRemark)}
                                className="border border-blue-200 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md text-xs hover:bg-blue-100 transition-colors">
                                In Review
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                      {u.verificationStatus === 'rejected' && (
                        <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-md border border-red-100">
                          <strong>Remark:</strong> {u.verificationRemark}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide mb-2">Identity Proof</p>
                      {u.identityProof ? (
                        (u.identityProof.toLowerCase().includes('.pdf') || u.identityProof.toLowerCase().includes('pdf')) ? (
                          <div 
                            onClick={() => {
                              let finalUrl = u.identityProof.startsWith('http') ? u.identityProof : `${baseUrl}/${u.identityProof}`;
                              if (finalUrl.toLowerCase().includes('.pdf')) finalUrl = finalUrl.replace(/\.pdf$/i, '.jpg');
                              window.open(finalUrl, '_blank');
                            }}
                            className="bg-zinc-50 border border-zinc-200 text-indigo-600 p-4 rounded-md text-center text-sm font-medium hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            View PDF Document
                          </div>
                        ) : (
                          <a href={u.identityProof.startsWith('http') ? u.identityProof : `${baseUrl}/${u.identityProof}`} target="_blank" rel="noopener noreferrer">
                            <img src={u.identityProof.startsWith('http') ? u.identityProof : `${baseUrl}/${u.identityProof}`} alt="Identity Proof" className="w-full h-28 object-cover rounded-md border border-zinc-200 hover:border-zinc-300" />
                          </a>
                        )
                      ) : <p className="text-xs text-red-500">Not provided</p>}
                    </div>

                    <div>
                      <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide mb-2">Address Proof</p>
                      {u.addressProof ? (
                        (u.addressProof.toLowerCase().includes('.pdf') || u.addressProof.toLowerCase().includes('pdf')) ? (
                          <div 
                            onClick={() => {
                              let finalUrl = u.addressProof.startsWith('http') ? u.addressProof : `${baseUrl}/${u.addressProof}`;
                              if (finalUrl.toLowerCase().includes('.pdf')) finalUrl = finalUrl.replace(/\.pdf$/i, '.jpg');
                              window.open(finalUrl, '_blank');
                            }}
                            className="bg-zinc-50 border border-zinc-200 text-indigo-600 p-4 rounded-md text-center text-sm font-medium hover:bg-zinc-100 transition-colors cursor-pointer"
                          >
                            View PDF Document
                          </div>
                        ) : (
                          <a href={u.addressProof.startsWith('http') ? u.addressProof : `${baseUrl}/${u.addressProof}`} target="_blank" rel="noopener noreferrer">
                            <img src={u.addressProof.startsWith('http') ? u.addressProof : `${baseUrl}/${u.addressProof}`} alt="Address Proof" className="w-full h-28 object-cover rounded-md border border-zinc-200 hover:border-zinc-300" />
                          </a>
                        )
                      ) : <p className="text-xs text-red-500">Not provided</p>}
                    </div>
                  </div>

                  {/* Work Proofs */}
                  <div className="mt-4">
                    <p className="text-[11px] text-zinc-400 font-semibold uppercase tracking-wide mb-2">Work Proofs</p>
                    {u.workProofs?.length > 0 ? (
                      <div className="flex gap-2 flex-wrap">
                        {u.workProofs.map((url, i) => (
                          (url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('pdf')) ? (
                            <div key={i}
                              onClick={() => {
                                let finalUrl = url.startsWith('http') ? url : `${baseUrl}/${url}`;
                                if (finalUrl.toLowerCase().includes('.pdf')) finalUrl = finalUrl.replace(/\.pdf$/i, '.jpg');
                                window.open(finalUrl, '_blank');
                              }}
                              className="w-20 h-20 bg-zinc-50 border border-zinc-200 text-indigo-600 rounded-md flex items-center justify-center text-xs font-medium hover:bg-zinc-100 transition-colors cursor-pointer text-center p-1"
                            >
                              PDF {i+1}
                            </div>
                          ) : (
                            <a key={i} href={url.startsWith('http') ? url : `${baseUrl}/${url}`} target="_blank" rel="noopener noreferrer">
                              <img src={url.startsWith('http') ? url : `${baseUrl}/${url}`} alt={`Work proof ${i+1}`}
                                className="w-20 h-20 object-cover rounded-md border border-zinc-200 hover:border-zinc-300 transition-colors" />
                            </a>
                          )
                        ))}
                      </div>
                    ) : <p className="text-xs text-red-500">Not provided</p>}
                  </div>

                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md px-4 py-2.5 text-xs text-amber-700">
                    ⚠️ Verify identity against the profile name ({u.name}) and address before approving.
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Already verified */}
          {verifiedWorkers.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-zinc-700 text-sm mb-3">Already Approved ({verifiedWorkers.length})</h3>
              <div className="bg-white border border-zinc-200 rounded-lg divide-y divide-zinc-50">
                {verifiedWorkers.map(u => (
                  <div key={u._id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-zinc-600 text-sm">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : u.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 text-sm">{u.name}</p>
                        <p className="text-[11px] text-zinc-400">{u.skills?.join(', ')}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-center">
                       <button onClick={() => verifyWorker(u._id, 'pending')} className="text-xs text-zinc-400 hover:text-red-500 transition-colors">Revoke</button>
                       <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                         <CheckCircle size={13} /> Approved
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: All Users */}
      {activeTab === 'users' && (
        <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="font-semibold text-zinc-900 text-sm">All Users</h2>
          </div>
          <div className="divide-y divide-zinc-50">
            {users.map(u => (
              <div key={u._id} className="flex justify-between items-center px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-zinc-600 text-sm">
                    {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : u.name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-zinc-900 text-sm">{u.name}</p>
                      {u.isVerified && <CheckCircle size={13} className="text-emerald-500" />}
                      {u.isAdmin && <span className="bg-red-50 border border-red-200 text-red-600 text-[10px] px-2 py-0.5 rounded font-semibold">Admin</span>}
                    </div>
                    <p className="text-xs text-zinc-400">{u.email}</p>
                    <p className="text-[11px] text-zinc-400">{u.location} · {u.totalJobsDone} jobs · ★{u.avgRating || 0}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex flex-wrap gap-1 justify-end mb-2">
                    {u.skills?.map(s => (
                      <span key={s} className="text-[10px] border border-zinc-200 text-zinc-500 px-2 py-0.5 rounded font-medium">{s}</span>
                    ))}
                  </div>
                  {!u.isVerified && u.skills?.length > 0 && (
                    <button onClick={() => verifyWorker(u._id)}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors">
                      Quick Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}