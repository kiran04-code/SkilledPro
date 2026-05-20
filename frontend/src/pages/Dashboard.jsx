import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';

let dashboardCache = { data: null, timestamp: 0, userId: null };

export default function Dashboard() {
  const { user, isWorker, isClient } = useAuth();
  const { socket } = useSocket();
  const [myProjects, setMyProjects] = useState([]);
  const [matchingProjects, setMatchingProjects] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    ((user.skills && user.skills.length > 0) || user.category) ? 'activeJobs' : 'overview'
  );

  const fetchData = useCallback(async (force = false) => {
    try {
      // Invalidate cache if user changed
      if (dashboardCache.userId !== user._id) {
        dashboardCache = { data: null, timestamp: 0, userId: user._id };
      }
      if (!force && dashboardCache.data && Date.now() - dashboardCache.timestamp < 10000) {
        setMyProjects(dashboardCache.data.myProjects);
        setMyBids(dashboardCache.data.myBids);
        setNotifications(dashboardCache.data.notifications);
        setMyReviews(dashboardCache.data.myReviews);
        setMatchingProjects(dashboardCache.data.matchingProjects);
        setLoading(false);
        return;
      }
      const [projRes, notiRes, bidsRes, reviewsRes] = await Promise.all([
        api.get('/projects'),
        api.get('/notifications'),
        api.get('/bids/my-bids'),
        api.get(`/reviews/${user._id}`),
      ]);
      const allProjects = projRes.data;
      const myProjects = allProjects.filter(p => p.client._id === user._id);
      const myBids = bidsRes.data;
      const notifications = notiRes.data;
      const myReviews = reviewsRes.data;
      let matchingProjects = [];
      let myJobs = [];
      let activeJobs = [];
      let completedJobs = [];
      if (user.skills && user.skills.length > 0) {
        matchingProjects = allProjects.filter(p =>
          p.status === 'open' &&
          p.client._id !== user._id &&
          user.skills.some(skill => skill.toLowerCase() === p.skill.toLowerCase())
        );
        myJobs = allProjects.filter(p => p.selectedWorker === user._id || p.selectedWorker?._id === user._id);
        activeJobs = myJobs.filter(p => p.status === 'in_progress');
        completedJobs = myJobs.filter(p => p.status === 'completed' || p.status === 'closed' || p.status === 'cancelled');
      }
      setMyProjects(myProjects);
      setMyBids(myBids.filter(b => b.status === 'pending' || b.status === 'rejected'));
      setNotifications(notifications);
      setMyReviews(myReviews);
      setMatchingProjects(matchingProjects);
      setMyJobs(myJobs);
      setActiveJobs(activeJobs);
      setCompletedJobs(completedJobs);
      dashboardCache = { data: { myProjects, myBids: myBids.filter(b => b.status === 'pending' || b.status === 'rejected'), notifications, myReviews, matchingProjects, myJobs, activeJobs, completedJobs }, timestamp: Date.now(), userId: user._id };
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user._id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (socket) {
      const handle = () => fetchData(true);
      socket.on('notification', handle);
      socket.on('payment_notification', handle);
      socket.on('refresh_project', handle);
      return () => { socket.off('notification', handle); socket.off('payment_notification', handle); socket.off('refresh_project', handle); };
    }
  }, [socket, fetchData]);

  if (loading) return (
    <div className="flex justify-center items-center h-[300px]">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-primary animate-spin mx-auto mb-3" />
        <p className="text-body-sm text-slate-400 font-inter">Loading dashboard...</p>
      </div>
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const statusBadge = (status) => {
    const map = {
      open: 'bg-secondary-container text-on-secondary-container',
      in_progress: 'bg-amber-100 text-amber-700',
      completed: 'bg-slate-100 text-slate-600',
      cancelled: 'bg-red-100 text-red-600',
    };
    return `px-3 py-1 rounded-full text-label-caps inline-block ${map[status] || map.completed}`;
  };

  const bidBadge = (status) => {
    const map = {
      accepted: 'bg-secondary-container text-on-secondary-container',
      pending: 'bg-amber-100 text-amber-700',
      rejected: 'bg-red-100 text-red-600',
      closed: 'bg-slate-100 text-slate-600',
    };
    return `px-3 py-1 rounded-full text-label-caps inline-block ${map[status] || map.closed}`;
  };

  const tabs = [
    isClient && { key: 'overview', label: 'My Posted Projects' },
    isWorker && { key: 'activeJobs', label: `Active Jobs (${activeJobs.length})` },
    isWorker && { key: 'matching', label: 'Matching Jobs' },
    isWorker && { key: 'bids', label: `My Bids (${myBids.length})` },
    isWorker && { key: 'completedJobs', label: 'Completed Jobs' },
    isWorker && { key: 'reviews', label: 'Reviews' },
    { key: 'notifications', label: `Notifications (${unreadCount > 0 ? unreadCount : ''})` }
  ].filter(Boolean);

  const completionScore = user.completionScore || 0;
  const completed = myProjects.filter(p => p.status === 'completed').length;
  const escrowBalance = myProjects.filter(p => p.status === 'in_progress' && p.escrowPaid).reduce((s, p) => s + (p.finalPrice || p.agreedPrice || 0), 0);

  // Profile strength segments
  const segments = 7;
  const filledSegments = Math.round((completionScore / 100) * segments);

  return (
    <div className="max-w-[1080px]">
      {/* Verification banner - matching Stitch */}
      {isWorker && user.verificationStatus !== 'approved' && (
        <div className="mb-6 p-4 rounded-xl border border-secondary-container bg-secondary-container/10 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
            <div>
              <p className="font-manrope font-bold text-on-surface text-body-sm">
                {user.verificationStatus === 'not_submitted' && 'Identity Verification Required'}
                {user.verificationStatus === 'pending' && 'Verification Pending Review'}
                {user.verificationStatus === 'in_review' && 'Verification In Review'}
                {user.verificationStatus === 'rejected' && 'Verification Rejected'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.verificationStatus === 'not_submitted' && 'Verify your profile to unlock high-budget enterprise projects.'}
                {user.verificationStatus === 'pending' && 'Your documents are waiting to be reviewed by our compliance team.'}
                {user.verificationStatus === 'in_review' && 'An admin is currently reviewing your uploaded documents.'}
                {user.verificationStatus === 'rejected' && `Re-upload required. Reason: ${user.verificationRemark}`}
              </p>
            </div>
          </div>
          {(user.verificationStatus === 'not_submitted' || user.verificationStatus === 'rejected') && (
            <Link to="/verification" className="px-5 py-2 bg-secondary text-white rounded-lg font-manrope font-semibold text-body-sm hover:opacity-90 transition-opacity whitespace-nowrap">
              Verify Now
            </Link>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-1 h-10 bg-primary rounded-full mt-1" />
          <div>
            <h1 className="font-manrope text-h1 text-on-surface">
              {isClient ? 'Dashboard' : 'Worker Dashboard'}
            </h1>
            <p className="text-body-sm text-slate-500 mt-1">
              {isClient
                ? 'Manage your active operations and monitor skilled talent performance across all project phases.'
                : `Welcome back, ${user.name.split(' ')[0]}. Here's your performance summary.`
              }
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-label-caps text-slate-400 block mb-1">LAST UPDATED</span>
          <span className="text-body-sm font-bold text-on-surface">Just now</span>
        </div>
      </div>

      {/* Profile Strength Bar (top right area) */}
      <div className="flex justify-end mb-2">
        <div>
          <span className="text-label-caps text-slate-400 block text-right mb-2">PROFILE STRENGTH</span>
          <div className="flex gap-1">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className={`h-2 w-6 rounded-full ${i < filledSegments ? 'bg-secondary-light' : 'bg-slate-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isClient ? (
          <>
            <StatCard icon="rocket_launch" iconBg="bg-blue-50" iconColor="text-blue-600" label="POSTED PROJECTS" value={myProjects.length} badge="+12%" badgeColor="text-secondary" />
            <StatCard icon="check_circle" iconBg="bg-green-50" iconColor="text-green-600" label="COMPLETED JOBS" value={completed} badge="+8%" badgeColor="text-secondary" />
            <StatCard icon="account_balance_wallet" iconBg="bg-indigo-50" iconColor="text-indigo-600" label="FUNDS IN ESCROW" value={`₹${escrowBalance.toLocaleString()}`} badge="Secure" badgeColor="text-secondary" />
            <StatCard icon="savings" iconBg="bg-slate-50" iconColor="text-slate-600" label="TOTAL INVESTMENT" value={`₹${myProjects.reduce((s, p) => s + (p.finalPrice || p.agreedPrice || p.budget || 0), 0).toLocaleString()}`} badge="—" />
            <StatCard icon="star" iconBg="bg-amber-50" iconColor="text-amber-600" label="CLIENT RATING" value={user.avgRating || '—'} badge="Top 1%" badgeColor="text-secondary" />
          </>
        ) : (
          <>
            <StatCard icon="check_circle" iconBg="bg-green-50" iconColor="text-green-600" label="JOBS COMPLETED" value={user.totalJobsDone || 0} badge="+12%" badgeColor="text-secondary" />
            <StatCard icon="star" iconBg="bg-amber-50" iconColor="text-amber-600" label="AVG RATING" value={user.avgRating || '—'} badge="Top Rated" badgeColor="text-amber-500" />
            <StatCard icon="savings" iconBg="bg-blue-50" iconColor="text-blue-600" label="ESCROW EARNINGS" value={`₹${user.escrowBalance || 0}`} badge="Active" />
            <div className="border border-slate-200 rounded-xl p-5 bg-white">
              <div className="flex justify-between items-center mb-3">
                <span className="text-label-caps text-slate-400">PROFILE STRENGTH</span>
                <span className="text-body-sm font-bold text-secondary">{completionScore}%</span>
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: segments }).map((_, i) => (
                  <div key={i} className={`h-2 flex-1 rounded-full ${i < filledSegments ? 'bg-secondary-light' : 'bg-slate-200'}`} />
                ))}
              </div>
              {completionScore < 100 && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-sm text-secondary">add_a_photo</span>
                  Add a site photo for +10% boost
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Content area with tabs + right sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content (2/3 width) */}
        <div className="lg:col-span-2">
          {/* Tab bar */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-body-sm font-inter transition-colors ${
                    activeTab === tab.key
                      ? 'font-bold text-primary border-b-2 border-primary'
                      : 'text-slate-400 hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* My Projects (client) */}
            {activeTab === 'overview' && isClient && (
              <div>
                {myProjects.length === 0 ? (
                  <EmptyState icon="work" text="No projects yet" linkTo="/post-project" linkText="Post your first project" />
                ) : (
                  myProjects.map(project => (
                    <Link key={project._id} to={`/projects/${project._id}`} className="block px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-manrope font-semibold text-on-surface text-body-sm">{project.title}</h3>
                            <span className={statusBadge(project.status)}>{project.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{project.location}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>Posted {new Date(project.createdAt).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">group</span>{project.bidCount || 0} Proposals</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        {project.status === 'in_progress' && project.progress !== undefined && (
                          <div className="flex-1 mr-4">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-label-caps text-slate-400">PROGRESS</span>
                              <span className="font-bold text-primary">{project.progress || 0}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-secondary-light rounded-full" style={{ width: `${project.progress || 0}%` }} />
                            </div>
                          </div>
                        )}
                        <span className="text-body-sm font-bold text-primary whitespace-nowrap flex items-center gap-1 ml-auto">
                          {project.status === 'open' ? 'Review Proposals' : 'View Details'}
                          <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </span>
                      </div>
                    </Link>
                  ))
                )}
                {myProjects.length > 0 && (
                  <Link to="/projects" className="block py-4 text-center text-body-sm font-semibold text-primary hover:underline border-t border-slate-100">
                    View All Projects
                  </Link>
                )}
              </div>
            )}

            {/* Matching Jobs (worker) */}
            {activeTab === 'matching' && isWorker && (
              <div>
                {/* Search bar */}
                <div className="px-6 py-3 border-b border-slate-100 flex gap-3">
                  <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="material-symbols-outlined text-slate-400 text-lg">search</span>
                    <input className="flex-1 bg-transparent border-none outline-none focus:ring-0 focus:shadow-none text-body-sm font-inter" placeholder="Search by skills or title..." />
                  </div>
                  <button className="px-4 py-2 border border-slate-200 rounded-lg text-body-sm text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-sm">tune</span> Filter
                  </button>
                </div>

                {!user.skills?.length ? (
                  <EmptyState icon="warning" text="Add skills to your profile to see matching projects" linkTo="/profile/edit" linkText="Add Skills" />
                ) : matchingProjects.length === 0 ? (
                  <EmptyState icon="work_off" text="No matching open projects right now" linkTo="/projects" linkText="Browse all projects" />
                ) : (
                  matchingProjects.map(project => (
                    <Link key={project._id} to={`/projects/${project._id}`} className="block px-6 py-5 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-600">
                              {Math.round(80 + Math.random() * 18)}% MATCH
                            </span>
                          </div>
                          <h3 className="font-manrope font-bold text-on-surface text-h3 mb-2">{project.title}</h3>
                          <p className="text-body-sm text-slate-500 mb-3 line-clamp-1">{project.description?.slice(0, 100)}...</p>
                          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">location_on</span>{project.location}</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">schedule</span>Posted recently</span>
                            {project.skill && (
                              <span className="px-2.5 py-1 border border-slate-200 rounded text-xs text-slate-600 font-medium">{project.skill}</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="font-manrope font-bold text-on-surface text-h3">₹{project.budget}</p>
                          <p className="text-xs text-slate-400 mt-1">Posted recently</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
                {matchingProjects.length > 0 && (
                  <Link to="/projects" className="block py-4 text-center border-t border-slate-100">
                    <span className="px-6 py-2.5 border border-slate-200 rounded-lg text-body-sm font-manrope font-semibold text-on-surface hover:bg-slate-50 inline-block">
                      View All Matching Jobs
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* Active Jobs (worker) */}
            {activeTab === 'activeJobs' && isWorker && (
              <div>
                {activeJobs.length === 0 ? (
                  <EmptyState icon="engineering" text="No active jobs right now" linkTo="/projects" linkText="Find Work →" />
                ) : (
                  activeJobs.map(job => (
                    <Link key={job._id} to={`/projects/${job._id}`} className="block px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-manrope font-semibold text-on-surface text-body-sm">{job.title}</h3>
                            <span className={statusBadge(job.status)}>{job.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">person</span>Client: {job.client?.name}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-on-surface text-body-sm mb-1">₹{job.finalPrice || job.agreedPrice}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Completed Jobs (worker) */}
            {activeTab === 'completedJobs' && isWorker && (
              <div>
                {completedJobs.length === 0 ? (
                  <EmptyState icon="check_circle" text="No completed jobs yet" linkTo="/projects" linkText="Find Work →" />
                ) : (
                  completedJobs.map(job => (
                    <Link key={job._id} to={`/projects/${job._id}`} className="block px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-manrope font-semibold text-on-surface text-body-sm">{job.title}</h3>
                            <span className={statusBadge(job.status)}>{job.status.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">person</span>Client: {job.client?.name}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-on-surface text-body-sm mb-1">₹{job.finalPrice || job.agreedPrice}</p>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* My Bids (worker) */}
            {activeTab === 'bids' && isWorker && (
              <div>
                {myBids.length === 0 ? (
                  <EmptyState icon="gavel" text="No pending bids" linkTo="/projects" linkText="Browse open projects →" />
                ) : (
                  myBids.map(bid => (
                    <Link key={bid._id} to={`/projects/${bid.project?._id}`} className="block px-6 py-4 border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-manrope font-semibold text-on-surface text-body-sm mb-1">{bid.project?.title}</h3>
                          <p className="text-xs text-slate-400">{bid.project?.skill} · {bid.project?.location}</p>
                          <p className="text-xs text-slate-300 mt-1 italic">"{bid.proposal?.slice(0, 60)}..."</p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-on-surface text-body-sm mb-1">₹{bid.amount}</p>
                          <span className={bidBadge(bid.status)}>{bid.status}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}

            {/* Reviews (worker) */}
            {activeTab === 'reviews' && isWorker && (
              <div>
                <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-4">
                  <span className="font-manrope font-bold text-on-surface text-body-sm">Client Reviews</span>
                  <span className="px-3 py-1 border border-slate-200 rounded-full text-label-caps text-slate-600">
                    {user.avgRating || 0}/5 Overall Satisfaction
                  </span>
                </div>
                {myReviews.length === 0 ? (
                  <EmptyState icon="rate_review" text="No reviews yet. Complete jobs to receive reviews." />
                ) : (
                  myReviews.map(r => (
                    <div key={r._id} className="px-6 py-5 border-b border-slate-100">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-manrope font-bold text-primary text-body-sm">
                            {r.client?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-manrope font-bold text-on-surface text-body-sm">{r.client?.name}</p>
                            <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <span key={s} className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1", color: s <= r.rating ? '#f59e0b' : '#e2e8f0' }}>star</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-body-sm text-slate-600 leading-relaxed">"{r.comment}"</p>
                      {r.project && (
                        <div className="mt-3 flex items-center gap-2">
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-secondary-container text-on-secondary-container rounded">PROJECT COMPLETED</span>
                          <span className="text-xs text-slate-400">| {r.project.title}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                {notifications.length === 0 ? (
                  <EmptyState icon="notifications_none" text="No notifications" />
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className={`px-6 py-4 border-b border-slate-100 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-start gap-3">
                        <span className={`material-symbols-outlined text-xl mt-0.5 ${n.amount > 0 ? 'text-secondary' : n.message?.includes('Action') ? 'text-amber-500' : 'text-blue-500'}`}
                          style={{ fontVariationSettings: "'FILL' 1" }}>
                          {n.amount > 0 ? 'check_circle' : n.message?.includes('Action') ? 'error' : 'mail'}
                        </span>
                        <div>
                          <p className="font-manrope font-bold text-on-surface text-body-sm">{n.message?.split('.')[0]}</p>
                          <p className="text-body-sm text-slate-500 mt-1">{n.message?.split('.').slice(1).join('.')}</p>
                          {n.amount > 0 && <p className="text-body-sm font-bold text-secondary mt-2">₹{n.amount} received</p>}
                          <p className="text-xs text-slate-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar (1/3 width) */}
        <div className="space-y-6">
          {/* CTA Card */}
          {isClient && (
            <div className="bg-primary rounded-xl p-6 text-white">
              <h3 className="font-manrope font-bold text-lg mb-2">Ready for the next milestone?</h3>
              <p className="text-primary-fixed-dim text-body-sm mb-5">
                Instantly connect with top-tier specialized contractors for your new project requirements.
              </p>
              <Link to="/post-project" className="flex items-center justify-center gap-2 w-full py-3 bg-secondary-light text-white rounded-lg font-manrope font-semibold hover:bg-secondary transition-colors">
                <span className="material-symbols-outlined">add_circle</span>
                Post a New Project
              </Link>
            </div>
          )}

          {/* Recent Notifications */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="text-label-caps text-slate-400">RECENT NOTIFICATIONS</span>
              {unreadCount > 0 && <div className="w-2 h-2 rounded-full bg-red-500" />}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-slate-300 text-body-sm">No notifications</p>
              ) : (
                notifications.slice(0, 5).map(n => (
                  <div key={n._id} className={`px-5 py-3 border-b border-slate-50 ${!n.read ? 'bg-blue-50/50' : ''}`}>
                    <div className="flex items-start gap-3">
                      <span className={`material-symbols-outlined text-sm mt-0.5 ${n.amount > 0 ? 'text-secondary' : n.message?.includes('Action') ? 'text-amber-500' : 'text-blue-500'}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}>
                        {n.amount > 0 ? 'check_circle' : n.message?.includes('Action') ? 'error' : 'mail'}
                      </span>
                      <div>
                        <p className="font-manrope font-bold text-on-surface text-xs">{n.message?.split('.')[0]}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message?.split('.').slice(1).join('.')}</p>
                        {n.amount > 0 && <p className="text-xs font-bold text-secondary mt-1">₹{n.amount} received</p>}
                        <p className="text-[10px] text-slate-300 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Link to="#" onClick={() => setActiveTab('notifications')} className="block py-3 text-center text-xs text-primary font-semibold hover:underline border-t border-slate-100">
              See All Notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, iconBg, iconColor, label, value, badge, badgeColor = 'text-slate-400' }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white">
      <div className="flex justify-between items-center mb-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        </div>
        {badge && <span className={`text-body-sm font-bold ${badgeColor}`}>{badge}</span>}
      </div>
      <p className="font-manrope font-bold text-on-surface text-[28px] mb-1">{value}</p>
      <p className="text-label-caps text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState({ icon, text, linkTo, linkText }) {
  return (
    <div className="py-16 text-center">
      <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">{icon}</span>
      <p className="text-body-sm text-slate-400 mb-3">{text}</p>
      {linkTo && (
        <Link to={linkTo} className="px-4 py-2 bg-primary text-white rounded-lg text-body-sm font-manrope font-semibold hover:bg-primary-container transition-colors inline-block">
          {linkText}
        </Link>
      )}
    </div>
  );
}