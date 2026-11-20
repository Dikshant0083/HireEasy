import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { getSocket } from '../services/socket';

export default function NotificationToast() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [notifications, setNotifications] = useState([]);
  const userId = isAuthenticated ? user?._id : null;

  useEffect(() => {
    const socket = getSocket();
    const join = () => socket.emit('join', userId);
    const onJobs = (data) => {
      const id = `${Date.now()}-${Math.random()}`;
      setNotifications((prev) => [{ id, message: data.message }, ...prev].slice(0, 3));
      setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 6000);
    };

    socket.on('connect', join);
    if (socket.connected) join();
    socket.on('new_jobs', onJobs);
    return () => {
      socket.off('connect', join);
      socket.off('new_jobs', onJobs);
    };
  }, [userId]);

  if (!notifications.length) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-xs flex-col gap-2 md:bottom-6" aria-live="polite">
      {notifications.map((n) => (
        <div key={n.id} className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[var(--line-strong)] bg-[var(--raised)] px-3.5 py-3 shadow-lg animate-slide-up">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent-400" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-gray-900">New listings</p>
            <p className="text-xs text-gray-600">{n.message}</p>
            <Link to="/jobs" className="mt-1 inline-block text-xs text-accent-600 hover:text-accent-700">View jobs</Link>
          </div>
          <button onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))} className="text-gray-500 hover:text-gray-800" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
