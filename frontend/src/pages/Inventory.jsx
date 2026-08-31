import { useEffect, useState } from 'react';
import api from '../api/axios';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

export default function Inventory() {
  const [allProducts, setAllProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products', { params: { limit: 100 } })
      .then((res) => setAllProducts(res.data.products))
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = allProducts.filter((p) => {
    if (filter === 'low') return p.stock > 0 && p.stock <= p.lowStockLimit;
    if (filter === 'out') return p.stock === 0;
    return true;
  });

  const tabs = [
    { key: 'all', label: 'All Products', count: allProducts.length },
    { key: 'low', label: 'Low Stock', count: allProducts.filter((p) => p.stock > 0 && p.stock <= p.lowStockLimit).length },
    { key: 'out', label: 'Out of Stock', count: allProducts.filter((p) => p.stock === 0).length },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory</h1>
      <Alert message={error} />

      <div className="flex gap-2 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === tab.key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? <Spinner /> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-right px-4 py-3">Low Limit</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.category?.name}</td>
                  <td className="px-4 py-3 text-right font-bold">{p.stock}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{p.lowStockLimit}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-center">
                    {p.stock === 0 ? (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Out of Stock</span>
                    ) : p.stock <= p.lowStockLimit ? (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Low Stock</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">In Stock</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
