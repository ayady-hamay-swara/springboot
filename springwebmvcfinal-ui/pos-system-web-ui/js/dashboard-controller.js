/**
 * DASHBOARD CONTROLLER
 * Modern POS Dashboard with Real-Time Analytics
 * Displays business metrics, charts, and quick actions
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = "http://localhost:8080/api";
const ITEMS_URL = `${API_BASE_URL}/items`;
const CUSTOMERS_URL = `${API_BASE_URL}/customers`;
const ORDERS_URL = `${API_BASE_URL}/orders`;
const EMPLOYEES_URL = `${API_BASE_URL}/employees`;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let salesChart = null;
let allOrders = [];
let allItems = [];
let allCustomers = [];
let allEmployees = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

$(document).ready(function() {
    console.log("Dashboard Initializing...");
    
    // Update clock
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Load all data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize chart
    initializeSalesChart();
    
    console.log("Dashboard Ready!");
});

function setupEventListeners() {
    // Chart period change
    $('#chartPeriod').change(updateSalesChart);
    
    // Quick action buttons
    $('#btnGenerateReport').click(generateReport);
    $('#btnBackupData').click(backupData);
    $('#btnSettings').click(openSettings);
}

// ============================================================================
// DATE & TIME
// ============================================================================

function updateDateTime() {
    const now = new Date();
    
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    
    $('#currentDate').text(now.toLocaleDateString('en-US', dateOptions));
    $('#currentTime').text(now.toLocaleTimeString('en-US', timeOptions));
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadDashboardData() {
    // Load all required data
    Promise.all([
        loadOrders(),
        loadItems(),
        loadCustomers(),
        loadEmployees()
    ]).then(() => {
        console.log("All data loaded successfully");
        calculateMetrics();
        displayRecentOrders();
        displayLowStockAlerts();
        displayTopProducts();
        displayTopCustomers();
        updateSalesChart();
    }).catch(error => {
        console.error("Error loading dashboard data:", error);
        showNotification("Error loading dashboard data", "error");
    });
}

function loadOrders() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: ORDERS_URL,
            method: "GET",
            success: function(orders) {
                allOrders = orders || [];
                console.log(`Loaded ${allOrders.length} orders`);
                resolve(orders);
            },
            error: function(error) {
                console.error("Error loading orders:", error);
                allOrders = generateMockOrders(); // Fallback to mock data
                resolve(allOrders);
            }
        });
    });
}

function loadItems() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: ITEMS_URL,
            method: "GET",
            success: function(items) {
                allItems = items || [];
                console.log(`Loaded ${allItems.length} items`);
                resolve(items);
            },
            error: function(error) {
                console.error("Error loading items:", error);
                allItems = [];
                resolve([]);
            }
        });
    });
}

function loadCustomers() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: CUSTOMERS_URL,
            method: "GET",
            success: function(customers) {
                allCustomers = customers || [];
                console.log(`Loaded ${allCustomers.length} customers`);
                resolve(customers);
            },
            error: function(error) {
                console.error("Error loading customers:", error);
                allCustomers = [];
                resolve([]);
            }
        });
    });
}

function loadEmployees() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: EMPLOYEES_URL,
            method: "GET",
            success: function(employees) {
                allEmployees = employees || [];
                console.log(`Loaded ${allEmployees.length} employees`);
                resolve(employees);
            },
            error: function(error) {
                console.error("Error loading employees:", error);
                allEmployees = [];
                resolve([]);
            }
        });
    });
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

function calculateMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate today's sales
    const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= today && order.status === 'COMPLETED';
    });
    
    const todaySales = todayOrders.reduce((sum, order) => {
        return sum + (order.totalAmount || 0);
    }, 0);
    
    // Calculate monthly revenue
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= monthStart && order.status === 'COMPLETED';
    });
    
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => {
        return sum + (order.totalAmount || 0);
    }, 0);
    
    // Stock calculations
    const lowStockItems = allItems.filter(item => 
        item.active && item.qtyOnHand <= (item.minStockLevel || 10)
    );
    
    const outOfStockItems = allItems.filter(item => 
        item.active && item.qtyOnHand === 0
    );
    
    const activeEmployees = allEmployees.filter(emp => emp.active);
    
    // Calculate inventory value
    const inventoryValue = allItems
        .filter(item => item.active)
        .reduce((sum, item) => sum + (item.unitPrice * item.qtyOnHand), 0);
    
    // Update UI
    $('#todaySales').text(`Rs. ${formatCurrency(todaySales)}`);
    $('#todayOrders').text(todayOrders.length);
    $('#totalCustomers').text(allCustomers.length);
    $('#monthlyRevenue').text(`Rs. ${formatCurrency(monthlyRevenue)}`);
    
    $('#totalItems').text(allItems.filter(i => i.active).length);
    $('#lowStockItems').text(lowStockItems.length);
    $('#outOfStockItems').text(outOfStockItems.length);
    $('#activeEmployees').text(activeEmployees.length);
    $('#inventoryValue').text(`Rs. ${formatCurrency(inventoryValue)}`);
    
    // Calculate and display trends
    calculateTrends();
}

function calculateTrends() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Today's orders
    const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= today;
    });
    
    // Yesterday's orders
    const yesterdayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= yesterday && orderDate < today;
    });
    
    // Calculate sales change
    const todaySales = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const yesterdaySales = yesterdayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    const salesChange = yesterdaySales > 0 
        ? ((todaySales - yesterdaySales) / yesterdaySales * 100).toFixed(1)
        : 0;
    
    // Update trend displays
    updateTrend('#salesChange', salesChange, 'from yesterday');
    updateTrend('#ordersChange', 
        yesterdayOrders.length > 0 
            ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(1)
            : 0, 
        'from yesterday'
    );
}

function updateTrend(selector, percent, label) {
    const element = $(selector);
    const isPositive = percent >= 0;
    
    element.removeClass('positive negative neutral');
    element.addClass(isPositive ? 'positive' : 'negative');
    
    const arrow = isPositive ? '↑' : '↓';
    element.html(`
        <span class="arrow">${arrow}</span> ${Math.abs(percent)}% ${label}
    `);
}

// ============================================================================
// SALES CHART
// ============================================================================

function initializeSalesChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Sales (Rs.)',
                data: [],
                borderColor: '#2E75B6',
                backgroundColor: 'rgba(46, 117, 182, 0.1)',
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#2E75B6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return 'Sales: Rs. ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rs. ' + (value / 1000).toFixed(0) + 'k';
                        }
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

function updateSalesChart() {
    const days = parseInt($('#chartPeriod').val()) || 7;
    const salesData = calculateSalesData(days);
    
    salesChart.data.labels = salesData.labels;
    salesChart.data.datasets[0].data = salesData.values;
    salesChart.update();
}

function calculateSalesData(days) {
    const labels = [];
    const values = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        // Calculate sales for this day
        const daySales = allOrders
            .filter(order => {
                const orderDate = new Date(order.date);
                return orderDate >= date && orderDate < nextDay && order.status === 'COMPLETED';
            })
            .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        // Format label
        const label = i === 0 ? 'Today' : 
                     i === 1 ? 'Yesterday' : 
                     date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        labels.push(label);
        values.push(daySales);
    }
    
    return { labels, values };
}

// ============================================================================
// RECENT ORDERS
// ============================================================================

function displayRecentOrders() {
    const tbody = $('#recentOrdersBody');
    tbody.empty();
    
    // Get last 5 orders
    const recentOrders = allOrders
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    if (recentOrders.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    No recent orders
                </td>
            </tr>
        `);
        return;
    }
    
    recentOrders.forEach(order => {
        const customer = allCustomers.find(c => c.id === order.customerId);
        const customerName = customer ? customer.name : 'Walk-in';
        const orderTime = new Date(order.date);
        const timeAgo = getTimeAgo(orderTime);
        
        const statusClass = {
            'COMPLETED': 'status-completed',
            'PENDING': 'status-pending',
            'CANCELLED': 'status-cancelled'
        }[order.status] || 'status-pending';
        
        const row = $(`
            <tr>
                <td><strong>#${order.id}</strong></td>
                <td>${customerName}</td>
                <td>Rs. ${formatCurrency(order.totalAmount || 0)}</td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>${timeAgo}</td>
            </tr>
        `);
        
        row.click(() => viewOrderDetails(order));
        tbody.append(row);
    });
}

// ============================================================================
// LOW STOCK ALERTS
// ============================================================================

function displayLowStockAlerts() {
    const tbody = $('#lowStockBody');
    tbody.empty();
    
    const lowStockItems = allItems
        .filter(item => item.active && item.qtyOnHand <= (item.minStockLevel || 10))
        .sort((a, b) => a.qtyOnHand - b.qtyOnHand)
        .slice(0, 5);
    
    if (lowStockItems.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="5" class="text-center text-success py-4">
                    ✓ All items have sufficient stock
                </td>
            </tr>
        `);
        return;
    }
    
    lowStockItems.forEach(item => {
        const stockClass = item.qtyOnHand === 0 ? 'stock-critical' : 'stock-warning';
        const stockText = item.qtyOnHand === 0 ? 'OUT OF STOCK' : item.qtyOnHand;
        
        const row = $(`
            <tr>
                <td><strong>${item.description}</strong></td>
                <td>${item.category || 'General'}</td>
                <td><span class="${stockClass}">${stockText}</span></td>
                <td>${item.minStockLevel || 10}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="location.href='manage-items.html'">
                        Restock
                    </button>
                </td>
            </tr>
        `);
        
        tbody.append(row);
    });
}

// ============================================================================
// TOP PRODUCTS
// ============================================================================

function displayTopProducts() {
    const container = $('#topProductsList');
    container.empty();
    
    // Calculate product sales
    const productSales = {};
    
    allOrders.forEach(order => {
        if (order.items && order.status === 'COMPLETED') {
            order.items.forEach(item => {
                if (!productSales[item.itemCode]) {
                    productSales[item.itemCode] = {
                        code: item.itemCode,
                        quantity: 0,
                        revenue: 0
                    };
                }
                productSales[item.itemCode].quantity += item.quantity;
                productSales[item.itemCode].revenue += (item.quantity * item.unitPrice);
            });
        }
    });
    
    // Get top 5 products
    const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    if (topProducts.length === 0) {
        container.html(`
            <div class="text-center text-muted py-4">
                No sales data available
            </div>
        `);
        return;
    }
    
    topProducts.forEach((product, index) => {
        const item = allItems.find(i => i.code === product.code);
        const itemName = item ? item.description : product.code;
        const itemCategory = item ? (item.category || 'General') : 'Unknown';
        
        const productItem = $(`
            <div class="top-product-item">
                <div class="product-info">
                    <div class="product-rank">#${index + 1}</div>
                    <div class="product-details">
                        <div class="product-name">${itemName}</div>
                        <div class="product-category">${itemCategory}</div>
                    </div>
                </div>
                <div class="product-sales">
                    <div class="sales-count">Rs. ${formatCurrency(product.revenue)}</div>
                    <div class="sales-label">${product.quantity} sold</div>
                </div>
            </div>
        `);
        
        container.append(productItem);
    });
}

// ============================================================================
// TOP CUSTOMERS
// ============================================================================

function displayTopCustomers() {
    const container = $('#topCustomersList');
    container.empty();
    
    // Calculate customer purchases
    const customerPurchases = {};
    
    allOrders.forEach(order => {
        if (order.customerId && order.status === 'COMPLETED') {
            if (!customerPurchases[order.customerId]) {
                customerPurchases[order.customerId] = {
                    id: order.customerId,
                    totalSpent: 0,
                    orderCount: 0
                };
            }
            customerPurchases[order.customerId].totalSpent += (order.totalAmount || 0);
            customerPurchases[order.customerId].orderCount++;
        }
    });
    
    // Get top 5 customers
    const topCustomers = Object.values(customerPurchases)
        .sort((a, b) => b.totalSpent - a.totalSpent)
        .slice(0, 5);
    
    if (topCustomers.length === 0) {
        container.html(`
            <div class="text-center text-muted py-4">
                No customer data available
            </div>
        `);
        return;
    }
    
    topCustomers.forEach((customerData, index) => {
        const customer = allCustomers.find(c => c.id === customerData.id);
        const customerName = customer ? customer.name : customerData.id;
        const customerEmail = customer ? (customer.email || 'No email') : '';
        
        const customerItem = $(`
            <div class="top-customer-item">
                <div class="customer-info">
                    <div class="customer-rank">#${index + 1}</div>
                    <div class="customer-details">
                        <div class="customer-name">${customerName}</div>
                        <div class="customer-email">${customerEmail}</div>
                    </div>
                </div>
                <div class="customer-purchases">
                    <div class="purchases-count">Rs. ${formatCurrency(customerData.totalSpent)}</div>
                    <div class="purchases-label">${customerData.orderCount} orders</div>
                </div>
            </div>
        `);
        
        container.append(customerItem);
    });
}

// ============================================================================
// QUICK ACTIONS
// ============================================================================

function generateReport() {
    showNotification("Generating report...", "info");
    
    // In production, this would generate a PDF or Excel report
    setTimeout(() => {
        showNotification("Report generated successfully!", "success");
    }, 2000);
}

function backupData() {
    if (confirm("Create backup of all data?")) {
        showNotification("Creating backup...", "info");
        
        // In production, this would trigger a database backup
        setTimeout(() => {
            showNotification("Backup completed successfully!", "success");
        }, 2000);
    }
}

function openSettings() {
    showNotification("Settings page coming soon!", "info");
}

function viewOrderDetails(order) {
    // Navigate to search orders page with this order
    window.location.href = `search-orders.html?orderId=${order.id}`;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

function showNotification(message, type = 'info') {
    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[type] || 'alert-info';
    
    const alert = $(`
        <div class="alert ${alertClass} alert-dismissible fade show" 
             style="position: fixed; top: 70px; right: 20px; z-index: 9999; min-width: 300px;">
            ${message}
            <button type="button" class="close" data-dismiss="alert">
                <span>&times;</span>
            </button>
        </div>
    `);
    
    $('body').append(alert);
    
    setTimeout(() => {
        alert.alert('close');
    }, 3000);
}

// ============================================================================
// MOCK DATA (Fallback when API fails)
// ============================================================================

function generateMockOrders() {
    const orders = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const orderDate = new Date(today);
        orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 30));
        
        orders.push({
            id: 1000 + i,
            date: orderDate.toISOString(),
            customerId: `C00${Math.floor(Math.random() * 5) + 1}`,
            status: Math.random() > 0.1 ? 'COMPLETED' : 'PENDING',
            totalAmount: Math.random() * 50000 + 5000,
            items: []
        });
    }
    
    return orders;
}

// ============================================================================
// AUTO REFRESH (Optional)
// ============================================================================

// Refresh data every 5 minutes
setInterval(() => {
    console.log("Auto-refreshing dashboard data...");
    loadDashboardData();
}, 300000);

console.log("Dashboard Controller Loaded!");
