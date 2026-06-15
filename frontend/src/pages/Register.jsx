import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  auth, signInWithGoogle, getRedirectResult,
  createUserWithEmailAndPassword, updateProfile,
} from '../firebase';
import { setUser } from '../store/authSlice';
import { authAPI } from '../services/api';

const COURSES = ['B.Tech', 'M.Tech', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'MBA', 'B.Com', 'B.E', 'M.E', 'Ph.D', 'Diploma', 'Other'];
const DEGREES = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Chemical', 'IT', 'Data Science', 'AI & ML', 'Biotechnology', 'Physics', 'Mathematics', 'Commerce', 'Management', 'Other'];

function GoogleButton({ onClick, loading, text = 'Continue with Google' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 disabled:opacity-50"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.15)',
        color: '#e5e7eb',
      }}
    >
      {/* Google SVG logo */}
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
      </svg>
      {loading ? 'Signing in...' : text}
    </button>
  );
}

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    course: '', degree: '', cgpa: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1=personal, 2=academic

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setResumeFile(file);
  };

  const syncToBackend = async (firebaseUser, extraData = {}) => {
    const idToken = await firebaseUser.getIdToken();
    const formData = new FormData();
    formData.append('idToken', idToken);
    formData.append('name', extraData.name || firebaseUser.displayName || '');
    formData.append('phone', extraData.phone || '');
    formData.append('course', extraData.course || '');
    formData.append('degree', extraData.degree || '');
    formData.append('cgpa', extraData.cgpa || '');
    formData.append('provider', extraData.provider || 'email');
    if (resumeFile) formData.append('resume', resumeFile);

    const res = await authAPI.syncUser(formData);
    return res.data.user;
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    setLoading(true);
    setError('');
    try {
      // 1. Create Firebase account
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      // 2. Update Firebase display name
      await updateProfile(cred.user, { displayName: form.name });
      // 3. Sync to MongoDB
      const user = await syncToBackend(cred.user, {
        name: form.name, phone: form.phone,
        course: form.course, degree: form.degree, cgpa: form.cgpa,
        provider: 'email',
      });
      dispatch(setUser(user));
      navigate('/dashboard');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'Email already registered. Sign in instead.'
        : err.code === 'auth/invalid-email'
        ? 'Invalid email address.'
        : err.message || 'Registration failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect result after Google redirect sign-in returns
  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result?.user) return;
      try {
        const user = await syncToBackend(result.user, {
          name: result.user.displayName,
          provider: 'google',
        });
        dispatch(setUser(user));
        navigate('/dashboard');
      } catch (err) {
        setError(err.message || 'Google sign-in failed');
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle(); // popup on localhost, redirect on prod
      if (result?.user) {
        const user = await syncToBackend(result.user, {
          name: result.user.displayName,
          phone: form.phone,
          course: form.course,
          degree: form.degree,
          cgpa: form.cgpa,
          provider: 'google',
        });
        dispatch(setUser(user));
        navigate('/dashboard');
      }
      // redirect path: page reloads, getRedirectResult above handles it
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in failed');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password) {
      return setError('Please fill all required fields');
    }
    setError('');
    setStep(2);
  };

  return (
    <div className="page-bg flex items-center justify-center px-4 py-24 min-h-screen">
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}>
            HE
          </div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-gray-400 text-sm mt-1">Your career journey starts here</p>
        </div>

        <div className="glass-card p-8">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-500'
                }`}>{s}</div>
                <span className={`text-xs transition-colors ${step === s ? 'text-purple-300' : 'text-gray-500'}`}>
                  {s === 1 ? 'Personal Info' : 'Academic Details'}
                </span>
                {s < 2 && <div className={`flex-1 h-px ${step > s ? 'bg-purple-600' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <form onSubmit={nextStep} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name *</label>
                <input name="name" required value={form.name} onChange={handleChange}
                  className="input-field" placeholder="Dikshant Choudhary" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email Address *</label>
                <input name="email" type="email" required value={form.email} onChange={handleChange}
                  className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Contact Number *</label>
                <input name="phone" type="tel" required value={form.phone} onChange={handleChange}
                  className="input-field" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Password *</label>
                <input name="password" type="password" required value={form.password} onChange={handleChange}
                  className="input-field" placeholder="Min 6 characters" minLength={6} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm Password *</label>
                <input name="confirmPassword" type="password" required value={form.confirmPassword} onChange={handleChange}
                  className="input-field" placeholder="Re-enter password" />
              </div>
              <button type="submit" className="btn-primary w-full mt-2">
                Next: Academic Details →
              </button>

              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-gray-500 text-xs">or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <GoogleButton onClick={handleGoogleRegister} loading={googleLoading} text="Sign up with Google" />
            </form>
          )}

          {/* Step 2: Academic Details */}
          {step === 2 && (
            <form onSubmit={handleEmailRegister} className="space-y-4">
              <button type="button" onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-400 hover:text-white text-xs transition-colors mb-2">
                ← Back
              </button>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Course *</label>
                  <select name="course" required value={form.course} onChange={handleChange} className="input-field">
                    <option value="">Select Course</option>
                    {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Branch/Degree *</label>
                  <select name="degree" required value={form.degree} onChange={handleChange} className="input-field">
                    <option value="">Select Branch</option>
                    {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">CGPA (out of 10)</label>
                <input name="cgpa" type="number" step="0.01" min="0" max="10"
                  value={form.cgpa} onChange={handleChange}
                  className="input-field" placeholder="e.g. 8.5" />
              </div>

              {/* Resume Upload */}
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">
                  Resume <span className="text-purple-400">(PDF/DOCX — auto-extracts skills)</span>
                </label>
                <div
                  className={`drop-zone p-5 text-center ${dragOver ? 'drag-over' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {resumeFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">📄</span>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{resumeFile.name}</p>
                        <p className="text-gray-400 text-xs">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button type="button"
                        onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                        className="text-red-400 text-xl ml-1">×</button>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl mb-2">📤</div>
                      <p className="text-gray-300 text-sm">Drop resume or click to browse</p>
                      <p className="text-gray-500 text-xs mt-1">PDF, DOCX up to 5MB</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt"
                  className="hidden" onChange={(e) => setResumeFile(e.target.files[0])} />
              </div>

              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {loading
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating Account...</>
                  : '🚀 Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-gray-500 text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
