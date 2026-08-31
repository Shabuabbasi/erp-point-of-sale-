import { useEffect, useState } from 'react';
import api from '../api/axios';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import Input from '../components/Input';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [detailOpen, setDetailOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [returnItems, setReturnItems] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSales = () => {
    setLoading(true);
    api.get('/sales', { params: { page, limit: 10 } })
      .then((res) => { setSales(res.data.sales); setPages(res.data.pagination.pages); })
      .catch((err) => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSales(); }, [page]);

  const viewDetail = async (id) => {
    try {
      const res = await api.get(`/sales/${id}`);
      setSelectedSale(res.data);
      setDetailOpen(true);
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  const openReturn = (sale) => {
    setSelectedSale(sale);
    setReturnItems(sale.items.map((item) => ({
      itemId: item._id,
      productName: item.productName,
      maxReturn: item.quantity - item.returnedQuantity,
      quantity: 0,
    })).filter((i) => i.maxReturn > 0));
    setReturnOpen(true);
  };

  const handleReturn = async () => {
    const items = returnItems.filter((i) => i.quantity > 0).map((i) => ({ itemId: i.itemId, quantity: i.quantity }));
    if (items.length === 0) { setError('Enter return quantities'); return; }
    try {
      await api.post(`/sales/${selectedSale._id}/return`, { items });
      setSuccess('Return processed');
      setReturnOpen(false);
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sales</h1>
      <Alert message={error} onClose={() => setError('')} />
      <Alert type="success" message={success} onClose={() => setSuccess('')} />

      <div className="bg-white rounded-xl shadow-sm border">
        {loading ? <Spinner /> : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3">Invoice</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-left px-4 py-3">Cashier</th>
                  <th className="text-right px-4 py-3">Total</th>
                  <th className="text-left px-4 py-3">Payment</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={s._id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{s.invoiceNumber}</td>
                    <td className="px-4 py-3">{s.customer?.name}</td>
                    <td className="px-4 py-3">{s.cashier?.name}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total)}</td>
                    <td className="px-4 py-3 capitalize">{s.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(s.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => viewDetail(s._id)} className="text-blue-600 hover:underline text-xs">View</button>
                      <button onClick={async () => { const res = await api.get(`/sales/${s._id}`); openReturn(res.data); }} className="text-orange-600 hover:underline text-xs">Return</button>
                    </td>
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
      </div>

      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title={`Sale ${selectedSale?.invoiceNumber}`} size="lg">
        {selectedSale && (
          <div className="text-sm">
            <p>Customer: <strong>{selectedSale.customer?.name}</strong></p>
            <p>Cashier: <strong>{selectedSale.cashier?.name}</strong></p>
            <hr className="my-3" />
            {selectedSale.items.map((item) => (
              <div key={item._id} className="flex justify-between py-1">
                <span>{item.productName} × {item.quantity} {item.returnedQuantity > 0 && <span className="text-orange-500">(returned: {item.returnedQuantity})</span>}</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
            ))}
            <hr className="my-3" />
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(selectedSale.total)}</span></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={returnOpen} onClose={() => setReturnOpen(false)} title="Process Return">
        {returnItems.length === 0 ? (
          <p className="text-gray-500">All items already returned</p>
        ) : (
          <>
            {returnItems.map((item, i) => (
              <div key={item.itemId} className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs text-gray-500">Max return: {item.maxReturn}</p>
                </div>
                <Input type="number" min="0" max={item.maxReturn} value={item.quantity}
                  onChange={(e) => {
                    const updated = [...returnItems];
                    updated[i].quantity = Math.min(parseInt(e.target.value) || 0, item.maxReturn);
                    setReturnItems(updated);
                  }}
                  className="mb-0 w-20" />
              </div>
            ))}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setReturnOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={handleReturn}>Process Return</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
