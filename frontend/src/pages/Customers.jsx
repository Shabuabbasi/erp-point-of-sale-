import { useEffect, useState } from 'react';
import { Plus, History, Pencil, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchInput from '../components/SearchInput';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import Input from '../components/Input';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

export default function Customers() {
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  const fetchCustomers = () => {
    setLoading(true);
    api.get('/customers', { params: { page, limit: 10, search } })
      .then((res) => { setCustomers(res.data.customers); setPages(res.data.pagination.pages); })
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [page, search]);

  const openModal = (customer = null) => {
    if (customer) {
      setEditing(customer);
      setForm({ name: customer.name, phone: customer.phone, email: customer.email, address: customer.address });
    } else {
      setEditing(null);
      setForm({ name: '', phone: '', email: '', address: '' });
    }
    setModalOpen(true);
  };

  const viewHistory = async (id) => {
    try {
      const res = await api.get(`/customers/${id}`);
      setHistory(res.data);
      setHistoryOpen(true);
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/customers/${editing._id}`, form);
      else await api.post('/customers', form);
      setSuccess(editing ? 'Customer updated' : 'Customer created');
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await api.delete(`/customers/${id}`);
      setSuccess('Customer deleted');
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage registered customers and view purchase history"
        action={isAdmin && (
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        )}
      />

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <Card className="mb-4">
        <SearchInput
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </Card>

      <Card padding={false}>
        {loading ? <Spinner /> : customers.length === 0 ? (
          <EmptyState message="No customers found" description="Add a customer or adjust your search" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Phone</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Address</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr
                    key={c._id}
                    className={`hover:bg-slate-50/80 transition-colors ${c.isWalkIn ? 'bg-sky-50/50' : ''}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{c.name}</span>
                        {c.isWalkIn && <Badge variant="info">Walk-in</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{c.phone || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-500">{c.email || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-500">{c.address || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => viewHistory(c._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="History">
                          <History className="w-4 h-4" />
                        </button>
                        {isAdmin && !c.isWalkIn && (
                          <>
                            <button onClick={() => openModal(c)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Edit">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(c._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit}>
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title={`Purchase History — ${history?.customer?.name}`} size="lg">
        {!history?.purchaseHistory?.length ? (
          <EmptyState message="No purchases yet" description="Sales will appear here once completed" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-semibold text-slate-600 uppercase">Invoice</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-600 uppercase">Total</th>
                <th className="text-right py-2 text-xs font-semibold text-slate-600 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.purchaseHistory.map((s) => (
                <tr key={s._id}>
                  <td className="py-2.5 font-mono text-xs text-slate-700">{s.invoiceNumber}</td>
                  <td className="py-2.5 text-right font-medium">{formatCurrency(s.total)}</td>
                  <td className="py-2.5 text-right text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>
    </div>
  );
}
