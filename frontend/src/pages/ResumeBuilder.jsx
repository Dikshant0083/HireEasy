import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import ResumePreview from '../components/resume/ResumePreview';
import { Pencil, Eye, Download, Check, Plus, Trash2 } from 'lucide-react';
import { Segmented, Spinner } from '../components/ui';

const STEPS = [
  { id: 'personal', label: 'Personal' },
  { id: 'education', label: 'Education' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'certifications', label: 'Certifications' },
];

const TEMPLATES = [
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
  { value: 'minimal', label: 'Minimal' },
];

const DEFAULT_RESUME = {
  template: 'modern',
  personal: { name: '', email: '', phone: '', location: '', linkedin: '', github: '', website: '', summary: '' },
  education: [],
  experience: [],
  projects: [],
  skills: { technical: [], soft: [], languages: [], tools: [] },
  certifications: [],
};

const parseList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

function ListInput({ value, onChange, ...props }) {
  const [text, setText] = useState((value || []).join(', '));
  return <input {...props} value={text} onChange={(e) => { setText(e.target.value); onChange(parseList(e.target.value)); }} />;
}

function Entry({ title, onRemove, children }) {
  return (
    <div className="rounded-lg border border-[var(--line)] bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{title}</span>
        <button type="button" onClick={onRemove} className="btn-icon h-7 w-7 hover:text-red-700" aria-label={`Remove ${title}`}><Trash2 size={14} /></button>
      </div>
      {children}
    </div>
  );
}

export default function ResumeBuilder() {
  const [resume, setResume] = useState(DEFAULT_RESUME);
  const [step, setStep] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const printRef = useRef();

  useEffect(() => {
    api.get('/resume-builder').then((res) => {
      if (res.data.resume) setResume({ ...DEFAULT_RESUME, ...res.data.resume });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await api.put('/resume-builder', resume);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (_) {} finally { setSaving(false); }
  };

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Resume - ${resume.personal.name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; }
        @page { margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
      </head><body>${printContent}</body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  const updatePersonal = (field, value) =>
    setResume({ ...resume, personal: { ...resume.personal, [field]: value } });

  const updateSkills = (type, list) =>
    setResume({ ...resume, skills: { ...resume.skills, [type]: list } });

  const addListItem = (section, item) =>
    setResume({ ...resume, [section]: [...(resume[section] || []), item] });

  const removeListItem = (section, idx) =>
    setResume({ ...resume, [section]: resume[section].filter((_, i) => i !== idx) });

  const updateListItem = (section, idx, key, value) => {
    const arr = [...resume[section]];
    arr[idx] = { ...arr[idx], [key]: value };
    setResume({ ...resume, [section]: arr });
  };

  if (loading) return <div className="page flex items-center justify-center"><Spinner className="text-gray-400" /></div>;

  return (
    <div className="page">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[22px] font-semibold leading-tight">Resume</h1>
            <p className="mt-1 text-[13px] text-gray-600">Edit on the left, check the preview on the right, then export to PDF.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="Template" value={resume.template} onChange={(t) => setResume({ ...resume, template: t })} options={TEMPLATES} />
            <button onClick={() => setShowPreview(!showPreview)} className="btn-secondary btn-sm lg:hidden">
              {showPreview ? <><Pencil size={14} /> Edit</> : <><Eye size={14} /> Preview</>}
            </button>
            <button onClick={handlePrint} className="btn-secondary btn-sm"><Download size={14} /> Export PDF</button>
            <button onClick={save} disabled={saving} className="btn-primary btn-sm min-w-[72px]">
              {saving ? <Spinner /> : saved ? <><Check size={14} /> Saved</> : 'Save'}
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Steps + Form */}
          <div className={`${showPreview ? 'hidden lg:block lg:w-1/2' : 'flex-1'}`}>
            {/* Step tabs */}
            <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--line)]">
              {STEPS.map((s) => (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-[13px] font-medium transition-colors ${
                    step === s.id ? 'border-accent-600 text-accent-700' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>

            {/* Form sections */}
            <div className="glass-card space-y-4 p-5">
              {step === 'personal' && (
                <>
                  <h3 className="section-title mb-3">Personal Information
                  </h3>
                  {[
                    { key: 'name', label: 'Full name', placeholder: 'Your full name' },
                    { key: 'email', label: 'Email', placeholder: 'you@email.com' },
                    { key: 'phone', label: 'Phone', placeholder: '+91 9876543210' },
                    { key: 'location', label: 'Location', placeholder: 'Bengaluru, India' },
                    { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'linkedin.com/in/yourname' },
                    { key: 'github', label: 'GitHub URL', placeholder: 'github.com/yourname' },
                    { key: 'website', label: 'Portfolio / Website', placeholder: 'yourportfolio.com' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <input className="input-field" placeholder={placeholder}
                        value={resume.personal[key] || ''} onChange={(e) => updatePersonal(key, e.target.value)} />
                    </div>
                  ))}
                  <div>
                    <label className="form-label">Professional Summary</label>
                    <textarea className="input-field resize-none" rows={4}
                      placeholder="A passionate software engineer with 2+ years of experience..."
                      value={resume.personal.summary || ''} onChange={(e) => updatePersonal('summary', e.target.value)} />
                  </div>
                </>
              )}

              {step === 'education' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="section-title">Education
                    </h3>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => addListItem('education', { institution: '', degree: '', field: '', start_year: '', end_year: '', cgpa: '' })}><Plus size={14} /> Add</button>
                  </div>
                  {(resume.education || []).length === 0 && <p className="rounded-lg border border-dashed border-[var(--line-strong)] py-8 text-center text-[13px] text-gray-500">No education entries yet</p>}
                  {(resume.education || []).map((edu, i) => (
                    <Entry key={i} title={`Education ${i + 1}`} onRemove={() => removeListItem('education', i)}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="form-label">Institution</label>
                          <input className="input-field" placeholder="IIT Delhi, VIT..." value={edu.institution || ''} onChange={(e) => updateListItem('education', i, 'institution', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Degree</label>
                          <input className="input-field" placeholder="B.Tech" value={edu.degree || ''} onChange={(e) => updateListItem('education', i, 'degree', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Field</label>
                          <input className="input-field" placeholder="Computer Science" value={edu.field || ''} onChange={(e) => updateListItem('education', i, 'field', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Start Year</label>
                          <input className="input-field" placeholder="2020" value={edu.start_year || ''} onChange={(e) => updateListItem('education', i, 'start_year', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">End Year</label>
                          <input className="input-field" placeholder="2024" value={edu.end_year || ''} onChange={(e) => updateListItem('education', i, 'end_year', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">CGPA / Percentage</label>
                          <input className="input-field" placeholder="8.5 / 85%" value={edu.cgpa || ''} onChange={(e) => updateListItem('education', i, 'cgpa', e.target.value)} />
                        </div>
                      </div>
                    </Entry>
                  ))}
                </>
              )}

              {step === 'experience' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="section-title">Work Experience
                    </h3>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => addListItem('experience', { company: '', role: '', location: '', start_date: '', end_date: '', current: false, description: '' })}><Plus size={14} /> Add</button>
                  </div>
                  {(resume.experience || []).length === 0 && <p className="rounded-lg border border-dashed border-[var(--line-strong)] py-8 text-center text-[13px] text-gray-500">No experience entries yet</p>}
                  {(resume.experience || []).map((exp, i) => (
                    <Entry key={i} title={`Experience ${i + 1}`} onRemove={() => removeListItem('experience', i)}>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Company</label>
                          <input className="input-field" placeholder="Google, Startup..." value={exp.company || ''} onChange={(e) => updateListItem('experience', i, 'company', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Role</label>
                          <input className="input-field" placeholder="Software Engineer" value={exp.role || ''} onChange={(e) => updateListItem('experience', i, 'role', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Start Date</label>
                          <input className="input-field" placeholder="Jan 2023" value={exp.start_date || ''} onChange={(e) => updateListItem('experience', i, 'start_date', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">End Date</label>
                          <input className="input-field" placeholder="Present" disabled={exp.current} value={exp.current ? 'Present' : (exp.end_date || '')} onChange={(e) => updateListItem('experience', i, 'end_date', e.target.value)} />
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          <input type="checkbox" id={`curr-${i}`} checked={exp.current || false} onChange={(e) => updateListItem('experience', i, 'current', e.target.checked)} className="h-4 w-4 accent-[#4a78f2]" />
                          <label htmlFor={`curr-${i}`} className="text-gray-700 text-sm">Currently working here</label>
                        </div>
                        <div className="col-span-2">
                          <label className="form-label">Description (use bullet points)</label>
                          <textarea className="input-field resize-none" rows={4} placeholder="• Built microservices handling 1M+ requests/day&#10;• Reduced API latency by 40%..." value={exp.description || ''} onChange={(e) => updateListItem('experience', i, 'description', e.target.value)} />
                        </div>
                      </div>
                    </Entry>
                  ))}
                </>
              )}

              {step === 'projects' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="section-title">Projects
                    </h3>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => addListItem('projects', { name: '', description: '', tech_stack: [], link: '' })}><Plus size={14} /> Add</button>
                  </div>
                  {(resume.projects || []).length === 0 && <p className="rounded-lg border border-dashed border-[var(--line-strong)] py-8 text-center text-[13px] text-gray-500">No projects yet</p>}
                  {(resume.projects || []).map((proj, i) => (
                    <Entry key={i} title={`Project ${i + 1}`} onRemove={() => removeListItem('projects', i)}>
                      <div className="space-y-3">
                        <div>
                          <label className="form-label">Project Name</label>
                          <input className="input-field" placeholder="Project name" value={proj.name || ''} onChange={(e) => updateListItem('projects', i, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Tech Stack (comma-separated)</label>
                          <ListInput className="input-field" placeholder="React, Node.js, MongoDB" value={proj.tech_stack || []} onChange={(list) => updateListItem('projects', i, 'tech_stack', list)} />
                        </div>
                        <div>
                          <label className="form-label">Description</label>
                          <textarea className="input-field resize-none" rows={3} placeholder="Built a job platform that aggregates 1000+ real-time listings..." value={proj.description || ''} onChange={(e) => updateListItem('projects', i, 'description', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Link (GitHub / Live)</label>
                          <input className="input-field" placeholder="https://github.com/..." value={proj.link || ''} onChange={(e) => updateListItem('projects', i, 'link', e.target.value)} />
                        </div>
                      </div>
                    </Entry>
                  ))}
                </>
              )}

              {step === 'skills' && (
                <>
                  <h3 className="section-title mb-3">Skills
                  </h3>
                  {[
                    { key: 'technical', label: 'Technical Skills', placeholder: 'Python, React, Node.js, MongoDB, AWS...' },
                    { key: 'tools', label: 'Tools & Technologies', placeholder: 'Git, Docker, VS Code, Figma...' },
                    { key: 'languages', label: 'Programming Languages', placeholder: 'JavaScript, Python, Java, C++...' },
                    { key: 'soft', label: 'Soft Skills', placeholder: 'Leadership, Communication, Problem Solving...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <ListInput className="input-field" placeholder={placeholder}
                        value={resume.skills?.[key] || []}
                        onChange={(list) => updateSkills(key, list)} />
                      {(resume.skills?.[key] || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {resume.skills[key].map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 border border-purple-500/20">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              {step === 'certifications' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="section-title">Certifications
                    </h3>
                    <button type="button" className="btn-secondary btn-sm" onClick={() => addListItem('certifications', { name: '', issuer: '', year: '', link: '' })}><Plus size={14} /> Add</button>
                  </div>
                  {(resume.certifications || []).length === 0 && <p className="rounded-lg border border-dashed border-[var(--line-strong)] py-8 text-center text-[13px] text-gray-500">No certifications yet</p>}
                  {(resume.certifications || []).map((cert, i) => (
                    <Entry key={i} title={`Cert ${i + 1}`} onRemove={() => removeListItem('certifications', i)}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="form-label">Certificate Name</label>
                          <input className="input-field" placeholder="AWS Certified Developer" value={cert.name || ''} onChange={(e) => updateListItem('certifications', i, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Issuer</label>
                          <input className="input-field" placeholder="Amazon, Google..." value={cert.issuer || ''} onChange={(e) => updateListItem('certifications', i, 'issuer', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Year</label>
                          <input className="input-field" placeholder="2024" value={cert.year || ''} onChange={(e) => updateListItem('certifications', i, 'year', e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <label className="form-label">Certificate Link</label>
                          <input className="input-field" placeholder="https://credly.com/..." value={cert.link || ''} onChange={(e) => updateListItem('certifications', i, 'link', e.target.value)} />
                        </div>
                      </div>
                    </Entry>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={`${showPreview ? 'flex-1' : 'hidden lg:block lg:w-1/2'}`}>
            <div className="sticky top-20">
              <p className="eyebrow mb-2">Preview · A4</p>
              <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-white" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <div ref={printRef}>
                  <ResumePreview resume={resume} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
