const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const { generateInvoiceNumber } = require('../utils/generateInvoice');

const getSales = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'cashier') {
      query.cashier = req.user._id;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [sales, total] = await Promise.all([
      Sale.find(query)
        .populate('customer', 'name phone')
        .populate('cashier', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(query),
    ]);

    res.json({
      sales,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('customer', 'name phone email')
      .populate('cashier', 'name email')
      .populate('items.product', 'name sku barcode');

    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    if (req.user.role === 'cashier' && sale.cashier._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSale = async (req, res) => {
  try {
    const { customer: customerId, items, discount = 0, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const saleItems = [];
    let subtotal = 0;
    const productsToUpdate = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      const quantity = parseInt(item.quantity, 10);
      if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }

      if (product.stock < quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}. Available: ${product.stock}` });
      }

      const price = product.sellingPrice;
      const lineTotal = price * quantity;
      subtotal += lineTotal;

      saleItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        price,
        total: lineTotal,
        returnedQuantity: 0,
      });

      productsToUpdate.push({ product, quantity });
    }

    const discountAmount = Math.min(parseFloat(discount) || 0, subtotal);
    const taxRate = parseFloat(process.env.TAX_RATE) || 0;
    const taxableAmount = subtotal - discountAmount;
    const tax = Math.round((taxableAmount * taxRate) / 100);
    const total = taxableAmount + tax;

    const invoiceNumber = await generateInvoiceNumber();

    const sale = await Sale.create({
      invoiceNumber,
      customer: customerId,
      cashier: req.user._id,
      items: saleItems,
      subtotal,
      discount: discountAmount,
      tax,
      total,
      paymentMethod,
      paymentStatus: 'paid',
    });

    for (const { product, quantity } of productsToUpdate) {
      product.stock -= quantity;
      await product.save();
    }

    const populated = await Sale.findById(sale._id)
      .populate('customer', 'name phone')
      .populate('cashier', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const returnSale = async (req, res) => {
  try {
    const { items: returnItems } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    if (req.user.role === 'cashier' && sale.cashier.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!returnItems || returnItems.length === 0) {
      return res.status(400).json({ message: 'Return items are required' });
    }

    for (const returnItem of returnItems) {
      const saleItem = sale.items.id(returnItem.itemId);
      if (!saleItem) {
        return res.status(404).json({ message: 'Sale item not found' });
      }

      const returnQty = parseInt(returnItem.quantity, 10);
      const remaining = saleItem.quantity - saleItem.returnedQuantity;

      if (returnQty < 1) {
        return res.status(400).json({ message: 'Return quantity must be at least 1' });
      }

      if (returnQty > remaining) {
        return res.status(400).json({
          message: `Cannot return more than ${remaining} for ${saleItem.productName}`,
        });
      }

      saleItem.returnedQuantity += returnQty;

      const product = await Product.findById(saleItem.product);
      if (product) {
        product.stock += returnQty;
        await product.save();
      }
    }

    await sale.save();

    const updated = await Sale.findById(sale._id)
      .populate('customer', 'name phone')
      .populate('cashier', 'name')
      .populate('items.product', 'name sku');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSales, getSaleById, createSale, returnSale };
