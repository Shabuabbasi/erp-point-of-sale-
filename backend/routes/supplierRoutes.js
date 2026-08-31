const express = require('express');
const { body } = require('express-validator');
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');
const { validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.get('/', protect, authorize('admin'), getSuppliers);
router.post('/', protect, authorize('admin'), [body('name').notEmpty().withMessage('Name required')], validate, createSupplier);
router.put('/:id', protect, authorize('admin'), updateSupplier);
router.delete('/:id', protect, authorize('admin'), deleteSupplier);

module.exports = router;
