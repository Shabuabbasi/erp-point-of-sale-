const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const getPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [purchases, total] = await Promise.all([
      Purchase.find()
        .populate('supplier', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Purchase.countDocuments(),
    ]);

    res.json({
      purchases,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name phone email address')
      .populate('items.product', 'name sku');

    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { supplier: supplierId, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'At least one item is required' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ message: 'Supplier not found' });
    }

    const purchaseItems = [];
    let total = 0;
    const productsToUpdate = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || !product.isActive) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      const quantity = parseInt(item.quantity, 10);
      const costPrice = parseFloat(item.costPrice) || product.costPrice;

      if (quantity < 1) {
        return res.status(400).json({ message: 'Quantity must be at least 1' });
      }

      const lineTotal = costPrice * quantity;
      total += lineTotal;

      purchaseItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        costPrice,
        total: lineTotal,
      });

      productsToUpdate.push({ product, quantity, costPrice });
    }

    const purchase = await Purchase.create({
      supplier: supplierId,
      items: purchaseItems,
      total,
    });

    for (const { product, quantity, costPrice } of productsToUpdate) {
      product.stock += quantity;
      product.costPrice = costPrice;
      await product.save();
    }

    const populated = await Purchase.findById(purchase._id)
      .populate('supplier', 'name phone')
      .populate('items.product', 'name sku');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getPurchases, getPurchaseById, createPurchase };
