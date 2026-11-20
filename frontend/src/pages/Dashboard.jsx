import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowRight, ArrowUpRight, FileText, Upload, Inbox, Bookmark } from 'lucide-react';
import { setUser } from '../store/authSlice';
import { userAPI, applicationsAPI, jobsAPI, alertsAPI } from '../services/api';
import { CompanyAvatar, Modal, Segmented, Spinner, TYPE_NAMES, timeAgo } from '../components/ui';

const COURSES = ['B.Tech', 'B.E', 'M.Tech', 'M.E', 'BCA', 'MCA', 'B.Sc', 'M.Sc', 'MBA', 'B.Com', 'Ph.D', 'Diploma'];
const DEGREES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Chemical', 'Data Science', 'AI & ML', 'Biotechnology', 'Physics', 'Mathematics', 'Commerce', 'Management'];

function Card({ title, action, children, className = '' }) {
  return (
    <section className={`glass-card ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-3.5">
        <h2 className="section-title">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Message({ msg }) {
  if (!msg) return null;
  return <p className={`mt-3 text-xs ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`} role="status">{msg.text}</p>;
}

function ProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', course: user?.course || '', degree: user?.degree || '', cgpa: user?.cgpa ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Name can’t be empty.');
    if (form.cgpa !== '' && (Number(form.cgpa) < 0 || Number(form.cgpa) > 10)) return setError('CGPA must be between 0 and 10.');
    setSaving(true);
    setError('');
    try {
      const res = await userAPI.updateProfile({ ...form, name: form.name.trim(), cgpa: form.cgpa !== '' ? form.cgpa : undefined });
      onSave(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit profile" onClose={onClose}>
      {error && <div className="alert-error mb-4" role="alert">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="p-name" className="form-label">Full name</label>
          <input id="p-name" value={form.name} onChange={set('name')} className="input-field" autoComplete="name" />
        </div>
        <div>
          <label htmlFor="p-phone" className="form-label">Phone</label>
          <input id="p-phone" type="tel" value={form.phone} onChange={set('phone')} className="input-field" placeholder="+91 98765 43210" autoComplete="tel" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="p-course" className="form-label">Course</label>
            <input id="p-course" list="courses" value={form.course} onChange={set('course')} className="input-field" />
            <datalist id="courses">{COURSES.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label htmlFor="p-degree" className="form-label">Branch</label>
            <input id="p-degree" list="degrees" value={form.degree} onChange={set('degree')} className="input-field" />
            <datalist id="degrees">{DEGREES.map((d) => <option key={d} value={d} />)}</datalist>
          </div>
        </div>
        <div>
          <label htmlFor="p-cgpa" className="form-label">CGPA <span className="font-normal text-gray-400">· out of 10</span></label>
          <input id="p-cgpa" type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={set('cgpa')} className="input-field" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <><Spinner /> Saving</> : 'Save changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ActivityRow({ app }) {
  const job = app.job_id || app.job_snapshot || {};
  const id = app.job_id?._id;
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <CompanyAvatar company={job.company} size={32} />
      <div className="min-w-0 flex-1">
        {id
          ? <Link to={`/jobs/${id}`} className="block truncate text-[13px] font-medium text-gray-900 hover:underline hover:underline-offset-4">{job.title || 'Untitled listing'}</Link>
          : <p className="truncate text-[13px] font-medium text-gray-900">{job.title || 'Untitled listing'}</p>}
        <p className="truncate text-xs text-gray-500">{[job.company, TYPE_NAMES[job.type]].filter(Boolean).join(' · ')}</p>
      </div>
      <span className="num hidden flex-shrink-0 text-xs text-gray-500 sm:block">{timeAgo(app.createdAt)}</span>
      {job.apply_url && (
        <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-icon flex-shrink-0" aria-label={`Open ${job.title} listing`}>
          <ArrowUpRight size={15} />
        </a>
      )}
    </li>
  );
}

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const csvRef = useRef(null);
  const resumeRef = useRef(null);

  const [applications, setApplications] = useState(null);
  const [liveCount, setLiveCount] = useState(null);
  const [appTab, setAppTab] = useState('applied');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMsg, setResumeMsg] = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvMsg, setCsvMsg] = useState(null);
  const [alertLoading, setAlertLoading] = useState(false);
  const [testEmail, setTestEmail] = useState({ sending: false, msg: null });

  useEffect(() => {
    applicationsAPI.getApplications({})
      .then((res) => setApplications(res.data.applications))
      .catch(() => setApplications([]));
    jobsAPI.getJobs({ limit: 1 }).then((res) => setLiveCount(res.data.total)).catch(() => setLiveCount(0));
  }, []);

  const counts = useMemo(() => ({
    applied: applications?.filter((a) => a.action === 'applied').length ?? 0,
    saved: applications?.filter((a) => a.action === 'saved').length ?? 0,
  }), [applications]);
  const shownApps = (applications || []).filter((a) => a.action === appTab);

  const emailAlerts = !!user?.alert_preferences?.email_alerts;
  const toggleEmailAlerts = async () => {
    setAlertLoading(true);
    try {
      const res = await alertsAPI.updatePreferences({ email_alerts: !emailAlerts, whatsapp_alerts: !!user?.alert_preferences?.whatsapp_alerts });
      dispatch(setUser({ ...user, alert_preferences: res.data.preferences }));
    } catch (_) {} finally { setAlertLoading(false); }
  };

  const handleTestEmail = async () => {
    setTestEmail({ sending: true, msg: null });
    try {
      const res = await alertsAPI.testEmail();
      setTestEmail({ sending: false, msg: { ok: true, text: res.data.message } });
    } catch (err) {
      setTestEmail({ sending: false, msg: { ok: false, text: err.response?.data?.message || 'Couldn’t send the test email.' } });
    }
  };

  const handleResume = async (file) => {
    if (!file) return;
    setResumeLoading(true);
    setResumeMsg(null);
    try {
      const fd = new FormData();
      fd.append('resume', file);
      const res = await userAPI.uploadResume(fd);
      dispatch(setUser(res.data.user));
      const n = res.data.extractedSkills.length;
      setResumeMsg(n
        ? { ok: true, text: `Found ${n} skill${n === 1 ? '' : 's'} in ${file.name}.` }
        : { ok: false, text: 'No recognisable skills found. Make sure the file has selectable text, not a scanned image.' });
    } catch (err) {
      setResumeMsg({ ok: false, text: err.response?.data?.message || 'Upload failed.' });
    } finally {
      setResumeLoading(false);
      if (resumeRef.current) resumeRef.current.value = '';
    }
  };

  const handleCsv = async (file) => {
    if (!file) return;
    setCsvLoading(true);
    setCsvMsg(null);
    try {
      const fd = new FormData();
      fd.append('csv', file);
      const res = await jobsAPI.uploadCSV(fd);
      setCsvMsg({ ok: true, text: res.data.message + (res.data.errors?.length ? ` (${res.data.errors.length} rows skipped)` : '') });
    } catch (err) {
      setCsvMsg({ ok: false, text: err.response?.data?.message || 'Import failed.' });
    } finally {
      setCsvLoading(false);
      if (csvRef.current) csvRef.current.value = '';
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const academics = [user?.course, user?.degree, user?.cgpa ? `CGPA ${user.cgpa}` : null].filter(Boolean).join(' · ');
  const skills = user?.skills || [];
  const checklist = [
    ['phone number', !!user?.phone],
    ['course', !!user?.course],
    ['branch', !!user?.degree],
    ['CGPA', user?.cgpa !== null && user?.cgpa !== undefined],
    ['resume', skills.length > 0],
  ];
  const missing = checklist.filter(([, ok]) => !ok).map(([label]) => label);
  const completeness = Math.round(((checklist.length - missing.length + 1) / (checklist.length + 1)) * 100); // +1: name/email always set

  return (
    <div className="page">
      {showProfileModal && <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onSave={(u) => dispatch(setUser(u))} />}

      <div className="page-inner animate-fade-in">
        <div className="grid items-start gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_300px]">
          <aside className="lg:sticky lg:top-20">
            <div className="glass-card overflow-hidden">
              <div className="h-16 bg-[linear-gradient(120deg,#dce7fe,#eef4ff_60%,#e9f8f0)]" />
              <div className="-mt-9 px-5 pb-5">
                <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-white bg-accent-600 text-2xl font-bold text-white">
                  {(user?.name || '?').split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
                <h1 className="mt-2 text-[18px] font-bold leading-tight">{user?.name}</h1>
                <p className="mt-0.5 text-[13px] text-gray-600">{academics || 'Add your course and branch'}</p>
                <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email}</p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-gray-700">Profile strength</span>
                    <span className="num font-semibold text-accent-700">{completeness}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-accent-600 transition-[width]" style={{ width: `${completeness}%` }} />
                  </div>
                  {completeness < 100 && <p className="mt-1.5 text-xs text-gray-500">Add {missing.join(', ')} to complete it.</p>}
                </div>
                <button onClick={() => setShowProfileModal(true)} className="btn-secondary btn-sm mt-4 w-full">Edit profile</button>
              </div>
              <dl className="border-t border-[var(--line)] text-[13px]">
                {[
                  ['Applied', applications ? counts.applied : '–', '/applications'],
                  ['Saved jobs', applications ? counts.saved : '–', '/applications'],
                  ['Skills on resume', skills.length, null],
                ].map(([k, v, to]) => {
                  const row = <><dt className="text-gray-600">{k}</dt><dd className="num font-semibold text-accent-700">{v}</dd></>;
                  return to
                    ? <Link key={k} to={to} className="flex justify-between px-5 py-2.5 hover:bg-gray-50">{row}</Link>
                    : <div key={k} className="flex justify-between px-5 py-2.5">{row}</div>;
                })}
              </dl>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="glass-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[18px] font-bold text-gray-900">{greeting}, {firstName}</p>
                <p className="mt-0.5 text-[13px] text-gray-600">
                  {liveCount === null ? 'Checking for new openings…' : <><span className="num font-semibold text-gray-900">{liveCount.toLocaleString()}</span> opportunities are open right now.</>}
                </p>
              </div>
              <Link to="/jobs" className="btn-primary flex-shrink-0">Find jobs <ArrowRight size={15} /></Link>
            </div>
            <Card
              title="Activity"
              action={<Segmented label="Activity" value={appTab} onChange={setAppTab} options={[
                { value: 'applied', label: 'Applied', count: counts.applied },
                { value: 'saved', label: 'Saved', count: counts.saved },
              ]} />}
            >
              {applications === null ? (
                <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="flex gap-3"><div className="skeleton h-8 w-8" /><div className="flex-1 space-y-1.5"><div className="skeleton h-3 w-1/2" /><div className="skeleton h-3 w-1/3" /></div></div>)}</div>
              ) : shownApps.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  {appTab === 'applied' ? <Inbox size={20} className="text-gray-400" /> : <Bookmark size={20} className="text-gray-400" />}
                  <p className="mt-3 text-[13px] text-gray-700">{appTab === 'applied' ? 'No applications yet' : 'Nothing saved yet'}</p>
                  <p className="mt-1 text-xs text-gray-500">{appTab === 'applied' ? 'Listings you open with Apply show up here.' : 'Use the bookmark on any listing to keep it here.'}</p>
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-[var(--line)]">{shownApps.slice(0, 6).map((a) => <ActivityRow key={a._id} app={a} />)}</ul>
                  {shownApps.length > 6 && (
                    <Link to="/applications" className="mt-4 inline-flex items-center gap-1 text-[13px] text-gray-600 hover:text-gray-900">
                      View all {shownApps.length} <ArrowRight size={13} />
                    </Link>
                  )}
                </>
              )}
            </Card>

            <Card title="Profile" action={<button onClick={() => setShowProfileModal(true)} className="text-xs text-gray-600 hover:text-gray-900">Edit</button>}>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
                {[
                  ['Email', user?.email],
                  ['Phone', user?.phone],
                  ['Course', user?.course],
                  ['Branch', user?.degree],
                  ['CGPA', user?.cgpa],
                  ['Sign-in', user?.provider === 'google' ? 'Google' : 'Email and password'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-[var(--line)] pb-3 sm:block sm:border-0 sm:pb-0">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className={`truncate sm:mt-0.5 ${v ? 'text-gray-800' : 'text-gray-400'}`}>{v ?? 'Not set'}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          <div className="space-y-4 lg:col-start-2 xl:col-start-auto">
            <Card
              title="Skills"
              action={skills.length > 0 && (
                <button onClick={() => resumeRef.current?.click()} disabled={resumeLoading} className="text-xs text-gray-600 hover:text-gray-900">
                  {resumeLoading ? 'Reading…' : 'Replace resume'}
                </button>
              )}
            >
              {skills.length > 0 ? (
                <>
                  <div className="flex flex-wrap gap-1">{skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
                  {user?.resume_original_name && (
                    <p className="mt-4 flex items-center gap-1.5 truncate text-xs text-gray-500"><FileText size={12} /> {user.resume_original_name}</p>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-[13px] text-gray-700">Add your resume to unlock match scores</p>
                  <p className="mt-1 text-xs text-gray-500">We read the skills from it. PDF, DOCX or TXT.</p>
                  <button onClick={() => resumeRef.current?.click()} disabled={resumeLoading} className="btn-primary btn-sm mt-4">
                    {resumeLoading ? <><Spinner /> Reading resume</> : <><Upload size={14} /> Upload resume</>}
                  </button>
                </div>
              )}
              <input ref={resumeRef} type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => handleResume(e.target.files[0])} />
              <Message msg={resumeMsg} />
            </Card>

            <Card title="Email alerts">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] text-gray-800">Daily digest</p>
                  <p className="mt-0.5 text-xs text-gray-500">Your best new matches, every morning at 9:00 IST.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailAlerts}
                  aria-label="Daily email digest"
                  onClick={toggleEmailAlerts}
                  disabled={alertLoading}
                  className={`relative mt-0.5 h-5 w-9 flex-shrink-0 rounded-full transition-colors disabled:opacity-50 ${emailAlerts ? 'bg-accent-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${emailAlerts ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {emailAlerts && (
                <>
                  <button onClick={handleTestEmail} disabled={testEmail.sending} className="btn-secondary btn-sm mt-4 w-full">
                    {testEmail.sending ? <><Spinner /> Sending</> : 'Send a test email'}
                  </button>
                  <Message msg={testEmail.msg} />
                </>
              )}
            </Card>

            <Card title="Import listings">
              <p className="text-xs leading-relaxed text-gray-500">
                CSV with <code className="font-mono text-gray-600">title</code> and <code className="font-mono text-gray-600">apply_url</code>. Optional: company, type, location, salary, description, tags, is_remote.
              </p>
              <button onClick={() => csvRef.current?.click()} disabled={csvLoading} className="btn-secondary btn-sm mt-4 w-full">
                {csvLoading ? <><Spinner /> Importing</> : <><Upload size={14} /> Choose CSV file</>}
              </button>
              <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={(e) => handleCsv(e.target.files[0])} />
              <Message msg={csvMsg} />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
