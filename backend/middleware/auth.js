const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  console.log('=== AUTHENTICATION DEBUG ===');
  console.log('Authorization header:', req.headers['authorization']);
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    console.log('Token role:', decoded.role);
    console.log('Token role type:', typeof decoded.role);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    console.log('Authentication successful');
    next();
  } catch (error) {
    console.log('Token verification error:', error.message);
    res.status(403).json({ message: 'Invalid token.' });
  }
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    console.log('=== AUTHORIZATION DEBUG ===');
    console.log('User role from token:', req.userRole);
    console.log('Allowed roles:', roles);
    console.log('User role type:', typeof req.userRole);
    console.log('Direct includes check:', roles.includes(req.userRole));
    
    // Normalize role to lowercase for comparison
    const normalizedUserRole = typeof req.userRole === 'string' ? req.userRole.toLowerCase().trim() : '';
    const normalizedRoles = roles.map(role => typeof role === 'string' ? role.toLowerCase().trim() : '');
    
    console.log('Normalized user role:', `'${normalizedUserRole}'`);
    console.log('Normalized allowed roles:', normalizedRoles);
    console.log('Final includes check:', normalizedRoles.includes(normalizedUserRole));
    console.log('===================');
    
    if (!normalizedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        userRole: req.userRole,
        requiredRoles: roles
      });
    }
    next();
  };
};

const authorizeAdmin = authorizeRole(['admin']);

module.exports = { authenticateToken, authorizeRole, authorizeAdmin };