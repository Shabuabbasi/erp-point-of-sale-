const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getRoles,
  validate,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/roles', getRoles);
router.get('/', getUsers);
router.get('/:id', getUserById);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['admin', 'cashier']).withMessage('Role must be admin or cashier'),
  ],
  validate,
  createUser
);

router.put(
  '/:id',
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['admin', 'cashier']).withMessage('Invalid role'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  updateUser
);

router.delete('/:id', deleteUser);

module.exports = router;
