export default function Button({ children, variant = 'primary', className = '', disabled, ...props }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow',
    secondary: 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow',
    success: 'bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600',
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
