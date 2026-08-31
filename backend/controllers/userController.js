const User = require('../models/User');
const {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  sanitizePermissions,
  getUserPermissions,
  formatPermissions,
} = require('../utils/permissions');
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

const attachPermissions = (user) => {
  const json = user.toJSON();
  json.effectivePermissions = getUserPermissions(user);
  return json;
};

const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      users: users.map(attachPermissions),
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      user: attachPermissions(user),
      permissions: getUserPermissions(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, permissions } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const userRole = role || 'cashier';
    const userPermissions = sanitizePermissions(permissions);
    const finalPermissions = userPermissions.length > 0 ? userPermissions : ROLE_PERMISSIONS[userRole];

    if (finalPermissions.length === 0) {
      return res.status(400).json({ message: 'At least one permission is required' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      permissions: finalPermissions,
    });

    res.status(201).json({ user: attachPermissions(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      if (req.body.isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      }
      if (req.body.role && req.body.role !== user.role) {
        return res.status(400).json({ message: 'You cannot change your own role' });
      }
      if (req.body.permissions) {
        return res.status(400).json({ message: 'You cannot change your own permissions' });
      }
    }

    if (user.role === 'admin' && req.body.role === 'cashier') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: user._id } });
      if (adminCount === 0) {
        return res.status(400).json({ message: 'Cannot demote the last admin' });
      }
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.role) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    if (req.body.password) user.password = req.body.password;

    if (req.body.permissions) {
      const perms = sanitizePermissions(req.body.permissions);
      if (perms.length === 0) {
        return res.status(400).json({ message: 'At least one permission is required' });
      }
      user.permissions = perms;
    }

    // Last admin must keep manage_users
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: user._id } });
      const perms = getUserPermissions(user);
      if (adminCount === 0 && !perms.includes('manage_users')) {
        return res.status(400).json({ message: 'Last admin must have manage_users permission' });
      }
    }

    await user.save();
    res.json({ user: attachPermissions(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: user._id } });
      if (adminCount === 0) {
        return res.status(400).json({ message: 'Cannot delete the last admin' });
      }
    }

    user.isActive = false;
    await user.save();
    res.json({ message: 'User deactivated', user: attachPermissions(user) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRoles = async (req, res) => {
  res.json({
    allPermissions: formatPermissions(Object.keys(PERMISSIONS)),
    roles: [
      { id: 'admin', label: 'Admin', permissions: formatPermissions(ROLE_PERMISSIONS.admin) },
      { id: 'cashier', label: 'Cashier', permissions: formatPermissions(ROLE_PERMISSIONS.cashier) },
    ],
  });
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getRoles, validate };
