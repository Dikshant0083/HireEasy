import React, { useEffect, useState } from 'react';
import api from '../services/api';

const FORMAT_ICONS = { Online: '💻', Onsite: '🏢', Phone: '📞', Assessment: '📝' };
const STATUS_STYLES = {
  scheduled:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  completed:   'text-green-400 bg-green-500/10 border-green-500/20',
  cancelled:   'text-red-400 bg-red-500/10 border-red-500/20',
  rescheduled: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
};

const EMPTY_FORM = {
  company: '', role: '', scheduled_at: '', format: 'Online', link: '', notes: '', status: 'scheduled',
};

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function isUpcoming(iso) {
  return new Date(iso) > new Date();
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('upcoming'); // upcoming | past

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/interviews');
      setInterviews(res.data.interviews || []);
    } catch (_) {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };
  const openEdit = (iv) => {
    setForm({
      company: iv.company, role: iv.role,
      scheduled_at: iv.scheduled_at ? new Date(iv.scheduled_at).toISOString().slice(0, 16) : '',
      format: iv.format, link: iv.link, notes: iv.notes, status: iv.status,
    });
    setEditId(iv._id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await api.patch(`/interviews/${editId}`, form);
      } else {
        await api.post('/interviews', form);
      }
      await load();
      setShowForm(false);
    } catch (_) {} finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Cancel this interview?')) return;
    await api.delete(`/interviews/${id}`);
    setInterviews((prev) => prev.filter((iv) => iv._id !== id));
  };

  const upcoming = interviews.filter((iv) => isUpcoming(iv.scheduled_at) && iv.status !== 'cancelled');
  const past = interviews.filter((iv) => !isUpcoming(iv.scheduled_at) || iv.status === 'cancelled');
  const shown = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="page-bg pt-20 pb-10 px-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-white">📅 Interview Scheduler</h1>
            <p className="text-gray-400 text-sm mt-1">Track and manage your upcoming interviews</p>
          </div>
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <span>+</span> Schedule Interview
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Upcoming', value: upcoming.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Completed', value: interviews.filter(iv => iv.status === 'completed').length, color: 'text-green-400', bg: 'bg-green-500/10' },
            { label: 'Total', value: interviews.length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((s) => (
            <div key={s.label} className={`glass-card p-4 text-center ${s.bg} border border-white/5`}>
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 glass-card p-1 w-fit">
          {['upcoming', 'past'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
              }`}>
              {t === 'upcoming' ? `🔜 Upcoming (${upcoming.length})` : `📁 Past (${past.length})`}
            </button>
          ))}
        </div>

        {/* Interview List */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading interviews...</div>
        ) : shown.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">{tab === 'upcoming' ? '📅' : '📁'}</div>
            <p className="text-white font-semibold mb-2">No {tab} interviews</p>
            {tab === 'upcoming' && (
              <button onClick={openNew} className="btn-primary mt-4">Schedule your first interview</button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map((iv) => (
              <div key={iv._id} className="glass-card-hover p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="text-3xl flex-shrink-0">{FORMAT_ICONS[iv.format] || '💼'}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{iv.role}</h3>
                    <span className="text-gray-400 text-sm">@ {iv.company}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLES[iv.status]}`}>
                      {iv.status}
                    </span>
                  </div>
                  <p className="text-purple-300 text-sm font-medium">📅 {formatDateTime(iv.scheduled_at)}</p>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
                    <span>{iv.format}</span>
                    {iv.link && <a href={iv.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">🔗 Join Link</a>}
                    {iv.notes && <span className="truncate max-w-xs" title={iv.notes}>📝 {iv.notes.slice(0, 50)}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => openEdit(iv)} className="px-3 py-1.5 text-xs rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 transition-all">
                    Edit
                  </button>
                  {iv.status === 'scheduled' && (
                    <button onClick={() => { openEdit(iv); setForm(f => ({ ...f, status: 'completed' })); }}
                      className="px-3 py-1.5 text-xs rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                      ✓ Done
                    </button>
                  )}
                  <button onClick={() => handleDelete(iv._id)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">
                {editId ? '✏️ Edit Interview' : '📅 Schedule Interview'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Company *</label>
                  <input className="input-field" placeholder="Google, Amazon..." required
                    value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Role *</label>
                  <input className="input-field" placeholder="Software Engineer..." required
                    value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Date & Time *</label>
                  <input type="datetime-local" className="input-field" required
                    value={form.scheduled_at} onChange={(e) => setForm({ ...form, scheduled_at: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Format</label>
                  <select className="input-field" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                    {['Online', 'Onsite', 'Phone', 'Assessment'].map((f) => (
                      <option key={f} value={f}>{FORMAT_ICONS[f]} {f}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Meeting Link (optional)</label>
                <input className="input-field" placeholder="https://meet.google.com/..."
                  value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
              </div>
              {editId && (
                <div>
                  <label className="form-label">Status</label>
                  <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {['scheduled', 'completed', 'cancelled', 'rescheduled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="form-label">Notes (optional)</label>
                <textarea className="input-field resize-none" rows={2} placeholder="Interview tips, topics to prepare..."
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Saving...' : (editId ? 'Update' : 'Schedule')}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
