import React from 'react';
import { SOURCE_NAMES } from './ui';

export const EMPTY_FILTERS = { type: '', search: '', remote: false, source: '' };

const TYPES = [
  { value: '', label: 'All opportunities' },
  { value: 'job', label: 'Jobs' },
  { value: 'internship', label: 'Internships' },
  { value: 'scholarship', label: 'Scholarships' },
];
const SOURCES = [{ value: '', label: 'All sources' }, ...Object.entries(SOURCE_NAMES).map(([value, label]) => ({ value, label }))];

function Group({ title, name, options, value, onChange }) {
  return (
    <fieldset className="border-t border-[var(--line)] px-4 py-4 first:border-t-0">
      <legend className="sr-only">{title}</legend>
      <p className="mb-2.5 text-[14px] font-semibold text-gray-900" aria-hidden="true">{title}</p>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.value || 'all'} className="flex cursor-pointer items-center gap-2.5 text-[13px] text-gray-700 hover:text-gray-900">
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="h-4 w-4 accent-[#2557d6]"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function FilterPanel({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value });
  const dirty = filters.type || filters.remote || filters.source;

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <h2 className="text-[15px] font-semibold text-gray-900">All filters</h2>
        {dirty && (
          <button type="button" onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })} className="text-[13px] font-semibold text-accent-700 hover:underline">
            Clear
          </button>
        )}
      </div>

      <div className="border-b border-[var(--line)] px-4 py-4">
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] font-medium text-gray-800">
          <input type="checkbox" checked={!!filters.remote} onChange={() => set('remote', !filters.remote)} className="h-4 w-4 rounded accent-[#2557d6]" />
          Work from home / remote only
        </label>
      </div>
      <Group title="Opportunity type" name="type" options={TYPES} value={filters.type} onChange={(v) => set('type', v)} />
      <Group title="Source" name="source" options={SOURCES} value={filters.source} onChange={(v) => set('source', v)} />
    </div>
  );
}
