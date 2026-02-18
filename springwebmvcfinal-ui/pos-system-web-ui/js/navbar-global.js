/**
 * GLOBAL NAVBAR JAVASCRIPT
 * Handles: Settings popup, Calculator, Active page highlighting
 * Pure JS - no jQuery required
 */

(function() {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // INIT
    // ═══════════════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', function() {
        initNavbar();
        initSettings();
        initCalculator();
        highlightActivePage();
        updateUsernameDisplay();
    });

    // ═══════════════════════════════════════════════════════════
    // NAVBAR INIT
    // ═══════════════════════════════════════════════════════════
    function initNavbar() {
        // Settings button
        const btnSettings = document.getElementById('btnGlobalSettings');
        if (btnSettings) {
            btnSettings.addEventListener('click', function() {
                togglePopup('globalSettingsPanel', 'btnGlobalSettings');
            });
        }

        // Calculator button
        const btnCalc = document.getElementById('btnGlobalCalc');
        if (btnCalc) {
            btnCalc.addEventListener('click', function() {
                togglePopup('globalCalcPanel', 'btnGlobalCalc');
            });
        }

        // Close buttons
        const settingsClose = document.getElementById('settingsCloseBtn');
        if (settingsClose) {
            settingsClose.addEventListener('click', closeAllPopups);
        }

        const calcClose = document.getElementById('calcCloseBtn');
        if (calcClose) {
            calcClose.addEventListener('click', closeAllPopups);
        }

        // Backdrop click
        const backdrop = document.getElementById('globalBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', closeAllPopups);
        }

        // Update language label
        updateLanguageLabel();
        window.addEventListener('languageChanged', updateLanguageLabel);
    }

    function togglePopup(popupId, btnId) {
        const popup = document.getElementById(popupId);
        const btn = document.getElementById(btnId);
        const backdrop = document.getElementById('globalBackdrop');

        if (!popup) return;

        const isOpen = popup.classList.contains('show');

        // Close all first
        closeAllPopups();

        // If wasn't open, open it
        if (!isOpen) {
            popup.classList.add('show');
            backdrop.classList.add('show');
            if (btn) btn.classList.add('active');
        }
    }

    function closeAllPopups() {
        const popups = document.querySelectorAll('.global-popup');
        popups.forEach(p => p.classList.remove('show'));

        const backdrop = document.getElementById('globalBackdrop');
        if (backdrop) backdrop.classList.remove('show');

        const btns = document.querySelectorAll('.nav-icon-btn');
        btns.forEach(b => b.classList.remove('active'));
    }

    // ═══════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════
    function initSettings() {
        loadSettings();

        // Toggle switches
        const autoPrint = document.getElementById('globalAutoPrint');
        const sound = document.getElementById('globalSound');

        if (autoPrint) {
            autoPrint.addEventListener('change', function() {
                const label = this.parentElement.querySelector('.toggle-text');
                if (label) label.textContent = this.checked ? 'On' : 'Off';
            });
            autoPrint.dispatchEvent(new Event('change'));
        }

        if (sound) {
            sound.addEventListener('change', function() {
                const label = this.parentElement.querySelector('.toggle-text');
                if (label) label.textContent = this.checked ? 'On' : 'Off';
            });
            sound.dispatchEvent(new Event('change'));
        }

        // Save button
        const saveBtn = document.getElementById('btnGlobalSaveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveSettings);
        }
    }

    function loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('posSettings') || '{}');
            
            const storeName = document.getElementById('globalStoreName');
            const currency = document.getElementById('globalCurrency');
            const taxRate = document.getElementById('globalTaxRate');
            const autoPrint = document.getElementById('globalAutoPrint');
            const sound = document.getElementById('globalSound');
            const cashierName = document.getElementById('globalCashierName');

            if (storeName) storeName.value = settings.storeName || '';
            if (currency) currency.value = settings.currency || 'Rs.';
            if (taxRate) taxRate.value = settings.taxRate || 0;
            if (autoPrint) autoPrint.checked = !!settings.autoPrint;
            if (sound) sound.checked = settings.sound !== false;
            if (cashierName) cashierName.value = settings.cashier || '';
        } catch (e) {
            console.error('Error loading settings:', e);
        }
    }

    function saveSettings() {
        const storeName = document.getElementById('globalStoreName');
        const currency = document.getElementById('globalCurrency');
        const taxRate = document.getElementById('globalTaxRate');
        const autoPrint = document.getElementById('globalAutoPrint');
        const sound = document.getElementById('globalSound');
        const cashierName = document.getElementById('globalCashierName');

        const settings = {
            storeName: storeName ? storeName.value.trim() : 'POS System',
            currency: currency ? currency.value : 'Rs.',
            taxRate: taxRate ? parseFloat(taxRate.value) || 0 : 0,
            autoPrint: autoPrint ? autoPrint.checked : false,
            sound: sound ? sound.checked : true,
            cashier: cashierName ? cashierName.value.trim() : 'Admin'
        };

        localStorage.setItem('posSettings', JSON.stringify(settings));
        
        // Update username display
        updateUsernameDisplay();
        
        // Close popup
        closeAllPopups();
        
        // Show success message
        showToast('Settings saved successfully!', 'success');

        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('settingsSaved', { detail: settings }));
    }

    // ═══════════════════════════════════════════════════════════
    // CALCULATOR (Pure JS)
    // ═══════════════════════════════════════════════════════════
    const calc = {
        display: '0',
        firstOperand: null,
        operator: null,
        waitingForSecond: false,
        expression: ''
    };

    function initCalculator() {
        const buttons = document.querySelectorAll('.cb');
        buttons.forEach(btn => {
            btn.addEventListener('click', function() {
                const num = this.dataset.num;
                const op = this.dataset.op;
                const action = this.dataset.action;

                if (num !== undefined) calcInputNumber(String(num));
                if (op) calcInputOperator(op);
                if (action === 'clear') calcClear();
                if (action === 'sign') calcSign();
                if (action === 'percent') calcPercent();
                if (action === 'equals') calcEquals();
            });
        });

        calcRender();
    }

    function calcInputNumber(n) {
        if (calc.waitingForSecond) {
            calc.display = n === '.' ? '0.' : n;
            calc.waitingForSecond = false;
        } else {
            if (n === '.' && calc.display.includes('.')) return;
            if (calc.display === '0' && n !== '.') calc.display = n;
            else calc.display = calc.display + n;
        }
        calcRender();
    }

    function calcInputOperator(op) {
        const current = parseFloat(calc.display);
        if (calc.operator && !calc.waitingForSecond) {
            const result = calcCompute(calc.firstOperand, current, calc.operator);
            calc.display = calcFormat(result);
            calc.firstOperand = result;
            calc.expression = calcFormat(result) + ' ' + op;
        } else {
            calc.firstOperand = current;
            calc.expression = calcFormat(current) + ' ' + op;
        }
        calc.operator = op;
        calc.waitingForSecond = true;
        calcRender();
    }

    function calcEquals() {
        if (calc.operator === null || calc.waitingForSecond) return;
        const second = parseFloat(calc.display);
        calc.expression = calc.expression + ' ' + calcFormat(second) + ' =';
        const result = calcCompute(calc.firstOperand, second, calc.operator);
        calc.display = calcFormat(result);
        calc.operator = null;
        calc.firstOperand = null;
        calc.waitingForSecond = false;
        calcRender();
    }

    function calcCompute(a, b, op) {
        switch (op) {
            case '+': return a + b;
            case '−': return a - b;
            case '×': return a * b;
            case '÷': return b === 0 ? 0 : a / b;
            default: return b;
        }
    }

    function calcClear() {
        calc.display = '0';
        calc.firstOperand = null;
        calc.operator = null;
        calc.waitingForSecond = false;
        calc.expression = '';
        calcRender();
    }

    function calcSign() {
        calc.display = calcFormat(parseFloat(calc.display) * -1);
        calcRender();
    }

    function calcPercent() {
        calc.display = calcFormat(parseFloat(calc.display) / 100);
        calcRender();
    }

    function calcFormat(n) {
        if (isNaN(n) || !isFinite(n)) return '0';
        const rounded = Math.round(n * 1e10) / 1e10;
        return String(rounded);
    }

    function calcRender() {
        const expr = document.getElementById('globalCalcExpr');
        const result = document.getElementById('globalCalcResult');
        if (expr) expr.textContent = calc.expression || '\u00a0';
        if (result) result.textContent = calc.display;
    }

    // ═══════════════════════════════════════════════════════════
    // HIGHLIGHT ACTIVE PAGE
    // ═══════════════════════════════════════════════════════════
    function highlightActivePage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('.global-navbar .nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            const parentLi = link.closest('.nav-item');
            
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                if (parentLi) parentLi.classList.add('active');
            } else {
                if (parentLi) parentLi.classList.remove('active');
            }
        });
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE USERNAME
    // ═══════════════════════════════════════════════════════════
    function updateUsernameDisplay() {
        try {
            const settings = JSON.parse(localStorage.getItem('posSettings') || '{}');
            const username = settings.cashier || 'Admin';
            
            const usernameEl = document.getElementById('navbarUsername');
            if (usernameEl) usernameEl.textContent = username;
        } catch (e) {
            console.error('Error updating username:', e);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE LANGUAGE LABEL
    // ═══════════════════════════════════════════════════════════
    function updateLanguageLabel() {
        const lang = localStorage.getItem('posLang') || 'en';
        const labels = { en: 'English', ku: 'کوردی', ar: 'العربية' };
        
        const label = document.getElementById('currentLangLabel');
        if (label) label.textContent = labels[lang] || 'English';
    }

    // ═══════════════════════════════════════════════════════════
    // TOAST NOTIFICATION
    // ═══════════════════════════════════════════════════════════
    function showToast(message, type = 'info') {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,.25);
            font-weight: 600;
            font-size: 14px;
        `;
        toast.textContent = `${icons[type]} ${message}`;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.transition = 'opacity .3s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Make functions globally available
    window.showToast = showToast;

})();
