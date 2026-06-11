const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. You do not have permission to do this.' 
      });
    }
    next();
  };
};

module.exports = rbac;