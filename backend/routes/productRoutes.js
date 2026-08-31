const express = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.get('/', protect, getProducts);
router.get('/:id', protect, getProductById);

router.post(
  '/',
  protect,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('sku').notEmpty().withMessage('SKU required'),
    body('category').notEmpty().withMessage('Category required'),
    body('costPrice').isFloat({ min: 0 }).withMessage('Valid cost price required'),
    body('sellingPrice').isFloat({ min: 0 }).withMessage('Valid selling price required'),
    body('stock').optional().isInt({ min: 0 }),
    body('lowStockLimit').optional().isInt({ min: 0 }),
  ],
  validate,
  createProduct
);

router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
