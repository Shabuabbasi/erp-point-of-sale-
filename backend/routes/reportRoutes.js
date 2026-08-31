const express = require('express');
const { getSalesReport, getProductReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.get('/sales', protect, authorize('admin'), getSalesReport);
router.get('/products', protect, authorize('admin'), getProductReport);

module.exports = router;
