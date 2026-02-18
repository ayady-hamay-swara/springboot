const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await req.db.query(
            'SELECT * FROM customers WHERE active = true ORDER BY name'
        );
        res.json(customers);
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

const getCustomerById = async (req, res) => {
    try {
        const [customers] = await req.db.query(
            'SELECT * FROM customers WHERE id = ?',
            [req.params.id]
        );
        
        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        
        res.json(customers[0]);
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const { id, name, phone, email, address, loyaltyPoints } = req.body;
        
        if (!id || !name) {
            return res.status(400).json({ error: 'ID and name are required' });
        }

        const [result] = await req.db.query(
            `INSERT INTO customers (id, name, phone, email, address, loyalty_points, active) 
             VALUES (?, ?, ?, ?, ?, ?, true)`,
            [id, name, phone, email, address, loyaltyPoints || 0]
        );

        res.status(201).json({ message: 'Customer created', id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Customer ID already exists' });
        }
        console.error('Create customer error:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

const updateCustomer = async (req, res) => {
    try {
        const { name, phone, email, address, loyaltyPoints, active } = req.body;

        const [result] = await req.db.query(
            `UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, 
             loyalty_points = ?, active = ? WHERE id = ?`,
            [name, phone, email, address, loyaltyPoints, active !== false, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer updated' });
    } catch (error) {
        console.error('Update customer error:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
};

const deleteCustomer = async (req, res) => {
    try {
        const [result] = await req.db.query(
            'UPDATE customers SET active = false WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted' });
    } catch (error) {
        console.error('Delete customer error:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};

module.exports = {
    getAllCustomers,
    getCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer
};
