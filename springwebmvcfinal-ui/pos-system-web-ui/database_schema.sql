-- ════════════════════════════════════════════════════════════════════
-- REFORMED DATABASE SCHEMA - With Debts Integration
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. ITEMS TABLE (No changes - already simplified)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS items (
    code VARCHAR(50) PRIMARY KEY,
    description VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    unit_price DECIMAL(10,2) NOT NULL,
    qty_on_hand INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    barcode VARCHAR(100),
    notes TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────
-- 2. CATEGORIES TABLE (Simplified - no active field)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────
-- 3. EMPLOYEES TABLE (No changes)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    position VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(50),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    salary DECIMAL(10,2),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────────────
-- 4. CUSTOMERS TABLE (NEW - For debt tracking)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_phone (phone)
);

-- ─────────────────────────────────────────────────────────────────────
-- 5. ORDERS TABLE (Updated - Added payment_type and customer_id)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NULL,  -- NULL for walk-in, ID for debt customers
    status VARCHAR(50) DEFAULT 'COMPLETED',
    
    -- Payment info
    payment_type ENUM('CASH', 'DEBT') NOT NULL DEFAULT 'CASH',
    payment_method VARCHAR(50),  -- CASH, CARD, TRANSFER (when payment_type = CASH)
    payment_status VARCHAR(50) DEFAULT 'PAID',
    
    -- Amounts
    discount DECIMAL(10,2) DEFAULT 0,
    discount_type VARCHAR(50),
    tax DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    change_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Meta
    processed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    INDEX idx_order_number (order_number),
    INDEX idx_customer (customer_id),
    INDEX idx_payment_type (payment_type),
    INDEX idx_created_at (created_at)
);

-- ─────────────────────────────────────────────────────────────────────
-- 6. ORDER_DETAILS TABLE (No changes)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES items(code),
    INDEX idx_order (order_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 7. DEBTS TABLE (NEW - Tracks customer debts)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NULL,  -- Link to order if created from POS
    
    -- Debt amounts
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2) NOT NULL,
    
    -- Status
    status ENUM('UNPAID', 'PARTIAL', 'PAID') DEFAULT 'UNPAID',
    
    -- Dates
    debt_date DATE NOT NULL,
    due_date DATE NULL,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_debt_date (debt_date)
);

-- ─────────────────────────────────────────────────────────────────────
-- 8. DEBT_PAYMENTS TABLE (NEW - Payment history for debts)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debt_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    debt_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_method VARCHAR(50),  -- CASH, CARD, TRANSFER
    notes TEXT,
    processed_by INT,
    
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
    INDEX idx_debt (debt_id),
    INDEX idx_payment_date (payment_date)
);

-- ════════════════════════════════════════════════════════════════════
-- SAMPLE DATA
-- ════════════════════════════════════════════════════════════════════

-- Sample Categories
INSERT INTO categories (name, description) VALUES
('گشتی', 'بەرهەمە گشتیەکان'),
('ئەلیکترۆنی', 'کاڵا ئەلیکترۆنیەکان'),
('خواردن', 'خواردەمەنی و خواردنەوە'),
('جل و بەرگ', 'جل و پێڵاو')
ON DUPLICATE KEY UPDATE name=name;

-- Sample Items
INSERT INTO items (code, description, category, unit_price, qty_on_hand, min_stock_level) VALUES
('I001', 'مۆبایل Samsung A54', 'ئەلیکترۆنی', 450000, 10, 5),
('I002', 'چای سەیلانی', 'خواردن', 8000, 50, 20),
('I003', 'پانتۆڵ جینز', 'جل و بەرگ', 35000, 20, 10)
ON DUPLICATE KEY UPDATE code=code;

-- Sample Customers
INSERT INTO customers (name, phone, address) VALUES
('ئەحمەد محەمەد', '07501234567', 'سلێمانی'),
('سارا ئیبراهیم', '07701234567', 'هەولێر'),
('کەریم رەشید', '07511234567', 'دهۆک');

-- ════════════════════════════════════════════════════════════════════
-- USEFUL QUERIES
-- ════════════════════════════════════════════════════════════════════

-- Get customer total debt
-- SELECT 
--     c.name,
--     c.phone,
--     SUM(d.remaining_amount) as total_debt
-- FROM customers c
-- JOIN debts d ON c.id = d.customer_id
-- WHERE d.status != 'PAID'
-- GROUP BY c.id;

-- Get payment history for a debt
-- SELECT * FROM debt_payments WHERE debt_id = ?;

-- Get all unpaid debts
-- SELECT 
--     d.*,
--     c.name as customer_name,
--     c.phone
-- FROM debts d
-- JOIN customers c ON d.customer_id = c.id
-- WHERE d.status != 'PAID'
-- ORDER BY d.debt_date DESC;
