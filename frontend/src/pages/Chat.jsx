import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Chat() {
  const { projectId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [project, setProject] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await api.get(`/messages/${projectId}`);
        setMessages(data);
      } catch (err) { console.error(err); }
    };
    const fetchProject = async () => {
      try {
        const { data } = await api.get(`/projects/${projectId}`);
        setProject(data);
      } catch (err) { console.error(err); }
    };
    fetchMessages();
    fetchProject();
    if (socket) {
      socket.emit('join_project', projectId);
      const handleReceiveMessage = (msg) => setMessages(prev => [...prev, msg]);
      const handleMessageBlocked = (data) => toast.error(data.reason, { duration: 5000 });
      socket.on('receive_message', handleReceiveMessage);
      socket.on('message_blocked', handleMessageBlocked);
      return () => { socket.off('receive_message', handleReceiveMessage); socket.off('message_blocked', handleMessageBlocked); };
    }
  }, [projectId, socket]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    socket?.emit('send_message', { projectId, message: input, senderId: user._id, senderName: user.name });
    try { await api.post('/messages', { projectId, content: input }); } catch (err) { console.error(err); }
    setInput('');
  };

  const shareLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    toast.loading('Getting your location...', { id: 'locationToast' });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        toast.dismiss('locationToast');
        const { latitude, longitude } = position.coords;
        const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationMessage = `[LOCATION] ${mapsLink}`;
        socket?.emit('send_message', { projectId, message: locationMessage, senderId: user._id, senderName: user.name });
        try { await api.post('/messages', { projectId, content: locationMessage }); } catch (err) { console.error(err); }
      },
      (error) => {
        toast.dismiss('locationToast');
        toast.error(error.code === 1 ? 'Location permission denied' : 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const otherName = project ? (project.client?._id === user._id ? project.worker?.name : project.client?.name) : 'Project Chat';
  const otherInitial = otherName?.[0] || 'P';
  const myInitial = user.name?.[0] || 'M';

  const statusBadge = project?.status === 'in_progress'
    ? 'bg-secondary-container text-on-secondary-container'
    : project?.status === 'completed'
    ? 'bg-slate-100 text-slate-600'
    : 'bg-amber-100 text-amber-700';

  return (
    <div className="grid grid-cols-12 gap-gutter" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Main Chat Area */}
      <section className="col-span-12 lg:col-span-8 flex flex-col glass-panel rounded-xl overflow-hidden border border-slate-200">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center font-manrope font-bold text-primary text-body-sm overflow-hidden">
                {project?.worker?.avatar || project?.client?.avatar ? (
                  <img src={project.client?._id === user._id ? project.worker?.avatar : project.client?.avatar} alt="" className="w-full h-full object-cover" />
                ) : otherInitial}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-secondary-light rounded-full border-2 border-white" />
            </div>
            <div>
              <h3 className="font-manrope font-semibold text-on-surface text-body-sm">{otherName}</h3>
              <p className="text-body-sm text-on-surface-variant flex items-center gap-1 text-xs">
                <span className="w-2 h-2 rounded-full bg-secondary-light" /> Online
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"><span className="material-symbols-outlined">videocam</span></button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"><span className="material-symbols-outlined">call</span></button>
            <button onClick={shareLocation} className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"><span className="material-symbols-outlined">location_on</span></button>
            <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-lg"><span className="material-symbols-outlined">more_vert</span></button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-slate-200 mb-3 block">chat_bubble</span>
              <p className="text-body-sm text-slate-400">No messages yet. Start the conversation!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMe = msg.sender?._id === user._id || msg.senderId === user._id;
            const isLocation = msg.content?.startsWith('[LOCATION]');
            const time = msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            if (isLocation) {
              const url = msg.content.replace('[LOCATION] ', '');
              return (
                <div key={i} className={`flex gap-4 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary">
                      {isMe ? myInitial : otherInitial}
                    </div>
                  </div>
                  <div>
                    <a href={url} target="_blank" rel="noopener noreferrer" className={`p-4 rounded-xl shadow-sm flex items-center gap-3 ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                      <span className="material-symbols-outlined">location_on</span>
                      <span className="text-body-sm underline">View Location</span>
                    </a>
                    <span className={`text-[10px] text-slate-400 mt-1 block ${isMe ? 'text-right' : ''}`}>{time}</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className={`flex gap-4 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                    {msg.sender?.avatar ? <img src={msg.sender.avatar} className="w-full h-full object-cover" /> : (isMe ? myInitial : otherInitial)}
                  </div>
                </div>
                <div>
                  <div className={`p-4 rounded-xl shadow-sm text-body-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-white border border-slate-200 rounded-tl-none text-on-surface'
                  }`}>
                    {msg.content}
                  </div>
                  <span className={`text-[10px] text-slate-400 mt-1 block ${isMe ? 'text-right' : ''}`}>{time}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Chat Input */}
        <div className="p-6 bg-white border-t border-slate-200 flex-shrink-0">
          <form onSubmit={sendMessage} className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all">
            <button type="button" className="p-1 text-slate-400 hover:text-primary">
              <span className="material-symbols-outlined">attach_file</span>
            </button>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }}
              className="flex-1 bg-transparent border-none focus:ring-0 focus:shadow-none text-body-sm p-1 min-h-[24px] max-h-[120px] resize-none outline-none font-inter"
              placeholder="Type your message here..."
              rows={1}
            />
            <button type="submit" className="bg-primary text-white p-2 rounded-lg hover:opacity-90 active:scale-95 transition-all">
              <span className="material-symbols-outlined">send</span>
            </button>
          </form>
        </div>
      </section>

      {/* Sidebar Project Details */}
      <aside className="col-span-12 lg:col-span-4 space-y-6 overflow-y-auto hide-mobile">
        {project && (
          <>
            {/* Project Status Card */}
            <div className="glass-panel rounded-xl p-6 border border-slate-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`${statusBadge} px-3 py-1 rounded-full text-label-caps inline-block mb-2`}>
                    {project.status?.replace('_', ' ')}
                  </span>
                  <h2 className="font-manrope font-semibold text-primary text-h3">{project.title}</h2>
                </div>
                <Link to={`/projects/${project._id}`} className="text-slate-400 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">edit</span>
                </Link>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-body-sm">
                  <span className="text-slate-500">Total Budget</span>
                  <span className="font-bold text-primary">₹{project.budget?.toLocaleString()}</span>
                </div>

                {project.status === 'in_progress' && (
                  <div className="pt-2">
                    <div className="flex justify-between text-label-caps mb-2">
                      <span className="text-slate-500">Completion</span>
                      <span className="text-primary">{project.progress || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      <div className="h-full bg-secondary-light rounded-full" style={{ width: `${project.progress || 0}%` }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <Link to={`/projects/${project._id}`} className="w-full py-3 bg-primary text-white rounded-lg font-manrope font-semibold text-center block active:scale-[0.98] transition-transform shadow-lg shadow-primary/20">
                  View Project Details
                </Link>
                <button className="w-full py-3 bg-white border border-slate-200 text-on-surface rounded-lg font-manrope font-semibold hover:bg-slate-50 transition-colors">
                  Mark Completed
                </button>
              </div>
            </div>

            {/* Project Meta Bento */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2">event</span>
                <span className="text-label-caps text-slate-500">Deadline</span>
                <span className="text-body-sm font-bold mt-1">{new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="glass-panel p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-outlined text-primary mb-2">location_on</span>
                <span className="text-label-caps text-slate-500">Location</span>
                <span className="text-body-sm font-bold mt-1">{project.location}</span>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}