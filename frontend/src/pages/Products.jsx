import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchInput from '../components/SearchInput';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '', sku: '', barcode: '', category: '', costPrice: '', sellingPrice: '', stock: '', lowStockLimit: '10',
  });

  const fetchProducts = () => {
    setLoading(true);
    const params = { page, limit: 10 };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    api.get('/products', { params })
      .then((res) => {
        setProducts(res.data.products);
        setPages(res.data.pagination.pages);
      })
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data));
  }, []);

  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter]);

  const openModal = (product = null) => {
    if (product) {
      setEditing(product);
      setForm({
        name: product.name, sku: product.sku, barcode: product.barcode || '',
        category: product.category?._id || product.category,
        costPrice: product.costPrice, sellingPrice: product.sellingPrice,
        stock: product.stock, lowStockLimit: product.lowStockLimit,
      });
    } else {
      setEditing(null);
      setForm({ name: '', sku: '', barcode: '', category: '', costPrice: '', sellingPrice: '', stock: '', lowStockLimit: '10' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, costPrice: Number(form.costPrice), sellingPrice: Number(form.sellingPrice), stock: Number(form.stock), lowStockLimit: Number(form.lowStockLimit) };
      if (editing) {
        await api.put(`/products/${editing._id}`, payload);
        setSuccess('Product updated');
      } else {
        await api.post('/products', payload);
        setSuccess('Product created');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setSuccess('Product deactivated');
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage product catalog, pricing, and stock levels"
        action={isAdmin && (
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        )}
      />

      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <Card className="mb-4 flex gap-3 flex-wrap items-center">
        <SearchInput placeholder="Search name, SKU, barcode..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="flex-1 min-w-[200px]" />
        <Select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }} className="mb-0 w-48">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
      </Card>

      <Card padding={false}>
        {loading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">SKU</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Cost</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-right px-4 py-3">Stock</th>
                  {isAdmin && <th className="text-right px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                    <td className="px-4 py-3">{p.category?.name}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(p.costPrice)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.sellingPrice)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${p.stock <= p.lowStockLimit ? 'text-orange-600' : ''} ${p.stock === 0 ? 'text-red-600' : ''}`}>
                      {p.stock === 0 ? <Badge variant="danger">Out</Badge> : p.stock <= p.lowStockLimit ? <Badge variant="warning">{p.stock}</Badge> : p.stock}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-right space-x-2">
                        <button onClick={() => openModal(p)} className="text-blue-600 hover:underline text-xs">Edit</button>
                        <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:underline text-xs">Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {pages > 1 && (
              <div className="flex justify-center gap-2 p-4">
                <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
                <span className="text-sm self-center">Page {page} of {pages}</span>
                <Button variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            )}
          </>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })} required disabled={!!editing} />
            <Input label="Barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Input label="Cost Price" type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} required />
            <Input label="Selling Price" type="number" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} required />
            <Input label="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} required />
            <Input label="Low Stock Limit" type="number" value={form.lowStockLimit} onChange={(e) => setForm({ ...form, lowStockLimit: e.target.value })} required />
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
