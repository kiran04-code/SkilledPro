import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

import TopNav from './components/TopNav';
import Sidebar from './components/Sidebar';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostProject from './pages/PostProject';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import WorkerProfile from './pages/WorkerProfile';
import Workers from './pages/Workers';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import EditProfile from './pages/EditProfile';
import VerifyEmail from './pages/VerifyEmail';
import Verification from './pages/Verification';
import Settings from './pages/Settings';
import PushNotificationManager from './components/PushNotificationManager';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-[3px] border-slate-200 border-t-primary animate-spin mx-auto mb-3" />
        <p className="text-body-sm text-slate-400 font-inter">Loading...</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user?.isAdmin ? children : <Navigate to="/" />;
};

const ClientRoute = ({ children }) => {
  const { user, isWorker } = useAuth();
  if (user && isWorker && !user.isAdmin) return <Navigate to="/dashboard" />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  // Public pages (no sidebar, just top nav)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav />
        <main className="flex-1 pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/workers" element={<Workers />} />
            <Route path="/workers/:id" element={<WorkerProfile />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    );
  }

  // Authenticated pages: top nav + sidebar + content
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <Sidebar />
      <main className="pt-16 md:ml-[220px] min-h-screen">
        <div className="p-4 md:p-8 max-w-container-max mx-auto">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={<Navigate to="/dashboard" />} />
            <Route path="/register" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<PrivateRoute>{user?.isAdmin ? <Navigate to="/admin" /> : <Dashboard />}</PrivateRoute>} />
            <Route path="/workers" element={<ClientRoute><Workers /></ClientRoute>} />
            <Route path="/workers/:id" element={<WorkerProfile />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/post-project" element={<ClientRoute><PostProject /></ClientRoute>} />
            <Route path="/projects/:id" element={<PrivateRoute><ProjectDetail /></PrivateRoute>} />
            <Route path="/chat/:projectId" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/profile/edit" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
            <Route path="/verification" element={<PrivateRoute><Verification /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: 'Inter, Manrope, sans-serif',
                fontSize: 14,
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
              },
            }}
          />
          <PushNotificationManager />
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;