import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auth, onAuthStateChanged } from './firebase';
import { setUser, setAuthLoading, logout } from './store/authSlice';
import { authAPI } from './services/api';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobBoard from './pages/JobBoard';
import JobDetail from './pages/JobDetail';
import Applications from './pages/Applications';
import Interviews from './pages/Interviews';
import ResumeBuilder from './pages/ResumeBuilder';

function AuthLoader({ children }) {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const res = await authAPI.getMe();
          dispatch(setUser(res.data.user));
        } catch {
          // If getMe fails, it might be a new user who just completed a redirect login.
          try {
            const idToken = await firebaseUser.getIdToken();
            const fd = new FormData();
            fd.append('idToken', idToken);
            fd.append('name', firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '');
            fd.append('provider', firebaseUser.providerData?.[0]?.providerId === 'google.com' ? 'google' : 'email');
            const res = await authAPI.syncUser(fd);
            dispatch(setUser(res.data.user));
          } catch (syncErr) {
            console.error("Failed to sync new user:", syncErr);
            dispatch(logout());
          }
        }
      } else {
        dispatch(logout());
      }
    });
    return unsubscribe;
  }, [dispatch]);

  if (loading) {
    return (
      <div className="page-bg flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading HireEasy...</p>
        </div>
      </div>
    );
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthLoader>
        <Navbar />
        <NotificationToast />
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobBoard />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/resume-builder" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </AuthLoader>
    </BrowserRouter>
  );
}
