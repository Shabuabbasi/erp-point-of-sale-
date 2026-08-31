import EmptyState from './EmptyState';

export default function Table({ columns, data, emptyMessage = 'No data found', emptyDescription }) {
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => (
            <tr key={row._id || i} className="hover:bg-slate-50/80 transition-colors">
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3.5 text-slate-700 ${col.align === 'right' ? 'text-right' : ''}`}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
