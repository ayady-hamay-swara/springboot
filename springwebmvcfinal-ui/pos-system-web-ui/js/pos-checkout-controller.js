/**
 * POS CHECKOUT CONTROLLER
 * Complete Point of Sale System
 * Handles all checkout operations, cart management, and payments
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_BASE_URL = "http://localhost:8080/api";
const ITEMS_URL = `${API_BASE_URL}/items`;
const CUSTOMERS_URL = `${API_BASE_URL}/customers`;
const ORDERS_URL = `${API_BASE_URL}/orders`;

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

let cart = [];
let selectedCustomer = null;
let allItems = [];
let allCustomers = [];
let currentPaymentMethod = "CASH";
let todaySalesTotal = 0;
let todayTransactionsCount = 0;

// ============================================================================
// INITIALIZATION
// ============================================================================

$(document).ready(function() {
    console.log("POS Checkout System Initialized");
    
    // Load initial data
    loadItems();
    loadCustomers();
    loadTodayStats();
    
    // Set cashier name (you can integrate with employee login)
    $('#cashierName').text(getCashierName());
    
    // Event Listeners
    setupEventListeners();
    
    // Focus on search box
    $('#productSearch').focus();
});

function setupEventListeners() {
    // Product search
    $('#productSearch').on('input', filterProducts);
    $('#categoryFilter').on('change', filterProducts);
    
    // Customer selection
    $('#btnSelectCustomer').click(openCustomerModal);
    $('#btnWalkIn').click(selectWalkInCustomer);
    $('#customerSearch').on('input', filterCustomers);
    
    // Cart actions
    $('#btnClearCart').click(clearCart);
    
    // Payment
    $('.payment-btn').click(function() {
        $('.payment-btn').removeClass('active');
        $(this).addClass('active');
        currentPaymentMethod = $(this).data('method');
        
        // Show/hide cash payment fields
        if (currentPaymentMethod === 'CASH') {
            $('#cashPayment').show();
        } else {
            $('#cashPayment').hide();
        }
    });
    
    // Calculate change
    $('#amountReceived').on('input', calculateChange);
    $('#discountPercent').on('input', updateOrderSummary);
    
    // Sale actions
    $('#btnCompleteSale').click(completeSale);
    $('#btnHoldSale').click(holdSale);
    $('#btnCancelSale').click(cancelSale);
    
    // Receipt actions
    $('#btnPrintReceipt').click(printReceipt);
    $('#btnNewSale').click(newSale);
    
    // Numpad
    $('.numpad-btn').click(handleNumpadClick);
    $('#btnNumpadOk').click(applyNumpadValue);
    
    // Amount received click to show numpad
    $('#amountReceived').click(function() {
        $('#numpadModal').modal('show');
        $('#numpadDisplay').val('0');
    });
    
    // Keyboard shortcuts
    $(document).keydown(handleKeyboardShortcuts);
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadItems() {
    $.ajax({
        url: ITEMS_URL,
        method: "GET",
        success: function(items) {
            allItems = items.filter(item => item.active);
            displayProducts(allItems);
            console.log(`Loaded ${allItems.length} items`);
        },
        error: function(error) {
            console.error("Error loading items:", error);
            showNotification("Error loading products", "error");
        }
    });
}

function loadCustomers() {
    $.ajax({
        url: CUSTOMERS_URL,
        method: "GET",
        success: function(customers) {
            allCustomers = customers.filter(c => c.active);
            console.log(`Loaded ${allCustomers.length} customers`);
        },
        error: function(error) {
            console.error("Error loading customers:", error);
        }
    });
}

function loadTodayStats() {
    // In a real application, this would fetch from backend
    // For now, we'll use localStorage or mock data
    todaySalesTotal = parseFloat(localStorage.getItem('todaySales') || 0);
    todayTransactionsCount = parseInt(localStorage.getItem('todayTransactions') || 0);
    
    updateStatsDisplay();
}

function updateStatsDisplay() {
    $('#todaySales').text(`Rs. ${formatCurrency(todaySalesTotal)}`);
    $('#todayTransactions').text(todayTransactionsCount);
}

// ============================================================================
// PRODUCT DISPLAY & FILTERING
// ============================================================================

function displayProducts(items) {
    const grid = $('#productsGrid');
    grid.empty();
    
    if (items.length === 0) {
        grid.html(`
            <div class="col-12 text-center py-5">
                <h5 class="text-muted">No products found</h5>
                <p>Try adjusting your search or filter</p>
            </div>
        `);
        return;
    }
    
    items.forEach(item => {
        const isOutOfStock = item.qtyOnHand <= 0;
        const isLowStock = item.qtyOnHand <= (item.minStockLevel || 10);
        
        const card = $(`
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                 data-code="${item.code}">
                <div class="product-image">
                    ${getProductEmoji(item.category)}
                </div>
                <div class="product-name" title="${item.description}">
                    ${item.description}
                </div>
                <div class="product-category">${item.category || 'General'}</div>
                <div class="product-price">Rs. ${formatCurrency(item.unitPrice)}</div>
                <div class="product-stock ${isLowStock ? 'low-stock' : ''}">
                    Stock: ${item.qtyOnHand}
                </div>
            </div>
        `);
        
        if (!isOutOfStock) {
            card.click(() => addToCart(item));
        }
        
        grid.append(card);
    });
}

function filterProducts() {
    const searchTerm = $('#productSearch').val().toLowerCase();
    const category = $('#categoryFilter').val();
    
    let filtered = allItems;
    
    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.description.toLowerCase().includes(searchTerm) ||
            item.code.toLowerCase().includes(searchTerm) ||
            (item.barcode && item.barcode.toLowerCase().includes(searchTerm))
        );
    }
    
    // Filter by category
    if (category) {
        filtered = filtered.filter(item => item.category === category);
    }
    
    displayProducts(filtered);
}

function getProductEmoji(category) {
    const emojis = {
        'Electronics': '💻',
        'Accessories': '🎧',
        'Furniture': '🪑',
        'Stationery': '📝',
        'Food & Beverage': '🍔',
        'Clothing': '👕',
        'General': '📦'
    };
    return emojis[category] || '📦';
}

// ============================================================================
// CART MANAGEMENT
// ============================================================================

function addToCart(item) {
    // Check if item already in cart
    const existingIndex = cart.findIndex(cartItem => cartItem.code === item.code);
    
    if (existingIndex >= 0) {
        // Increase quantity if stock available
        const newQty = cart[existingIndex].quantity + 1;
        if (newQty <= item.qtyOnHand) {
            cart[existingIndex].quantity = newQty;
        } else {
            showNotification("Insufficient stock", "warning");
            return;
        }
    } else {
        // Add new item to cart
        cart.push({
            code: item.code,
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: 1,
            maxStock: item.qtyOnHand
        });
    }
    
    displayCart();
    updateOrderSummary();
    
    // Play sound effect (optional)
    playSound('beep');
}

function displayCart() {
    const cartContainer = $('#cartItems');
    cartContainer.empty();
    
    if (cart.length === 0) {
        cartContainer.html(`
            <div class="empty-cart">
                <div class="empty-cart-icon">🛒</div>
                <p>Cart is empty</p>
                <small>Scan or select products to add</small>
            </div>
        `);
        return;
    }
    
    cart.forEach((item, index) => {
        const itemTotal = item.unitPrice * item.quantity;
        
        const cartItem = $(`
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.description}</div>
                    <div class="cart-item-price">Rs. ${formatCurrency(item.unitPrice)} each</div>
                </div>
                <div class="cart-item-controls">
                    <div class="qty-control">
                        <button class="qty-btn qty-decrease" data-index="${index}">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn qty-increase" data-index="${index}">+</button>
                    </div>
                    <div class="cart-item-total">Rs. ${formatCurrency(itemTotal)}</div>
                    <button class="remove-item" data-index="${index}">×</button>
                </div>
            </div>
        `);
        
        cartContainer.append(cartItem);
    });
    
    // Attach event listeners
    $('.qty-decrease').click(function() {
        decreaseQuantity($(this).data('index'));
    });
    
    $('.qty-increase').click(function() {
        increaseQuantity($(this).data('index'));
    });
    
    $('.remove-item').click(function() {
        removeFromCart($(this).data('index'));
    });
}

function increaseQuantity(index) {
    if (cart[index].quantity < cart[index].maxStock) {
        cart[index].quantity++;
        displayCart();
        updateOrderSummary();
    } else {
        showNotification("Maximum stock reached", "warning");
    }
}

function decreaseQuantity(index) {
    if (cart[index].quantity > 1) {
        cart[index].quantity--;
        displayCart();
        updateOrderSummary();
    } else {
        removeFromCart(index);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    displayCart();
    updateOrderSummary();
}

function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear the cart?')) {
        cart = [];
        displayCart();
        updateOrderSummary();
        showNotification("Cart cleared", "info");
    }
}

// ============================================================================
// ORDER SUMMARY & CALCULATIONS
// ============================================================================

function updateOrderSummary() {
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    
    // Calculate discount
    const discountPercent = parseFloat($('#discountPercent').val()) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    
    // Calculate tax (currently 0%, but ready for implementation)
    const taxAmount = 0;
    
    // Calculate total
    const total = subtotal - discountAmount + taxAmount;
    
    // Update display
    $('#subtotal').text(`Rs. ${formatCurrency(subtotal)}`);
    $('#discountAmount').text(`Rs. ${formatCurrency(discountAmount)}`);
    $('#taxAmount').text(`Rs. ${formatCurrency(taxAmount)}`);
    $('#totalAmount').text(`Rs. ${formatCurrency(total)}`);
    
    // Update change if cash payment
    if (currentPaymentMethod === 'CASH') {
        calculateChange();
    }
    
    // Enable/disable complete sale button
    $('#btnCompleteSale').prop('disabled', cart.length === 0);
}

function calculateChange() {
    const total = parseFloat($('#totalAmount').text().replace('Rs. ', '').replace(/,/g, ''));
    const received = parseFloat($('#amountReceived').val()) || 0;
    const change = received - total;
    
    $('#changeAmount').text(`Rs. ${formatCurrency(Math.max(0, change))}`);
    
    // Highlight if insufficient payment
    if (change < 0 && received > 0) {
        $('#changeAmount').css('color', '#dc3545');
    } else {
        $('#changeAmount').css('color', '#28a745');
    }
}

// ============================================================================
// CUSTOMER SELECTION
// ============================================================================

function openCustomerModal() {
    $('#customerModal').modal('show');
    displayCustomerList(allCustomers);
    $('#customerSearch').val('').focus();
}

function displayCustomerList(customers) {
    const list = $('#customerList');
    list.empty();
    
    if (customers.length === 0) {
        list.html('<p class="text-center text-muted">No customers found</p>');
        return;
    }
    
    customers.forEach(customer => {
        const item = $(`
            <div class="customer-item" data-id="${customer.id}">
                <div class="customer-item-name">${customer.name}</div>
                <div class="customer-item-details">
                    ${customer.phone || 'No phone'} • 
                    ${customer.address || 'No address'} • 
                    Loyalty: ${customer.loyaltyPoints || 0} pts
                </div>
            </div>
        `);
        
        item.click(() => selectCustomer(customer));
        list.append(item);
    });
}

function filterCustomers() {
    const searchTerm = $('#customerSearch').val().toLowerCase();
    
    const filtered = allCustomers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.id.toLowerCase().includes(searchTerm) ||
        (customer.phone && customer.phone.includes(searchTerm))
    );
    
    displayCustomerList(filtered);
}

function selectCustomer(customer) {
    selectedCustomer = customer;
    
    $('#customerInfo').html(`
        <div class="customer-name">${customer.name}</div>
        <div class="customer-details">
            ${customer.phone || ''} • Loyalty: ${customer.loyaltyPoints || 0} points
        </div>
    `);
    
    $('#customerModal').modal('hide');
    showNotification(`Customer ${customer.name} selected`, "success");
}

function selectWalkInCustomer() {
    selectedCustomer = null;
    
    $('#customerInfo').html(`
        <div class="customer-name">Walk-in Customer</div>
        <div class="customer-details">No customer selected</div>
    `);
    
    $('#customerModal').modal('hide');
}

// ============================================================================
// PAYMENT & CHECKOUT
// ============================================================================

function completeSale() {
    if (cart.length === 0) {
        showNotification("Cart is empty", "warning");
        return;
    }
    
    const total = parseFloat($('#totalAmount').text().replace('Rs. ', '').replace(/,/g, ''));
    
    // Validate cash payment
    if (currentPaymentMethod === 'CASH') {
        const received = parseFloat($('#amountReceived').val()) || 0;
        if (received < total) {
            showNotification("Insufficient payment amount", "error");
            $('#amountReceived').focus();
            return;
        }
    }
    
    // Confirm sale
    if (!confirm(`Complete sale for Rs. ${formatCurrency(total)}?`)) {
        return;
    }
    
    // Prepare order data
    const orderData = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        date: new Date().toISOString(),
        status: "COMPLETED",
        discount: parseFloat($('#discountPercent').val()) || 0,
        totalAmount: total,
        paymentMethod: currentPaymentMethod,
        processedBy: getCashierName(),
        items: cart.map(item => ({
            itemCode: item.code,
            quantity: item.quantity,
            unitPrice: item.unitPrice
        }))
    };
    
    // Save order
    $.ajax({
        url: ORDERS_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(orderData),
        success: function(response) {
            // Update stats
            todaySalesTotal += total;
            todayTransactionsCount++;
            localStorage.setItem('todaySales', todaySalesTotal);
            localStorage.setItem('todayTransactions', todayTransactionsCount);
            updateStatsDisplay();
            
            // Generate receipt
            generateReceipt(response, orderData);
            
            // Show receipt modal
            $('#receiptModal').modal('show');
            
            showNotification("Sale completed successfully!", "success");
        },
        error: function(error) {
            console.error("Error completing sale:", error);
            showNotification("Error completing sale. Please try again.", "error");
        }
    });
}

function holdSale() {
    if (cart.length === 0) {
        showNotification("Cart is empty", "warning");
        return;
    }
    
    // Save cart to localStorage for later
    const heldSale = {
        cart: cart,
        customer: selectedCustomer,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('heldSale', JSON.stringify(heldSale));
    
    // Clear current sale
    newSale();
    
    showNotification("Sale held successfully", "success");
}

function cancelSale() {
    if (cart.length === 0) return;
    
    if (confirm('Cancel current sale?')) {
        newSale();
        showNotification("Sale cancelled", "info");
    }
}

function newSale() {
    cart = [];
    selectedCustomer = null;
    currentPaymentMethod = 'CASH';
    
    displayCart();
    updateOrderSummary();
    selectWalkInCustomer();
    
    $('#discountPercent').val(0);
    $('#amountReceived').val('');
    $('#changeAmount').text('Rs. 0.00');
    
    $('.payment-btn').removeClass('active');
    $('.payment-btn[data-method="CASH"]').addClass('active');
    
    $('#productSearch').val('').focus();
    filterProducts();
    
    $('#receiptModal').modal('hide');
}

// ============================================================================
// RECEIPT GENERATION
// ============================================================================

function generateReceipt(order, orderData) {
    const receipt = $('#receiptContent');
    const now = new Date();
    
    let html = `
        <div class="receipt-header">
            <h4>YOUR STORE NAME</h4>
            <p>123 Main Street, City</p>
            <p>Tel: 0771234567</p>
            <hr>
            <p>Receipt #${order.id || 'N/A'}</p>
            <p>${now.toLocaleString()}</p>
        </div>
        
        <div class="receipt-customer">
            <p><strong>Customer:</strong> ${selectedCustomer ? selectedCustomer.name : 'Walk-in'}</p>
            <p><strong>Cashier:</strong> ${getCashierName()}</p>
        </div>
        
        <hr>
        
        <div class="receipt-items">
    `;
    
    cart.forEach(item => {
        html += `
            <div class="receipt-item">
                <div>
                    <div>${item.description}</div>
                    <div style="font-size: 11px; color: #666;">
                        ${item.quantity} x Rs. ${formatCurrency(item.unitPrice)}
                    </div>
                </div>
                <div>Rs. ${formatCurrency(item.quantity * item.unitPrice)}</div>
            </div>
        `;
    });
    
    const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountPercent = parseFloat($('#discountPercent').val()) || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const total = subtotal - discountAmount;
    
    html += `
        </div>
        
        <div class="receipt-total">
            <div class="receipt-item">
                <span>Subtotal:</span>
                <span>Rs. ${formatCurrency(subtotal)}</span>
            </div>
    `;
    
    if (discountAmount > 0) {
        html += `
            <div class="receipt-item">
                <span>Discount (${discountPercent}%):</span>
                <span>- Rs. ${formatCurrency(discountAmount)}</span>
            </div>
        `;
    }
    
    html += `
            <div class="receipt-item" style="font-size: 18px; margin-top: 10px;">
                <span><strong>TOTAL:</strong></span>
                <span><strong>Rs. ${formatCurrency(total)}</strong></span>
            </div>
        </div>
        
        <div class="receipt-payment">
            <p><strong>Payment Method:</strong> ${currentPaymentMethod}</p>
    `;
    
    if (currentPaymentMethod === 'CASH') {
        const received = parseFloat($('#amountReceived').val()) || 0;
        const change = received - total;
        html += `
            <p><strong>Cash Received:</strong> Rs. ${formatCurrency(received)}</p>
            <p><strong>Change:</strong> Rs. ${formatCurrency(change)}</p>
        `;
    }
    
    html += `
        </div>
        
        <div class="receipt-footer">
            <p>Thank you for your purchase!</p>
            <p>Please come again</p>
        </div>
    `;
    
    receipt.html(html);
}

function printReceipt() {
    window.print();
}

// ============================================================================
// NUMPAD FUNCTIONALITY
// ============================================================================

function handleNumpadClick() {
    const btn = $(this);
    const value = btn.text();
    const display = $('#numpadDisplay');
    let current = display.val();
    
    if (value === 'C') {
        display.val('0');
    } else if (value === '.') {
        if (!current.includes('.')) {
            display.val(current + '.');
        }
    } else {
        if (current === '0') {
            display.val(value);
        } else {
            display.val(current + value);
        }
    }
}

function applyNumpadValue() {
    const value = $('#numpadDisplay').val();
    $('#amountReceived').val(value);
    calculateChange();
    $('#numpadModal').modal('hide');
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

function handleKeyboardShortcuts(e) {
    // Don't trigger if typing in input field
    if ($(e.target).is('input, textarea')) return;
    
    switch(e.key) {
        case 'F1':
            e.preventDefault();
            openCustomerModal();
            break;
        case 'F2':
            e.preventDefault();
            $('#productSearch').focus();
            break;
        case 'F4':
            e.preventDefault();
            if (cart.length > 0) completeSale();
            break;
        case 'F9':
            e.preventDefault();
            clearCart();
            break;
        case 'Escape':
            cancelSale();
            break;
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getCashierName() {
    // In production, get from logged-in employee
    return localStorage.getItem('cashierName') || 'Admin';
}

function showNotification(message, type = 'info') {
    // Create notification element
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
    
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
        alert.alert('close');
    }, 3000);
}

function playSound(type) {
    // Optional: Add sound effects
    // const audio = new Audio(`sounds/${type}.mp3`);
    // audio.play();
}

// ============================================================================
// CONSOLE HELPERS (for debugging)
// ============================================================================

window.posDebug = {
    cart: () => console.log(cart),
    customer: () => console.log(selectedCustomer),
    items: () => console.log(allItems),
    stats: () => console.log({ todaySales: todaySalesTotal, transactions: todayTransactionsCount })
};

console.log("POS System Ready! Use posDebug.cart(), posDebug.customer(), etc. for debugging");
