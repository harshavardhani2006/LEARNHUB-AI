import React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({ 
  icon: Icon = Sparkles, 
  title, 
  description, 
  actionText, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      
      <h3 className="text-lg font-heading font-semibold text-slate-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-slate-500 mb-6">
          {description}
        </p>
      )}
      
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
