const express = require('express');
const { body } = require('express-validator');
const { getCategories, createCategory } = require('../controllers/categoryController');
const { validate } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

const router = express.Router();

router.get('/', protect, getCategories);
router.post('/', protect, authorize('admin'), [body('name').notEmpty().withMessage('Name required')], validate, createCategory);

module.exports = router;
