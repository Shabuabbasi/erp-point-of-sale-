const express = require('express');
const { body } = require('express-validator');
const { getPurchases, getPurchaseById, createPurchase } = require('../controllers/purchaseController');
const { validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.get('/', protect, authorize('admin'), getPurchases);
router.get('/:id', protect, authorize('admin'), getPurchaseById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('supplier').notEmpty().withMessage('Supplier required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  ],
  validate,
  createPurchase
);

module.exports = router;
