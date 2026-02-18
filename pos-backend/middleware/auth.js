const jwt = require('jsonwebtoken');
const { masterPool } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from master DB
        const [users] = await masterPool.query(
            'SELECT id, username, tenant_id FROM users WHERE id = ? AND active = true',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Get tenant database name
        const [tenants] = await masterPool.query(
            'SELECT db_name FROM tenants WHERE id = ? AND active = true',
            [users[0].tenant_id]
        );

        if (tenants.length === 0) {
            return res.status(401).json({ error: 'Tenant not found' });
        }

        // Attach to request
        req.user = {
            id: users[0].id,
            username: users[0].username,
            tenantId: users[0].tenant_id,
            tenantDb: tenants[0].db_name
        };

        next();
    } catch (error) {
        console.error('Auth error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

module.exports = { authenticate };
