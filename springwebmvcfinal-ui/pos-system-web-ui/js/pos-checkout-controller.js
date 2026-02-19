/* ============================================================
   POS CHECKOUT CONTROLLER
   - Pure JS Calculator (no eval, no libraries)
   - Currency Converter (offline rates, IQD base)
   - Settings (saved to localStorage)
   ============================================================ */

const ITEMS_URL      = "http://localhost:8080/api/items";
const ORDERS_URL     = "http://localhost:8080/api/orders";
const CUSTOMERS_URL  = "http://localhost:8080/api/customers";
const CATEGORIES_URL = "http://localhost:8080/api/categories";

let allProducts = [], allCustomers = [];
let cart = [], selectedCustomer = null, paymentMethod = "CASH";
let currencySymbol = "IQD";  // ← default IQD

// ═══════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════
$(document).ready(function(){
    loadSettings();
    loadCategories();
    loadProducts();
    setupPosListeners();
    calcInit();
    settingsInit();
    currencyInit();

    const s = parseFloat(localStorage.getItem('todaySales') || 0);
    const t = parseInt(localStorage.getItem('todayOrders') || 0);
    $('#todaySales').text(currencySymbol + ' ' + fmt(s));
    $('#todayTransactions').text(t);
});


// ═══════════════════════════════════════════════════════
// SETTINGS  (localStorage-based)
// ═══════════════════════════════════════════════════════
function loadSettings(){
    const s = getSettings();
    currencySymbol = s.currency || 'IQD';  // ← default IQD
    $('#cashierName').text(s.cashier || 'Admin');
    document.title = (s.storeName || 'POS') + ' — Checkout';
}

function getSettings(){
    try { return JSON.parse(localStorage.getItem('posSettings') || '{}'); } catch(e){ return {}; }
}

function settingsInit(){
    const s = getSettings();

    // Populate global settings panel fields (global navbar IDs)
    $('#globalStoreName').val(s.storeName || '');
    $('#globalCurrency').val(s.currency || 'IQD');  // ← default IQD
    $('#globalTaxRate').val(s.taxRate || 0);
    $('#globalCashierName').val(s.cashier || '');
    $('#globalAutoPrint').prop('checked', !!s.autoPrint);
    $('#globalSound').prop('checked', s.sound !== false);

    // Toggle text labels
    $('#globalAutoPrint, #globalSound').on('change', function(){
        $(this).siblings('.toggle-text').text(this.checked ? 'On' : 'Off');
    });
    $('#globalAutoPrint').trigger('change');
    $('#globalSound').trigger('change');

    // Save button — global navbar uses #btnGlobalSaveSettings
    $('#btnGlobalSaveSettings').on('click', function(){
        const data = {
            storeName: $('#globalStoreName').val().trim() || 'POS System',
            currency:  $('#globalCurrency').val(),
            taxRate:   parseFloat($('#globalTaxRate').val()) || 0,
            cashier:   $('#globalCashierName').val().trim() || 'Admin',
            autoPrint: $('#globalAutoPrint').is(':checked'),
            sound:     $('#globalSound').is(':checked')
        };
        localStorage.setItem('posSettings', JSON.stringify(data));
        currencySymbol = data.currency;
        $('#cashierName').text(data.cashier);
        recalc();
        showToast(t('msg_saved'), 'success');
    });
}


// ═══════════════════════════════════════════════════════
// CALCULATOR — 100% pure JS, no eval()
// Uses global navbar popup IDs: #globalCalcPanel, #globalCalcExpr, #globalCalcResult
// ═══════════════════════════════════════════════════════
const calc = {
    display: '0',
    firstOperand: null,
    operator: null,
    waitingForSecond: false,
    expression: ''
};

function calcInit(){
    // Keyboard support when calculator is open
    $(document).on('keydown', function(e){
        if(!$('#globalCalcPanel').hasClass('show')) return;
        const k = e.key;
        if(k >= '0' && k <= '9') calcInputNumber(k);
        else if(k === '.') calcInputNumber('.');
        else if(k === '+') calcInputOperator('+');
        else if(k === '-') calcInputOperator('−');
        else if(k === '*') calcInputOperator('×');
        else if(k === '/') { e.preventDefault(); calcInputOperator('÷'); }
        else if(k === 'Enter' || k === '=') calcEquals();
        else if(k === 'Escape') calcClear();
        else if(k === 'Backspace') calcBackspace();
    });

    // Button clicks — shared .cb class across both old and global calc
    $(document).on('click', '.cb', function(){
        const num    = $(this).data('num');
        const op     = $(this).data('op');
        const action = $(this).data('action');

        if(num !== undefined) calcInputNumber(String(num));
        if(op)                calcInputOperator(op);
        if(action === 'clear')   calcClear();
        if(action === 'sign')    calcSign();
        if(action === 'percent') calcPercent();
        if(action === 'equals')  calcEquals();
    });

    // Use result in Amount Received — global navbar button ID
    $('#calcUseTotals').on('click', function(){
        const val = parseFloat(calc.display) || 0;
        if(val > 0){
            $('#amountReceived').val(val.toFixed(2));
            calcChange();
            showToast(t('calc_use') + ': ' + currencySymbol + ' ' + fmt(val), 'success');
        } else {
            showToast('Calculator shows 0', 'warning');
        }
    });

    calcRender();
}

function calcInputNumber(n){
    if(calc.waitingForSecond){
        calc.display = n === '.' ? '0.' : n;
        calc.waitingForSecond = false;
    } else {
        if(n === '.' && calc.display.includes('.')) return;
        if(calc.display === '0' && n !== '.') calc.display = n;
        else calc.display = calc.display + n;
    }
    calcRender();
}

function calcInputOperator(op){
    const current = parseFloat(calc.display);
    if(calc.operator && !calc.waitingForSecond){
        const result = calcCompute(calc.firstOperand, current, calc.operator);
        calc.display = calcFormatResult(result);
        calc.firstOperand = result;
        calc.expression = calcFormatResult(result) + ' ' + op;
    } else {
        calc.firstOperand = current;
        calc.expression = calcFormatResult(current) + ' ' + op;
    }
    calc.operator = op;
    calc.waitingForSecond = true;
    calcRender();
}

function calcEquals(){
    if(calc.operator === null || calc.waitingForSecond) return;
    const second = parseFloat(calc.display);
    calc.expression = calc.expression + ' ' + calcFormatResult(second) + ' =';
    const result = calcCompute(calc.firstOperand, second, calc.operator);
    calc.display = calcFormatResult(result);
    calc.operator = null;
    calc.firstOperand = null;
    calc.waitingForSecond = false;
    calcRender();
}

function calcCompute(a, b, op){
    switch(op){
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? 0 : a / b;
        default:  return b;
    }
}

function calcClear(){
    calc.display = '0'; calc.firstOperand = null;
    calc.operator = null; calc.waitingForSecond = false; calc.expression = '';
    calcRender();
}

function calcSign(){
    calc.display = calcFormatResult(parseFloat(calc.display) * -1);
    calcRender();
}

function calcPercent(){
    calc.display = calcFormatResult(parseFloat(calc.display) / 100);
    calcRender();
}

function calcBackspace(){
    if(calc.display.length > 1) calc.display = calc.display.slice(0, -1);
    else calc.display = '0';
    calcRender();
}

function calcFormatResult(n){
    if(isNaN(n) || !isFinite(n)) return '0';
    const rounded = Math.round(n * 1e10) / 1e10;
    return String(rounded);
}

function calcRender(){
    // Global navbar calculator display IDs
    $('#globalCalcExpr').text(calc.expression || '\u00a0');
    $('#globalCalcResult').text(calc.display);
}


// ═══════════════════════════════════════════════════════
// CURRENCY CONVERTER
// Rates relative to IQD (Iraqi Dinar) as base
// ═══════════════════════════════════════════════════════

// Approximate rates: 1 IQD = X of each currency
const RATES_FROM_IQD = {
    IQD: 1,
    USD: 0.000763,   // 1 IQD ≈ 0.000763 USD  (1 USD ≈ 1310 IQD)
    EUR: 0.000701,   // 1 IQD ≈ 0.000701 EUR  (1 EUR ≈ 1427 IQD)
    GBP: 0.000600,   // 1 IQD ≈ 0.000600 GBP  (1 GBP ≈ 1667 IQD)
    AUD: 0.001160    // 1 IQD ≈ 0.001160 AUD  (1 AUD ≈  862 IQD)
};

function currencyInit(){
    $('#currPosTotal').text(currencySymbol + ' 0.00');

    $('#btnConvert').on('click', doConvert);
    $('#currAmount').on('keypress', function(e){ if(e.which === 13) doConvert(); });

    // Mirror POS total into converter when it changes
    const observer = new MutationObserver(function(){
        const total = parseFloat($('#totalAmount').text().replace(/[^0-9.]/g, '')) || 0;
        $('#currPosTotal').text(currencySymbol + ' ' + fmt(total));
        if(!$('#currAmount').val()){
            $('#currAmount').val(total > 0 ? total.toFixed(2) : '');
        }
    });
    observer.observe(document.getElementById('totalAmount'), { childList: true, subtree: true });
}

function doConvert(){
    const amount = parseFloat($('#currAmount').val());
    if(isNaN(amount) || amount < 0){ showToast('Enter a valid amount', 'warning'); return; }

    const from = $('#currFrom').val();
    const to   = $('#currTo').val();

    if(from === to){
        const sym = $('#currFrom option:selected').data('symbol');
        $('#currResult').text(sym + ' ' + fmt(amount));
        $('#currRateRow').text('Same currency');
        return;
    }

    const toSym = $('#currTo option:selected').data('symbol');
    const rFrom = RATES_FROM_IQD[from] || 1;
    const rTo   = RATES_FROM_IQD[to]   || 1;

    // Convert: from → IQD → to
    const inIQD  = amount / rFrom;
    const result = inIQD * rTo;
    const rate   = rTo / rFrom;

    $('#currResult').text(toSym + ' ' + fmt(result));
    $('#currRateRow').text(`1 ${from} = ${toSym} ${fmtRate(rate)} · Indicative rates`);
}

function fmtRate(n){
    if(n >= 100)  return n.toFixed(0);
    if(n >= 1)    return n.toFixed(2);
    return n.toFixed(4);
}


// ═══════════════════════════════════════════════════════
// POS LISTENERS
// ═══════════════════════════════════════════════════════
function setupPosListeners(){
    $('#productSearch').on('input', function(){
        const q = $(this).val().trim();
        if(q.length < 1){ $('#productResults').hide(); return; }
        showSearchResults(q, $('#categoryFilter').val());
    });
    $('#productSearch').on('keydown', function(e){
        if(e.key === 'Escape'){ $('#productResults').hide(); $(this).val(''); }
    });
    $(document).on('click', function(e){
        if(!$(e.target).closest('.search-wrap').length) $('#productResults').hide();
    });
    $('#categoryFilter').on('change', function(){
        const q = $('#productSearch').val().trim();
        if(q) showSearchResults(q, $(this).val());
    });
    $('#discountPercent').on('input', recalc);
    $('.pay-btn').on('click', function(){
        $('.pay-btn').removeClass('active'); $(this).addClass('active');
        paymentMethod = $(this).data('method');
        $('#cashSection').toggle(paymentMethod === 'CASH');
    });
    $('#amountReceived').on('input', calcChange);
    $('#btnClearCart').on('click', clearCart);
    $('#btnCompleteSale').on('click', completeSale);
    $('#btnCancel').on('click', cancelOrder);
    $('#btnHold').on('click', holdOrder);
    $('#btnReturn').on('click', () => $('#returnModal').modal('show'));
    $('#btnNewSale').on('click', newSale);
    $('#btnSelectCustomer').on('click', openCustomerModal);
    $('#btnWalkin').on('click', clearCustomer);
    $('#customerSearch').on('input', function(){
        const q = $(this).val().toLowerCase();
        renderCustomerList(allCustomers.filter(c =>
            c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)
        ));
    });
    $('#btnProcessReturn').on('click', processReturn);
}


// ═══════════════════════════════════════════════════════
// LOAD DATA
// ═══════════════════════════════════════════════════════
function loadCategories(){
    $.ajax({ url: CATEGORIES_URL, method: 'GET',
        success(cats){
            const sel = $('#categoryFilter');
            sel.find('option:not(:first)').remove();
            (cats || []).filter(c => c.active).forEach(c =>
                sel.append(`<option value="${c.name}">${c.name}</option>`)
            );
        },
        error(){
            ['General','Electronics','Accessories','Clothing','Food & Beverage','Furniture']
                .forEach(c => $('#categoryFilter').append(`<option value="${c}">${c}</option>`));
        }
    });
}

function loadProducts(){
    $.ajax({ url: ITEMS_URL, method: 'GET',
        success(items){ allProducts = (items || []).filter(i => i.active); },
        error(){ showToast(t('msg_error'), 'error'); }
    });
}


// ═══════════════════════════════════════════════════════
// SEARCH RESULTS
// ═══════════════════════════════════════════════════════
function showSearchResults(q, cat){
    let res = allProducts;
    const ql = q.toLowerCase();
    res = res.filter(p =>
        p.description.toLowerCase().includes(ql) ||
        p.code.toLowerCase().includes(ql) ||
        (p.barcode && p.barcode.includes(q))
    );
    if(cat) res = res.filter(p => p.category === cat);

    const box = $('#productResults'); box.empty();
    if(!res.length){
        box.html('<div style="padding:12px;color:#999;text-align:center;">No products found</div>');
        box.show(); return;
    }

    res.slice(0, 10).forEach(p => {
        const qty = p.qtyOnHand || 0, min = p.minStockLevel || 10;
        const isOut = qty === 0, isLow = !isOut && qty <= min;
        let stk = `<span class="stock-ok">✅ ${qty}</span>`;
        if(isOut)       stk = `<span class="stock-out">❌ ${t('items_out_stock')}</span>`;
        else if(isLow)  stk = `<span class="stock-low">⚠️ ${qty}</span>`;

        const row = $(`
            <div class="prod-result-row">
                <div>
                    <div class="prod-result-name">${p.description}</div>
                    <div class="prod-result-meta">${p.code}${p.category ? ' · ' + p.category : ''} · ${stk}</div>
                </div>
                <div class="prod-result-price">${currencySymbol} ${fmt(p.unitPrice)}</div>
            </div>
        `);
        if(!isOut){
            row.on('click', () => { addToCart(p); $('#productSearch').val(''); box.hide(); });
        } else {
            row.css('opacity', '.5').css('cursor', 'not-allowed');
        }
        box.append(row);
    });
    box.show();
}


// ═══════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════
function addToCart(p){
    const ex = cart.find(c => c.code === p.code);
    if(ex){
        if(ex.qty >= p.qtyOnHand){ showToast(`Max stock: ${p.qtyOnHand}`, 'warning'); return; }
        ex.qty++;
    } else {
        cart.push({ code: p.code, name: p.description, price: p.unitPrice, qty: 1, maxQty: p.qtyOnHand, notes: p.notes || null });
    }
    renderCart(); recalc();
    const s = getSettings();
    if(s.sound !== false) playBeep();
    showToast(p.description + ' added', 'success');
}

function updateQty(code, delta){
    const item = cart.find(c => c.code === code); if(!item) return;
    item.qty += delta;
    if(item.qty <= 0) cart = cart.filter(c => c.code !== code);
    else if(item.qty > item.maxQty){ item.qty = item.maxQty; showToast(t('items_out_stock'), 'warning'); }
    renderCart(); recalc();
}

function removeItem(code){ cart = cart.filter(c => c.code !== code); renderCart(); recalc(); }

function clearCart(){
    if(!cart.length) return;
    if(!confirm(t('msg_confirm_delete') + '?')) return;
    cart = []; renderCart(); recalc();
}

function renderCart(){
    const body = $('#cartItems'); body.empty();
    const totalQty = cart.reduce((s, c) => s + c.qty, 0);
    $('#cartCount').text(totalQty + (totalQty === 1 ? ' item' : ' items'));

    if(!cart.length){
        body.html(`
            <div class="cart-empty">
                <div style="font-size:48px;">🛒</div>
                <p>${t('pos_cart_empty')}</p>
                <small>${t('pos_cart_empty_msg')}</small>
            </div>
        `);
        return;
    }
    cart.forEach(item => {
        const row = $(`
            <div class="cart-row">
                <div>
                    <div class="col-name">${item.name}</div>
                    ${item.notes ? `<div class="col-note">📝 ${item.notes}</div>` : ''}
                </div>
                <div class="col-qty">
                    <div class="qty-ctrl">
                        <button class="q-btn minus" data-code="${item.code}" data-delta="-1">−</button>
                        <span class="q-num">${item.qty}</span>
                        <button class="q-btn plus"  data-code="${item.code}" data-delta="1">+</button>
                    </div>
                </div>
                <div class="col-price">${currencySymbol} ${fmt(item.price)}</div>
                <div class="col-total">${currencySymbol} ${fmt(item.price * item.qty)}</div>
                <div class="col-action"><button class="rm-btn" data-code="${item.code}">✕</button></div>
            </div>
        `);
        row.find('.q-btn').on('click', function(e){ e.stopPropagation(); updateQty($(this).data('code'), $(this).data('delta')); });
        row.find('.rm-btn').on('click', function(e){ e.stopPropagation(); removeItem($(this).data('code')); });
        body.append(row);
    });
}


// ═══════════════════════════════════════════════════════
// TOTALS
// ═══════════════════════════════════════════════════════
function recalc(){
    const s = getSettings();
    const taxRate = (s.taxRate || 0) / 100;
    const sub = cart.reduce((t, c) => t + (c.price * c.qty), 0);
    const discPc = parseFloat($('#discountPercent').val()) || 0;
    const disc = sub * (discPc / 100);
    const tax = (sub - disc) * taxRate;
    const total = sub - disc + tax;

    $('#subtotal').text(currencySymbol + ' ' + fmt(sub));
    $('#discountAmount').text('- ' + currencySymbol + ' ' + fmt(disc));
    $('#totalAmount').text(currencySymbol + ' ' + fmt(total));
    calcChange();

    $('#currPosTotal').text(currencySymbol + ' ' + fmt(total));
    if(!$('#currAmount').is(':focus')) $('#currAmount').val(total > 0 ? total.toFixed(2) : '');
}

function calcChange(){
    const total = parseFloat($('#totalAmount').text().replace(/[^0-9.]/g, '')) || 0;
    const received = parseFloat($('#amountReceived').val()) || 0;
    const change = received - total;
    $('#changeAmount').text(currencySymbol + ' ' + fmt(Math.max(0, change)));
    $('#changeAmount').css('color', change >= 0 ? '#28a745' : '#dc3545');
}


// ═══════════════════════════════════════════════════════
// COMPLETE SALE
// ═══════════════════════════════════════════════════════
function completeSale(){
    if(!cart.length){ showToast(t('msg_cart_empty'), 'warning'); return; }
    if(paymentMethod === 'CASH'){
        const total = parseFloat($('#totalAmount').text().replace(/[^0-9.]/g, '')) || 0;
        const received = parseFloat($('#amountReceived').val()) || 0;
        if(received < total){ showToast(t('msg_insufficient_amount'), 'warning'); return; }
    }
    const s = getSettings();
    const taxRate = (s.taxRate || 0) / 100;
    const sub = cart.reduce((t, c) => t + (c.price * c.qty), 0);
    const discPc = parseFloat($('#discountPercent').val()) || 0;
    const disc = sub * (discPc / 100);
    const tax = (sub - disc) * taxRate;
    const total = sub - disc + tax;
    const paid = parseFloat($('#amountReceived').val()) || total;
    const change = Math.max(0, paid - total);

    const order = {
        customerId: selectedCustomer ? selectedCustomer.id : null,
        status: 'COMPLETED', discount: disc, discountType: 'PERCENTAGE',
        tax: tax, subtotal: sub, totalAmount: total,
        amountPaid: paid, changeAmount: change,
        paymentMethod: paymentMethod, paymentStatus: 'PAID',
        processedBy: localStorage.getItem('userId') || null,
        orderDetails: cart.map(c => ({
            itemCode: c.code, quantity: c.qty, unitPrice: c.price,
            discount: 0, tax: 0, subtotal: c.price * c.qty, total: c.price * c.qty
        }))
    };

    $('#btnCompleteSale').prop('disabled', true).html('⏳ ' + t('loading'));
    $.ajax({ url: ORDERS_URL, method: 'POST', contentType: 'application/json', data: JSON.stringify(order),
        success(res){
            const ps = parseFloat(localStorage.getItem('todaySales') || 0);
            const po = parseInt(localStorage.getItem('todayOrders') || 0);
            localStorage.setItem('todaySales', ps + total);
            localStorage.setItem('todayOrders', po + 1);
            $('#todaySales').text(currencySymbol + ' ' + fmt(ps + total));
            $('#todayTransactions').text(po + 1);
            showReceipt(res, change, paid, discPc, tax);
            $('#btnCompleteSale').prop('disabled', false).html('✅ ' + t('pos_complete_sale'));
            if(s.autoPrint) setTimeout(() => window.print(), 300);
        },
        error(err){
            console.error(err);
            showToast(t('msg_error'), 'error');
            $('#btnCompleteSale').prop('disabled', false).html('✅ ' + t('pos_complete_sale'));
        }
    });
}

function showReceipt(order, change, paid, discPc, tax){
    const now = new Date().toLocaleString();
    const s = getSettings();
    let rows = cart.map(i =>
        `<div class="receipt-row"><span>${i.name} x${i.qty}</span><span>${currencySymbol} ${fmt(i.price * i.qty)}</span></div>`
    ).join('');

    $('#receiptContent').html(`
        <div class="receipt-body">
            <div class="receipt-header">
                <strong>🏪 ${s.storeName || 'POS SYSTEM'}</strong><br>
                <small>${now}</small><br>
                <small>Order #: ${order.orderNumber || 'N/A'}</small>
            </div>
            <div class="receipt-divider"></div>${rows}
            <div class="receipt-divider"></div>
            <div class="receipt-row"><span>${t('pos_subtotal')}:</span><span>${$('#subtotal').text()}</span></div>
            ${discPc > 0 ? `<div class="receipt-row"><span>${t('pos_discount')} (${discPc}%):</span><span>${$('#discountAmount').text()}</span></div>` : ''}
            ${tax > 0 ? `<div class="receipt-row"><span>${t('pos_tax')} (${s.taxRate || 0}%):</span><span>${currencySymbol} ${fmt(tax)}</span></div>` : ''}
            <div class="receipt-row receipt-total"><span>${t('pos_total')}:</span><span>${$('#totalAmount').text()}</span></div>
            <div class="receipt-row"><span>${t('pos_amount_received')} (${paymentMethod}):</span><span>${currencySymbol} ${fmt(paid)}</span></div>
            ${paymentMethod === 'CASH' ? `<div class="receipt-row"><span>${t('pos_change')}:</span><span>${currencySymbol} ${fmt(change)}</span></div>` : ''}
            <div class="receipt-divider"></div>
            <div style="text-align:center"><small>Thank you for shopping! 🙏</small></div>
        </div>
    `);
    $('#receiptModal').modal('show');
}

function cancelOrder(){
    if(!cart.length) return;
    if(!confirm(t('msg_confirm_delete') + '?')) return;
    newSale();
    showToast(t('msg_order_cancelled'), 'info');
}

function holdOrder(){ showToast('Hold feature coming soon!', 'info'); }

function processReturn(){
    const n = $('#returnOrderNumber').val().trim(), r = $('#returnReason').val();
    if(!n){ showToast('Enter order number', 'warning'); return; }
    if(!r){ showToast('Select a reason', 'warning'); return; }
    showToast('Return processed', 'success');
    $('#returnModal').modal('hide');
}

function newSale(){
    cart = []; selectedCustomer = null; paymentMethod = 'CASH';
    renderCart(); recalc();
    $('#discountPercent').val(0); $('#amountReceived').val('');
    $('#changeAmount').text(currencySymbol + ' 0.00').css('color', '#28a745');
    clearCustomer();
    $('.pay-btn').removeClass('active'); $('[data-method="CASH"]').addClass('active');
    $('#cashSection').show();
    $('#productSearch').val('').focus();
}

// CUSTOMER
function openCustomerModal(){
    $.ajax({ url: CUSTOMERS_URL, method: 'GET',
        success(c){ allCustomers = (c || []).filter(x => x.active); renderCustomerList(allCustomers); $('#customerModal').modal('show'); },
        error(){ showToast(t('msg_error'), 'error'); }
    });
}

function renderCustomerList(list){
    const el = $('#customerList'); el.empty();
    if(!list || !list.length){
        el.html(`<div class="text-center text-muted p-3">${t('pos_cart_empty')}</div>`);
        return;
    }
    list.forEach(c => {
        const row = $(`<div class="cust-row"><strong>${c.name}</strong><small>${c.phone || 'No phone'} · ⭐ ${c.loyaltyPoints || 0} pts</small></div>`);
        row.on('click', () => { selectCustomer(c); $('#customerModal').modal('hide'); });
        el.append(row);
    });
}

function selectCustomer(c){
    selectedCustomer = c;
    $('#customerDisplay').html(`<div class="cust-name">${c.name}</div><div class="cust-detail">${c.phone || 'No phone'} · ⭐ ${c.loyaltyPoints || 0} pts</div>`);
    showToast(t('pos_customer') + ': ' + c.name, 'success');
}

function clearCustomer(){
    selectedCustomer = null;
    $('#customerDisplay').html(`<div class="cust-name">${t('pos_walkin')}</div><div class="cust-detail">—</div>`);
}

// UTILS
function fmt(n){ return (n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function playBeep(){
    try{
        const a = new AudioContext(); const o = a.createOscillator(); const g = a.createGain();
        o.connect(g); g.connect(a.destination); o.frequency.value = 880;
        g.gain.setValueAtTime(0.3, a.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.08);
        o.start(); o.stop(a.currentTime + 0.08);
    } catch(e){}
}

function showToast(msg, type = 'info'){
    const c = { success:'#27ae60', error:'#e74c3c', warning:'#f39c12', info:'#3498db' };
    const ic = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    const toast = $(`<div style="position:fixed;bottom:20px;right:20px;z-index:9999;background:${c[type]};color:white;padding:10px 18px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,.25);font-weight:600;font-size:14px;">${ic[type]} ${msg}</div>`);
    $('body').append(toast);
    setTimeout(() => toast.fadeOut(300, () => toast.remove()), 2500);
}