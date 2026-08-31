const express = require('express');
const { body } = require('express-validator');
const { login, register, getMe, validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail().withMessage('Valid email required'), body('password').notEmpty().withMessage('Password required')],
  validate,
  login
);

router.post(
  '/register',
  protect,
  authorize('admin'),
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'cashier']).withMessage('Invalid role'),
  ],
  validate,
  register
);

router.get('/me', protect, getMe);

module.exports = router;
