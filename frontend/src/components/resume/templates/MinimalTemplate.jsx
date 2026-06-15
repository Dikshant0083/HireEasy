import React from 'react';

export default function MinimalTemplate({ resume }) {
  const { personal = {}, education = [], experience = [], projects = [], skills = {}, certifications = [] } = resume;
  const allSkills = [...(skills.technical || []), ...(skills.languages || []), ...(skills.tools || [])];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", width: '210mm', minHeight: '297mm', background: '#fff', padding: '40px 44px', color: '#18181b' }}>
      {/* Name & Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -1 }}>{personal.name || 'Your Name'}</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 6, fontSize: 10, color: '#6b7280' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>{personal.github}</span>}
        </div>
        {personal.summary && <p style={{ margin: '10px 0 0', fontSize: 11, lineHeight: 1.7, color: '#52525b', maxWidth: '90%' }}>{personal.summary}</p>}
      </div>

      {/* Experience */}
      {experience.length > 0 && <MinSection title="Experience">
        {experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: 14, paddingLeft: 12, borderLeft: '2px solid #e4e4e7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
              <span style={{ fontWeight: 700, fontSize: 12 }}>{exp.role}</span>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
            </div>
            <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 3 }}>{exp.company}</div>
            {exp.description && <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{exp.description}</div>}
          </div>
        ))}
      </MinSection>}

      {/* Education */}
      {education.length > 0 && <MinSection title="Education">
        {education.map((edu, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, paddingLeft: 12, borderLeft: '2px solid #e4e4e7' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 11 }}>{edu.degree} in {edu.field}</div>
              <div style={{ fontSize: 10, color: '#6b7280' }}>{edu.institution}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 10, color: '#9ca3af' }}>
              <div>{edu.start_year} – {edu.end_year}</div>
              {edu.cgpa && <div style={{ color: '#059669', fontWeight: 600 }}>{edu.cgpa}</div>}
            </div>
          </div>
        ))}
      </MinSection>}

      {/* Skills */}
      {allSkills.length > 0 && <MinSection title="Skills">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {allSkills.map((s, i) => <span key={i} style={{ border: '1px solid #e4e4e7', borderRadius: 6, padding: '2px 8px', fontSize: 10, color: '#374151' }}>{s}</span>)}
        </div>
      </MinSection>}

      {/* Projects */}
      {projects.length > 0 && <MinSection title="Projects">
        {projects.map((proj, i) => (
          <div key={i} style={{ marginBottom: 10, paddingLeft: 12, borderLeft: '2px solid #e4e4e7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: 11 }}>{proj.name}</span>
              {proj.link && <a href={proj.link} style={{ fontSize: 9, color: '#6d28d9' }}>{proj.link}</a>}
            </div>
            {(proj.tech_stack || []).length > 0 && <div style={{ fontSize: 9, color: '#9ca3af', margin: '2px 0' }}>{proj.tech_stack.join(' · ')}</div>}
            {proj.description && <div style={{ fontSize: 10, color: '#52525b', lineHeight: 1.5 }}>{proj.description}</div>}
          </div>
        ))}
      </MinSection>}

      {/* Certifications */}
      {certifications.length > 0 && <MinSection title="Certifications">
        {certifications.map((c, i) => (
          <div key={i} style={{ fontSize: 10, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>{c.name}</strong>{c.issuer && <span style={{ color: '#6b7280' }}> · {c.issuer}</span>}</span>
            <span style={{ color: '#9ca3af' }}>{c.year}</span>
          </div>
        ))}
      </MinSection>}
    </div>
  );
}

function MinSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: '#9ca3af', marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
