const Sale = require('../models/Sale');
const Product = require('../models/Product');

const getPeriodStart = (period) => {
  const now = new Date();
  const start = new Date();

  if (period === 'today') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'week') {
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'month') {
    start.setMonth(now.getMonth() - 1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setHours(0, 0, 0, 0);
  }

  return start;
};

const getSalesReport = async (req, res) => {
  try {
    const { period = 'today', page = 1, limit = 20 } = req.query;
    const startDate = getPeriodStart(period);
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { createdAt: { $gte: startDate } };

    const [sales, total, summary] = await Promise.all([
      Sale.find(query)
        .populate('customer', 'name')
        .populate('cashier', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Sale.countDocuments(query),
      Sale.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            totalOrders: { $sum: 1 },
            totalDiscount: { $sum: '$discount' },
          },
        },
      ]),
    ]);

    res.json({
      sales,
      summary: summary[0] || { totalSales: 0, totalOrders: 0, totalDiscount: 0 },
      period,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductReport = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate('category', 'name').sort({ name: 1 });

    const soldData = await Sale.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: { $subtract: ['$items.quantity', '$items.returnedQuantity'] } },
          revenue: { $sum: { $multiply: [{ $subtract: ['$items.quantity', '$items.returnedQuantity'] }, '$items.price'] } },
        },
      },
    ]);

    const soldMap = {};
    soldData.forEach((s) => {
      soldMap[s._id.toString()] = s;
    });

    const report = products.map((p) => ({
      _id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name,
      stock: p.stock,
      sellingPrice: p.sellingPrice,
      totalSold: soldMap[p._id.toString()]?.totalSold || 0,
      revenue: soldMap[p._id.toString()]?.revenue || 0,
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSalesReport, getProductReport };
