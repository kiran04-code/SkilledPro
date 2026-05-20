import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';

export default function TopNav() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (socket) {
      const handle = () => fetchNotifications();
      socket.on('notification', handle);
      socket.on('payment_notification', handle);
      return () => { socket.off('notification', handle); socket.off('payment_notification', handle); };
    }
  }, [socket]);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch (err) { console.error(err); }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleToggleNotif = async () => {
    const nextState = !showNotif;
    setShowNotif(nextState);
    if (nextState && unreadCount > 0) {
      try {
        await api.put('/notifications/read-all');
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (err) { console.error(err); }
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.read) markRead(n._id);
    if (n.projectId) {
      navigate(`/projects/${n.projectId}`);
      setShowNotif(false);
    }
  };

  // Authenticated nav links
  const { isWorker, isClient } = useAuth();
  
  const authLinks = [
    { to: '/projects', label: 'Find Work', hidden: isClient },
    { to: '/workers', label: 'Hire Talent', hidden: isWorker && !user?.isAdmin },
    { to: '/chat', label: 'Messages', hidden: true },
    { to: '/dashboard', label: 'Workspace' },
  ];

  // Public nav links
  const publicLinks = [
    { to: '/projects', label: 'Browse Jobs' },
    { to: '/workers', label: 'Find Pros' },
  ];

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <header className="fixed top-0 left-0 w-full flex justify-between items-center px-6 md:px-8 h-16 bg-white/70 backdrop-blur-md z-50 border-b border-slate-200/50 shadow-sm font-manrope antialiased tracking-tight">
      <div className="flex items-center gap-8">
        <Link to={user ? '/dashboard' : '/'} className="text-xl font-extrabold text-primary tracking-tighter">
          SkilledPro
        </Link>
        <button className="md:hidden p-2 text-slate-500 hover:text-primary transition-colors" onClick={() => setShowMobileMenu(!showMobileMenu)}>
          <span className="material-symbols-outlined">{showMobileMenu ? 'close' : 'menu'}</span>
        </button>
        <nav className="hidden md:flex items-center gap-6">
          {(user ? authLinks : publicLinks).filter(l => !l.hidden).map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`transition-colors duration-200 font-medium text-sm ${
                isActive(link.to)
                  ? 'text-primary font-bold border-b-2 border-primary pb-1'
                  : 'text-slate-500 hover:text-primary'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            {/* Notification bell */}
            <div ref={notifRef} className="relative">
              <button
                onClick={handleToggleNotif}
                className="p-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 duration-200 relative"
              >
                <span className="material-symbols-outlined text-primary">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="animate-fade-in absolute right-0 top-[calc(100%+8px)] w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <span className="font-manrope font-bold text-on-surface text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-[11px] font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-sm">No notifications</div>
                    ) : notifications.map(n => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors ${
                          !n.read ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-body-sm text-slate-700">{n.message}</p>
                        {n.amount > 0 && (
                          <p className="text-secondary font-bold text-xs mt-1">₹{n.amount} received</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100">
                    <Link to="/dashboard" onClick={() => setShowNotif(false)} className="text-xs text-primary font-semibold hover:underline">
                      See All Notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Help removed as per issue 8 */}

            {/* Profile avatar */}
            <Link to="/profile/edit" className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant overflow-hidden flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-primary">{initials}</span>
              )}
            </Link>
          </>
        ) : (
          <>
            <Link to="/register" className="flex items-center gap-2 pl-4 pr-1 py-1 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors duration-200">
              <span className="text-slate-700 font-medium text-body-sm px-2">Sign Up</span>
              <span className="material-symbols-outlined text-primary">account_circle</span>
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-lg md:hidden py-4 px-6 flex flex-col gap-4 z-40">
          {(user ? authLinks : publicLinks).filter(l => !l.hidden).map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setShowMobileMenu(false)}
              className={`text-base font-medium py-2 border-b border-slate-100 ${
                isActive(link.to) ? 'text-primary font-bold' : 'text-slate-600'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              to="/settings"
              onClick={() => setShowMobileMenu(false)}
              className="text-base font-medium py-2 text-slate-600 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">settings</span> Settings
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
