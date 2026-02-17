/**
 * POS CHECKOUT CONTROLLER
 * Layout matches sketch: LEFT (stats+search+cart+totals) | RIGHT (customer+payment+buttons)
 */

const ITEMS_URL     = "http://localhost:8080/api/items";
const ORDERS_URL    = "http://localhost:8080/api/orders";
const CUSTOMERS_URL = "http://localhost:8080/api/customers";
const CATEGORIES_URL= "http://localhost:8080/api/categories";

let allProducts = [], allCustomers = [];
let cart = [];
let selectedCustomer = null;
let paymentMethod = "CASH";

// ── INIT ──
$(document).ready(function(){
    loadCategories();
    loadProducts();
    setupListeners();

    $('#cashierName').text(localStorage.getItem('userName') || 'Admin');
    const s = parseFloat(localStorage.getItem('todaySales')||0);
    const t = parseInt(localStorage.getItem('todayOrders')||0);
    $('#todaySales').text('Rs. ' + fmt(s));
    $('#todayTransactions').text(t);
});

// ── SETUP LISTENERS ──
function setupListeners(){
    // Search — show dropdown results
    $('#productSearch').on('input', function(){
        const q = $(this).val().trim();
        if(q.length < 1){ $('#productResults').hide(); return; }
        filterAndShowResults(q, $('#categoryFilter').val());
    });

    $('#productSearch').on('keydown', function(e){
        if(e.key === 'Escape'){ $('#productResults').hide(); $(this).val(''); }
    });

    $('#categoryFilter').on('change', function(){
        const q = $('#productSearch').val().trim();
        if(q) filterAndShowResults(q, $(this).val());
    });

    // Close dropdown when clicking outside
    $(document).on('click', function(e){
        if(!$(e.target).closest('.search-wrap').length){
            $('#productResults').hide();
        }
    });

    // Discount
    $('#discountPercent').on('input', recalc);

    // Payment methods
    $('.pay-btn').on('click', function(){
        $('.pay-btn').removeClass('active');
        $(this).addClass('active');
        paymentMethod = $(this).data('method');
        $('#cashSection').toggle(paymentMethod === 'CASH');
    });

    // Amount received → change
    $('#amountReceived').on('input', calcChange);

    // Buttons
    $('#btnCompleteSale').on('click', completeSale);
    $('#btnCancel').on('click', cancelOrder);
    $('#btnHold').on('click', holdOrder);
    $('#btnReturn').on('click', ()=> $('#returnModal').modal('show'));
    $('#btnClearCart').on('click', clearCart);
    $('#btnSelectCustomer').on('click', openCustomerModal);
    $('#btnNewSale').on('click', newSale);
    $('#btnWalkin').on('click', clearCustomer);

    // Customer search
    $('#customerSearch').on('input', function(){
        const q = $(this).val().toLowerCase();
        renderCustomerList(allCustomers.filter(c =>
            c.name.toLowerCase().includes(q) || (c.phone||'').includes(q)
        ));
    });

    // Return
    $('#btnProcessReturn').on('click', processReturn);
}

// ── LOAD DATA ──
function loadCategories(){
    $.ajax({ url: CATEGORIES_URL, method:'GET',
        success(cats){
            const sel = $('#categoryFilter');
            sel.find('option:not(:first)').remove();
            (cats||[]).filter(c=>c.active).forEach(c=>{
                sel.append(`<option value="${c.name}">${c.name}</option>`);
            });
        },
        error(){ ['General','Electronics','Accessories','Clothing','Food & Beverage','Furniture']
            .forEach(c=>$('#categoryFilter').append(`<option value="${c}">${c}</option>`));
        }
    });
}

function loadProducts(){
    $.ajax({ url: ITEMS_URL, method:'GET',
        success(items){
            allProducts = (items||[]).filter(i=>i.active);
        },
        error(){ showToast('Error loading products','error'); }
    });
}

// ── SEARCH RESULTS DROPDOWN ──
function filterAndShowResults(q, cat){
    let res = allProducts;
    if(q) res = res.filter(p =>
        p.description.toLowerCase().includes(q.toLowerCase()) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q))
    );
    if(cat) res = res.filter(p => p.category === cat);

    const box = $('#productResults');
    box.empty();

    if(res.length === 0){
        box.html('<div style="padding:12px;color:#999;text-align:center;">No products found</div>');
        box.show(); return;
    }

    res.slice(0,10).forEach(p => {
        const qty = p.qtyOnHand || 0;
        const min = p.minStockLevel || 10;
        const isOut = qty === 0;
        const isLow = !isOut && qty <= min;

        let stockHtml = `<span class="prod-result-stock-ok">✅ ${qty} in stock</span>`;
        if(isOut)  stockHtml = `<span class="prod-result-stock-out">❌ Out of stock</span>`;
        else if(isLow) stockHtml = `<span class="prod-result-stock-low">⚠️ Only ${qty} left</span>`;

        const row = $(`
            <div class="prod-result-row ${isOut?'prod-result-stock-out':''}">
                <div>
                    <div class="prod-result-name">${p.description}</div>
                    <div class="prod-result-meta">${p.code}${p.category?' · '+p.category:''} &nbsp; ${stockHtml}</div>
                </div>
                <div class="prod-result-price">Rs. ${fmt(p.unitPrice)}</div>
            </div>
        `);

        if(!isOut){
            row.on('click', function(){
                addToCart(p);
                $('#productSearch').val('');
                $('#productResults').hide();
            });
        }
        box.append(row);
    });

    box.show();
}

// ── CART ──
function addToCart(p){
    const ex = cart.find(c => c.code === p.code);
    if(ex){
        if(ex.qty >= p.qtyOnHand){ showToast(`Max stock: ${p.qtyOnHand}`, 'warning'); return; }
        ex.qty++;
    } else {
        cart.push({ code:p.code, name:p.description, price:p.unitPrice,
                    qty:1, maxQty:p.qtyOnHand, notes:p.notes||null });
    }
    renderCart();
    recalc();
    showToast(`${p.description} added`, 'success');
}

function updateQty(code, delta){
    const item = cart.find(c => c.code === code);
    if(!item) return;
    item.qty += delta;
    if(item.qty <= 0)      cart = cart.filter(c => c.code !== code);
    else if(item.qty > item.maxQty){ item.qty = item.maxQty; showToast('Max stock reached','warning'); }
    renderCart(); recalc();
}

function removeItem(code){ cart = cart.filter(c=>c.code!==code); renderCart(); recalc(); }

function clearCart(){
    if(cart.length===0) return;
    if(!confirm('Clear all cart items?')) return;
    cart=[];
    renderCart(); recalc();
}

function renderCart(){
    const body = $('#cartItems');
    body.empty();

    const totalQty = cart.reduce((s,c)=>s+c.qty,0);
    $('#cartCount').text(totalQty + (totalQty===1?' item':' items'));

    if(cart.length===0){
        body.html(`<div class="cart-empty">
            <div style="font-size:48px;">🛒</div>
            <p>Cart is empty</p>
            <small>Search or scan a product to add it</small>
        </div>`);
        return;
    }

    cart.forEach(item => {
        const row = $(`
            <div class="cart-row">
                <div>
                    <div class="col-name">${item.name}</div>
                    ${item.notes?`<div class="col-note">📝 ${item.notes}</div>`:''}
                </div>
                <div class="col-qty">
                    <div class="qty-ctrl">
                        <button class="q-btn minus" data-code="${item.code}" data-delta="-1">−</button>
                        <span class="q-num">${item.qty}</span>
                        <button class="q-btn plus" data-code="${item.code}" data-delta="1">+</button>
                    </div>
                </div>
                <div class="col-price">Rs. ${fmt(item.price)}</div>
                <div class="col-total">Rs. ${fmt(item.price * item.qty)}</div>
                <div class="col-action">
                    <button class="rm-btn" data-code="${item.code}">✕</button>
                </div>
            </div>
        `);
        row.find('.q-btn').on('click', function(e){
            e.stopPropagation();
            updateQty($(this).data('code'), $(this).data('delta'));
        });
        row.find('.rm-btn').on('click', function(e){
            e.stopPropagation();
            removeItem($(this).data('code'));
        });
        body.append(row);
    });
}

// ── TOTALS ──
function recalc(){
    const sub  = cart.reduce((s,c)=>s+(c.price*c.qty),0);
    const disc = sub * ((parseFloat($('#discountPercent').val())||0)/100);
    const total= sub - disc;

    $('#subtotal').text('Rs. '+fmt(sub));
    $('#discountAmount').text('- Rs. '+fmt(disc));
    $('#totalAmount').text('Rs. '+fmt(total));

    calcChange();
}

function calcChange(){
    const total    = parseFloat($('#totalAmount').text().replace(/[^0-9.]/g,''))||0;
    const received = parseFloat($('#amountReceived').val())||0;
    const change   = received - total;
    $('#changeAmount').text('Rs. '+fmt(Math.max(0,change)));
    $('#changeAmount').css('color', change>=0 ? '#28a745':'#dc3545');
}

// ── COMPLETE SALE ──
function completeSale(){
    if(cart.length===0){ showToast('Cart is empty!','warning'); return; }

    if(paymentMethod==='CASH'){
        const total    = parseFloat($('#totalAmount').text().replace(/[^0-9.]/g,''))||0;
        const received = parseFloat($('#amountReceived').val())||0;
        if(received < total){ showToast('Amount received is less than total!','warning'); return; }
    }

    const sub    = cart.reduce((s,c)=>s+(c.price*c.qty),0);
    const discPc = parseFloat($('#discountPercent').val())||0;
    const disc   = sub*(discPc/100);
    const total  = sub-disc;
    const paid   = parseFloat($('#amountReceived').val())||total;
    const change = Math.max(0, paid-total);

    const order = {
        customerId:   selectedCustomer ? selectedCustomer.id : null,
        status:       'COMPLETED',
        discount:     disc, discountType:'PERCENTAGE',
        tax:0, subtotal:sub, totalAmount:total,
        amountPaid:paid, changeAmount:change,
        paymentMethod:paymentMethod, paymentStatus:'PAID',
        processedBy: localStorage.getItem('userId')||null,
        orderDetails: cart.map(c=>({
            itemCode:c.code, quantity:c.qty, unitPrice:c.price,
            discount:0, tax:0, subtotal:c.price*c.qty, total:c.price*c.qty
        }))
    };

    $('#btnCompleteSale').prop('disabled',true).text('⏳ Processing...');

    $.ajax({ url:ORDERS_URL, method:'POST', contentType:'application/json',
        data: JSON.stringify(order),
        success(res){
            const ps = parseFloat(localStorage.getItem('todaySales')||0);
            const po = parseInt(localStorage.getItem('todayOrders')||0);
            localStorage.setItem('todaySales', ps+total);
            localStorage.setItem('todayOrders', po+1);
            $('#todaySales').text('Rs. '+fmt(ps+total));
            $('#todayTransactions').text(po+1);

            showReceipt(res, change, paid);
            $('#btnCompleteSale').prop('disabled',false).text('✅ Complete Sale');
        },
        error(err){
            console.error(err);
            showToast('Error completing sale','error');
            $('#btnCompleteSale').prop('disabled',false).text('✅ Complete Sale');
        }
    });
}

function showReceipt(order, change, paid){
    const now = new Date().toLocaleString();
    let rows = cart.map(i =>
        `<div class="receipt-row"><span>${i.name} x${i.qty}</span><span>Rs. ${fmt(i.price*i.qty)}</span></div>`
    ).join('');
    const discPc = parseFloat($('#discountPercent').val())||0;

    $('#receiptContent').html(`
        <div class="receipt-body">
            <div class="receipt-header">
                <strong>🏪 POS SYSTEM</strong><br>
                <small>${now}</small><br>
                <small>Order #: ${order.orderNumber||'N/A'}</small>
            </div>
            <div class="receipt-divider"></div>
            ${rows}
            <div class="receipt-divider"></div>
            <div class="receipt-row"><span>Subtotal:</span><span>${$('#subtotal').text()}</span></div>
            ${discPc>0?`<div class="receipt-row"><span>Discount (${discPc}%):</span><span>${$('#discountAmount').text()}</span></div>`:''}
            <div class="receipt-row receipt-total"><span>TOTAL:</span><span>${$('#totalAmount').text()}</span></div>
            <div class="receipt-row"><span>Paid (${paymentMethod}):</span><span>Rs. ${fmt(paid)}</span></div>
            ${paymentMethod==='CASH'?`<div class="receipt-row"><span>Change:</span><span>Rs. ${fmt(change)}</span></div>`:''}
            <div class="receipt-divider"></div>
            <div style="text-align:center"><small>Thank you! 🙏</small></div>
        </div>
    `);
    $('#receiptModal').modal('show');
}

// ── OTHER BUTTONS ──
function cancelOrder(){
    if(cart.length===0) return;
    if(!confirm('Cancel this order?')) return;
    newSale();
    showToast('Order cancelled','info');
}

function holdOrder(){
    showToast('Hold feature coming soon!','info');
}

function processReturn(){
    const orderNo = $('#returnOrderNumber').val().trim();
    const reason  = $('#returnReason').val();
    if(!orderNo){ showToast('Please enter order number','warning'); return; }
    if(!reason)  { showToast('Please select a reason','warning'); return; }
    showToast('Return processed (connect to API)','success');
    $('#returnModal').modal('hide');
}

function newSale(){
    cart=[]; selectedCustomer=null; paymentMethod='CASH';
    renderCart(); recalc();
    $('#discountPercent').val(0);
    $('#amountReceived').val('');
    $('#changeAmount').text('Rs. 0.00').css('color','#28a745');
    clearCustomer();
    $('.pay-btn').removeClass('active');
    $('[data-method="CASH"]').addClass('active');
    $('#cashSection').show();
    $('#productSearch').val('').focus();
}

// ── CUSTOMER ──
function openCustomerModal(){
    $.ajax({ url:CUSTOMERS_URL, method:'GET',
        success(c){ allCustomers=(c||[]).filter(x=>x.active); renderCustomerList(allCustomers); $('#customerModal').modal('show'); },
        error(){ showToast('Error loading customers','error'); }
    });
}

function renderCustomerList(list){
    const el = $('#customerList');
    el.empty();
    if(!list||!list.length){ el.html('<div class="text-center text-muted p-3">No customers found</div>'); return; }
    list.forEach(c=>{
        const row=$(`<div class="cust-row"><strong>${c.name}</strong><small>${c.phone||'No phone'} · ⭐ ${c.loyaltyPoints||0} pts</small></div>`);
        row.on('click',()=>{ selectCustomer(c); $('#customerModal').modal('hide'); });
        el.append(row);
    });
}

function selectCustomer(c){
    selectedCustomer=c;
    $('#customerDisplay').html(`<div class="cust-name">${c.name}</div><div class="cust-detail">${c.phone||'No phone'} · ⭐ ${c.loyaltyPoints||0} pts</div>`);
    showToast(`Customer: ${c.name}`,'success');
}

function clearCustomer(){
    selectedCustomer=null;
    $('#customerDisplay').html('<div class="cust-name">Walk-in Customer</div><div class="cust-detail">—</div>');
}

// ── UTILS ──
function fmt(n){ return (n||0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','); }

function showToast(msg, type='info'){
    const c={success:'#27ae60',error:'#e74c3c',warning:'#f39c12',info:'#3498db'};
    const ic={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    const t=$(`<div style="position:fixed;bottom:20px;right:20px;z-index:9999;background:${c[type]};color:white;padding:10px 18px;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,.25);font-weight:600;font-size:14px;">${ic[type]} ${msg}</div>`);
    $('body').append(t);
    setTimeout(()=>t.fadeOut(300,()=>t.remove()),2500);
}