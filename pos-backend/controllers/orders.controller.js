const getAllOrders = async (req, res) => {
    try {
        const [orders] = await req.db.query(
            `SELECT o.*, c.name as customer_name 
             FROM orders o 
             LEFT JOIN customers c ON o.customer_id = c.id 
             ORDER BY o.created_at DESC 
             LIMIT 100`
        );
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const [orders] = await req.db.query(
            `SELECT o.*, c.name as customer_name 
             FROM orders o 
             LEFT JOIN customers c ON o.customer_id = c.id 
             WHERE o.id = ?`,
            [req.params.id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Get order details
        const [details] = await req.db.query(
            `SELECT od.*, i.description as item_name 
             FROM order_details od 
             JOIN items i ON od.item_code = i.code 
             WHERE od.order_id = ?`,
            [req.params.id]
        );

        res.json({ ...orders[0], details });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
};

const createOrder = async (req, res) => {
    const connection = await req.db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { customerId, status, discount, discountType, tax, subtotal, totalAmount,
                amountPaid, changeAmount, paymentMethod, paymentStatus, processedBy, 
                orderDetails } = req.body;

        // Validation
        if (!orderDetails || orderDetails.length === 0) {
            throw new Error('Order must have at least one item');
        }

        // Generate order number
        const [lastOrder] = await connection.query(
            'SELECT order_number FROM orders ORDER BY id DESC LIMIT 1'
        );
        
        let orderNumber = 'ORD0000001';
        if (lastOrder.length > 0 && lastOrder[0].order_number) {
            const lastNum = parseInt(lastOrder[0].order_number.substring(3));
            orderNumber = 'ORD' + String(lastNum + 1).padStart(7, '0');
        }

        // Insert order
        const [orderResult] = await connection.query(
            `INSERT INTO orders (order_number, customer_id, status, discount, discount_type, 
             tax, subtotal, total_amount, amount_paid, change_amount, payment_method, 
             payment_status, processed_by) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [orderNumber, customerId, status, discount, discountType, tax, subtotal, 
             totalAmount, amountPaid, changeAmount, paymentMethod, paymentStatus, processedBy]
        );

        const orderId = orderResult.insertId;

        // Insert order details & update stock
        for (const detail of orderDetails) {
            await connection.query(
                `INSERT INTO order_details (order_id, item_code, quantity, unit_price, 
                 discount, tax, subtotal, total) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [orderId, detail.itemCode, detail.quantity, detail.unitPrice, 
                 detail.discount, detail.tax, detail.subtotal, detail.total]
            );

            // Update item stock
            await connection.query(
                'UPDATE items SET qty_on_hand = qty_on_hand - ? WHERE code = ?',
                [detail.quantity, detail.itemCode]
            );
        }

        await connection.commit();

        res.status(201).json({ 
            message: 'Order created', 
            orderId: orderId,
            orderNumber: orderNumber
        });

    } catch (error) {
        await connection.rollback();
        console.error('Create order error:', error);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    } finally {
        connection.release();
    }
};

module.exports = {
    getAllOrders,
    getOrderById,
    createOrder
};
