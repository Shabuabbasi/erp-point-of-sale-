const express = require('express');
const { body } = require('express-validator');
const { getSales, getSaleById, createSale, returnSale } = require('../controllers/saleController');
const { validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getSales);
router.get('/:id', protect, getSaleById);

router.post(
  '/',
  protect,
  [
    body('customer').notEmpty().withMessage('Customer required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item required'),
    body('paymentMethod').isIn(['cash', 'card', 'online']).withMessage('Valid payment method required'),
    body('discount').optional().isFloat({ min: 0 }),
  ],
  validate,
  createSale
);

router.post(
  '/:id/return',
  protect,
  [body('items').isArray({ min: 1 }).withMessage('Return items required')],
  validate,
  returnSale
);

module.exports = router;
