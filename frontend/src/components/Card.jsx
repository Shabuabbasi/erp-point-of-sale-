export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow ${padding ? 'p-4' : ''} ${className}`}>
      {children}
    </div>
  );
}
