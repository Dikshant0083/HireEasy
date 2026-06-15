import React from 'react';

export default function ModernTemplate({ resume }) {
  const { personal = {}, education = [], experience = [], projects = [], skills = {}, certifications = [] } = resume;
  const allSkills = [
    ...(skills.technical || []),
    ...(skills.languages || []),
    ...(skills.tools || []),
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', Arial, sans-serif", width: '210mm', minHeight: '297mm', display: 'flex', background: '#fff' }}>
      {/* Sidebar */}
      <div style={{ width: '72mm', background: 'linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%)', padding: '32px 20px', color: '#fff', flexShrink: 0 }}>
        {/* Avatar */}
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 16, border: '3px solid rgba(255,255,255,0.4)' }}>
          {(personal.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2, marginBottom: 4 }}>{personal.name || 'Your Name'}</div>
        {personal.summary && <div style={{ fontSize: 10, opacity: 0.8, marginBottom: 20, lineHeight: 1.5 }}>{personal.summary}</div>}

        {/* Contact */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 4 }}>Contact</div>
          {personal.email && <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9 }}>✉ {personal.email}</div>}
          {personal.phone && <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9 }}>📱 {personal.phone}</div>}
          {personal.location && <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9 }}>📍 {personal.location}</div>}
          {personal.linkedin && <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9 }}>🔗 {personal.linkedin}</div>}
          {personal.github && <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.9 }}>💻 {personal.github}</div>}
        </div>

        {/* Skills */}
        {allSkills.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 4 }}>Skills</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {allSkills.map((s, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 12, fontSize: 9, fontWeight: 500 }}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* Soft skills */}
        {(skills.soft || []).length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.7, marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: 4 }}>Soft Skills</div>
            {skills.soft.map((s, i) => <div key={i} style={{ fontSize: 10, opacity: 0.85, marginBottom: 2 }}>• {s}</div>)}
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px 24px', color: '#1e1b4b' }}>
        {/* Experience */}
        {experience.length > 0 && (
          <Section title="Experience">
            {experience.map((exp, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#1e1b4b' }}>{exp.role}</div>
                    <div style={{ fontSize: 11, color: '#6d28d9', fontWeight: 600 }}>{exp.company}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>{exp.start_date} — {exp.current ? 'Present' : exp.end_date}</div>
                </div>
                {exp.description && <div style={{ fontSize: 10, color: '#374151', marginTop: 4, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{exp.description}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <Section title="Education">
            {education.map((edu, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 12 }}>{edu.degree} in {edu.field}</div>
                    <div style={{ fontSize: 11, color: '#6d28d9' }}>{edu.institution}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'right' }}>
                    <div>{edu.start_year} — {edu.end_year}</div>
                    {edu.cgpa && <div style={{ fontWeight: 600, color: '#059669' }}>CGPA: {edu.cgpa}</div>}
                  </div>
                </div>
              </div>
            ))}
          </Section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <Section title="Projects">
            {projects.map((proj, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{proj.name}</div>
                  {proj.link && <a href={proj.link} style={{ fontSize: 9, color: '#6d28d9' }}>{proj.link}</a>}
                </div>
                {(proj.tech_stack || []).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', margin: '3px 0' }}>
                    {proj.tech_stack.map((t, j) => (
                      <span key={j} style={{ background: '#ede9fe', color: '#6d28d9', padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                )}
                {proj.description && <div style={{ fontSize: 10, color: '#374151', lineHeight: 1.5 }}>{proj.description}</div>}
              </div>
            ))}
          </Section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <Section title="Certifications">
            {certifications.map((cert, i) => (
              <div key={i} style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 11 }}>{cert.name}</span>
                  {cert.issuer && <span style={{ fontSize: 10, color: '#6b7280' }}> · {cert.issuer}</span>}
                </div>
                <span style={{ fontSize: 10, color: '#6b7280' }}>{cert.year}</span>
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#6d28d9', borderBottom: '2px solid #6d28d9', paddingBottom: 4, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
