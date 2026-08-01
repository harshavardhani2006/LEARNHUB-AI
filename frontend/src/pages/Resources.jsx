import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/resources/SearchBar';
import SubjectFilter from '../components/resources/SubjectFilter';
import ResourceGrid from '../components/resources/ResourceGrid';
import { ArrowUpDown } from 'lucide-react';

export const Resources = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subject, setSubject] = useState('All');
  const [sort, setSort] = useState('popularity');

  // When the URL search param changes (e.g. from TopNav), sync it into state
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl text-slate-900">Resource Library</h1>
          <p className="text-slate-500 mt-1">
            Browse and search shared learning materials from the community.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-card p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-lg">
            <SearchBar value={search} onSearch={setSearch} placeholder="Search by title, keywords or description..." />
          </div>
          
          <div className="flex items-center space-x-2 shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-white border border-slate-200 rounded-button px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all shadow-sm"
            >
              <option value="popularity">Sort by Popularity</option>
              <option value="newest">Sort by Newest</option>
              <option value="oldest">Sort by Oldest</option>
              <option value="views">Sort by Views</option>
              <option value="likes">Sort by Likes</option>
            </select>
          </div>
        </div>

        {/* Subject Pills */}
        <SubjectFilter selectedSubject={subject} onSelectSubject={setSubject} />
      </div>

      {/* Grid */}
      <ResourceGrid search={search} subject={subject} sort={sort} />
    </div>
  );
};

export default Resources;
