import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auth, onAuthStateChanged } from './firebase';
import { setUser, setAuthLoading, logout } from './store/authSlice';
import { authAPI } from './services/api';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import NotificationToast from './components/NotificationToast';
import { Logo, Spinner } from './components/ui';
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
          // Email sign-ups create their profile from the Register page (with course, resume, etc.).
          // Syncing here too would race it and could fail with "account already exists".
          if (firebaseUser.providerData?.[0]?.providerId === 'password') return dispatch(logout());
          // A Google user returning from a redirect sign-in: create the profile.
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
      <div className="page-bg flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Logo compact />
          <Spinner className="text-gray-400" />
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
