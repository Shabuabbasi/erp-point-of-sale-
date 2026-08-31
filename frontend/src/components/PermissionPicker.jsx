import { CheckSquare, Square } from 'lucide-react';

export default function PermissionPicker({ allPermissions, selected, onChange, roleTemplate = [] }) {
  const toggle = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter((p) => p !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => onChange(allPermissions.map((p) => p.id));
  const selectNone = () => onChange([]);
  const useTemplate = () => onChange([...roleTemplate]);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-slate-700">Permissions</label>
        <div className="flex gap-2 text-xs">
          <button type="button" onClick={useTemplate} className="text-blue-600 hover:underline">
            Role default
          </button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={selectAll} className="text-blue-600 hover:underline">
            All
          </button>
          <span className="text-slate-300">|</span>
          <button type="button" onClick={selectNone} className="text-slate-500 hover:underline">
            None
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Choose what this user can access. You can customize permissions for both admin and cashier roles.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50">
        {allPermissions.map((perm) => {
          const checked = selected.includes(perm.id);
          return (
            <button
              key={perm.id}
              type="button"
              onClick={() => toggle(perm.id)}
              className={`flex items-start gap-2 text-left text-xs rounded-lg px-2.5 py-2 transition ${
                checked ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-white text-slate-600 border border-slate-100 hover:border-slate-200'
              }`}
            >
              {checked ? (
                <CheckSquare className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
              )}
              <span>{perm.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 mt-2">{selected.length} of {allPermissions.length} selected</p>
    </div>
  );
}
