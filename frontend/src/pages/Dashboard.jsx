import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import { userAPI, applicationsAPI, jobsAPI } from '../services/api';

const COURSES = ['B.Tech','M.Tech','BCA','MCA','B.Sc','M.Sc','MBA','B.Com','B.E','M.E','Ph.D','Diploma','Other'];
const DEGREES = ['CSE','ECE','EEE','Mechanical','Civil','Chemical','IT','Data Science','AI & ML','Biotechnology','Physics','Mathematics','Commerce','Management','Other'];

// ────────────────────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color = 'purple' }) {
  const colors = {
    purple: 'from-purple-600/20 to-purple-500/5 border-purple-500/20',
    green:  'from-green-600/20  to-green-500/5  border-green-500/20',
    blue:   'from-blue-600/20   to-blue-500/5   border-blue-500/20',
    yellow: 'from-yellow-600/20 to-yellow-500/5 border-yellow-500/20',
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-5 ${colors[color]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-gray-400 text-xs mt-0.5">{label}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Profile Edit Modal
// ────────────────────────────────────────────────────────────────────────────
function ProfileModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name:   user?.name   || '',
    phone:  user?.phone  || '',
    course: user?.course || '',
    degree: user?.degree || '',
    cgpa:   user?.cgpa   ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await userAPI.updateProfile({ ...form, cgpa: form.cgpa !== '' ? form.cgpa : undefined });
      onSave(res.data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="glass-card p-8 w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">✏️ Edit Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="input-field" placeholder="Your full name" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Contact Number</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
              className="input-field" placeholder="+91 98765 43210" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Course</label>
              <select value={form.course} onChange={e => setForm({...form, course: e.target.value})}
                className="input-field">
                <option value="">Select Course</option>
                {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5 font-medium">Branch</label>
              <select value={form.degree} onChange={e => setForm({...form, degree: e.target.value})}
                className="input-field">
                <option value="">Select Branch</option>
                {DEGREES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">CGPA (out of 10)</label>
            <input type="number" step="0.01" min="0" max="10"
              value={form.cgpa} onChange={e => setForm({...form, cgpa: e.target.value})}
              className="input-field" placeholder="e.g. 8.5" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50">
              {saving ? 'Saving...' : '✅ Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Applied Job Row
// ────────────────────────────────────────────────────────────────────────────
function AppliedJobRow({ app }) {
  const job = app.job_id || app.job_snapshot || {};
  const TYPE_ICON = { job: '💼', internship: '🎓', scholarship: '🏅' };

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
          {TYPE_ICON[job.type] || '💼'}
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{job.title || 'Unknown'}</p>
          <p className="text-gray-500 text-xs">{job.company || ''} {job.location ? `· ${job.location}` : ''}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
          app.action === 'applied'
            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
        }`}>
          {app.action === 'applied' ? '✅ Applied' : '⭐ Saved'}
        </span>
        {job.apply_url && (
          <a href={job.apply_url} target="_blank" rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 text-xs transition-colors">
            Open →
          </a>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const fileRef = useRef(null);
  const csvRef = useRef(null);
  const resumeRef = useRef(null);

  const [stats, setStats]         = useState({ applied: 0, saved: 0, jobs: 0 });
  const [applications, setApplications] = useState([]);
  const [appTab, setAppTab]       = useState('applied');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [csvFile, setCsvFile]     = useState(null);
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvMsg, setCsvMsg]       = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeMsg, setResumeMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [appliedRes, savedRes, jobsRes, appsRes] = await Promise.allSettled([
          applicationsAPI.getApplications({ action: 'applied' }),
          applicationsAPI.getApplications({ action: 'saved' }),
          jobsAPI.getJobs({ limit: 1 }),
          applicationsAPI.getApplications({}),
        ]);
        setStats({
          applied: appliedRes.status === 'fulfilled' ? appliedRes.value.data.applications.length : 0,
          saved:   savedRes.status === 'fulfilled'   ? savedRes.value.data.applications.length   : 0,
          jobs:    jobsRes.status === 'fulfilled'    ? jobsRes.value.data.total                  : 0,
        });
        if (appsRes.status === 'fulfilled') {
          setApplications(appsRes.value.data.applications);
        }
      } catch (_) {}
    }
    loadData();
  }, []);

  // Filter applications by tab
  const filteredApps = applications.filter(a => a.action === appTab);

  const handleResumeUpload = async () => {
    if (!resumeFile) return;
    setResumeLoading(true);
    setResumeMsg('');
    try {
      const fd = new FormData();
      fd.append('resume', resumeFile);
      const res = await userAPI.uploadResume(fd);
      dispatch(setUser(res.data.user));
      setResumeMsg(`✅ Detected ${res.data.extractedSkills.length} skills: ${res.data.extractedSkills.slice(0, 5).join(', ')}${res.data.extractedSkills.length > 5 ? '...' : ''}`);
      setResumeFile(null);
    } catch (err) {
      setResumeMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`);
    } finally {
      setResumeLoading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setCsvLoading(true);
    setCsvMsg('');
    try {
      const fd = new FormData();
      fd.append('csv', csvFile);
      const res = await jobsAPI.uploadCSV(fd);
      setCsvMsg(`✅ ${res.data.message}`);
      setCsvFile(null);
    } catch (err) {
      setCsvMsg(`❌ ${err.response?.data?.message || 'Upload failed'}`);
    } finally {
      setCsvLoading(false);
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Good morning';
    if (h < 17) return '☀️ Good afternoon';
    return '🌙 Good evening';
  };

  return (
    <div className="page-bg pt-20 pb-10 px-4 min-h-screen">
      {showProfileModal && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSave={(u) => dispatch(setUser(u))}
        />
      )}

      <div className="max-w-6xl mx-auto animate-fade-in">
        {/* ── Welcome header ─────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-7 flex-wrap gap-3">
          <div>
            <p className="text-gray-400 text-sm">{greeting()},</p>
            <h1 className="text-3xl font-bold text-white mt-0.5">{user?.name?.split(' ')[0] || 'There'} 👋</h1>
            {(user?.course || user?.degree) && (
              <p className="text-gray-500 text-sm mt-1">
                📚 {[user.course, user.degree].filter(Boolean).join(' · ')}
                {user?.cgpa ? ` · CGPA ${user.cgpa}` : ''}
              </p>
            )}
          </div>
          <button onClick={() => setShowProfileModal(true)} className="btn-secondary text-sm py-2 px-4">
            ✏️ Edit Profile
          </button>
        </div>

        {/* ── Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
          <StatCard icon="💼" value={stats.jobs.toLocaleString()} label="Live Opportunities" color="purple" />
          <StatCard icon="✅" value={stats.applied}              label="Jobs Applied"         color="green"  />
          <StatCard icon="⭐" value={stats.saved}                label="Jobs Saved"           color="yellow" />
          <StatCard icon="🧠" value={user?.skills?.length || 0}  label="Skills Detected"      color="blue"   />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left column ────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Profile summary */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">👤 My Profile</h2>
                <button onClick={() => setShowProfileModal(true)}
                  className="text-xs text-purple-400 hover:text-purple-300">Edit →</button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Email',   value: user?.email  },
                  { label: 'Phone',   value: user?.phone  || '—' },
                  { label: 'Course',  value: user?.course || '—' },
                  { label: 'Branch',  value: user?.degree || '—' },
                  { label: 'CGPA',    value: user?.cgpa   ?? '—' },
                  { label: 'Auth',    value: user?.provider === 'google' ? '🔵 Google' : '📧 Email' },
                ].map(item => (
                  <div key={item.label} className="p-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-gray-500 text-[10px] uppercase tracking-wide mb-0.5">{item.label}</p>
                    <p className="text-white text-sm font-medium truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Applied jobs record */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">📋 Application History</h2>
                <div className="flex gap-1">
                  {[
                    { v: 'applied', l: '✅ Applied' },
                    { v: 'saved',   l: '⭐ Saved' },
                  ].map(t => (
                    <button key={t.v} onClick={() => setAppTab(t.v)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        appTab === t.v ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                      }`}>
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>

              {filteredApps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">{appTab === 'applied' ? '📭' : '🔖'}</div>
                  <p className="text-gray-400 text-sm">
                    {appTab === 'applied' ? 'No applications yet' : 'No saved jobs yet'}
                  </p>
                  <Link to="/jobs" className="btn-primary text-xs py-2 px-4 mt-3 inline-block">
                    Browse Jobs →
                  </Link>
                </div>
              ) : (
                <div>
                  {filteredApps.slice(0, 8).map(app => (
                    <AppliedJobRow key={app._id} app={app} />
                  ))}
                  {filteredApps.length > 8 && (
                    <Link to="/applications" className="block text-center text-purple-400 text-xs mt-3 hover:text-purple-300">
                      View all {filteredApps.length} →
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="glass-card p-6">
              <h2 className="text-white font-semibold mb-4">🚀 Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { to: '/jobs',               icon: '💼', label: 'Browse Live Jobs',    color: 'bg-purple-500/10 hover:bg-purple-500/20' },
                  { to: '/jobs?type=internship',icon: '🎓', label: 'Find Internships',    color: 'bg-orange-500/10 hover:bg-orange-500/20' },
                  { to: '/jobs?type=scholarship',icon:'🏅', label: 'Explore Scholarships',color: 'bg-yellow-500/10 hover:bg-yellow-500/20' },
                  { to: '/applications',        icon: '📋', label: 'My Applications',    color: 'bg-green-500/10  hover:bg-green-500/20'  },
                ].map(a => (
                  <Link key={a.to} to={a.to}
                    className={`flex items-center gap-2 p-3.5 rounded-xl transition-colors group ${a.color}`}>
                    <span>{a.icon}</span>
                    <span className="text-gray-300 text-sm group-hover:text-white">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column ───────────────────────────────────── */}
          <div className="space-y-5">
            {/* Skills card */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">🧠 Skills</h2>
                <button onClick={() => resumeRef.current?.click()}
                  className="text-xs text-purple-400 hover:text-purple-300">Update Resume →</button>
              </div>
              {user?.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20">
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5">
                  <div className="text-3xl mb-2">📄</div>
                  <p className="text-gray-400 text-sm mb-3">Upload resume to auto-detect skills</p>
                  <button onClick={() => resumeRef.current?.click()} className="btn-primary text-xs py-2 px-4">
                    Upload Resume
                  </button>
                </div>
              )}
              <input ref={resumeRef} type="file" accept=".pdf,.docx,.doc" className="hidden"
                onChange={(e) => setResumeFile(e.target.files[0])} />
              {resumeFile && (
                <div className="mt-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <p className="text-purple-300 text-xs mb-2">📄 {resumeFile.name}</p>
                  <button onClick={handleResumeUpload} disabled={resumeLoading}
                    className="btn-primary text-xs py-1.5 px-4 w-full disabled:opacity-50">
                    {resumeLoading ? 'Parsing...' : 'Parse & Update Skills'}
                  </button>
                </div>
              )}
              {resumeMsg && <p className="text-xs mt-2 text-gray-300">{resumeMsg}</p>}
              {user?.resume_original_name && (
                <p className="text-[10px] text-gray-600 mt-3">
                  📎 Current: {user.resume_original_name}
                </p>
              )}
            </div>

            {/* CSV Upload */}
            <div className="glass-card p-6">
              <h2 className="text-white font-semibold mb-1">📄 Upload Job CSV</h2>
              <p className="text-gray-500 text-xs mb-3">
                Columns: title, company, apply_url, type, location, salary, description, tags, is_remote
              </p>
              <div className="drop-zone p-4 text-center cursor-pointer"
                onClick={() => csvRef.current?.click()}>
                {csvFile
                  ? <p className="text-purple-300 text-sm">📄 {csvFile.name}</p>
                  : <p className="text-gray-500 text-xs">Click to select CSV file</p>}
              </div>
              <input ref={csvRef} type="file" accept=".csv" className="hidden"
                onChange={(e) => { setCsvFile(e.target.files[0]); setCsvMsg(''); }} />
              {csvFile && (
                <button onClick={handleCsvUpload} disabled={csvLoading}
                  className="btn-primary w-full mt-3 text-sm py-2 disabled:opacity-50">
                  {csvLoading ? 'Importing...' : '⬆️ Import CSV'}
                </button>
              )}
              {csvMsg && <p className="text-xs mt-2 text-gray-300">{csvMsg}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
