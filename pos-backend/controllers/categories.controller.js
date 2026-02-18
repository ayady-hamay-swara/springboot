const getAllCategories = async (req, res) => {
    try {
        const [categories] = await req.db.query(
            'SELECT * FROM categories ORDER BY name'
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};

const getCategoryById = async (req, res) => {
    try {
        const [categories] = await req.db.query(
            'SELECT * FROM categories WHERE id = ?',
            [req.params.id]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(categories[0]);
    } catch (error) {
        console.error('Get category error:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
};

const createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const [result] = await req.db.query(
            'INSERT INTO categories (name, description, active) VALUES (?, ?, true)',
            [name, description]
        );

        res.status(201).json({ message: 'Category created', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        console.error('Create category error:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { name, description, active } = req.body;

        const [result] = await req.db.query(
            'UPDATE categories SET name = ?, description = ?, active = ? WHERE id = ?',
            [name, description, active !== false, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category updated' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const [result] = await req.db.query(
            'UPDATE categories SET active = false WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};
