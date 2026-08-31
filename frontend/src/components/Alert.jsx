export default function Alert({ type = 'error', message, onClose }) {
  if (!message) return null;
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  return (
    <div className={`border rounded-xl p-3.5 mb-4 text-sm flex justify-between items-start gap-3 ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 font-bold opacity-60 hover:opacity-100 transition">
          ×
        </button>
      )}
    </div>
  );
}
