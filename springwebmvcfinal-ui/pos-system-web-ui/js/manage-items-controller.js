/**
 * ITEMS/INVENTORY MANAGEMENT CONTROLLER
 * Advanced Inventory Management with Stock Control
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const BASE_URL = "http://localhost:8080/api/items";
let currentItemCode = null;
let allItems = [];

// ============================================================================
// INITIALIZATION
// ============================================================================

$(document).ready(function() {
    console.log("Items Management Initialized");
    
    loadAllItems();
    loadStatistics();
    generateItemCode();
    
    setupEventListeners();
});

function setupEventListeners() {
    // Form buttons
    $('#btnGenerateCode').click(generateItemCode);
    $('#btnSave').click(saveItem);
    $('#btnUpdate').click(updateItem);
    $('#btnDelete').click(deleteItem);
    $('#btnClear').click(clearForm);
    
    // Search and filter
    $('#btnSearch').click(searchItems);
    $('#btnResetFilters').click(resetFilters);
    $('#txtSearch').on('keyup', function(e) {
        if (e.key === 'Enter') searchItems();
    });
    $('#filterCategory, #filterStock, #filterStatus').change(searchItems);
    
    // Bulk operations
    $('#btnBulkImport').click(() => $('#bulkImportModal').modal('show'));
    $('#btnExport').click(exportToCSV);
    $('#btnDownloadTemplate').click(downloadCSVTemplate);
    $('#csvFileInput').change(previewCSVImport);
    $('#btnConfirmImport').click(confirmBulkImport);
    
    // Image upload
    $('#btnUploadImage').click(() => showNotification("Image upload coming soon!", "info"));
    
    // Stock adjustment
    $('#adjustmentType, #adjustmentQty').on('change input', calculateNewStock);
    $('#btnConfirmAdjustment').click(confirmStockAdjustment);
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadAllItems() {
    $.ajax({
        url: BASE_URL,
        method: "GET",
        success: function(items) {
            allItems = items || [];
            displayItems(allItems);
            console.log(`Loaded ${allItems.length} items`);
        },
        error: function(error) {
            console.error("Error loading items:", error);
            showNotification("Error loading items", "error");
            allItems = [];
        }
    });
}

function loadStatistics() {
    // Calculate statistics from loaded items
    setTimeout(() => {
        const activeItems = allItems.filter(item => item.active);
        const lowStock = allItems.filter(item => 
            item.active && item.qtyOnHand <= (item.minStockLevel || 10)
        );
        const outOfStock = allItems.filter(item => 
            item.active && item.qtyOnHand === 0
        );
        
        const totalValue = allItems
            .filter(item => item.active)
            .reduce((sum, item) => sum + (item.unitPrice * item.qtyOnHand), 0);
        
        $('#totalItems').text(activeItems.length);
        $('#lowStockItems').text(lowStock.length);
        $('#outOfStockItems').text(outOfStock.length);
        $('#inventoryValue').text(`Rs. ${formatCurrency(totalValue)}`);
    }, 500);
}

// ============================================================================
// ITEM DISPLAY
// ============================================================================

function displayItems(items) {
    const tbody = $('#tblItemsBody');
    tbody.empty();
    
    if (items.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="9" class="text-center text-muted py-5">
                    <h5>No items found</h5>
                    <p>Add your first product to get started</p>
                </td>
            </tr>
        `);
        return;
    }
    
    items.forEach(item => {
        const statusClass = item.active ? 'badge-active' : 'badge-inactive';
        const statusText = item.active ? 'Active' : 'Inactive';
        
        // Stock level indicator
        let stockClass = 'stock-good';
        let stockBadge = 'stock-badge-good';
        if (item.qtyOnHand === 0) {
            stockClass = 'stock-critical';
            stockBadge = 'stock-badge-critical';
        } else if (item.qtyOnHand <= (item.minStockLevel || 10)) {
            stockClass = 'stock-low';
            stockBadge = 'stock-badge-low';
        }
        
        const itemValue = item.unitPrice * item.qtyOnHand;
        
        const row = $(`
            <tr>
                <td><strong>${item.code}</strong></td>
                <td>${item.description}</td>
                <td><span class="category-badge">${item.category || 'General'}</span></td>
                <td class="price-cell">Rs. ${formatCurrency(item.unitPrice)}</td>
                <td>
                    <span class="${stockClass}">${item.qtyOnHand}</span>
                    <span class="stock-badge ${stockBadge}">${getStockStatus(item)}</span>
                </td>
                <td>${item.minStockLevel || 10}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td class="value-cell">Rs. ${formatCurrency(itemValue)}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary btn-edit" data-code="${item.code}">
                        ✏️ Edit
                    </button>
                    <button class="btn btn-sm btn-info btn-stock" data-code="${item.code}">
                        📦 Stock
                    </button>
                    <button class="btn btn-sm btn-danger btn-delete-row" data-code="${item.code}">
                        🗑️
                    </button>
                </td>
            </tr>
        `);
        
        // Click row to select
        row.find('td:not(.action-buttons)').click(() => selectItem(item));
        
        // Edit button
        row.find('.btn-edit').click((e) => {
            e.stopPropagation();
            selectItem(item);
        });
        
        // Stock adjustment button
        row.find('.btn-stock').click((e) => {
            e.stopPropagation();
            openStockAdjustment(item);
        });
        
        // Quick delete button
        row.find('.btn-delete-row').click((e) => {
            e.stopPropagation();
            quickDeleteItem(item.code);
        });
        
        tbody.append(row);
    });
    
    loadStatistics();
}

function getStockStatus(item) {
    if (item.qtyOnHand === 0) return 'OUT';
    if (item.qtyOnHand <= (item.minStockLevel || 10)) return 'LOW';
    return 'OK';
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
    $('#txtStatus').val(item.active ? 'true' : 'false');
    
    // Show update/delete buttons, hide save
    $('#btnSave').hide();
    $('#btnUpdate, #btnDelete').show();
    
    // Scroll to form
    $('html, body').animate({
        scrollTop: $('#itemForm').offset().top - 100
    }, 500);
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

function saveItem() {
    if (!validateForm()) return;
    
    const itemData = getFormData();
    
    $.ajax({
        url: BASE_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(itemData),
        success: function(response) {
            showNotification("Item saved successfully!", "success");
            clearForm();
            loadAllItems();
        },
        error: function(error) {
            console.error("Error saving item:", error);
            if (error.responseJSON && error.responseJSON.message) {
                showNotification(error.responseJSON.message, "error");
            } else {
                showNotification("Error saving item. Item code may already exist.", "error");
            }
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
        url: `${BASE_URL}/${currentItemCode}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(itemData),
        success: function(response) {
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
    
    if (!confirm(`Are you sure you want to delete item ${currentItemCode}?`)) {
        return;
    }
    
    $.ajax({
        url: `${BASE_URL}/${currentItemCode}`,
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

function quickDeleteItem(code) {
    if (!confirm(`Delete item ${code}?`)) return;
    
    $.ajax({
        url: `${BASE_URL}/${code}`,
        method: "DELETE",
        success: function() {
            showNotification("Item deleted!", "success");
            loadAllItems();
        },
        error: function(error) {
            console.error("Error deleting item:", error);
            showNotification("Error deleting item", "error");
        }
    });
}

// ============================================================================
// FORM MANAGEMENT
// ============================================================================

function getFormData() {
    return {
        code: $('#txtItemCode').val(),
        description: $('#txtDescription').val(),
        category: $('#txtCategory').val(),
        unitPrice: parseFloat($('#txtUnitPrice').val()),
        qtyOnHand: parseInt($('#txtQtyOnHand').val()),
        minStockLevel: parseInt($('#txtMinStock').val()) || 10,
        barcode: $('#txtBarcode').val() || null,
        imageUrl: null, // To be implemented
        active: $('#txtStatus').val() === 'true'
    };
}

function validateForm() {
    const code = $('#txtItemCode').val();
    const description = $('#txtDescription').val();
    const category = $('#txtCategory').val();
    const price = $('#txtUnitPrice').val();
    const qty = $('#txtQtyOnHand').val();
    
    if (!code) {
        showNotification("Item code is required", "warning");
        $('#txtItemCode').focus();
        return false;
    }
    
    if (!description) {
        showNotification("Product name is required", "warning");
        $('#txtDescription').focus();
        return false;
    }
    
    if (!category) {
        showNotification("Please select a category", "warning");
        $('#txtCategory').focus();
        return false;
    }
    
    if (!price || parseFloat(price) <= 0) {
        showNotification("Please enter a valid price", "warning");
        $('#txtUnitPrice').focus();
        return false;
    }
    
    if (!qty || parseInt(qty) < 0) {
        showNotification("Please enter a valid quantity", "warning");
        $('#txtQtyOnHand').focus();
        return false;
    }
    
    return true;
}

function clearForm() {
    $('#itemForm')[0].reset();
    currentItemCode = null;
    
    $('#btnSave').show();
    $('#btnUpdate, #btnDelete').hide();
    $('#txtMinStock').val(10);
    $('#txtStatus').val('true');
    
    generateItemCode();
}

function generateItemCode() {
    $.ajax({
        url: `${BASE_URL}/next-code`,
        method: "GET",
        success: function(code) {
            $('#txtItemCode').val(code);
        },
        error: function() {
            // Fallback: generate code based on existing items
            const maxCode = allItems.reduce((max, item) => {
                const num = parseInt(item.code.substring(1));
                return num > max ? num : max;
            }, 0);
            $('#txtItemCode').val(`I${String(maxCode + 1).padStart(3, '0')}`);
        }
    });
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

function searchItems() {
    const searchTerm = $('#txtSearch').val().toLowerCase();
    const category = $('#filterCategory').val();
    const stockFilter = $('#filterStock').val();
    const status = $('#filterStatus').val();
    
    let filtered = allItems;
    
    // Search by name or code
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
    
    // Filter by stock level
    if (stockFilter === 'in-stock') {
        filtered = filtered.filter(item => item.qtyOnHand > (item.minStockLevel || 10));
    } else if (stockFilter === 'low-stock') {
        filtered = filtered.filter(item => 
            item.qtyOnHand > 0 && item.qtyOnHand <= (item.minStockLevel || 10)
        );
    } else if (stockFilter === 'out-of-stock') {
        filtered = filtered.filter(item => item.qtyOnHand === 0);
    }
    
    // Filter by status
    if (status) {
        const isActive = status === 'true';
        filtered = filtered.filter(item => item.active === isActive);
    }
    
    displayItems(filtered);
}

function resetFilters() {
    $('#txtSearch').val('');
    $('#filterCategory').val('');
    $('#filterStock').val('');
    $('#filterStatus').val('');
    displayItems(allItems);
}

// ============================================================================
// STOCK ADJUSTMENT
// ============================================================================

function openStockAdjustment(item) {
    currentItemCode = item.code;
    $('#currentStock').val(`${item.description} - Current: ${item.qtyOnHand}`);
    $('#adjustmentType').val('add');
    $('#adjustmentQty').val('');
    $('#adjustmentReason').val('purchase');
    $('#adjustmentNotes').val('');
    $('#newStock').text(item.qtyOnHand);
    
    $('#stockAdjustModal').modal('show');
}

function calculateNewStock() {
    const item = allItems.find(i => i.code === currentItemCode);
    if (!item) return;
    
    const currentStock = item.qtyOnHand;
    const type = $('#adjustmentType').val();
    const qty = parseInt($('#adjustmentQty').val()) || 0;
    
    let newStock = currentStock;
    
    switch(type) {
        case 'add':
            newStock = currentStock + qty;
            break;
        case 'remove':
            newStock = currentStock - qty;
            break;
        case 'set':
            newStock = qty;
            break;
    }
    
    newStock = Math.max(0, newStock);
    $('#newStock').text(newStock);
}

function confirmStockAdjustment() {
    const item = allItems.find(i => i.code === currentItemCode);
    if (!item) return;
    
    const newStock = parseInt($('#newStock').text());
    const reason = $('#adjustmentReason').val();
    const notes = $('#adjustmentNotes').val();
    
    // Update item stock
    item.qtyOnHand = newStock;
    
    $.ajax({
        url: `${BASE_URL}/${currentItemCode}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(item),
        success: function() {
            showNotification(`Stock adjusted successfully! New stock: ${newStock}`, "success");
            $('#stockAdjustModal').modal('hide');
            loadAllItems();
            
            // Log adjustment (in production, this would save to audit log)
            console.log(`Stock Adjustment: ${currentItemCode}, Reason: ${reason}, Notes: ${notes}`);
        },
        error: function(error) {
            console.error("Error adjusting stock:", error);
            showNotification("Error adjusting stock", "error");
        }
    });
}

// ============================================================================
// BULK IMPORT/EXPORT
// ============================================================================

function exportToCSV() {
    const headers = ['Code', 'Description', 'Category', 'Price', 'Stock', 'MinStock', 'Barcode', 'Active'];
    const rows = allItems.map(item => [
        item.code,
        item.description,
        item.category || '',
        item.unitPrice,
        item.qtyOnHand,
        item.minStockLevel || 10,
        item.barcode || '',
        item.active ? 'Yes' : 'No'
    ]);
    
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    downloadCSV(csv, 'items_export.csv');
    showNotification("Items exported successfully!", "success");
}

function downloadCSVTemplate() {
    const headers = ['Code', 'Description', 'Category', 'Price', 'Stock', 'MinStock', 'Barcode', 'Active'];
    const sample = [
        'I001', 'Sample Product', 'Electronics', '1000.00', '50', '10', '123456789', 'Yes'
    ];
    
    let csv = headers.join(',') + '\n';
    csv += sample.map(cell => `"${cell}"`).join(',') + '\n';
    
    downloadCSV(csv, 'items_template.csv');
    showNotification("Template downloaded!", "success");
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

function previewCSVImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        let preview = '<thead><tr>';
        headers.forEach(h => preview += `<th>${h}</th>`);
        preview += '</tr></thead><tbody>';
        
        for (let i = 1; i < Math.min(6, lines.length); i++) {
            const cells = lines[i].split(',');
            preview += '<tr>';
            cells.forEach(c => preview += `<td>${c.replace(/"/g, '')}</td>`);
            preview += '</tr>';
        }
        preview += '</tbody>';
        
        $('#previewTable').html(preview);
        $('#importPreview').show();
    };
    reader.readAsText(file);
}

function confirmBulkImport() {
    showNotification("Bulk import functionality coming soon!", "info");
    // In production, this would parse CSV and create multiple items
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

console.log("Items Management Controller Loaded!");
