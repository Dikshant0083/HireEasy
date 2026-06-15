import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setRedirectAfterLogin } from '../store/authSlice';

export default function ProtectedRoute({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading } = useSelector((s) => s.auth);

  if (loading) return null; // wait for Firebase to resolve

  if (!isAuthenticated) {
    dispatch(setRedirectAfterLogin(location.pathname + location.search));
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}
