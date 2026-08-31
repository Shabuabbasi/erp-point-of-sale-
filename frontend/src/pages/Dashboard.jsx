import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Package, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import Badge from '../components/Badge';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

const statConfig = [
  { key: 'todaySales', label: "Today's Sales", icon: DollarSign, color: 'from-green-500 to-emerald-600', format: formatCurrency },
  { key: 'todayOrders', label: "Today's Orders", icon: ShoppingBag, color: 'from-blue-500 to-blue-600' },
  { key: 'totalProducts', label: 'Total Products', icon: Package, color: 'from-violet-500 to-purple-600' },
  { key: 'lowStockCount', label: 'Low Stock', icon: AlertTriangle, color: 'from-orange-500 to-amber-600' },
  { key: 'totalCustomers', label: 'Total Customers', icon: Users, color: 'from-indigo-500 to-indigo-600' },
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner size="lg" />;

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your store performance today" />
      <Alert message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statConfig.map((stat) => {
          const Icon = stat.icon;
          const value = stat.format ? stat.format(data?.[stat.key] || 0) : (data?.[stat.key] || 0);
          return (
            <Card key={stat.key} className="relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Recent Sales</h2>
          </div>
          {!data?.recentSales?.length ? (
            <p className="text-slate-400 text-sm text-center py-6">No sales yet</p>
          ) : (
            <div className="space-y-3">
              {data.recentSales.map((sale) => (
                <div key={sale._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{sale.invoiceNumber}</p>
                    <p className="text-xs text-slate-500">{sale.customer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-slate-800">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-slate-400">{new Date(sale.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-4 h-4 text-violet-600" />
            <h2 className="font-semibold text-slate-800">Top Selling Products</h2>
          </div>
          {!data?.topProducts?.length ? (
            <p className="text-slate-400 text-sm text-center py-6">No data yet</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p._id} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center">{i + 1}</span>
                    <span className="text-sm font-medium text-slate-800">{p.productName}</span>
                  </div>
                  <Badge variant="primary">{p.totalSold} sold</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            <h2 className="font-semibold text-slate-800">Low Stock Alert</h2>
          </div>
          {!data?.lowStockProducts?.length ? (
            <p className="text-slate-400 text-sm text-center py-4">All products are well stocked</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {data.lowStockProducts.map((p) => (
                <div key={p._id} className="flex justify-between items-center bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                  <span className="text-sm font-medium text-slate-700 truncate mr-2">{p.name}</span>
                  <Badge variant="warning">Stock: {p.stock}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
