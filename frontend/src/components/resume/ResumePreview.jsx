import React from 'react';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import MinimalTemplate from './templates/MinimalTemplate';

export default function ResumePreview({ resume }) {
  const { template = 'modern' } = resume;
  if (template === 'classic') return <ClassicTemplate resume={resume} />;
  if (template === 'minimal') return <MinimalTemplate resume={resume} />;
  return <ModernTemplate resume={resume} />;
}
