# 🏪 POS System - Node.js Backend

Complete REST API backend for the POS system using Express.js + MySQL.

## 📋 Features

- ✅ Multi-tenant architecture (Master DB + Tenant DBs)
- ✅ RESTful API with Express.js
- ✅ MySQL connection pooling
- ✅ Password hashing with bcrypt
- ✅ CORS enabled
- ✅ Environment-based configuration
- ✅ Transaction support for orders
- ✅ Auto-generated order numbers
- ✅ Stock management on order creation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env` file:
```env
PORT=8080
DB_MASTER_HOST=localhost
DB_MASTER_USER=root
DB_MASTER_PASSWORD=your_password
DB_MASTER_DATABASE=masterDB
DEFAULT_TENANT_DB=tenantDB_000001
```

### 3. Setup Databases
Run the SQL scripts to create:
- `masterDB` (authentication)
- `tenantDB_000001` (POS data)

### 4. Start Server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Server will start on `http://localhost:8080`

## 📡 API Endpoints

### Items
- `GET    /api/items` - Get all items
- `GET    /api/items/:code` - Get item by code
- `POST   /api/items` - Create new item
- `PUT    /api/items/:code` - Update item
- `DELETE /api/items/:code` - Soft delete item

### Customers
- `GET    /api/customers` - Get all customers
- `GET    /api/customers/:id` - Get customer by ID
- `POST   /api/customers` - Create new customer
- `PUT    /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Soft delete customer

### Categories
- `GET    /api/categories` - Get all categories
- `GET    /api/categories/:id` - Get category by ID
- `POST   /api/categories` - Create new category
- `PUT    /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Soft delete category

### Orders
- `GET    /api/orders` - Get all orders
- `GET    /api/orders/:id` - Get order with details
- `POST   /api/orders` - Create new order (with stock update)

### Employees
- `GET    /api/employees` - Get all employees
- `GET    /api/employees/:id` - Get employee by ID
- `POST   /api/employees` - Create new employee
- `PUT    /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Soft delete employee

## 📦 Project Structure

```
pos-backend/
├── config/
│   └── database.js         # DB connection config
├── controllers/
│   ├── items.controller.js
│   ├── customers.controller.js
│   ├── categories.controller.js
│   ├── orders.controller.js
│   └── employees.controller.js
├── middleware/
│   ├── auth.js            # JWT authentication
│   └── tenant.js          # Multi-tenant middleware
├── routes/
│   ├── items.routes.js
│   ├── customers.routes.js
│   ├── categories.routes.js
│   ├── orders.routes.js
│   └── employees.routes.js
├── .env                   # Environment variables
├── .env.example          # Example env file
├── package.json
├── server.js             # Main entry point
└── README.md
```

## 🔧 Configuration

### Database Connection
Uses connection pooling with mysql2/promise:
- **Master Pool**: For authentication & tenant lookup
- **Tenant Pools**: Cached per-tenant database connections

### Multi-Tenant Setup
1. Master DB stores users & tenant info
2. Each tenant gets separate database (tenantDB_XXXXXX)
3. Middleware auto-switches database per request
4. DEFAULT_TENANT_DB used when no auth token provided

## 📝 Example Requests

### Create Item
```bash
curl -X POST http://localhost:8080/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "code": "I001",
    "description": "Laptop Dell XPS 15",
    "category": "Electronics",
    "unitPrice": 150000,
    "qtyOnHand": 10,
    "minStockLevel": 5,
    "notes": "i7, 16GB RAM"
  }'
```

### Create Order
```bash
curl -X POST http://localhost:8080/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "C001",
    "status": "COMPLETED",
    "discount": 0,
    "tax": 0,
    "subtotal": 150000,
    "totalAmount": 150000,
    "amountPaid": 150000,
    "changeAmount": 0,
    "paymentMethod": "CASH",
    "paymentStatus": "PAID",
    "orderDetails": [
      {
        "itemCode": "I001",
        "quantity": 1,
        "unitPrice": 150000,
        "discount": 0,
        "tax": 0,
        "subtotal": 150000,
        "total": 150000
      }
    ]
  }'
```

## 🛡️ Security Features

- Password hashing with bcrypt (10 rounds)
- Soft deletes (data not actually removed)
- SQL injection protection (parameterized queries)
- CORS configuration
- Environment-based secrets

## 🔄 Database Updates

When creating an order:
1. Transaction begins
2. Order inserted
3. Order details inserted
4. Item stock decremented
5. Transaction committed
6. If any step fails, everything rolls back

## 📊 Database Schema

Uses the schema from:
- `masterDB_schema.sql`
- `tenantDB_template.sql`

## 🐛 Troubleshooting

**Connection error?**
- Check MySQL is running
- Verify credentials in `.env`
- Test: `mysql -u root -p`

**Port already in use?**
- Change PORT in `.env`
- Check: `lsof -i :8080`

**Tenant database not found?**
- Ensure DEFAULT_TENANT_DB exists
- Run tenantDB_template.sql

## 📄 License

MIT
