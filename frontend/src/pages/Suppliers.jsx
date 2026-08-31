import { useEffect, useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });

  const fetchSuppliers = () => {
    setLoading(true);
    api.get('/suppliers', { params: { search, limit: 50 } })
      .then((res) => setSuppliers(res.data.suppliers))
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuppliers(); }, [search]);

  const openModal = (supplier = null) => {
    if (supplier) {
      setEditing(supplier);
      setForm({ name: supplier.name, phone: supplier.phone, email: supplier.email, address: supplier.address });
    } else {
      setEditing(null);
      setForm({ name: '', phone: '', email: '', address: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/suppliers/${editing._id}`, form);
      else await api.post('/suppliers', form);
      setSuccess(editing ? 'Supplier updated' : 'Supplier created');
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return;
    try {
      await api.delete(`/suppliers/${id}`);
      setSuccess('Supplier deleted');
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <Button onClick={() => openModal()}>+ Add Supplier</Button>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="bg-white rounded-xl shadow-sm border p-4 mb-4">
        <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="mb-0" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Address</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.phone || '-'}</td>
                  <td className="px-4 py-3">{s.email || '-'}</td>
                  <td className="px-4 py-3">{s.address || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openModal(s)} className="text-blue-600 hover:underline text-xs">Edit</button>
                    <button onClick={() => handleDelete(s._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}>
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
    </div>
  );
}
