import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getSocket, joinUserRoom } from '../services/socket';

const SOURCE_EMOJIS = {
  remotive: '📡', arbeitnow: '🌍', themuse: '✨',
  jsearch: '🔍', jooble: '🇮🇳', default: '💼',
};

export default function NotificationToast() {
  const { user, isAuthenticated } = useSelector((s) => s.auth);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socket = getSocket();

    // Join rooms after connect
    socket.on('connect', () => {
      socket.emit('join', isAuthenticated ? user?._id : null);
    });
    if (socket.connected) {
      socket.emit('join', isAuthenticated ? user?._id : null);
    }

    // Listen for new jobs
    socket.on('new_jobs', (data) => {
      const id = Date.now();
      const emoji = SOURCE_EMOJIS[data.source] || SOURCE_EMOJIS.default;
      setNotifications((prev) => [
        { id, emoji, message: data.message, source: data.source },
        ...prev.slice(0, 4), // max 5 toasts
      ]);
      // Auto-remove after 6 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 6000);
    });

    return () => {
      socket.off('new_jobs');
      socket.off('connect');
    };
  }, [isAuthenticated, user]);

  if (!notifications.length) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl
            bg-[#111118] border border-purple-500/30 shadow-xl shadow-purple-900/20
            backdrop-blur-xl animate-slide-in max-w-xs"
          style={{ animation: 'slideInRight 0.4s ease-out' }}
        >
          <span className="text-xl flex-shrink-0">{n.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold">New Jobs!</p>
            <p className="text-gray-400 text-xs truncate">{n.message}</p>
          </div>
          <button
            onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
            className="text-gray-600 hover:text-gray-300 flex-shrink-0 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
