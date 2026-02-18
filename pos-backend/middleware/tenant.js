const { getTenantConnection } = require('../config/database');

// Attach tenant database connection to request
const attachTenantDb = async (req, res, next) => {
    try {
        // If no user (not authenticated), use default tenant for public endpoints
        const tenantDb = req.user?.tenantDb || process.env.DEFAULT_TENANT_DB;
        
        if (!tenantDb) {
            return res.status(500).json({ error: 'Tenant database not configured' });
        }

        // Get tenant connection and attach to request
        req.db = await getTenantConnection(tenantDb);
        req.tenantDb = tenantDb;
        
        next();
    } catch (error) {
        console.error('Tenant middleware error:', error);
        return res.status(500).json({ error: 'Database connection failed' });
    }
};

module.exports = { attachTenantDb };
