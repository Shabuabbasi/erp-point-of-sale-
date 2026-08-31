import { useEffect, useState } from 'react';
import api from '../api/axios';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ supplier: '', items: [{ product: '', quantity: 1, costPrice: '' }] });

  const fetchPurchases = () => {
    setLoading(true);
    api.get('/purchases', { params: { limit: 20 } })
      .then((res) => setPurchases(res.data.purchases))
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPurchases();
    api.get('/suppliers', { params: { limit: 100 } }).then((res) => setSuppliers(res.data.suppliers));
    api.get('/products', { params: { limit: 100 } }).then((res) => setProducts(res.data.products));
  }, []);

  const addItem = () => {
    setForm({ ...form, items: [...form.items, { product: '', quantity: 1, costPrice: '' }] });
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index][field] = value;
    if (field === 'product') {
      const prod = products.find((p) => p._id === value);
      if (prod) items[index].costPrice = prod.costPrice;
    }
    setForm({ ...form, items });
  };

  const removeItem = (index) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/purchases', {
        supplier: form.supplier,
        items: form.items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity),
          costPrice: Number(i.costPrice),
        })),
      });
      setSuccess('Purchase recorded');
      setModalOpen(false);
      setForm({ supplier: '', items: [{ product: '', quantity: 1, costPrice: '' }] });
      fetchPurchases();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Purchases</h1>
        <Button onClick={() => setModalOpen(true)}>+ New Purchase</Button>
      </div>

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-left px-4 py-3">Items</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.supplier?.name}</td>
                  <td className="px-4 py-3">{p.items.length} item(s)</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.total)}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Purchase" size="lg">
        <form onSubmit={handleSubmit}>
          <Select label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} required>
            <option value="">Select supplier</option>
            {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>

          <h3 className="font-medium text-sm mb-2">Items</h3>
          {form.items.map((item, i) => (
            <div key={i} className="flex gap-2 items-end mb-2">
              <Select value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)} className="mb-0 flex-1" required>
                <option value="">Product</option>
                {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </Select>
              <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="mb-0 w-20" required />
              <Input type="number" min="0" value={item.costPrice} onChange={(e) => updateItem(i, 'costPrice', e.target.value)} className="mb-0 w-24" placeholder="Cost" required />
              {form.items.length > 1 && (
                <button type="button" onClick={() => removeItem(i)} className="text-red-500 pb-2">×</button>
              )}
            </div>
          ))}
          <Button type="button" variant="secondary" className="mb-4 text-xs" onClick={addItem}>+ Add Item</Button>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">Record Purchase</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
