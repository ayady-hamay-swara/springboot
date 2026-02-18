const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnections } = require('./config/database');
const { attachTenantDb } = require('./middleware/tenant');

const app = express();

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Attach tenant database to all /api routes
app.use('/api', attachTenantDb);

// API Routes
app.use('/api/items', require('./routes/items.routes'));
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/orders', require('./routes/orders.routes'));
app.use('/api/employees', require('./routes/employees.routes'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error' 
    });
});

// Start server
const PORT = process.env.PORT || 8080;

const startServer = async () => {
    try {
        // Test database connections
        await testConnections();
        
        // Start listening
        app.listen(PORT, () => {
            console.log(`
╔════════════════════════════════════════════╗
║   🏪 POS Backend Server Started           ║
╠════════════════════════════════════════════╣
║   Port: ${PORT}                               ║
║   Environment: ${process.env.NODE_ENV}           ║
║   Database: ${process.env.DB_MASTER_DATABASE}              ║
╚════════════════════════════════════════════╝
            `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
