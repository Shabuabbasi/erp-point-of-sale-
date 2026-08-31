const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');

const getStartOfDay = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDashboard = async (req, res) => {
  try {
    const startOfDay = getStartOfDay();

    const [todaySales, todayOrders, totalProducts, lowStockProducts, totalCustomers, recentSales, topProducts] =
      await Promise.all([
        Sale.aggregate([
          { $match: { createdAt: { $gte: startOfDay } } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
        Sale.countDocuments({ createdAt: { $gte: startOfDay } }),
        Product.countDocuments({ isActive: true }),
        Product.find({ isActive: true, $expr: { $lte: ['$stock', '$lowStockLimit'] }, stock: { $gt: 0 } })
          .populate('category', 'name')
          .limit(10),
        Customer.countDocuments(),
        Sale.find()
          .populate('customer', 'name')
          .populate('cashier', 'name')
          .sort({ createdAt: -1 })
          .limit(5),
        Sale.aggregate([
          { $unwind: '$items' },
          {
            $group: {
              _id: '$items.product',
              productName: { $first: '$items.productName' },
              totalSold: { $sum: { $subtract: ['$items.quantity', '$items.returnedQuantity'] } },
              revenue: { $sum: { $multiply: [{ $subtract: ['$items.quantity', '$items.returnedQuantity'] }, '$items.price'] } },
            },
          },
          { $sort: { totalSold: -1 } },
          { $limit: 5 },
        ]),
      ]);

    res.json({
      todaySales: todaySales[0]?.total || 0,
      todayOrders,
      totalProducts,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      totalCustomers,
      recentSales,
      topProducts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboard };
