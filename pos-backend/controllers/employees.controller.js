const bcrypt = require('bcryptjs');

const getAllEmployees = async (req, res) => {
    try {
        const [employees] = await req.db.query(
            'SELECT id, name, position, email, phone, username, salary, hire_date, active FROM employees ORDER BY name'
        );
        res.json(employees);
    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
};

const getEmployeeById = async (req, res) => {
    try {
        const [employees] = await req.db.query(
            'SELECT id, name, position, email, phone, username, salary, hire_date, active FROM employees WHERE id = ?',
            [req.params.id]
        );
        
        if (employees.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        
        res.json(employees[0]);
    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
};

const createEmployee = async (req, res) => {
    try {
        const { id, name, position, email, phone, username, password, salary, hireDate } = req.body;
        
        if (!id || !name || !position || !username || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await req.db.query(
            `INSERT INTO employees (id, name, position, email, phone, username, password, salary, hire_date, active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
            [id, name, position, email, phone, username, hashedPassword, salary, hireDate]
        );

        res.status(201).json({ message: 'Employee created', id });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Employee ID or username already exists' });
        }
        console.error('Create employee error:', error);
        res.status(500).json({ error: 'Failed to create employee' });
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { name, position, email, phone, username, password, salary, hireDate, active } = req.body;

        let query = 'UPDATE employees SET name = ?, position = ?, email = ?, phone = ?, username = ?, salary = ?, hire_date = ?, active = ?';
        let params = [name, position, email, phone, username, salary, hireDate, active !== false];

        // If password provided, hash and update it
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(req.params.id);

        const [result] = await req.db.query(query, params);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee updated' });
    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const [result] = await req.db.query(
            'UPDATE employees SET active = false WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        res.json({ message: 'Employee deleted' });
    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
};

module.exports = {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
