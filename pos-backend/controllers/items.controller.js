// GET all items
const getAllItems = async (req, res) => {
    try {
        const [items] = await req.db.query(
            'SELECT * FROM items WHERE active = true ORDER BY description'
        );
        res.json(items);
    } catch (error) {
        console.error('Get items error:', error);
        res.status(500).json({ error: 'Failed to fetch items' });
    }
};

// GET item by code
const getItemByCode = async (req, res) => {
    try {
        const [items] = await req.db.query(
            'SELECT * FROM items WHERE code = ?',
            [req.params.code]
        );
        
        if (items.length === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        res.json(items[0]);
    } catch (error) {
        console.error('Get item error:', error);
        res.status(500).json({ error: 'Failed to fetch item' });
    }
};

// CREATE item
const createItem = async (req, res) => {
    try {
        const { code, description, category, unitPrice, qtyOnHand, minStockLevel, 
                barcode, notes, imageUrl } = req.body;
        
        // Validation
        if (!code || !description || !unitPrice || qtyOnHand === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const [result] = await req.db.query(
            `INSERT INTO items (code, description, category, unit_price, qty_on_hand, 
             min_stock_level, barcode, notes, image_url, active) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
            [code, description, category, unitPrice, qtyOnHand, 
             minStockLevel || 10, barcode, notes, imageUrl]
        );

        res.status(201).json({ 
            message: 'Item created', 
            code: code
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Item code already exists' });
        }
        console.error('Create item error:', error);
        res.status(500).json({ error: 'Failed to create item' });
    }
};

// UPDATE item
const updateItem = async (req, res) => {
    try {
        const { description, category, unitPrice, qtyOnHand, minStockLevel, 
                barcode, notes, imageUrl, active } = req.body;

        const [result] = await req.db.query(
            `UPDATE items SET description = ?, category = ?, unit_price = ?, 
             qty_on_hand = ?, min_stock_level = ?, barcode = ?, notes = ?, 
             image_url = ?, active = ? WHERE code = ?`,
            [description, category, unitPrice, qtyOnHand, minStockLevel, 
             barcode, notes, imageUrl, active !== false, req.params.code]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item updated' });
    } catch (error) {
        console.error('Update item error:', error);
        res.status(500).json({ error: 'Failed to update item' });
    }
};

// DELETE item
const deleteItem = async (req, res) => {
    try {
        // Soft delete
        const [result] = await req.db.query(
            'UPDATE items SET active = false WHERE code = ?',
            [req.params.code]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted' });
    } catch (error) {
        console.error('Delete item error:', error);
        res.status(500).json({ error: 'Failed to delete item' });
    }
};

module.exports = {
    getAllItems,
    getItemByCode,
    createItem,
    updateItem,
    deleteItem
};
