import { useEffect, useState } from 'react';
import { ShoppingCart, Trash2, CreditCard, Banknote, Smartphone, Receipt } from 'lucide-react';
import api from '../api/axios';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import SearchInput from '../components/SearchInput';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';

const formatCurrency = (amount) => `Rs.${Number(amount).toLocaleString()}`;

const paymentIcons = { cash: Banknote, card: CreditCard, online: Smartphone };

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    api.get('/products', { params: { limit: 50, search } }).then((res) => setProducts(res.data.products));
  }, [search]);

  useEffect(() => {
    api.get('/customers', { params: { limit: 100 } }).then((res) => {
      setCustomers(res.data.customers);
      const walkIn = res.data.customers.find((c) => c.isWalkIn);
      if (walkIn) setSelectedCustomer(walkIn._id);
    });
  }, []);

  const addToCart = (product) => {
    if (product.stock <= 0) { setError('Product out of stock'); return; }
    setError('');
    setCart((prev) => {
      const existing = prev.find((item) => item.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.stock) { setError(`Only ${product.stock} in stock`); return prev; }
        return prev.map((item) =>
          item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId, qty) => {
    const num = parseInt(qty, 10);
    if (num < 1) { removeFromCart(productId); return; }
    setCart((prev) =>
      prev.map((item) => {
        if (item.product._id === productId) {
          if (num > item.product.stock) { setError(`Only ${item.product.stock} in stock`); return item; }
          return { ...item, quantity: num };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.product._id !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const discountAmount = Math.min(Number(discount) || 0, subtotal);
  const total = subtotal - discountAmount;

  const handlePay = async () => {
    if (cart.length === 0) { setError('Cart is empty'); return; }
    if (!selectedCustomer) { setError('Select a customer'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/sales', {
        customer: selectedCustomer,
        items: cart.map((item) => ({ product: item.product._id, quantity: item.quantity })),
        discount: discountAmount,
        paymentMethod,
      });
      setReceipt(data);
      setCart([]);
      setDiscount(0);
      api.get('/products', { params: { limit: 50, search } }).then((res) => setProducts(res.data.products));
    } catch (err) {
      setError(err.response?.data?.message || 'Sale failed');
    } finally {
      setLoading(false);
    }
  };

  const availableProducts = products.filter((p) => p.stock > 0);

  return (
    <div>
      <PageHeader title="Point of Sale" description="Search products, add to cart, and complete sales" />

      <Alert message={error} onClose={() => setError('')} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Products Panel */}
        <Card className="xl:col-span-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product, barcode, or SKU..."
            className="mb-4"
          />
          {availableProducts.length === 0 ? (
            <EmptyState message="No products available" description="Try a different search or check inventory" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[520px] overflow-y-auto pr-1">
              {availableProducts.map((p) => (
                <button
                  key={p._id}
                  onClick={() => addToCart(p)}
                  className="text-left p-3 border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 active:scale-[0.98] transition-all group"
                >
                  <p className="font-medium text-sm text-slate-800 group-hover:text-blue-700 truncate">{p.name}</p>
                  <p className="text-blue-600 font-bold text-base mt-1">{formatCurrency(p.sellingPrice)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.stock} in stock</p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Cart Panel */}
        <Card className="xl:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Cart</h2>
            {cart.length > 0 && <Badge variant="primary">{cart.length} items</Badge>}
          </div>

          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">Customer</label>
          <select
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>{c.name}{c.isWalkIn ? ' (Walk-in)' : ''}</option>
            ))}
          </select>

          {cart.length === 0 ? (
            <EmptyState message="Cart is empty" description="Click a product to add it" />
          ) : (
            <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto flex-1">
              {cart.map((item) => (
                <div key={item.product._id} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{formatCurrency(item.product.sellingPrice)} each</p>
                  </div>
                  <input
                    type="number" min="1" max={item.product.stock} value={item.quantity}
                    onChange={(e) => updateQty(item.product._id, e.target.value)}
                    className="w-14 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm"
                  />
                  <span className="font-semibold text-sm w-20 text-right">{formatCurrency(item.product.sellingPrice * item.quantity)}</span>
                  <button onClick={() => removeFromCart(item.product._id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4 space-y-2 text-sm mt-auto">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between items-center">
              <span className="text-slate-600">Discount</span>
              <input type="number" min="0" max={subtotal} value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-24 px-2 py-1.5 border border-slate-200 rounded-lg text-right text-sm" />
            </div>
            <div className="flex justify-between font-bold text-xl text-slate-800 border-t border-slate-100 pt-3">
              <span>Total</span><span className="text-blue-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <label className="block text-xs font-medium text-slate-500 mt-4 mb-1.5 uppercase tracking-wide">Payment</label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['cash', 'card', 'online'].map((method) => {
              const Icon = paymentIcons[method];
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium capitalize transition ${
                    paymentMethod === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {method}
                </button>
              );
            })}
          </div>

          <Button className="w-full py-3.5 text-base rounded-xl" variant="success" onClick={handlePay} disabled={loading || cart.length === 0}>
            {loading ? 'Processing...' : 'PAY NOW'}
          </Button>
        </Card>
      </div>

      <Modal isOpen={!!receipt} onClose={() => setReceipt(null)} title="Receipt" size="md">
        {receipt && (
          <div className="text-sm">
            <div className="text-center mb-5 pb-4 border-b border-dashed border-slate-200">
              <Receipt className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-bold text-lg text-slate-800">Superstore ERP</h3>
              <p className="text-slate-500 font-mono text-xs mt-1">{receipt.invoiceNumber}</p>
              <p className="text-slate-400 text-xs">{new Date(receipt.createdAt).toLocaleString()}</p>
            </div>
            <div className="space-y-1 mb-3 text-slate-600">
              <p>Customer: <strong className="text-slate-800">{receipt.customer?.name}</strong></p>
              <p>Cashier: <strong className="text-slate-800">{receipt.cashier?.name}</strong></p>
            </div>
            <div className="space-y-2 mb-3">
              {receipt.items.map((item, i) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-700">{item.productName} × {item.quantity}</span>
                  <span className="font-medium">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span></div>
              {receipt.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-{formatCurrency(receipt.discount)}</span></div>}
              <div className="flex justify-between font-bold text-lg text-slate-800 pt-2"><span>Total</span><span>{formatCurrency(receipt.total)}</span></div>
            </div>
            <p className="text-center mt-3 text-slate-500 capitalize text-xs">Paid via {receipt.paymentMethod}</p>
            <Button className="w-full mt-4" onClick={() => setReceipt(null)}>Close</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
