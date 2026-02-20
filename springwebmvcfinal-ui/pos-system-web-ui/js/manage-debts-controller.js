/**
 * DEBTS MANAGEMENT CONTROLLER
 * Track customer debts and payments
 */

let debts = [];
let currentDebtId = null;

// Initialize
$(document).ready(function() {
    loadDebts();
    setupListeners();
    setTodayDate();
});

function setupListeners() {
    $('#btnSave').click(saveDebt);
    $('#btnUpdate').click(updateDebt);
    $('#btnClear').click(clearForm);
    $('#txtSearch').on('input', filterDebts);
    $('#filterStatus').change(filterDebts);
    $('#filterSort').change(sortDebts);
    $('#btnExport').click(exportToExcel);
    $('#btnConfirmPayment').click(processPayment);
    $('#btnConfirmDelete').click(confirmDelete);
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    $('#txtDate').val(today);
}

// Load debts from localStorage
function loadDebts() {
    const saved = localStorage.getItem('posDebts');
    debts = saved ? JSON.parse(saved) : [];
    renderDebts();
    updateStats();
}

// Save debts to localStorage
function saveDebts() {
    localStorage.setItem('posDebts', JSON.stringify(debts));
}

// Save new debt
function saveDebt() {
    const name = $('#txtCustomerName').val().trim();
    const phone = $('#txtPhone').val().trim();
    const amount = parseFloat($('#txtAmount').val());
    const date = $('#txtDate').val();
    const notes = $('#txtNotes').val().trim();

    if (!name || !amount) {
        alert('تکایە ناو و بڕی قەرز پڕبکەرەوە!');
        return;
    }

    const debt = {
        id: Date.now(),
        name,
        phone,
        totalAmount: amount,
        paidAmount: 0,
        remainingAmount: amount,
        date,
        notes,
        payments: [],
        status: 'unpaid'
    };

    debts.push(debt);
    saveDebts();
    loadDebts();
    clearForm();
    showToast('قەرز زیادکرا!', 'success');
}

// Update debt
function updateDebt() {
    const debt = debts.find(d => d.id === currentDebtId);
    if (!debt) return;

    debt.name = $('#txtCustomerName').val().trim();
    debt.phone = $('#txtPhone').val().trim();
    debt.notes = $('#txtNotes').val().trim();
    debt.date = $('#txtDate').val();

    saveDebts();
    loadDebts();
    clearForm();
    showToast('قەرز نوێکرایەوە!', 'success');
}

// Delete debt
let debtToDelete = null;
function deleteDebt(id) {
    debtToDelete = id;
    $('#deleteModal').modal('show');
}

function confirmDelete() {
    debts = debts.filter(d => d.id !== debtToDelete);
    saveDebts();
    loadDebts();
    $('#deleteModal').modal('hide');
    showToast('قەرز سڕایەوە!', 'success');
}

// Select debt for editing
function selectDebt(id) {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    currentDebtId = debt.id;
    $('#txtCustomerName').val(debt.name);
    $('#txtPhone').val(debt.phone);
    $('#txtAmount').val(debt.totalAmount).prop('disabled', true);
    $('#txtDate').val(debt.date);
    $('#txtNotes').val(debt.notes);

    $('#btnSave').hide();
    $('#btnUpdate').show();
    
    $('html, body').animate({ scrollTop: 0 }, 300);
}

// Clear form
function clearForm() {
    $('#debtForm')[0].reset();
    currentDebtId = null;
    $('#txtAmount').prop('disabled', false);
    $('#btnSave').show();
    $('#btnUpdate').hide();
    setTodayDate();
}

// Open payment modal
let currentPaymentDebt = null;
function openPaymentModal(id) {
    const debt = debts.find(d => d.id === id);
    if (!debt) return;

    currentPaymentDebt = debt;
    $('#paymentCustomerName').text(debt.name);
    $('#paymentDebtInfo').html(`
        کۆی قەرز: <strong class="text-danger">IQD ${fmt(debt.totalAmount)}</strong><br>
        واردبووی: <strong class="text-success">IQD ${fmt(debt.paidAmount)}</strong><br>
        ماوە: <strong class="text-warning">IQD ${fmt(debt.remainingAmount)}</strong>
    `);
    $('#txtPaymentAmount').val('').attr('max', debt.remainingAmount);
    $('#txtPaymentNotes').val('');
    $('#paymentModal').modal('show');
}

// Process payment
function processPayment() {
    const amount = parseFloat($('#txtPaymentAmount').val());
    const notes = $('#txtPaymentNotes').val().trim();
    
    if (!amount || amount <= 0) {
        alert('تکایە بڕێکی دروست بنووسە!');
        return;
    }

    if (amount > currentPaymentDebt.remainingAmount) {
        alert('بڕەکە زیاترە لە قەرزی ماوە!');
        return;
    }

    const payment = {
        amount,
        date: new Date().toISOString(),
        notes
    };

    currentPaymentDebt.payments.push(payment);
    currentPaymentDebt.paidAmount += amount;
    currentPaymentDebt.remainingAmount -= amount;

    // Update status
    if (currentPaymentDebt.remainingAmount === 0) {
        currentPaymentDebt.status = 'paid';
    } else {
        currentPaymentDebt.status = 'partial';
    }

    saveDebts();
    loadDebts();
    $('#paymentModal').modal('hide');
    showToast('پارە واردکرا!', 'success');
}

// Render debts table
function renderDebts() {
    const tbody = $('#debtsTableBody');
    tbody.empty();

    if (debts.length === 0) {
        tbody.html(`
            <tr>
                <td colspan="10" class="text-center py-5">
                    <div style="font-size:48px;">💳</div>
                    <p class="text-muted">هیچ قەرزێک تۆمار نەکراوە</p>
                </td>
            </tr>
        `);
        return;
    }

    debts.forEach((debt, index) => {
        const statusBadge = {
            unpaid: '<span class="badge badge-unpaid">نەدراوە</span>',
            partial: '<span class="badge badge-partial">بەشێک</span>',
            paid: '<span class="badge badge-paid">تەواو دراوە</span>'
        }[debt.status];

        const row = `
            <tr style="cursor:pointer;" onclick="selectDebt(${debt.id})">
                <td><strong>${index + 1}</strong></td>
                <td><strong>${debt.name}</strong></td>
                <td>${debt.phone || '-'}</td>
                <td class="amount-unpaid">IQD ${fmt(debt.totalAmount)}</td>
                <td class="amount-paid">IQD ${fmt(debt.paidAmount)}</td>
                <td><strong>IQD ${fmt(debt.remainingAmount)}</strong></td>
                <td>${statusBadge}</td>
                <td>${formatDate(debt.date)}</td>
                <td>${debt.notes || '-'}</td>
                <td onclick="event.stopPropagation()">
                    ${debt.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="openPaymentModal(${debt.id})">💰 وارد</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteDebt(${debt.id})">🗑️</button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

// Filter debts
function filterDebts() {
    const search = $('#txtSearch').val().toLowerCase();
    const status = $('#filterStatus').val();

    let filtered = debts;

    if (search) {
        filtered = filtered.filter(d => 
            d.name.toLowerCase().includes(search) ||
            (d.phone && d.phone.includes(search))
        );
    }

    if (status) {
        filtered = filtered.filter(d => d.status === status);
    }

    const temp = debts;
    debts = filtered;
    renderDebts();
    debts = temp;
}

// Sort debts
function sortDebts() {
    const sort = $('#filterSort').val();

    switch(sort) {
        case 'date_desc':
            debts.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'date_asc':
            debts.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'amount_desc':
            debts.sort((a, b) => b.remainingAmount - a.remainingAmount);
            break;
        case 'amount_asc':
            debts.sort((a, b) => a.remainingAmount - b.remainingAmount);
            break;
    }

    renderDebts();
}

// Update statistics
function updateStats() {
    const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalPaid = debts.reduce((sum, d) => sum + d.paidAmount, 0);
    const uniqueCustomers = [...new Set(debts.map(d => d.name))].length;

    $('#totalDebt').text('IQD ' + fmt(totalDebt));
    $('#totalPaid').text('IQD ' + fmt(totalPaid));
    $('#totalCustomers').text(uniqueCustomers);
}

// Export to Excel (simple CSV)
function exportToExcel() {
    if (debts.length === 0) {
        alert('هیچ قەرزێک نییە بۆ دەرهێنان!');
        return;
    }

    let csv = 'ژمارە,ناو,مۆبایل,کۆی قەرز,واردبووی,ماوە,دۆخ,بەروار,تێبینی\n';

    debts.forEach((d, i) => {
        const status = { unpaid: 'نەدراوە', partial: 'بەشێک', paid: 'تەواو' }[d.status];
        csv += `${i+1},"${d.name}","${d.phone || ''}",${d.totalAmount},${d.paidAmount},${d.remainingAmount},"${status}","${d.date}","${d.notes || ''}"\n`;
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `debts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    showToast('فایل دەرهێنرا!', 'success');
}

// Utilities
function fmt(n) {
    return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 0 });
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB');
}

function showToast(msg, type = 'info') {
    const colors = { success: '#27ae60', error: '#e74c3c', warning: '#f39c12', info: '#3498db' };
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = $(`
        <div style="position:fixed;bottom:20px;right:20px;z-index:9999;background:${colors[type]};
             color:white;padding:12px 20px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,.3);
             font-weight:600;font-size:14px;">
            ${icons[type]} ${msg}
        </div>
    `);
    $('body').append(toast);
    setTimeout(() => toast.fadeOut(300, () => toast.remove()), 2500);
}

console.log('Debts Controller Ready!');
