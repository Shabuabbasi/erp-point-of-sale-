import { Inbox } from 'lucide-react';

export default function EmptyState({ message = 'No data found', description }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-600">{message}</p>
      {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
    </div>
  );
}
