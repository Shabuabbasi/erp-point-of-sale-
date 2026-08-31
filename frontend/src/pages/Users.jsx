import { useEffect, useState } from 'react';
import { Plus, Pencil, UserX, Shield, ShieldCheck, Eye } from 'lucide-react';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchInput from '../components/SearchInput';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import Input from '../components/Input';
import PermissionPicker from '../components/PermissionPicker';

const defaultForm = () => ({ name: '', email: '', password: '', role: 'cashier', permissions: [] });

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [viewUserPerms, setViewUserPerms] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(defaultForm());

  const roleTemplate = (roleId) => roles.find((r) => r.id === roleId)?.permissions.map((p) => p.id) || [];

  const fetchUsers = () => {
    setLoading(true);
    const params = { limit: 50 };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    api.get('/users', { params })
      .then((res) => setUsers(res.data.users))
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/users/roles')
      .then((res) => {
        setRoles(res.data.roles);
        setAllPermissions(res.data.allPermissions || []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load roles'));
    fetchUsers();
  }, [search, roleFilter]);

  const openModal = (user = null) => {
    if (user) {
      setEditing(user);
      setForm({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        permissions: user.effectivePermissions || user.permissions || roleTemplate(user.role),
      });
    } else {
      setEditing(null);
      const role = 'cashier';
      setForm({ ...defaultForm(), role, permissions: roleTemplate(role) });
    }
    setModalOpen(true);
  };

  const handleRoleChange = (role) => {
    setForm((prev) => ({
      ...prev,
      role,
      permissions: roleTemplate(role),
    }));
  };

  const viewRolePermissions = (role) => {
    const r = roles.find((x) => x.id === role);
    if (!r) return;
    setViewUserPerms(null);
    setSelectedRole(r);
    setPermOpen(true);
  };

  const viewUserPermissions = (user) => {
    setSelectedRole(null);
    setViewUserPerms({
      name: user.name,
      role: user.role,
      permissions: (user.effectivePermissions || []).map((id) => ({
        id,
        label: allPermissions.find((p) => p.id === id)?.label || id,
      })),
    });
    setPermOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.permissions.length === 0) {
      setError('Select at least one permission');
      return;
    }
    try {
      if (editing) {
        const payload = { name: form.name, role: form.role, permissions: form.permissions };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing._id}`, payload);
        setSuccess('User updated');
      } else {
        await api.post('/users', form);
        setSuccess('User created');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user? They will not be able to login.')) return;
    try {
      await api.delete(`/users/${id}`);
      setSuccess('User deactivated');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const handleReactivate = async (user) => {
    try {
      await api.put(`/users/${user._id}`, { isActive: true });
      setSuccess('User reactivated');
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Staff & Roles"
        description="Add staff with flexible permissions for admin or cashier roles"
        action={
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" />
            Add Staff
          </Button>
        }
      />

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {roles.length === 0 ? (
          <Card className="md:col-span-2 text-center text-sm text-slate-500 py-6">
            Loading roles… (deploy latest backend if this stays empty)
          </Card>
        ) : (
          roles.map((role) => (
            <Card key={role.id} className="hover:border-blue-200" onClick={() => viewRolePermissions(role.id)}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role.id === 'admin' ? 'bg-violet-100' : 'bg-blue-100'}`}>
                  {role.id === 'admin' ? <ShieldCheck className="w-5 h-5 text-violet-600" /> : <Shield className="w-5 h-5 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 capitalize">{role.label}</h3>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); viewRolePermissions(role.id); }}
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Default permissions
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{role.permissions.length} default permissions · customizable per user</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="mb-4 flex gap-3 flex-wrap">
        <SearchInput placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 min-w-[200px]" />
        <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="mb-0 w-40">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="cashier">Cashier</option>
        </Select>
      </Card>

      <Card padding={false}>
        {loading ? <Spinner /> : users.length === 0 ? (
          <EmptyState message="No staff found" description="Add a cashier or admin to get started" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Role</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Permissions</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Joined</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className={`hover:bg-slate-50/80 ${!u.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.role === 'admin' ? 'primary' : 'info'} className="capitalize">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        type="button"
                        onClick={() => viewUserPermissions(u)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {(u.effectivePermissions?.length || 0)} permissions
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      {u.isActive !== false ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewUserPermissions(u)} className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg" title="Permissions">
                          <Shield className="w-4 h-4" />
                        </button>
                        <button onClick={() => openModal(u)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg" title="Edit">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.isActive !== false ? (
                          <button onClick={() => handleDeactivate(u._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Deactivate">
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button onClick={() => handleReactivate(u)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg text-xs font-medium px-2">
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Staff' : 'Add Staff'} size="lg">
        <form onSubmit={handleSubmit}>
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editing} />
          <Input label={editing ? 'New Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} minLength={6} />
          <Select label="Role" value={form.role} onChange={(e) => handleRoleChange(e.target.value)} required>
            <option value="cashier">Cashier</option>
            <option value="admin">Admin</option>
          </Select>
          <PermissionPicker
            allPermissions={allPermissions}
            selected={form.permissions}
            onChange={(permissions) => setForm({ ...form, permissions })}
            roleTemplate={roleTemplate(form.role)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={permOpen}
        onClose={() => { setPermOpen(false); setViewUserPerms(null); setSelectedRole(null); }}
        title={viewUserPerms ? `${viewUserPerms.name}'s Permissions` : `${selectedRole?.label} Default Permissions`}
        size="md"
      >
        {viewUserPerms ? (
          <div>
            <p className="text-sm text-slate-500 mb-4">
              Custom permissions for <strong>{viewUserPerms.name}</strong> ({viewUserPerms.role})
            </p>
            <ul className="space-y-2">
              {viewUserPerms.permissions.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
        ) : selectedRole && (
          <div>
            <p className="text-sm text-slate-500 mb-4">
              Default template for <strong className="capitalize">{selectedRole.label}</strong>. You can customize these when adding or editing staff.
            </p>
            <ul className="space-y-2">
              {selectedRole.permissions.map((p) => (
                <li key={p.id} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>
    </div>
  );
}
