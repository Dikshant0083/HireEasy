import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import ResumePreview from '../components/resume/ResumePreview';

const STEPS = [
  { id: 'personal',       label: 'Personal',       icon: '👤' },
  { id: 'education',      label: 'Education',       icon: '🎓' },
  { id: 'experience',     label: 'Experience',      icon: '💼' },
  { id: 'projects',       label: 'Projects',        icon: '🚀' },
  { id: 'skills',         label: 'Skills',          icon: '⚡' },
  { id: 'certifications', label: 'Certifications',  icon: '🏅' },
];

const TEMPLATES = [
  { id: 'modern',  label: 'Modern',  desc: 'Purple gradient, clean sidebar' },
  { id: 'classic', label: 'Classic', desc: 'Professional, ATS-friendly' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean & distraction-free' },
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

  const updateSkills = (type, value) =>
    setResume({ ...resume, skills: { ...resume.skills, [type]: value.split(',').map(s => s.trim()).filter(Boolean) } });

  const addListItem = (section, item) =>
    setResume({ ...resume, [section]: [...(resume[section] || []), item] });

  const removeListItem = (section, idx) =>
    setResume({ ...resume, [section]: resume[section].filter((_, i) => i !== idx) });

  const updateListItem = (section, idx, key, value) => {
    const arr = [...resume[section]];
    arr[idx] = { ...arr[idx], [key]: value };
    setResume({ ...resume, [section]: arr });
  };

  if (loading) return <div className="page-bg pt-20 min-h-screen flex items-center justify-center"><div className="text-gray-400 animate-pulse text-lg">Loading your resume...</div></div>;

  return (
    <div className="page-bg pt-20 pb-10 px-4 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">📄 Resume Builder</h1>
            <p className="text-gray-400 text-sm mt-1">Build your resume in minutes — export as PDF</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowPreview(!showPreview)}
              className={`btn-secondary text-sm ${showPreview ? 'ring-1 ring-purple-500' : ''}`}>
              {showPreview ? '📝 Edit' : '👁️ Preview'}
            </button>
            <button onClick={handlePrint} className="btn-secondary text-sm">⬇️ Export PDF</button>
            <button onClick={save} disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save'}
            </button>
          </div>
        </div>

        {/* Template selector */}
        <div className="glass-card p-4 mb-6 flex flex-wrap gap-3 items-center">
          <span className="text-gray-400 text-sm font-medium">Template:</span>
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => setResume({ ...resume, template: t.id })}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                resume.template === t.id
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : 'border-white/10 text-gray-400 hover:border-purple-500/50 hover:text-white'
              }`}>
              {t.label}
              <span className="text-xs ml-2 opacity-60">{t.desc}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Steps + Form */}
          <div className={`${showPreview ? 'hidden lg:block lg:w-1/2' : 'flex-1'}`}>
            {/* Step tabs */}
            <div className="flex gap-1 flex-wrap glass-card p-1 mb-4">
              {STEPS.map((s) => (
                <button key={s.id} onClick={() => setStep(s.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    step === s.id ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'
                  }`}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            {/* Form sections */}
            <div className="glass-card p-5 space-y-4">
              {step === 'personal' && (
                <>
                  <h3 className="text-white font-semibold mb-3">👤 Personal Information</h3>
                  {[
                    { key: 'name', label: 'Full Name', placeholder: 'Dikshant Choudhary' },
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
                    <h3 className="text-white font-semibold">🎓 Education</h3>
                    <button className="btn-secondary text-xs" onClick={() => addListItem('education', { institution: '', degree: '', field: '', start_year: '', end_year: '', cgpa: '' })}>+ Add</button>
                  </div>
                  {(resume.education || []).length === 0 && <p className="text-gray-500 text-sm text-center py-4">No education entries yet</p>}
                  {(resume.education || []).map((edu, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-medium">Education #{i + 1}</span>
                        <button onClick={() => removeListItem('education', i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                      </div>
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
                    </div>
                  ))}
                </>
              )}

              {step === 'experience' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">💼 Work Experience</h3>
                    <button className="btn-secondary text-xs" onClick={() => addListItem('experience', { company: '', role: '', location: '', start_date: '', end_date: '', current: false, description: '' })}>+ Add</button>
                  </div>
                  {(resume.experience || []).length === 0 && <p className="text-gray-500 text-sm text-center py-4">No experience entries yet</p>}
                  {(resume.experience || []).map((exp, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white text-sm font-medium">Experience #{i + 1}</span>
                        <button onClick={() => removeListItem('experience', i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                      </div>
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
                          <input type="checkbox" id={`curr-${i}`} checked={exp.current || false} onChange={(e) => updateListItem('experience', i, 'current', e.target.checked)} className="w-4 h-4 accent-purple-500" />
                          <label htmlFor={`curr-${i}`} className="text-gray-300 text-sm">Currently working here</label>
                        </div>
                        <div className="col-span-2">
                          <label className="form-label">Description (use bullet points)</label>
                          <textarea className="input-field resize-none" rows={4} placeholder="• Built microservices handling 1M+ requests/day&#10;• Reduced API latency by 40%..." value={exp.description || ''} onChange={(e) => updateListItem('experience', i, 'description', e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {step === 'projects' && (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">🚀 Projects</h3>
                    <button className="btn-secondary text-xs" onClick={() => addListItem('projects', { name: '', description: '', tech_stack: [], link: '' })}>+ Add</button>
                  </div>
                  {(resume.projects || []).length === 0 && <p className="text-gray-500 text-sm text-center py-4">No projects yet</p>}
                  {(resume.projects || []).map((proj, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white text-sm font-medium">Project #{i + 1}</span>
                        <button onClick={() => removeListItem('projects', i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="form-label">Project Name</label>
                          <input className="input-field" placeholder="HireEasy, SmartCV..." value={proj.name || ''} onChange={(e) => updateListItem('projects', i, 'name', e.target.value)} />
                        </div>
                        <div>
                          <label className="form-label">Tech Stack (comma-separated)</label>
                          <input className="input-field" placeholder="React, Node.js, MongoDB" value={(proj.tech_stack || []).join(', ')} onChange={(e) => updateListItem('projects', i, 'tech_stack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
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
                    </div>
                  ))}
                </>
              )}

              {step === 'skills' && (
                <>
                  <h3 className="text-white font-semibold mb-3">⚡ Skills</h3>
                  {[
                    { key: 'technical', label: 'Technical Skills', placeholder: 'Python, React, Node.js, MongoDB, AWS...' },
                    { key: 'tools', label: 'Tools & Technologies', placeholder: 'Git, Docker, VS Code, Figma...' },
                    { key: 'languages', label: 'Programming Languages', placeholder: 'JavaScript, Python, Java, C++...' },
                    { key: 'soft', label: 'Soft Skills', placeholder: 'Leadership, Communication, Problem Solving...' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="form-label">{label}</label>
                      <input className="input-field" placeholder={placeholder}
                        value={(resume.skills?.[key] || []).join(', ')}
                        onChange={(e) => updateSkills(key, e.target.value)} />
                      {(resume.skills?.[key] || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {resume.skills[key].map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20">{s}</span>
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
                    <h3 className="text-white font-semibold">🏅 Certifications</h3>
                    <button className="btn-secondary text-xs" onClick={() => addListItem('certifications', { name: '', issuer: '', year: '', link: '' })}>+ Add</button>
                  </div>
                  {(resume.certifications || []).length === 0 && <p className="text-gray-500 text-sm text-center py-4">No certifications yet</p>}
                  {(resume.certifications || []).map((cert, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white text-sm font-medium">Cert #{i + 1}</span>
                        <button onClick={() => removeListItem('certifications', i)} className="text-red-400 text-xs hover:text-red-300">Remove</button>
                      </div>
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
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className={`${showPreview ? 'flex-1' : 'hidden lg:block lg:w-1/2'}`}>
            <div className="sticky top-20">
              <div className="text-xs text-gray-500 text-center mb-2">Live Preview</div>
              <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
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
