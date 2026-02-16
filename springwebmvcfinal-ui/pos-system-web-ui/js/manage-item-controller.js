/**
 * ITEMS MANAGEMENT CONTROLLER
 * Updated with: Dynamic Categories + Notes Field
 */

const ITEMS_URL = "http://localhost:8080/api/items";
const CATEGORIES_URL = "http://localhost:8080/api/categories";

let allItems = [];
let currentItemCode = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

$(document).ready(function() {
    console.log("Items Management Initialized");
    
    loadCategories();      // Load categories dynamically
    loadAllItems();
    loadStatistics();
    generateItemCode();
    
    setupEventListeners();
});

function setupEventListeners() {
    $('#btnGenerateCode').click(generateItemCode);
    $('#btnSave').click(saveItem);
    $('#btnUpdate').click(updateItem);
    $('#btnDelete').click(deleteItem);
    $('#btnClear').click(clearForm);
    $('#btnSearch').click(searchItems);
    
    // Search on Enter key
    $('#txtSearchName').on('keypress', function(e) {
        if (e.which === 13) searchItems();
    });
}

// ============================================================================
// LOAD CATEGORIES DYNAMICALLY
// ============================================================================

function loadCategories() {
    $.ajax({
        url: CATEGORIES_URL,
        method: "GET",
        success: function(categories) {
            const select = $('#txtCategory');
            const searchSelect = $('#txtSearchCategory');
            
            select.empty();
            searchSelect.empty();
            
            select.append('<option value="">Select category</option>');
            searchSelect.append('<option value="">All Categories</option>');
            
            if (categories && categories.length > 0) {
                categories.forEach(cat => {
                    if (cat.active) {
                        select.append(`<option value="${cat.name}">${cat.name}</option>`);
                        searchSelect.append(`<option value="${cat.name}">${cat.name}</option>`);
                    }
                });
                console.log(`Loaded ${categories.length} categories`);
            }
        },
        error: function(error) {
            console.log("Could not load categories from API - using defaults");
            // Fallback to default categories
            const defaultCategories = [
                'General', 'Electronics', 'Accessories', 'Furniture', 
                'Stationery', 'Food & Beverage', 'Clothing'
            ];
            
            const select = $('#txtCategory');
            const searchSelect = $('#txtSearchCategory');
            
            defaultCategories.forEach(cat => {
                select.append(`<option value="${cat}">${cat}</option>`);
                searchSelect.append(`<option value="${cat}">${cat}</option>`);
            });
        }
    });
}

// ============================================================================
// LOAD ITEMS
// ============================================================================

function loadAllItems() {
    $.ajax({
        url: ITEMS_URL,
        method: "GET",
        success: function(items) {
            allItems = items || [];
            displayItems(allItems);
            loadStatistics();
            console.log(`Loaded ${allItems.length} items`);
        },
        error: function(error) {
            console.error("Error loading items:", error);
            showNotification("Error loading items", "error");
            allItems = [];
        }
    });
}

function displayItems(items) {
    const tbody = $('#tblItemsBody');
    tbody.empty();
    
    if (!items || items.length === 0) {
        tbody.html('<tr><td colspan="9" class="text-center">No items found</td></tr>');
        return;
    }
    
    items.forEach(item => {
        const stockStatus = getStockStatus(item);
        const statusBadge = item.active ? 
            '<span class="badge badge-success">Active</span>' : 
            '<span class="badge badge-secondary">Inactive</span>';
        
        const notesPreview = item.notes ? 
            (item.notes.length > 30 ? item.notes.substring(0, 30) + '...' : item.notes) : 
            '<span class="text-muted">-</span>';
        
        const row = $(`
            <tr class="item-row" data-code="${item.code}">
                <td><strong>${item.code}</strong></td>
                <td>${item.description}</td>
                <td><span class="badge badge-info">${item.category || 'N/A'}</span></td>
                <td>Rs. ${formatCurrency(item.unitPrice)}</td>
                <td>${stockStatus}</td>
                <td>${item.minStockLevel || 10}</td>
                <td>${statusBadge}</td>
                <td><small>${notesPreview}</small></td>
                <td>
                    <button class="btn btn-sm btn-primary btn-select" data-code="${item.code}">
                        ✏️ Edit
                    </button>
                </td>
            </tr>
        `);
        
        // Click row to select
        row.click(function() {
            selectItem(item);
        });
        
        // Edit button
        row.find('.btn-select').click(function(e) {
            e.stopPropagation();
            selectItem(item);
        });
        
        tbody.append(row);
    });
}

function getStockStatus(item) {
    const qty = item.qtyOnHand || 0;
    const minStock = item.minStockLevel || 10;
    
    if (qty === 0) {
        return '<span class="badge badge-danger">OUT: 0</span>';
    } else if (qty <= minStock) {
        return `<span class="badge badge-warning">LOW: ${qty}</span>`;
    } else {
        return `<span class="badge badge-success">OK: ${qty}</span>`;
    }
}

// ============================================================================
// STATISTICS
// ============================================================================

function loadStatistics() {
    const total = allItems.filter(i => i.active).length;
    const lowStock = allItems.filter(i => i.qtyOnHand <= (i.minStockLevel || 10) && i.qtyOnHand > 0).length;
    const outOfStock = allItems.filter(i => i.qtyOnHand === 0).length;
    const totalValue = allItems
        .filter(i => i.active)
        .reduce((sum, i) => sum + (i.qtyOnHand * i.unitPrice), 0);
    
    $('#totalItems').text(total);
    $('#lowStockItems').text(lowStock);
    $('#outOfStockItems').text(outOfStock);
    $('#totalValue').text(`Rs. ${formatCurrency(totalValue)}`);
}

// ============================================================================
// FORM OPERATIONS
// ============================================================================

function getFormData() {
    return {
        code: $('#txtItemCode').val(),
        description: $('#txtDescription').val(),
        category: $('#txtCategory').val() || null,  // OPTIONAL
        unitPrice: parseFloat($('#txtUnitPrice').val()),
        qtyOnHand: parseInt($('#txtQtyOnHand').val()),
        minStockLevel: parseInt($('#txtMinStock').val()) || 10,
        barcode: $('#txtBarcode').val() || null,
        notes: $('#txtNotes').val() || null,  // NEW FIELD
        imageUrl: null,
        active: $('#txtStatus').val() === 'true'
    };
}

function validateForm() {
    const description = $('#txtDescription').val().trim();
    const price = $('#txtUnitPrice').val();
    const qty = $('#txtQtyOnHand').val();
    
    if (!description) {
        showNotification("Product name is required", "warning");
        $('#txtDescription').focus();
        return false;
    }
    
    if (!price || parseFloat(price) < 0) {
        showNotification("Valid price is required", "warning");
        $('#txtUnitPrice').focus();
        return false;
    }
    
    if (!qty || parseInt(qty) < 0) {
        showNotification("Valid quantity is required", "warning");
        $('#txtQtyOnHand').focus();
        return false;
    }
    
    // Category is now OPTIONAL - no validation needed
    
    return true;
}

function saveItem() {
    if (!validateForm()) return;
    
    const itemData = getFormData();
    
    $.ajax({
        url: ITEMS_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(itemData),
        success: function() {
            showNotification("Item saved successfully!", "success");
            clearForm();
            loadAllItems();
        },
        error: function(error) {
            console.error("Error saving item:", error);
            showNotification("Error saving item", "error");
        }
    });
}

function updateItem() {
    if (!currentItemCode) {
        showNotification("No item selected", "warning");
        return;
    }
    
    if (!validateForm()) return;
    
    const itemData = getFormData();
    
    $.ajax({
        url: `${ITEMS_URL}/${currentItemCode}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(itemData),
        success: function() {
            showNotification("Item updated successfully!", "success");
            clearForm();
            loadAllItems();
        },
        error: function(error) {
            console.error("Error updating item:", error);
            showNotification("Error updating item", "error");
        }
    });
}

function deleteItem() {
    if (!currentItemCode) {
        showNotification("No item selected", "warning");
        return;
    }
    
    if (!confirm(`Delete item ${currentItemCode}?`)) return;
    
    $.ajax({
        url: `${ITEMS_URL}/${currentItemCode}`,
        method: "DELETE",
        success: function() {
            showNotification("Item deleted successfully!", "success");
            clearForm();
            loadAllItems();
        },
        error: function(error) {
            console.error("Error deleting item:", error);
            showNotification("Error deleting item", "error");
        }
    });
}

function selectItem(item) {
    currentItemCode = item.code;
    
    $('#txtItemCode').val(item.code);
    $('#txtDescription').val(item.description);
    $('#txtCategory').val(item.category || '');
    $('#txtUnitPrice').val(item.unitPrice);
    $('#txtQtyOnHand').val(item.qtyOnHand);
    $('#txtMinStock').val(item.minStockLevel || 10);
    $('#txtBarcode').val(item.barcode || '');
    $('#txtNotes').val(item.notes || '');  // POPULATE NOTES FIELD
    $('#txtStatus').val(item.active ? 'true' : 'false');
    
    // Show update/delete buttons
    $('#btnSave').hide();
    $('#btnUpdate, #btnDelete, #btnStockAdjust').show();
    
    // Scroll to form
    $('html, body').animate({
        scrollTop: $('#itemForm').offset().top - 100
    }, 500);
}

function clearForm() {
    $('#itemForm')[0].reset();
    currentItemCode = null;
    
    $('#btnSave').show();
    $('#btnUpdate, #btnDelete, #btnStockAdjust').hide();
    $('#txtMinStock').val(10);
    $('#txtStatus').val('true');
    $('#txtNotes').val('');  // CLEAR NOTES
    
    generateItemCode();
}

function generateItemCode() {
    if (allItems.length === 0) {
        $('#txtItemCode').val('I001');
        return;
    }
    
    const codes = allItems.map(item => {
        const num = parseInt(item.code.substring(1));
        return isNaN(num) ? 0 : num;
    });
    
    const maxCode = Math.max(...codes);
    const newCode = 'I' + String(maxCode + 1).padStart(3, '0');
    $('#txtItemCode').val(newCode);
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

function searchItems() {
    const searchTerm = $('#txtSearchName').val().toLowerCase();
    const category = $('#txtSearchCategory').val();
    const stockLevel = $('#txtSearchStock').val();
    const status = $('#txtSearchStatus').val();
    
    let filtered = allItems;
    
    // Search by name or code
    if (searchTerm) {
        filtered = filtered.filter(item => 
            item.code.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    if (category) {
        filtered = filtered.filter(item => item.category === category);
    }
    
    // Filter by stock level
    if (stockLevel === 'in_stock') {
        filtered = filtered.filter(item => item.qtyOnHand > (item.minStockLevel || 10));
    } else if (stockLevel === 'low_stock') {
        filtered = filtered.filter(item => 
            item.qtyOnHand <= (item.minStockLevel || 10) && item.qtyOnHand > 0
        );
    } else if (stockLevel === 'out_of_stock') {
        filtered = filtered.filter(item => item.qtyOnHand === 0);
    }
    
    // Filter by status
    if (status !== '') {
        const isActive = status === 'true';
        filtered = filtered.filter(item => item.active === isActive);
    }
    
    displayItems(filtered);
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

console.log("Items Controller Loaded - With Dynamic Categories + Notes!");