const mysql = require('mysql2/promise');
require('dotenv').config();

// Master database connection (for authentication)
const masterPool = mysql.createPool({
    host: process.env.DB_MASTER_HOST,
    user: process.env.DB_MASTER_USER,
    password: process.env.DB_MASTER_PASSWORD,
    database: process.env.DB_MASTER_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Cache for tenant connections
const tenantPools = {};

// Get tenant database connection
const getTenantConnection = async (tenantDbName) => {
    if (!tenantDbName) {
        throw new Error('Tenant database name is required');
    }

    // Return cached pool if exists
    if (tenantPools[tenantDbName]) {
        return tenantPools[tenantDbName];
    }

    // Create new pool for this tenant
    const pool = mysql.createPool({
        host: process.env.DB_MASTER_HOST,
        user: process.env.DB_MASTER_USER,
        password: process.env.DB_MASTER_PASSWORD,
        database: tenantDbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

    // Cache it
    tenantPools[tenantDbName] = pool;
    return pool;
};

// Test connections
const testConnections = async () => {
    try {
        await masterPool.query('SELECT 1');
        console.log('✅ Master DB connected');
        
        // Test default tenant
        const defaultDb = process.env.DEFAULT_TENANT_DB;
        if (defaultDb) {
            const tenantPool = await getTenantConnection(defaultDb);
            await tenantPool.query('SELECT 1');
            console.log(`✅ Tenant DB connected: ${defaultDb}`);
        }
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

module.exports = {
    masterPool,
    getTenantConnection,
    testConnections
};
