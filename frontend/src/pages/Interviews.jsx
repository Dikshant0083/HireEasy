import React, { useEffect, useState } from 'react';
import { Plus, CalendarDays, Video, Building2, Phone, ClipboardCheck, ArrowUpRight } from 'lucide-react';
import { interviewsAPI } from '../services/api';
import { EmptyState, Modal, PageHeader, Segmented, Spinner } from '../components/ui';

const FORMATS = { Online: Video, Onsite: Building2, Phone, Assessment: ClipboardCheck };
const STATUS = {
  scheduled: 'text-accent-700',
  rescheduled: 'text-amber-700',
  completed: 'text-emerald-700',
  cancelled: 'text-gray-500 line-through',
};
const EMPTY_FORM = { company: '', role: '', scheduled_at: '', format: 'Online', link: '', notes: '', status: 'scheduled' };

// <input type="datetime-local"> works in local time; toISOString() would shift it to UTC.
function toLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Same day: minutes/hours. Otherwise count calendar days, so tomorrow 9 AM is "tomorrow", not "in 0.6 days".
function relative(iso) {
  const when = new Date(iso);
  const now = new Date();
  const diff = when - now;
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(when) - startOf(now)) / 86400000);
  if (days === 0) {
    const mins = Math.max(1, Math.round(Math.abs(diff) / 60000));
    const text = mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`;
    return diff >= 0 ? `in ${text}` : `${text} ago`;
  }
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
}

function InterviewForm({ initial, editing, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (form.link && !/^https?:\/\//i.test(form.link)) return setError('Meeting link must start with http:// or https://');
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, scheduled_at: new Date(form.scheduled_at).toISOString() };
      if (editing) await interviewsAPI.update(editing, payload);
      else await interviewsAPI.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Couldn’t save the interview.');
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Edit interview' : 'Add interview'} onClose={onClose} width="max-w-lg">
      {error && <div className="alert-error mb-4" role="alert">{error}</div>}
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="iv-company" className="form-label">Company</label>
            <input id="iv-company" className="input-field" required value={form.company} onChange={set('company')} />
          </div>
          <div>
            <label htmlFor="iv-role" className="form-label">Role</label>
            <input id="iv-role" className="input-field" required value={form.role} onChange={set('role')} />
          </div>
          <div>
            <label htmlFor="iv-when" className="form-label">Date and time</label>
            <input id="iv-when" type="datetime-local" className="input-field" required value={form.scheduled_at} onChange={set('scheduled_at')} />
          </div>
          <div>
            <label htmlFor="iv-format" className="form-label">Format</label>
            <select id="iv-format" className="input-field" value={form.format} onChange={set('format')}>
              {Object.keys(FORMATS).map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="iv-link" className="form-label">Meeting or test link <span className="font-normal text-gray-400">· optional</span></label>
          <input id="iv-link" type="url" className="input-field" placeholder="https://" value={form.link} onChange={set('link')} />
        </div>
        {editing && (
          <div>
            <label htmlFor="iv-status" className="form-label">Status</label>
            <select id="iv-status" className="input-field" value={form.status} onChange={set('status')}>
              {Object.keys(STATUS).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="iv-notes" className="form-label">Notes <span className="font-normal text-gray-400">· optional</span></label>
          <textarea id="iv-notes" className="input-field resize-none" rows={3} placeholder="Interviewer, topics to prepare…" value={form.notes} onChange={set('notes')} />
        </div>
        <p className="text-xs text-gray-500">You’ll get an email reminder about an hour before.</p>
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <><Spinner /> Saving</> : editing ? 'Save changes' : 'Add interview'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Interviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState(null); // { initial, editing }
  const [tab, setTab] = useState('upcoming');

  const load = async () => {
    try {
      const res = await interviewsAPI.getAll();
      setInterviews(res.data.interviews || []);
      setError('');
    } catch {
      setError('Couldn’t load your interviews. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openNew = () => setModal({ initial: EMPTY_FORM, editing: null });
  const openEdit = (iv) => setModal({
    editing: iv._id,
    initial: { company: iv.company, role: iv.role, scheduled_at: toLocalInput(iv.scheduled_at), format: iv.format, link: iv.link || '', notes: iv.notes || '', status: iv.status },
  });

  const updateStatus = async (iv, status) => {
    setInterviews((list) => list.map((x) => (x._id === iv._id ? { ...x, status } : x)));
    try { await interviewsAPI.update(iv._id, { status }); } catch { load(); }
  };

  const handleDelete = async (iv) => {
    if (!window.confirm(`Delete the ${iv.company} interview? This can’t be undone.`)) return;
    setInterviews((list) => list.filter((x) => x._id !== iv._id));
    try { await interviewsAPI.delete(iv._id); } catch { load(); }
  };

  const now = new Date();
  const isUpcoming = (iv) => new Date(iv.scheduled_at) > now && iv.status !== 'cancelled' && iv.status !== 'completed';
  const upcoming = interviews.filter(isUpcoming);
  const past = interviews.filter((iv) => !isUpcoming(iv)).reverse();
  const shown = tab === 'upcoming' ? upcoming : past;
  const next = upcoming[0];

  return (
    <div className="page">
      <div className="mx-auto max-w-4xl animate-fade-in">
        <PageHeader
          title="Interviews"
          description={next ? <>Next: <span className="text-gray-800">{next.company}</span>, {relative(next.scheduled_at)}</> : 'Keep interview dates, links and notes in one place.'}
          actions={<button onClick={openNew} className="btn-primary btn-sm"><Plus size={14} /> Add interview</button>}
        />

        <div className="mb-4">
          <Segmented label="Show" value={tab} onChange={setTab} options={[
            { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { value: 'past', label: 'Past', count: past.length },
          ]} />
        </div>

        {error ? (
          <div className="alert-error">{error}</div>
        ) : loading ? (
          <div className="glass-card divide-y divide-[var(--line)]">
            {[0, 1, 2].map((i) => <div key={i} className="flex gap-4 px-4 py-4"><div className="skeleton h-10 w-12" /><div className="flex-1 space-y-2"><div className="skeleton h-3.5 w-1/3" /><div className="skeleton h-3 w-1/4" /></div></div>)}
          </div>
        ) : shown.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={tab === 'upcoming' ? 'No upcoming interviews' : 'No past interviews'}
            body={tab === 'upcoming' ? 'Add one to get an email reminder an hour before it starts.' : 'Completed and cancelled interviews show up here.'}
            action={tab === 'upcoming' && <button onClick={openNew} className="btn-secondary btn-sm"><Plus size={14} /> Add interview</button>}
          />
        ) : (
          <ul className="glass-card divide-y divide-[var(--line)]">
            {shown.map((iv) => {
              const d = new Date(iv.scheduled_at);
              const Icon = FORMATS[iv.format] || Video;
              return (
                <li key={iv._id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-4">
                    <div className="w-12 flex-shrink-0 rounded-lg border border-[var(--line-strong)] py-1.5 text-center">
                      <p className="text-2xs font-medium uppercase text-gray-500">{d.toLocaleDateString('en-US', { month: 'short' })}</p>
                      <p className="num text-[17px] font-semibold leading-tight text-gray-900">{d.getDate()}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-medium text-gray-900">{iv.role} <span className="font-normal text-gray-600">· {iv.company}</span></p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                        <span className="num">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} · {relative(iv.scheduled_at)}</span>
                        <span className="flex items-center gap-1"><Icon size={12} /> {iv.format}</span>
                        <span className={`capitalize ${STATUS[iv.status]}`}>{iv.status}</span>
                      </p>
                      {iv.notes && <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">{iv.notes}</p>}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1 pl-16 sm:pl-0">
                    {iv.link && isUpcoming(iv) && (
                      <a href={iv.link} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">Join <ArrowUpRight size={13} /></a>
                    )}
                    {iv.status === 'scheduled' && new Date(iv.scheduled_at) < now && (
                      <button onClick={() => updateStatus(iv, 'completed')} className="btn-secondary btn-sm">Mark done</button>
                    )}
                    <button onClick={() => openEdit(iv)} className="btn-ghost btn-sm">Edit</button>
                    <button onClick={() => handleDelete(iv)} className="btn-ghost btn-sm text-gray-500 hover:text-red-700">Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modal && (
        <InterviewForm
          initial={modal.initial}
          editing={modal.editing}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
