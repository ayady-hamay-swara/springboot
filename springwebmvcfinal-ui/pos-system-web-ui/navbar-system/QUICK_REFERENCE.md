# 🚀 Quick Reference Card

## 📁 Files to Add:
```
css/navbar-global.css
js/navbar-global.js
```

## 🔧 Every HTML File Needs:

### 1. In `<head>`:
```html
<link rel="stylesheet" href="css/navbar-global.css">
```

### 2. After `<body>`:
```html
<!-- Copy entire navbar block from navbar.html -->
<nav class="navbar...">...</nav>
<div class="global-popup" id="globalSettingsPanel">...</div>
<div class="global-popup" id="globalCalcPanel">...</div>
<div class="global-popup-backdrop" id="globalBackdrop"></div>
```

### 3. Before `</body>`:
```html
<script src="js/navbar-global.js"></script>
```

## ⚡ Features:
- ⚙️ Settings: All pages
- 🧮 Calculator: All pages
- 🌐 Languages: Dropdown
- 👤 Username: Auto-display
- ✨ Active page: Auto-highlight

## 🧹 Clean Up:
Remove from page-specific CSS/JS:
- Navbar styles
- Calculator code
- Settings code
- Popup styles

## ✅ Test:
- Click ⚙️ on every page
- Click 🧮 on every page
- Switch language
- Check mobile view
