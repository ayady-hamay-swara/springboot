/**
 * LANGUAGE SYSTEM - Kurdish Default
 */

const translations = {
    ku: {
        // Common
        loading: 'چاوەڕوان بە...',
        save: 'پاشەکەوت',
        cancel: 'هەڵوەشاندنەوە',
        delete: 'سڕینەوە',
        edit: 'دەستکاری',
        add: 'زیادکردن',
        search: 'گەڕان',
        clear: 'پاککردنەوە',
        
        // Navigation
        nav_home: 'سەرەکی',
        nav_items: 'کاڵاکان',
        nav_employees: 'کارمەندان',
        nav_pos: 'فرۆشتن',
        nav_search: 'قەرزەکان',
        
        // Items
        items_title: 'بەڕێوەبردنی کاڵا',
        items_code: 'کۆدی کاڵا',
        items_name: 'ناوی کاڵا',
        items_category: 'جۆر',
        items_price: 'نرخ',
        items_stock: 'کۆگا',
        items_min_stock: 'کەمترین کۆگا',
        items_barcode: 'بارکۆد',
        items_notes: 'تێبینی',
        items_update: 'نوێکردنەوە',
        items_total: 'کۆی کاڵاکان',
        items_low_stock: 'کۆگای کەم',
        items_out_stock: 'کۆگا نییە',
        items_total_value: 'کۆی نرخ',
        
        // Settings
        settings_title: 'ڕێکخستنەکان',
        settings_store: 'ناوی فرۆشگا',
        settings_tax: 'ڕێژەی باج (%)',
        settings_auto_print: 'چاپی خۆکار',
        settings_sound: 'دەنگ لە زیادکردن',
        settings_cashier_name: 'ناوی بەکارهێنەر',
        settings_save: 'پاشەکەوت',
        
        // Calculator
        calc_title: 'ژمێرەر'
    },
    
    en: {
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        clear: 'Clear',
        
        nav_home: 'Home',
        nav_items: 'Items',
        nav_employees: 'Employees',
        nav_pos: 'POS',
        nav_search: 'Orders',
        
        items_title: 'Inventory Management',
        items_code: 'Item Code',
        items_name: 'Item Name',
        items_category: 'Category',
        items_price: 'Price',
        items_stock: 'Stock',
        items_min_stock: 'Min Stock',
        items_barcode: 'Barcode',
        items_notes: 'Notes',
        items_update: 'Update',
        items_total: 'Total Items',
        items_low_stock: 'Low Stock',
        items_out_stock: 'Out of Stock',
        items_total_value: 'Total Value',
        
        settings_title: 'Settings',
        settings_store: 'Store Name',
        settings_tax: 'Tax Rate (%)',
        settings_auto_print: 'Auto-print',
        settings_sound: 'Sound',
        settings_cashier_name: 'User Name',
        settings_save: 'Save',
        
        calc_title: 'Calculator'
    },
    
    ar: {
        loading: 'جاري التحميل...',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        add: 'إضافة',
        search: 'بحث',
        clear: 'مسح',
        
        nav_home: 'الرئيسية',
        nav_items: 'المنتجات',
        nav_employees: 'الموظفون',
        nav_pos: 'المبيعات',
        nav_search: 'الطلبات',
        
        items_title: 'إدارة المخزون',
        items_code: 'كود المنتج',
        items_name: 'اسم المنتج',
        items_category: 'الفئة',
        items_price: 'السعر',
        items_stock: 'المخزون',
        items_min_stock: 'الحد الأدنى',
        items_barcode: 'الباركود',
        items_notes: 'ملاحظات',
        items_update: 'تحديث',
        items_total: 'إجمالي المنتجات',
        items_low_stock: 'مخزون منخفض',
        items_out_stock: 'نفذ',
        items_total_value: 'القيمة الإجمالية',
        
        settings_title: 'الإعدادات',
        settings_store: 'اسم المتجر',
        settings_tax: 'معدل الضريبة (%)',
        settings_auto_print: 'طباعة تلقائية',
        settings_sound: 'صوت',
        settings_cashier_name: 'اسم المستخدم',
        settings_save: 'حفظ',
        
        calc_title: 'الآلة الحاسبة'
    }
};

// KURDISH IS DEFAULT
let currentLang = localStorage.getItem('posLang') || 'ku';

function t(key) {
    return translations[currentLang]?.[key] || translations['ku'][key] || key;
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('posLang', lang);
    document.documentElement.dir = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    translatePage();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.type === 'button' || el.type === 'submit') el.value = translation;
            else el.placeholder = translation;
        } else {
            el.textContent = translation;
        }
    });
}

// Auto-translate on load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('posLang') || 'ku';
    setLanguage(savedLang);
});
