/**
 * SEARCH ORDERS CONTROLLER
 * Advanced Order Search, Filter, and Management
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const ORDERS_URL = "http://localhost:8080/api/orders";
const CUSTOMERS_URL = "http://localhost:8080/api/customers";
const ITEMS_URL = "http://localhost:8080/api/items";

let allOrders = [];
let allCustomers = [];
let allItems = [];
let currentOrder = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

$(document).ready(function() {
    console.log("Search Orders Initialized");
    
    // Load data
    loadOrders();
    loadCustomers();
    loadItems();
    
    // Set default dates (last 30 days)
    setDefaultDates();
    
    // Check for order ID in URL
    checkURLParameters();
    
    setupEventListeners();
});

function setupEventListeners() {
    // Search button
    $('#btnSearch').click(searchOrders);
    
    // Quick date filters
    $('#btnToday').click(() => setQuickDate('today'));
    $('#btnYesterday').click(() => setQuickDate('yesterday'));
    $('#btnThisWeek').click(() => setQuickDate('week'));
    $('#btnThisMonth').click(() => setQuickDate('month'));
    $('#btnReset').click(resetFilters);
    
    // Enter key in search fields
    $('.search-card input, .search-card select').on('keypress', function(e) {
        if (e.which === 13) searchOrders();
    });
    
    // Export and Print
    $('#btnExportResults').click(exportToCSV);
    $('#btnPrintResults').click(printResults);
    
    // Order details modal buttons
    $('#btnPrintOrder').click(printOrderReceipt);
    $('#btnEditOrder').click(editOrder);
    $('#btnCancelOrder').click(() => {
        $('#orderDetailsModal').modal('hide');
        $('#cancelOrderModal').modal('show');
    });
    
    // Cancel order confirmation
    $('#btnConfirmCancel').click(confirmCancelOrder);
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadOrders() {
    $.ajax({
        url: ORDERS_URL,
        method: "GET",
        success: function(orders) {
            allOrders = orders || [];
            console.log(`Loaded ${allOrders.length} orders`);
            searchOrders(); // Display initial results
            updateStatistics();
        },
        error: function(error) {
            console.error("Error loading orders:", error);
            showNotification("Error loading orders", "error");
            allOrders = [];
        }
    });
}

function loadCustomers() {
    $.ajax({
        url: CUSTOMERS_URL,
        method: "GET",
        success: function(customers) {
            allCustomers = customers || [];
        },
        error: function(error) {
            console.error("Error loading customers:", error);
            allCustomers = [];
        }
    });
}

function loadItems() {
    $.ajax({
        url: ITEMS_URL,
        method: "GET",
        success: function(items) {
            allItems = items || [];
        },
        error: function(error) {
            console.error("Error loading items:", error);
            allItems = [];
        }
    });
}

// ============================================================================
// STATISTICS
// ============================================================================

function updateStatistics() {
    const completed = allOrders.filter(o => o.status === 'COMPLETED').length;
    const pending = allOrders.filter(o => o.status === 'PENDING').length;
    const totalRevenue = allOrders
        .filter(o => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    $('#totalOrders').text(allOrders.length);
    $('#completedOrders').text(completed);
    $('#pendingOrders').text(pending);
    $('#totalRevenue').text(`Rs. ${formatCurrency(totalRevenue)}`);
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

function searchOrders() {
    const orderId = $('#searchOrderId').val().trim();
    const customer = $('#searchCustomer').val().trim().toLowerCase();
    const dateFrom = $('#searchDateFrom').val();
    const dateTo = $('#searchDateTo').val();
    const status = $('#searchStatus').val();
    const amountMin = parseFloat($('#searchAmountMin').val()) || 0;
    const amountMax = parseFloat($('#searchAmountMax').val()) || Infinity;
    const paymentMethod = $('#searchPayment').val();
    
    let filtered = allOrders;
    
    // Filter by Order ID
    if (orderId) {
        filtered = filtered.filter(order => 
            order.id.toString().includes(orderId)
        );
    }
    
    // Filter by Customer
    if (customer) {
        filtered = filtered.filter(order => {
            const cust = allCustomers.find(c => c.id === order.customerId);
            return cust && cust.name.toLowerCase().includes(customer);
        });
    }
    
    // Filter by Date Range
    if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate >= fromDate;
        });
    }
    
    if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.date);
            return orderDate <= toDate;
        });
    }
    
    // Filter by Status
    if (status) {
        filtered = filtered.filter(order => order.status === status);
    }
    
    // Filter by Amount Range
    filtered = filtered.filter(order => {
        const amount = order.totalAmount || 0;
        return amount >= amountMin && amount <= amountMax;
    });
    
    // Filter by Payment Method
    if (paymentMethod) {
        filtered = filtered.filter(order => order.paymentMethod === paymentMethod);
    }
    
    displayOrders(filtered);
}

function displayOrders(orders) {
    const tbody = $('#ordersTableBody');
    tbody.empty();
    
    $('#resultCount').text(orders.length);
    
    if (orders.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="8" class="text-center py-5">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <h5>No orders found</h5>
                        <p>Try adjusting your search filters</p>
                    </div>
                </td>
            </tr>
        `);
        return;
    }
    
    // Sort by date (newest first)
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    orders.forEach(order => {
        const customer = allCustomers.find(c => c.id === order.customerId);
        const customerName = customer ? customer.name : 'Walk-in';
        
        const orderDate = new Date(order.date);
        const dateStr = orderDate.toLocaleDateString();
        const timeStr = orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const statusClass = {
            'COMPLETED': 'status-completed',
            'PENDING': 'status-pending',
            'CANCELLED': 'status-cancelled'
        }[order.status] || 'status-pending';
        
        const paymentClass = {
            'CASH': 'payment-cash',
            'CARD': 'payment-card',
            'TRANSFER': 'payment-transfer'
        }[order.paymentMethod] || '';
        
        const itemCount = order.items ? order.items.length : 0;
        const amount = order.totalAmount || 0;
        
        let amountClass = 'amount-small';
        if (amount > 100000) amountClass = 'amount-large';
        else if (amount > 10000) amountClass = 'amount-medium';
        
        const row = $(`
            <tr data-order-id="${order.id}">
                <td><strong>#${order.id}</strong></td>
                <td>
                    <div class="order-date">${dateStr}</div>
                    <div class="order-time">${timeStr}</div>
                </td>
                <td>${customerName}</td>
                <td>${itemCount} item${itemCount !== 1 ? 's' : ''}</td>
                <td class="${amountClass}">Rs. ${formatCurrency(amount)}</td>
                <td><span class="payment-badge ${paymentClass}">${order.paymentMethod || 'CASH'}</span></td>
                <td><span class="status-badge ${statusClass}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-view" data-order-id="${order.id}">
                        👁️ View
                    </button>
                    <button class="btn btn-sm btn-info btn-print" data-order-id="${order.id}">
                        🖨️
                    </button>
                </td>
            </tr>
        `);
        
        // Click row to view details
        row.click(function() {
            viewOrderDetails(order.id);
        });
        
        // View button
        row.find('.btn-view').click(function(e) {
            e.stopPropagation();
            viewOrderDetails(order.id);
        });
        
        // Print button
        row.find('.btn-print').click(function(e) {
            e.stopPropagation();
            printOrderReceipt(order.id);
        });
        
        tbody.append(row);
    });
}

// ============================================================================
// ORDER DETAILS
// ============================================================================

function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.id == orderId);
    if (!order) {
        showNotification("Order not found", "error");
        return;
    }
    
    currentOrder = order;
    
    // Populate modal
    $('#modalOrderId').text('#' + order.id);
    
    const customer = allCustomers.find(c => c.id === order.customerId);
    $('#detailCustomer').text(customer ? customer.name : 'Walk-in Customer');
    
    const orderDate = new Date(order.date);
    $('#detailDate').text(orderDate.toLocaleString());
    
    $('#detailPayment').html(`<span class="payment-badge">${order.paymentMethod || 'CASH'}</span>`);
    
    const statusClass = {
        'COMPLETED': 'status-completed',
        'PENDING': 'status-pending',
        'CANCELLED': 'status-cancelled'
    }[order.status] || 'status-pending';
    $('#detailStatus').html(`<span class="status-badge ${statusClass}">${order.status}</span>`);
    
    $('#detailEmployee').text(order.processedBy || 'N/A');
    $('#detailNotes').text(order.notes || 'No notes');
    
    // Display order items
    const itemsBody = $('#detailItemsBody');
    itemsBody.empty();
    
    let subtotal = 0;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach(orderItem => {
            const item = allItems.find(i => i.code === orderItem.itemCode);
            const itemName = item ? item.description : orderItem.itemCode;
            const itemSubtotal = orderItem.quantity * orderItem.unitPrice;
            subtotal += itemSubtotal;
            
            itemsBody.append(`
                <tr>
                    <td>${itemName}</td>
                    <td>${orderItem.quantity}</td>
                    <td>Rs. ${formatCurrency(orderItem.unitPrice)}</td>
                    <td>Rs. ${formatCurrency(itemSubtotal)}</td>
                </tr>
            `);
        });
    } else {
        itemsBody.append(`
            <tr>
                <td colspan="4" class="text-center text-muted">No items found</td>
            </tr>
        `);
    }
    
    // Calculate totals
    const discount = order.discount || 0;
    const discountAmount = (subtotal * discount) / 100;
    const tax = order.tax || 0;
    const total = order.totalAmount || subtotal - discountAmount + tax;
    
    $('#detailSubtotal').text(`Rs. ${formatCurrency(subtotal)}`);
    $('#detailDiscount').text(`Rs. ${formatCurrency(discountAmount)} (${discount}%)`);
    $('#detailTax').text(`Rs. ${formatCurrency(tax)}`);
    $('#detailTotal').text(`Rs. ${formatCurrency(total)}`);
    
    // Update cancel button
    $('#cancelOrderId').text('#' + order.id);
    
    // Show/hide action buttons based on status
    if (order.status === 'CANCELLED') {
        $('#btnEditOrder, #btnCancelOrder').hide();
    } else {
        $('#btnEditOrder, #btnCancelOrder').show();
    }
    
    $('#orderDetailsModal').modal('show');
}

// ============================================================================
// ORDER ACTIONS
// ============================================================================

function editOrder() {
    if (!currentOrder) return;
    
    showNotification("Edit functionality coming soon!", "info");
    // In production, this would redirect to edit page
    // window.location.href = `place-order.html?orderId=${currentOrder.id}`;
}

function confirmCancelOrder() {
    if (!currentOrder) return;
    
    const reason = $('#cancelReason').val();
    const notes = $('#cancelNotes').val();
    
    // Update order status
    currentOrder.status = 'CANCELLED';
    currentOrder.notes = `Cancelled: ${reason}. ${notes}`;
    
    $.ajax({
        url: `${ORDERS_URL}/${currentOrder.id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(currentOrder),
        success: function() {
            showNotification("Order cancelled successfully", "success");
            $('#cancelOrderModal').modal('hide');
            $('#orderDetailsModal').modal('hide');
            loadOrders();
        },
        error: function(error) {
            console.error("Error cancelling order:", error);
            showNotification("Error cancelling order", "error");
        }
    });
}

// ============================================================================
// QUICK DATE FILTERS
// ============================================================================

function setQuickDate(period) {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    let fromDate;
    
    switch(period) {
        case 'today':
            fromDate = toDate;
            break;
        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            fromDate = yesterday.toISOString().split('T')[0];
            break;
        case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            fromDate = weekAgo.toISOString().split('T')[0];
            break;
        case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            fromDate = monthAgo.toISOString().split('T')[0];
            break;
    }
    
    $('#searchDateFrom').val(fromDate);
    $('#searchDateTo').val(toDate);
    searchOrders();
}

function setDefaultDates() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    $('#searchDateFrom').val(monthAgo.toISOString().split('T')[0]);
    $('#searchDateTo').val(today.toISOString().split('T')[0]);
}

function resetFilters() {
    $('#searchOrderId').val('');
    $('#searchCustomer').val('');
    $('#searchStatus').val('');
    $('#searchPayment').val('');
    $('#searchAmountMin').val('');
    $('#searchAmountMax').val('');
    setDefaultDates();
    searchOrders();
}

// ============================================================================
// PRINT & EXPORT
// ============================================================================

function printOrderReceipt(orderId) {
    const order = orderId ? allOrders.find(o => o.id == orderId) : currentOrder;
    if (!order) return;
    
    const customer = allCustomers.find(c => c.id === order.customerId);
    const orderDate = new Date(order.date);
    
    let receipt = `
        <div class="receipt-content">
            <div class="receipt-header">
                <h4>YOUR STORE NAME</h4>
                <p>123 Main Street, City</p>
                <p>Tel: 0771234567</p>
                <hr>
                <p>Receipt #${order.id}</p>
                <p>${orderDate.toLocaleString()}</p>
            </div>
            
            <div class="receipt-customer">
                <p><strong>Customer:</strong> ${customer ? customer.name : 'Walk-in'}</p>
                <p><strong>Payment:</strong> ${order.paymentMethod || 'CASH'}</p>
            </div>
            
            <hr>
            
            <div class="receipt-items">
    `;
    
    let subtotal = 0;
    if (order.items) {
        order.items.forEach(orderItem => {
            const item = allItems.find(i => i.code === orderItem.itemCode);
            const itemName = item ? item.description : orderItem.itemCode;
            const itemTotal = orderItem.quantity * orderItem.unitPrice;
            subtotal += itemTotal;
            
            receipt += `
                <div class="receipt-item">
                    <div>
                        <div>${itemName}</div>
                        <div style="font-size: 11px;">${orderItem.quantity} x Rs. ${formatCurrency(orderItem.unitPrice)}</div>
                    </div>
                    <div>Rs. ${formatCurrency(itemTotal)}</div>
                </div>
            `;
        });
    }
    
    const discount = order.discount || 0;
    const discountAmount = (subtotal * discount) / 100;
    const total = order.totalAmount || subtotal - discountAmount;
    
    receipt += `
            </div>
            
            <div class="receipt-total">
                <div class="receipt-item">
                    <span>Subtotal:</span>
                    <span>Rs. ${formatCurrency(subtotal)}</span>
                </div>
    `;
    
    if (discountAmount > 0) {
        receipt += `
                <div class="receipt-item">
                    <span>Discount (${discount}%):</span>
                    <span>- Rs. ${formatCurrency(discountAmount)}</span>
                </div>
        `;
    }
    
    receipt += `
                <div class="receipt-item" style="font-size: 18px; margin-top: 10px;">
                    <span><strong>TOTAL:</strong></span>
                    <span><strong>Rs. ${formatCurrency(total)}</strong></span>
                </div>
            </div>
            
            <div class="receipt-footer">
                <p>Thank you for your purchase!</p>
                <p>Please come again</p>
            </div>
        </div>
    `;
    
    $('#printReceipt').html(receipt);
    window.print();
}

function printResults() {
    window.print();
}

function exportToCSV() {
    const filtered = allOrders; // Use current search results
    
    const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Amount', 'Payment', 'Status'];
    const rows = filtered.map(order => {
        const customer = allCustomers.find(c => c.id === order.customerId);
        const itemCount = order.items ? order.items.length : 0;
        
        return [
            order.id,
            new Date(order.date).toLocaleString(),
            customer ? customer.name : 'Walk-in',
            itemCount,
            order.totalAmount || 0,
            order.paymentMethod || 'CASH',
            order.status
        ];
    });
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    downloadCSV(csv, 'orders_export.csv');
    showNotification("Orders exported successfully!", "success");
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ============================================================================
// URL PARAMETERS
// ============================================================================

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    
    if (orderId) {
        setTimeout(() => {
            viewOrderDetails(orderId);
        }, 500);
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

console.log("Search Orders Controller Loaded!");
