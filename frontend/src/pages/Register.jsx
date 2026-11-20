import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Check, FileText, Upload, X, ArrowLeft } from 'lucide-react';
import { auth, signInWithGoogle, getRedirectResult, createUserWithEmailAndPassword, updateProfile, rememberAfterAuth, takeAfterAuth } from '../firebase';
import { setUser, setRedirectAfterLogin } from '../store/authSlice';
import { authAPI } from '../services/api';
import AuthShell, { GoogleButton, OrDivider, firebaseMessage } from '../components/AuthShell';
import { Spinner } from '../components/ui';

const COURSES = ['B.Tech', 'B.E', 'M.Tech', 'M.E', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'MBA', 'B.Com', 'Ph.D', 'Diploma'];
const DEGREES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Chemical', 'Data Science', 'AI & ML', 'Biotechnology', 'Physics', 'Mathematics', 'Commerce', 'Management'];
const MAX_RESUME = 5 * 1024 * 1024;

const RULES = [
  ['At least 8 characters', (p) => p.length >= 8],
  ['One uppercase letter', (p) => /[A-Z]/.test(p)],
  ['One number or symbol', (p) => /[\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(p)],
];

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const location = useLocation();
  const { redirectAfterLogin } = useSelector((s) => s.auth);
  const reason = location.state?.reason;
  // Captured once: the auth listener resets store state while the account is being created.
  const destRef = useRef(redirectAfterLogin || location.state?.from || '/dashboard');
  const done = (user, to = { dest: destRef.current, reason }) => {
    dispatch(setUser(user));
    dispatch(setRedirectAfterLogin(null));
    navigate(to.dest, { replace: true, state: { afterAuth: to.reason } });
  };

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', course: '', degree: '', cgpa: '' });
  const [resumeFile, setResumeFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const pickFile = (file) => {
    if (!file) return;
    if (!/\.(pdf|docx|txt)$/i.test(file.name)) return setError('Upload your resume as a PDF, DOCX or TXT file.');
    if (file.size > MAX_RESUME) return setError('Resume must be 5 MB or smaller.');
    setError('');
    setResumeFile(file);
  };

  const syncToBackend = async (firebaseUser, extra = {}) => {
    const fd = new FormData();
    fd.append('idToken', await firebaseUser.getIdToken());
    fd.append('name', extra.name || firebaseUser.displayName || '');
    ['phone', 'course', 'degree', 'cgpa'].forEach((k) => fd.append(k, extra[k] || ''));
    fd.append('provider', extra.provider || 'email');
    if (resumeFile) fd.append('resume', resumeFile);
    const res = await authAPI.syncUser(fd);
    return res.data.user;
  };

  const validateStep1 = () => {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.password) return 'Fill in every field to continue.';
    if (form.phone.replace(/\D/g, '').length < 10) return 'Enter a valid phone number, including country code if outside India.';
    const failed = RULES.find(([, test]) => !test(form.password));
    if (failed) return `Password needs: ${failed[0].toLowerCase()}.`;
    if (form.password !== form.confirmPassword) return 'Passwords don’t match.';
    return '';
  };

  const nextStep = (e) => {
    e.preventDefault();
    const msg = validateStep1();
    setError(msg);
    if (!msg) setStep(2);
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    const msg = validateStep1();
    if (msg) { setStep(1); return setError(msg); }
    if (form.cgpa && (Number(form.cgpa) < 0 || Number(form.cgpa) > 10)) return setError('CGPA must be between 0 and 10.');
    setLoading(true);
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await updateProfile(cred.user, { displayName: form.name.trim() });
      const user = await syncToBackend(cred.user, { ...form, name: form.name.trim(), provider: 'email' });
      done(user);
    } catch (err) {
      setError(firebaseMessage(err, 'Couldn’t create your account. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (!result?.user) return;
      const user = await syncToBackend(result.user, { name: result.user.displayName, provider: 'google' });
      done(user, takeAfterAuth() || undefined); // back from full-page Google sign-in
    }).catch((err) => setError(firebaseMessage(err, 'Google sign-up failed.')));
  }, []);

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      rememberAfterAuth(destRef.current, reason); // used only if the popup is blocked and we redirect
      const result = await signInWithGoogle();
      if (result?.user) {
        takeAfterAuth();
        const user = await syncToBackend(result.user, { ...form, name: result.user.displayName, provider: 'google' });
        done(user);
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setError(firebaseMessage(err, 'Google sign-up failed.'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle={`${step === 1 ? 'Step 1 of 2 · Your details' : 'Step 2 of 2 · Education and resume'}${reason === 'apply' ? '. Then we’ll take you back to the job.' : ''}`}
      footer={<>Already have an account? <Link to="/login" state={location.state} className="text-gray-800 underline-offset-4 hover:underline">Sign in</Link></>}
    >
      <div className="mb-6 grid grid-cols-2 gap-1.5" aria-hidden="true">
        {[1, 2].map((s) => <div key={s} className={`h-0.5 rounded-full ${step >= s ? 'bg-accent-600' : 'bg-gray-200'}`} />)}
      </div>

      {error && <div className="alert-error mb-5" role="alert">{error}</div>}

      {step === 1 && (
        <>
          <GoogleButton onClick={handleGoogleRegister} loading={googleLoading} text="Sign up with Google" />
          <OrDivider label="or use email" />
          <form onSubmit={nextStep} className="space-y-4">
            <div>
              <label htmlFor="name" className="form-label">Full name</label>
              <input id="name" name="name" autoComplete="name" required value={form.name} onChange={handleChange} className="input-field" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="form-label">Email</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={handleChange} className="input-field" placeholder="you@example.com" />
              </div>
              <div>
                <label htmlFor="phone" className="form-label">Phone</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" required value={form.phone} onChange={handleChange} className="input-field" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="form-label">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required value={form.password} onChange={handleChange} className="input-field" />
              {form.password && (
                <ul className="mt-2 space-y-1">
                  {RULES.map(([label, test]) => {
                    const ok = test(form.password);
                    return (
                      <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-gray-500'}`}>
                        {ok ? <Check size={12} /> : <span className="mx-[3px] h-1.5 w-1.5 rounded-full bg-current" />} {label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required value={form.confirmPassword} onChange={handleChange} className="input-field" />
            </div>
            <button type="submit" className="btn-primary w-full">Continue</button>
          </form>
        </>
      )}

      {step === 2 && (
        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="course" className="form-label">Course</label>
              <input id="course" list="courses" name="course" required value={form.course} onChange={handleChange} className="input-field" placeholder="B.Tech" />
              <datalist id="courses">{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label htmlFor="degree" className="form-label">Branch</label>
              <input id="degree" list="degrees" name="degree" required value={form.degree} onChange={handleChange} className="input-field" placeholder="CSE" />
              <datalist id="degrees">{DEGREES.map((d) => <option key={d} value={d} />)}</datalist>
            </div>
          </div>
          <div>
            <label htmlFor="cgpa" className="form-label">CGPA <span className="font-normal text-gray-400">· optional, out of 10</span></label>
            <input id="cgpa" name="cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={handleChange} className="input-field" placeholder="8.5" />
          </div>

          <div>
            <span className="form-label">Resume <span className="font-normal text-gray-400">· optional, used to detect your skills</span></span>
            <div
              role="button"
              tabIndex={0}
              className={`drop-zone px-4 py-5 ${dragOver ? 'drag-over' : ''}`}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
            >
              {resumeFile ? (
                <div className="flex items-center gap-3">
                  <FileText size={18} className="flex-shrink-0 text-gray-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-gray-900">{resumeFile.name}</p>
                    <p className="num text-xs text-gray-500">{Math.max(1, Math.round(resumeFile.size / 1024))} KB</p>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); setResumeFile(null); }} className="btn-icon" aria-label="Remove file"><X size={15} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-left">
                  <Upload size={18} className="flex-shrink-0 text-gray-500" />
                  <div>
                    <p className="text-[13px] text-gray-800">Drop your resume or <span className="underline underline-offset-4">browse</span></p>
                    <p className="text-xs text-gray-500">PDF, DOCX or TXT, up to 5 MB</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => pickFile(e.target.files[0])} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => { setError(''); setStep(1); }} className="btn-secondary" aria-label="Back"><ArrowLeft size={15} /></button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <><Spinner /> Creating account</> : 'Create account'}
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
