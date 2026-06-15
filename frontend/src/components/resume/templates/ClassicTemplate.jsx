import React from 'react';

export default function ClassicTemplate({ resume }) {
  const { personal = {}, education = [], experience = [], projects = [], skills = {}, certifications = [] } = resume;
  const allSkills = [...(skills.technical || []), ...(skills.languages || []), ...(skills.tools || [])];

  return (
    <div style={{ fontFamily: 'Georgia, serif', width: '210mm', minHeight: '297mm', background: '#fff', color: '#111', padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ borderBottom: '2px solid #111', paddingBottom: 14, marginBottom: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>{personal.name || 'Your Name'}</div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 6, display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          {personal.email && <span>{personal.email}</span>}
          {personal.phone && <span>|</span>}{personal.phone && <span>{personal.phone}</span>}
          {personal.location && <span>|</span>}{personal.location && <span>{personal.location}</span>}
          {personal.linkedin && <span>|</span>}{personal.linkedin && <span>{personal.linkedin}</span>}
          {personal.github && <span>|</span>}{personal.github && <span>{personal.github}</span>}
        </div>
      </div>

      {/* Summary */}
      {personal.summary && (
        <ClassicSection title="Summary">
          <p style={{ fontSize: 10, lineHeight: 1.6, color: '#333' }}>{personal.summary}</p>
        </ClassicSection>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <ClassicSection title="Professional Experience">
          {experience.map((exp, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 11 }}>{exp.role}</strong>
                <span style={{ fontSize: 10, color: '#555', fontStyle: 'italic' }}>{exp.start_date} – {exp.current ? 'Present' : exp.end_date}</span>
              </div>
              <div style={{ fontSize: 10, color: '#555', marginBottom: 3 }}>{exp.company}</div>
              {exp.description && <div style={{ fontSize: 10, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{exp.description}</div>}
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Education */}
      {education.length > 0 && (
        <ClassicSection title="Education">
          {education.map((edu, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <strong style={{ fontSize: 11 }}>{edu.degree} in {edu.field}</strong>
                <div style={{ fontSize: 10, color: '#555' }}>{edu.institution}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 10 }}>
                <div>{edu.start_year} – {edu.end_year}</div>
                {edu.cgpa && <div style={{ color: '#16a34a', fontWeight: 600 }}>{edu.cgpa}</div>}
              </div>
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <ClassicSection title="Technical Skills">
          <p style={{ fontSize: 10, lineHeight: 1.8 }}>{allSkills.join('  ·  ')}</p>
        </ClassicSection>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <ClassicSection title="Projects">
          {projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: 11 }}>{proj.name}</strong>
                {proj.link && <a href={proj.link} style={{ fontSize: 9, color: '#1d4ed8' }}>{proj.link}</a>}
              </div>
              {(proj.tech_stack || []).length > 0 && <div style={{ fontSize: 9, color: '#555', marginBottom: 2, fontStyle: 'italic' }}>Tech: {proj.tech_stack.join(', ')}</div>}
              {proj.description && <div style={{ fontSize: 10, lineHeight: 1.5 }}>{proj.description}</div>}
            </div>
          ))}
        </ClassicSection>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <ClassicSection title="Certifications">
          {certifications.map((c, i) => (
            <div key={i} style={{ fontSize: 10, marginBottom: 4 }}>
              <strong>{c.name}</strong>{c.issuer && <span style={{ color: '#555' }}> — {c.issuer}</span>}{c.year && <span style={{ color: '#777' }}> ({c.year})</span>}
            </div>
          ))}
        </ClassicSection>
      )}
    </div>
  );
}

function ClassicSection({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, borderBottom: '1px solid #999', paddingBottom: 3, marginBottom: 8 }}>{title}</div>
      {children}
    </div>
  );
}
