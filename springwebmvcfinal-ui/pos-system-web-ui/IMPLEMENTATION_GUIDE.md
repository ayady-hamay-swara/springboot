# 💳 POS Debt Integration - Complete Guide

## 🎯 What This Does:

Adds a **"Sell as Debt" (فرۆشتن بە قەرز)** button to POS that:
1. Opens customer selection modal
2. Lets you quick-add or select existing customer
3. Creates order as DEBT (not paid)
4. Automatically creates debt record
5. Customer can pay later in Debts page

---

## 📦 Package Contents:

1. **database_schema.sql** - Complete database with debts tables
2. **pos-checkout-with-debt.html** - Updated POS page
3. **pos-checkout-debt-controller.js** - Controller with debt logic
4. **IMPLEMENTATION_GUIDE.md** - This file

---

## 🗄️ Database Changes:

### NEW Tables:

#### 1. **customers** (for debt tracking):
```sql
CREATE TABLE customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP
);
```

#### 2. **debts** (track all debts):
```sql
CREATE TABLE debts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT NULL,
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    remaining_amount DECIMAL(10,2),
    status ENUM('UNPAID', 'PARTIAL', 'PAID'),
    debt_date DATE,
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

#### 3. **debt_payments** (payment history):
```sql
CREATE TABLE debt_payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    debt_id INT NOT NULL,
    amount DECIMAL(10,2),
    payment_date TIMESTAMP,
    payment_method VARCHAR(50),
    notes TEXT,
    FOREIGN KEY (debt_id) REFERENCES debts(id)
);
```

### UPDATED Tables:

#### **orders** (added payment_type):
```sql
ALTER TABLE orders 
ADD COLUMN payment_type ENUM('CASH', 'DEBT') NOT NULL DEFAULT 'CASH',
ADD COLUMN customer_id INT NULL,
ADD FOREIGN KEY (customer_id) REFERENCES customers(id);
```

---

## 🚀 Implementation Steps:

### Step 1: Update Database
```bash
mysql -u root -p tenantDB_000001 < database_schema.sql
```

This creates all new tables and updates existing ones.

### Step 2: Add Backend APIs

Add these 2 new API endpoints to your Node.js backend:

**A. Customers API (`/api/customers`)**

Create `controllers/customers.controller.js`:
```javascript
const getAllCustomers = async (req, res) => {
    try {
        const [customers] = await req.db.query(
            'SELECT * FROM customers ORDER BY name'
        );
        res.json(customers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
};

const createCustomer = async (req, res) => {
    try {
        const { name, phone, address, notes } = req.body;
        const [result] = await req.db.query(
            'INSERT INTO customers (name, phone, address, notes) VALUES (?, ?, ?, ?)',
            [name, phone, address, notes]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create customer' });
    }
};

module.exports = { getAllCustomers, createCustomer };
```

**B. Debts API (`/api/debts`)**

Create `controllers/debts.controller.js`:
```javascript
const createDebt = async (req, res) => {
    try {
        const { customerId, orderId, totalAmount, debtDate, notes } = req.body;
        const [result] = await req.db.query(
            `INSERT INTO debts (customer_id, order_id, total_amount, paid_amount, 
             remaining_amount, status, debt_date, notes) 
             VALUES (?, ?, ?, 0, ?, 'UNPAID', ?, ?)`,
            [customerId, orderId, totalAmount, totalAmount, debtDate, notes]
        );
        res.status(201).json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create debt' });
    }
};

module.exports = { createDebt };
```

Add routes in `server.js`:
```javascript
app.use('/api/customers', require('./routes/customers.routes'));
app.use('/api/debts', require('./routes/debts.routes'));
```

### Step 3: Replace Frontend Files
```
pos-checkout-with-debt.html     → pos-checkout.html
pos-checkout-debt-controller.js → js/pos-checkout-debt-controller.js
```

### Step 4: Test!

---

## 💻 How It Works:

### Workflow 1: Normal Cash Sale
```
1. Add items to cart
2. Click [✅ تەواوکردنی فرۆشتن]
3. Enter amount received
4. Complete → Receipt shows
5. Stock decrements
6. Order saved as CASH
```

### Workflow 2: Debt Sale
```
1. Add items to cart (IQD 50,000)
2. Click [💳 فرۆشتن بە قەرز]
        ↓
   Modal opens:
   ┌──────────────────────────┐
   │ هەڵبژاردنی کڕیار          │
   ├──────────────────────────┤
   │ ➕ Quick Add:            │
   │ [ناو___] [مۆبایل___]    │
   │ [زیادکردن]               │
   ├──────────────────────────┤
   │ [گەڕان___________]      │
   │                          │
   │ ☑ احمد - 0750123...     │
   │ ☐ سارا - 0770123...     │
   │ ☐ کەریم - 0751123...    │
   └──────────────────────────┘
        ↓
3. Select customer (احمد)
4. Modal closes automatically
5. Order created as DEBT
6. Debt record created:
   - Customer: احمد
   - Amount: IQD 50,000
   - Status: UNPAID
   - Order linked
7. Stock decrements
8. Customer can pay later in Debts page
```

---

## 🎨 UI Changes:

### Action Buttons (Right Panel):

**BEFORE:**
```
┌─────────────────┐
│ ✅ تەواوکردن     │
│ [⏸][✕]         │
│ ↩ گەڕاندنەوە    │
└─────────────────┘
```

**AFTER:**
```
┌─────────────────┐
│ ✅ تەواوکردن     │ ← Cash sale
│ 💳 فرۆشتن بە قەرز│ ← NEW: Debt sale
│ [⏸][✕]         │
│ ↩ گەڕاندنەوە    │
└─────────────────┘
```

---

## 📋 Customer Selection Modal:

### Features:

**1. Quick Add (Top Section):**
- Add customer without leaving POS
- Name + Phone (optional)
- Instantly appears in list

**2. Search:**
- Filter by name or phone
- Real-time filtering

**3. Customer List:**
- Shows all customers
- Click to select
- Auto-closes after selection

---

## 🔄 Data Flow:

### Cash Sale:
```
Cart Items
    ↓
Create Order (payment_type = 'CASH')
    ↓
Update Stock
    ↓
Show Receipt
    ↓
Update Stats
```

### Debt Sale:
```
Cart Items
    ↓
Select Customer
    ↓
Create Order (payment_type = 'DEBT', customer_id = X)
    ↓
Create Debt Record (customer_id = X, order_id = Y)
    ↓
Update Stock
    ↓
Show Success Message
    ↓
Update Stats
```

---

## 💾 Database Entries:

### Example Debt Sale:

**Orders Table:**
```sql
id: 1
order_number: ORD0000001
customer_id: 5
payment_type: 'DEBT'
payment_method: 'DEBT'
payment_status: 'UNPAID'
total_amount: 50000
amount_paid: 0
```

**Debts Table:**
```sql
id: 1
customer_id: 5
order_id: 1
total_amount: 50000
paid_amount: 0
remaining_amount: 50000
status: 'UNPAID'
debt_date: '2025-02-20'
```

Later when customer pays in Debts page, payment recorded in:

**Debt_Payments Table:**
```sql
id: 1
debt_id: 1
amount: 20000
payment_date: '2025-02-25'
notes: 'واردکردنی یەکەم'
```

And debts table updates:
```sql
paid_amount: 20000
remaining_amount: 30000
status: 'PARTIAL'
```

---

## 🔗 Integration with Debts Page:

The `manage-debts.html` page can now:

1. Load debts from database (not localStorage):
```javascript
$.get('/api/debts', function(debts){
    // Show all debts with customer names
});
```

2. Show linked orders:
```javascript
// Each debt has order_id
// Can fetch order details if needed
```

3. Record payments that update database:
```javascript
$.post('/api/debt-payments', {
    debt_id: X,
    amount: Y
}, function(){
    // Updates debt status automatically
});
```

---

## ✅ Testing Checklist:

**Cash Sale:**
- [ ] Can add items to cart
- [ ] Can click [✅ تەواوکردن]
- [ ] Receipt shows
- [ ] Stock decrements
- [ ] Stats update
- [ ] Order saved with payment_type = 'CASH'

**Debt Sale:**
- [ ] [💳 فرۆشتن بە قەرز] button visible
- [ ] Click opens modal
- [ ] Can quick-add customer
- [ ] Customer appears in list
- [ ] Can search customers
- [ ] Click customer selects it
- [ ] Modal auto-closes
- [ ] Order created with payment_type = 'DEBT'
- [ ] Debt record created
- [ ] Stock decrements
- [ ] Success message shows
- [ ] Stats update

**Customer Management:**
- [ ] Quick add works
- [ ] Phone is optional
- [ ] Search filters correctly
- [ ] All customers load

**Database:**
- [ ] Orders have payment_type
- [ ] Orders have customer_id for debts
- [ ] Debts table populated
- [ ] Foreign keys work
- [ ] Can query debts by customer

---

## 🔥 Pro Tips:

1. **Quick Add**: Use for walk-in customers who want credit
2. **Search**: Type partial name or phone to filter
3. **Auto-Close**: Modal closes immediately after selection
4. **Stock**: Stock decreases for BOTH cash and debt sales
5. **Stats**: Both sale types count in today's stats

---

## 🐛 Troubleshooting:

**Modal doesn't open?**
- Check customers API is running
- Check browser console for errors
- Verify `loadCustomers()` function works

**Can't add customer?**
- Verify POST /api/customers endpoint
- Check name field is filled
- Look at network tab in DevTools

**Debt not created?**
- Check POST /api/debts endpoint
- Verify foreign keys exist
- Check console for errors

**Stock not decreasing?**
- Same logic for both cash and debt
- Check order_details creation
- Verify items table update query

---

## 📊 Reports & Analytics:

### Useful Queries:

**Total Debts by Customer:**
```sql
SELECT 
    c.name,
    SUM(d.remaining_amount) as total_debt
FROM customers c
JOIN debts d ON c.id = d.customer_id
WHERE d.status != 'PAID'
GROUP BY c.id;
```

**Payment History for Customer:**
```sql
SELECT 
    dp.*,
    d.total_amount,
    d.remaining_amount
FROM debt_payments dp
JOIN debts d ON dp.debt_id = d.id
WHERE d.customer_id = ?
ORDER BY dp.payment_date DESC;
```

**Today's Sales (Cash vs Debt):**
```sql
SELECT 
    payment_type,
    COUNT(*) as count,
    SUM(total_amount) as total
FROM orders
WHERE DATE(created_at) = CURDATE()
GROUP BY payment_type;
```

---

## 🎉 Summary:

You now have a complete debt tracking system integrated into your POS!

- ✅ Sell items on credit
- ✅ Track who owes what
- ✅ Link sales to customers
- ✅ Record payments later
- ✅ Full payment history
- ✅ Database-backed (not localStorage)
- ✅ Kurdish interface

**Everything works together!** POS creates debts, Debts page manages them, database stores everything permanently! 🚀
