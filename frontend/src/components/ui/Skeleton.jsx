import React from 'react';

export const Skeleton = ({ variant = 'text', className = '' }) => {
  const baseClass = 'bg-slate-200 animate-pulse';
  
  const variants = {
    text: 'h-4 w-3/4 rounded',
    card: 'h-48 w-full rounded-card',
    avatar: 'h-10 w-10 rounded-full',
    title: 'h-6 w-1/2 rounded'
  };

  return (
    <div className={`${baseClass} ${variants[variant]} ${className}`} />
  );
};
