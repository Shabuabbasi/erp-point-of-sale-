const express = require('express');
const { body } = require('express-validator');
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');
const { validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.get('/', protect, getCustomers);
router.get('/:id', protect, getCustomerById);

router.post('/', protect, authorize('admin'), [body('name').notEmpty().withMessage('Name required')], validate, createCustomer);
router.put('/:id', protect, authorize('admin'), updateCustomer);
router.delete('/:id', protect, authorize('admin'), deleteCustomer);

module.exports = router;
