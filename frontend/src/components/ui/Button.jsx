import React from 'react';

export const Button = ({
  children,
  variant = 'primary',
  className = '',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-button disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700 hover:shadow-glow-primary hover:-translate-y-0.5',
    secondary: 'bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50',
    ai: 'bg-gradient-to-r from-ai-purple to-accent-cyan text-white hover:shadow-glow-ai hover:-translate-y-0.5',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = props.size ? sizes[props.size] : sizes.md;

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};
