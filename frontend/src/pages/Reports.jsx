import { useEffect, useState } from 'react';
import api from '../api/axios';
import Button from '../components/Button';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

export default function Reports() {
  const [period, setPeriod] = useState('today');
  const [salesReport, setSalesReport] = useState(null);
  const [productReport, setProductReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('sales');

  const fetchReports = () => {
    setLoading(true);
    Promise.all([
      api.get('/reports/sales', { params: { period, limit: 50 } }),
      api.get('/reports/products'),
    ])
      .then(([salesRes, productRes]) => {
        setSalesReport(salesRes.data);
        setProductReport(productRes.data);
      })
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, [period]);

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>
      <Alert message={error} />

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('sales')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'sales' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Sales Report</button>
        <button onClick={() => setTab('products')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'products' ? 'bg-blue-600 text-white' : 'bg-white border'}`}>Product Report</button>
      </div>

      {loading ? <Spinner size="lg" /> : tab === 'sales' ? (
        <div>
          <div className="flex gap-2 mb-4">
            {periods.map((p) => (
              <Button key={p.key} variant={period === p.key ? 'primary' : 'secondary'} onClick={() => setPeriod(p.key)}>{p.label}</Button>
            ))}
          </div>

          {salesReport?.summary && (
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm text-gray-500">Total Sales</p>
                <p className="text-xl font-bold">{formatCurrency(salesReport.summary.totalSales)}</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-xl font-bold">{salesReport.summary.totalOrders}</p>
              </div>
              <div className="bg-white rounded-xl border p-4">
                <p className="text-sm text-gray-500">Total Discount</p>
                <p className="text-xl font-bold">{formatCurrency(salesReport.summary.totalDiscount)}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Cashier</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {salesReport?.sales?.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{s.invoiceNumber}</td>
                    <td className="px-4 py-3">{s.customer?.name}</td>
                    <td className="px-4 py-3">{s.cashier?.name}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total)}</td>
                    <td className="px-4 py-3 capitalize">{s.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">SKU</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-right px-4 py-3">Stock</th>
                <th className="text-right px-4 py-3">Price</th>
                <th className="text-right px-4 py-3">Total Sold</th>
                <th className="text-right px-4 py-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {productReport.map((p) => (
                <tr key={p._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-gray-500">{p.sku}</td>
                  <td className="px-4 py-3">{p.category || '-'}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right font-medium">{p.totalSold}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(p.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
