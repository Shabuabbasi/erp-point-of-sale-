const { getUserPermissions } = require('../utils/permissions');

const requirePermission = (...required) => {
  return (req, res, next) => {
    const userPerms = getUserPermissions(req.user);
    const allowed = required.some((p) => userPerms.includes(p));
    if (!allowed) {
      return res.status(403).json({ message: 'You do not have permission for this action' });
    }
    next();
  };
};

module.exports = { requirePermission };
