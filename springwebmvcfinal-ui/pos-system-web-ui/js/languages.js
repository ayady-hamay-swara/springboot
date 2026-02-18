/**
 * POS SYSTEM - MULTI-LANGUAGE SUPPORT
 * English, Kurdish (Sorani), Arabic
 */

const translations = {
    en: {
        // Common
        loading: 'Loading...',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        clear: 'Clear',
        close: 'Close',
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
        
        // Navigation
        nav_home: 'Home',
        nav_customers: 'Customers',
        nav_items: 'Items',
        nav_categories: 'Categories',
        nav_employees: 'Employees',
        nav_pos: 'POS Checkout',
        nav_orders: 'Orders',
        nav_search: 'Search',
        
        // POS Checkout
        pos_title: 'POS Checkout',
        pos_today_sales: "Today's Sales",
        pos_transactions: 'Transactions',
        pos_cashier: 'Cashier',
        pos_search_placeholder: 'Search product by name or scan barcode...',
        pos_all_categories: 'All Categories',
        pos_cart_items: 'Cart Items',
        pos_cart_empty: 'Cart is empty',
        pos_cart_empty_msg: 'Search or scan a product to add it',
        pos_product: 'Product',
        pos_qty: 'Qty',
        pos_unit_price: 'Unit Price',
        pos_total: 'Total',
        pos_subtotal: 'Subtotal',
        pos_discount: 'Discount',
        pos_tax: 'Tax',
        pos_customer: 'Customer',
        pos_walkin: 'Walk-in Customer',
        pos_change_customer: 'Change',
        pos_payment_method: 'Payment Method',
        pos_cash: 'Cash',
        pos_card: 'Card',
        pos_transfer: 'Transfer',
        pos_amount_received: 'Amount Received',
        pos_change: 'Change',
        pos_complete_sale: 'Complete Sale',
        pos_hold: 'Hold',
        pos_return: 'Return',
        pos_clear_cart: 'Clear',
        pos_currency_converter: 'Currency Converter',
        pos_pos_total: 'POS Total',
        pos_convert: 'Convert',
        
        // Items
        items_title: 'Inventory Management',
        items_code: 'Item Code',
        items_name: 'Product Name',
        items_category: 'Category',
        items_price: 'Unit Price',
        items_stock: 'Stock Qty',
        items_min_stock: 'Min Stock',
        items_barcode: 'Barcode',
        items_notes: 'Notes',
        items_notes_placeholder: 'e.g., Size M, Color Red, Serial No., etc.',
        items_status: 'Status',
        items_active: 'Active',
        items_inactive: 'Inactive',
        items_save: 'Save Item',
        items_update: 'Update Item',
        items_delete: 'Delete Item',
        items_total: 'Total Items',
        items_low_stock: 'Low Stock',
        items_out_stock: 'Out of Stock',
        items_total_value: 'Total Value',
        
        // Customers
        customers_title: 'Customer Management',
        customers_id: 'Customer ID',
        customers_name: 'Customer Name',
        customers_phone: 'Phone Number',
        customers_email: 'Email',
        customers_address: 'Address',
        customers_loyalty: 'Loyalty Points',
        customers_save: 'Save Customer',
        customers_update: 'Update Customer',
        customers_delete: 'Delete Customer',
        customers_total: 'Total Customers',
        customers_active: 'Active Customers',
        customers_new: 'New This Month',
        
        // Categories
        categories_title: 'Category Management',
        categories_name: 'Category Name',
        categories_description: 'Description',
        categories_save: 'Save Category',
        categories_update: 'Update Category',
        categories_delete: 'Delete Category',
        
        // Employees
        employees_title: 'Employee Management',
        employees_id: 'Employee ID',
        employees_name: 'Full Name',
        employees_position: 'Position',
        employees_username: 'Username',
        employees_password: 'Password',
        employees_email: 'Email',
        employees_phone: 'Phone',
        employees_salary: 'Salary',
        employees_hire_date: 'Hire Date',
        employees_save: 'Save Employee',
        employees_update: 'Update Employee',
        employees_delete: 'Delete Employee',
        employees_total: 'Total Employees',
        employees_managers: 'Managers',
        employees_payroll: 'Monthly Payroll',
        
        // Settings
        settings_title: 'Settings',
        settings_store: 'Store Name',
        settings_currency: 'Default Currency',
        settings_tax: 'Tax Rate (%)',
        settings_auto_print: 'Auto-print Receipt',
        settings_sound: 'Sound on Add to Cart',
        settings_cashier_name: 'Cashier Name',
        settings_save: 'Save Settings',
        
        // Calculator
        calc_title: 'Calculator',
        calc_use: 'Use in Amount Received',
        
        // Messages
        msg_saved: 'saved successfully!',
        msg_updated: 'updated successfully!',
        msg_deleted: 'deleted successfully!',
        msg_error: 'Error occurred',
        msg_confirm_delete: 'Are you sure you want to delete',
        msg_cart_empty: 'Cart is empty!',
        msg_insufficient_amount: 'Amount received is less than total!',
        msg_sale_complete: 'Sale Complete!',
        msg_order_cancelled: 'Order cancelled',
        
        // Positions
        position_owner: 'Owner',
        position_manager: 'Manager',
        position_asst_manager: 'Assistant Manager',
        position_cashier: 'Cashier'
    },
    
    ku: {
        // Common (Kurdish Sorani - کوردی)
        loading: 'چاوەڕوان بە...',
        save: 'پاشەکەوت',
        cancel: 'هەڵوەشاندنەوە',
        delete: 'سڕینەوە',
        edit: 'دەستکاری',
        add: 'زیادکردن',
        search: 'گەڕان',
        clear: 'پاککردنەوە',
        close: 'داخستن',
        ok: 'باشە',
        yes: 'بەڵێ',
        no: 'نەخێر',
        
        // Navigation
        nav_home: 'سەرەکی',
        nav_customers: 'کڕیاران',
        nav_items: 'کاڵاکان',
        nav_categories: 'جۆرەکان',
        nav_employees: 'کارمەندان',
        nav_pos: 'فرۆشتن',
        nav_orders: 'وەسڵەکان',
        nav_search: 'گەڕان',
        
        // POS Checkout
        pos_title: 'سیستەمی فرۆشتن',
        pos_today_sales: 'فرۆشی ئەمڕۆ',
        pos_transactions: 'مامەڵەکان',
        pos_cashier: 'کاشێر',
        pos_search_placeholder: 'گەڕان بە ناوی کاڵا یان بارکۆد...',
        pos_all_categories: 'هەموو جۆرەکان',
        pos_cart_items: 'کاڵاکانی سەبەتە',
        pos_cart_empty: 'سەبەتە بەتاڵە',
        pos_cart_empty_msg: 'کاڵایەک بگەڕێ یان سکان بکە',
        pos_product: 'کاڵا',
        pos_qty: 'ژمارە',
        pos_unit_price: 'نرخی یەک',
        pos_total: 'کۆی گشتی',
        pos_subtotal: 'کۆی لاوەکی',
        pos_discount: 'داشکاندن',
        pos_tax: 'باج',
        pos_customer: 'کڕیار',
        pos_walkin: 'کڕیاری ڕێگەیی',
        pos_change_customer: 'گۆڕین',
        pos_payment_method: 'شێوازی پارەدان',
        pos_cash: 'کاش',
        pos_card: 'کارت',
        pos_transfer: 'گواستنەوە',
        pos_amount_received: 'بڕی وەرگیراو',
        pos_change: 'پارەی ماوە',
        pos_complete_sale: 'تەواوکردنی فرۆشتن',
        pos_hold: 'ڕاگرتن',
        pos_return: 'گەڕاندنەوە',
        pos_clear_cart: 'پاککردنەوە',
        pos_currency_converter: 'گۆڕەری دراو',
        pos_pos_total: 'کۆی گشتی',
        pos_convert: 'گۆڕین',
        
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
        items_notes_placeholder: 'نموونە: قەبارە M، ڕەنگ سوور، ژمارە زنجیرە، هتد',
        items_status: 'دۆخ',
        items_active: 'چالاک',
        items_inactive: 'ناچالاک',
        items_save: 'پاشەکەوتی کاڵا',
        items_update: 'نوێکردنەوەی کاڵا',
        items_delete: 'سڕینەوەی کاڵا',
        items_total: 'کۆی کاڵاکان',
        items_low_stock: 'کۆگای کەم',
        items_out_stock: 'کۆگا نییە',
        items_total_value: 'کۆی نرخ',
        
        // Customers
        customers_title: 'بەڕێوەبردنی کڕیاران',
        customers_id: 'کۆدی کڕیار',
        customers_name: 'ناوی کڕیار',
        customers_phone: 'ژمارە مۆبایل',
        customers_email: 'ئیمەیڵ',
        customers_address: 'ناونیشان',
        customers_loyalty: 'خاڵی دڵسۆزی',
        customers_save: 'پاشەکەوتی کڕیار',
        customers_update: 'نوێکردنەوەی کڕیار',
        customers_delete: 'سڕینەوەی کڕیار',
        customers_total: 'کۆی کڕیاران',
        customers_active: 'کڕیارانی چالاک',
        customers_new: 'نوێ ئەم مانگە',
        
        // Categories
        categories_title: 'بەڕێوەبردنی جۆرەکان',
        categories_name: 'ناوی جۆر',
        categories_description: 'پێناسە',
        categories_save: 'پاشەکەوت',
        categories_update: 'نوێکردنەوە',
        categories_delete: 'سڕینەوە',
        
        // Employees
        employees_title: 'بەڕێوەبردنی کارمەندان',
        employees_id: 'کۆدی کارمەند',
        employees_name: 'ناوی تەواو',
        employees_position: 'پێگە',
        employees_username: 'ناوی بەکارهێنەر',
        employees_password: 'وشەی نهێنی',
        employees_email: 'ئیمەیڵ',
        employees_phone: 'مۆبایل',
        employees_salary: 'مووچە',
        employees_hire_date: 'بەرواری دەستپێکردن',
        employees_save: 'پاشەکەوت',
        employees_update: 'نوێکردنەوە',
        employees_delete: 'سڕینەوە',
        employees_total: 'کۆی کارمەندان',
        employees_managers: 'بەڕێوەبەران',
        employees_payroll: 'مووچەی مانگانە',
        
        // Settings
        settings_title: 'ڕێکخستنەکان',
        settings_store: 'ناوی فرۆشگا',
        settings_currency: 'دراوی سەرەکی',
        settings_tax: 'ڕێژەی باج (%)',
        settings_auto_print: 'چاپی خۆکار',
        settings_sound: 'دەنگ لە زیادکردن',
        settings_cashier_name: 'ناوی کاشێر',
        settings_save: 'پاشەکەوتی ڕێکخستنەکان',
        
        // Calculator
        calc_title: 'ژمێرەر',
        calc_use: 'بەکارهێنان لە بڕی وەرگیراو',
        
        // Messages
        msg_saved: 'بە سەرکەوتوویی پاشەکەوت کرا!',
        msg_updated: 'بە سەرکەوتوویی نوێ کرایەوە!',
        msg_deleted: 'بە سەرکەوتوویی سڕایەوە!',
        msg_error: 'هەڵەیەک ڕوویدا',
        msg_confirm_delete: 'دڵنیایت لە سڕینەوەی',
        msg_cart_empty: 'سەبەتە بەتاڵە!',
        msg_insufficient_amount: 'بڕی وەرگیراو کەمترە لە کۆی گشتی!',
        msg_sale_complete: 'فرۆشتن تەواو بوو!',
        msg_order_cancelled: 'وەسڵ هەڵوەشێنرایەوە',
        
        // Positions
        position_owner: 'خاوەن',
        position_manager: 'بەڕێوەبەر',
        position_asst_manager: 'یاریدەدەری بەڕێوەبەر',
        position_cashier: 'کاشێر'
    },
    
    ar: {
        // Common (Arabic - العربية)
        loading: 'جاري التحميل...',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        add: 'إضافة',
        search: 'بحث',
        clear: 'مسح',
        close: 'إغلاق',
        ok: 'موافق',
        yes: 'نعم',
        no: 'لا',
        
        // Navigation
        nav_home: 'الرئيسية',
        nav_customers: 'العملاء',
        nav_items: 'المنتجات',
        nav_categories: 'الفئات',
        nav_employees: 'الموظفون',
        nav_pos: 'نقطة البيع',
        nav_orders: 'الطلبات',
        nav_search: 'بحث',
        
        // POS Checkout
        pos_title: 'نقطة البيع',
        pos_today_sales: 'مبيعات اليوم',
        pos_transactions: 'المعاملات',
        pos_cashier: 'الكاشير',
        pos_search_placeholder: 'ابحث عن منتج بالاسم أو الباركود...',
        pos_all_categories: 'جميع الفئات',
        pos_cart_items: 'عناصر السلة',
        pos_cart_empty: 'السلة فارغة',
        pos_cart_empty_msg: 'ابحث عن منتج أو امسحه ضوئيًا',
        pos_product: 'المنتج',
        pos_qty: 'الكمية',
        pos_unit_price: 'سعر الوحدة',
        pos_total: 'الإجمالي',
        pos_subtotal: 'المجموع الفرعي',
        pos_discount: 'الخصم',
        pos_tax: 'الضريبة',
        pos_customer: 'العميل',
        pos_walkin: 'عميل عابر',
        pos_change_customer: 'تغيير',
        pos_payment_method: 'طريقة الدفع',
        pos_cash: 'نقدي',
        pos_card: 'بطاقة',
        pos_transfer: 'تحويل',
        pos_amount_received: 'المبلغ المستلم',
        pos_change: 'الباقي',
        pos_complete_sale: 'إتمام البيع',
        pos_hold: 'تعليق',
        pos_return: 'إرجاع',
        pos_clear_cart: 'مسح',
        pos_currency_converter: 'محول العملات',
        pos_pos_total: 'إجمالي نقطة البيع',
        pos_convert: 'تحويل',
        
        // Items
        items_title: 'إدارة المخزون',
        items_code: 'كود المنتج',
        items_name: 'اسم المنتج',
        items_category: 'الفئة',
        items_price: 'السعر',
        items_stock: 'المخزون',
        items_min_stock: 'الحد الأدنى',
        items_barcode: 'الباركود',
        items_notes: 'ملاحظات',
        items_notes_placeholder: 'مثال: مقاس M، لون أحمر، الرقم التسلسلي، إلخ',
        items_status: 'الحالة',
        items_active: 'نشط',
        items_inactive: 'غير نشط',
        items_save: 'حفظ المنتج',
        items_update: 'تحديث المنتج',
        items_delete: 'حذف المنتج',
        items_total: 'إجمالي المنتجات',
        items_low_stock: 'مخزون منخفض',
        items_out_stock: 'نفذ من المخزون',
        items_total_value: 'القيمة الإجمالية',
        
        // Customers
        customers_title: 'إدارة العملاء',
        customers_id: 'رقم العميل',
        customers_name: 'اسم العميل',
        customers_phone: 'رقم الهاتف',
        customers_email: 'البريد الإلكتروني',
        customers_address: 'العنوان',
        customers_loyalty: 'نقاط الولاء',
        customers_save: 'حفظ العميل',
        customers_update: 'تحديث العميل',
        customers_delete: 'حذف العميل',
        customers_total: 'إجمالي العملاء',
        customers_active: 'العملاء النشطون',
        customers_new: 'جديد هذا الشهر',
        
        // Categories
        categories_title: 'إدارة الفئات',
        categories_name: 'اسم الفئة',
        categories_description: 'الوصف',
        categories_save: 'حفظ',
        categories_update: 'تحديث',
        categories_delete: 'حذف',
        
        // Employees
        employees_title: 'إدارة الموظفين',
        employees_id: 'رقم الموظف',
        employees_name: 'الاسم الكامل',
        employees_position: 'المنصب',
        employees_username: 'اسم المستخدم',
        employees_password: 'كلمة المرور',
        employees_email: 'البريد الإلكتروني',
        employees_phone: 'الهاتف',
        employees_salary: 'الراتب',
        employees_hire_date: 'تاريخ التوظيف',
        employees_save: 'حفظ',
        employees_update: 'تحديث',
        employees_delete: 'حذف',
        employees_total: 'إجمالي الموظفين',
        employees_managers: 'المديرون',
        employees_payroll: 'الرواتب الشهرية',
        
        // Settings
        settings_title: 'الإعدادات',
        settings_store: 'اسم المتجر',
        settings_currency: 'العملة الافتراضية',
        settings_tax: 'معدل الضريبة (%)',
        settings_auto_print: 'طباعة تلقائية للإيصال',
        settings_sound: 'صوت عند الإضافة',
        settings_cashier_name: 'اسم الكاشير',
        settings_save: 'حفظ الإعدادات',
        
        // Calculator
        calc_title: 'الآلة الحاسبة',
        calc_use: 'استخدام في المبلغ المستلم',
        
        // Messages
        msg_saved: 'تم الحفظ بنجاح!',
        msg_updated: 'تم التحديث بنجاح!',
        msg_deleted: 'تم الحذف بنجاح!',
        msg_error: 'حدث خطأ',
        msg_confirm_delete: 'هل أنت متأكد من الحذف',
        msg_cart_empty: 'السلة فارغة!',
        msg_insufficient_amount: 'المبلغ المستلم أقل من الإجمالي!',
        msg_sale_complete: 'اكتمل البيع!',
        msg_order_cancelled: 'تم إلغاء الطلب',
        
        // Positions
        position_owner: 'المالك',
        position_manager: 'المدير',
        position_asst_manager: 'مساعد المدير',
        position_cashier: 'كاشير'
    }
};

// Current language (default: English)
let currentLang = localStorage.getItem('posLang') || 'en';

// Get translation
function t(key) {
    return translations[currentLang]?.[key] || translations['en'][key] || key;
}

// Change language
function setLanguage(lang) {
    if (!translations[lang]) {
        console.error('Language not supported:', lang);
        return;
    }
    
    currentLang = lang;
    localStorage.setItem('posLang', lang);
    
    // Update page direction for RTL languages
    document.documentElement.dir = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Translate all elements with data-i18n attribute
    translatePage();
    
    // Dispatch event for dynamic content
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Translate all elements on page
function translatePage() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        
        // Handle different element types
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.type === 'button' || el.type === 'submit') {
                el.value = translation;
            } else {
                el.placeholder = translation;
            }
        } else {
            el.textContent = translation;
        }
    });
}

// Auto-translate on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('posLang');
    if (savedLang && translations[savedLang]) {
        setLanguage(savedLang);
    } else {
        translatePage();
    }
});
