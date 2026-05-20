import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout, isClient, isWorker } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = user?.isAdmin
    ? [
        { to: '/admin', icon: 'admin_panel_settings', label: 'Admin Panel' },
        { to: '/settings', icon: 'settings', label: 'Settings' },
      ]
    : isClient
    ? [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/workers', icon: 'location_on', label: 'Map View' },
        { to: '/projects', icon: 'description', label: 'Project List' },
        { to: '/settings', icon: 'settings', label: 'Settings' },
      ]
    : [
        { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
        { to: '/verification', icon: 'account_balance_wallet', label: 'Wallet' },
        { to: '/settings', icon: 'settings', label: 'Settings' },
      ];

  return (
    <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-[220px] pt-16 z-40 bg-white border-r border-slate-200">
      {/* User profile section */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-container-high overflow-hidden flex items-center justify-center flex-shrink-0">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-lg">account_circle</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-manrope font-bold text-on-surface text-body-sm truncate">{user?.name}</p>
            <p className="text-[12px] text-slate-400">
              {user?.isAdmin ? 'Administrator' : isWorker ? 'Applicant' : 'Recruiter'}
            </p>
          </div>
        </div>
      </div>

      {/* Post/Find Project CTA */}
      {!user?.isAdmin && (
        <div className="px-4 py-4">
          <Link
            to={isClient ? '/post-project' : '/projects'}
            className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-on-primary rounded-lg font-manrope font-bold text-body-sm hover:bg-primary-container transition-colors active:scale-[0.98]"
          >
            {isClient ? 'Post a Project' : 'Search Projects'}
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3">
        {navItems.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-inter transition-colors duration-200 mb-0.5 ${
              isActive(to)
                ? 'text-primary font-semibold bg-surface-container-low border-l-[3px] border-primary'
                : 'text-slate-500 hover:text-primary hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 mt-auto border-t border-slate-100 pt-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
