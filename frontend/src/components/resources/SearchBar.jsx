import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

export const SearchBar = ({ value: externalValue, onSearch, placeholder = 'Search...' }) => {
  const [value, setValue] = useState(externalValue || '');

  // Sync if parent changes the value (e.g. from URL param)
  useEffect(() => {
    if (externalValue !== undefined) setValue(externalValue);
  }, [externalValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(handler);
  }, [value, onSearch]);

  return (
    <div className="relative w-full">
      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-button text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
      />
    </div>
  );
};

export default SearchBar;
