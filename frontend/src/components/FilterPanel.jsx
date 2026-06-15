import React from 'react';

export default function FilterPanel({ filters, onChange, total }) {
  const handleChange = (key, value) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm">🔍 Filters</h3>
        {total !== undefined && (
          <span className="text-xs text-purple-400 font-medium">{total.toLocaleString()} results</span>
        )}
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Search</label>
          <input
            type="text"
            className="input-field"
            placeholder="Title, company, skills..."
            value={filters.search || ''}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: '', label: '🌐 All' },
              { value: 'job', label: '💼 Jobs' },
              { value: 'internship', label: '🎓 Internships' },
              { value: 'scholarship', label: '🏅 Scholarships' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange('type', opt.value)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  filters.type === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Source */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Source</label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { value: '', label: '🌐 All' },
              { value: 'remotive', label: '📡 Remotive' },
              { value: 'arbeitnow', label: '🇩🇪 Arbeitnow' },
              { value: 'csv', label: '📄 My CSV' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => handleChange('source', opt.value)}
                className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  filters.source === opt.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Remote */}
        <div className="flex items-center justify-between">
          <label className="text-xs text-gray-400 font-medium">Remote Only</label>
          <button
            onClick={() => handleChange('remote', !filters.remote)}
            className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
              filters.remote ? 'bg-purple-600' : 'bg-white/10'
            }`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
              filters.remote ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* Clear */}
        <button
          onClick={() => onChange({ type: '', search: '', remote: false, source: '' })}
          className="w-full py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors bg-white/3 hover:bg-white/8"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
