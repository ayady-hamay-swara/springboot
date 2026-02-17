/**
 * EMPLOYEES MANAGEMENT CONTROLLER
 * Features:
 * - Position-based access control (Owner/Manager/Ass.Manager only)
 * - Username & Password fields for login
 * - Position dropdown
 * - Access level preview
 */

const EMPLOYEES_URL = "http://localhost:8080/api/employees";

let allEmployees = [];
let currentEmployeeId = null;
let currentUserPosition = null;

// ============================================================================
// ACCESS CONTROL CONFIG
// ============================================================================

const ACCESS_CONFIG = {
    OWNER: {
        label: "👑 Owner",
        color: "#6f42c1",
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        description: "Full Access - Can do everything"
    },
    MANAGER: {
        label: "💼 Manager",
        color: "#2E75B6",
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: false,
        description: "Can add and edit employees, cannot delete"
    },
    ASSISTANT_MANAGER: {
        label: "📋 Assistant Manager",
        color: "#17a2b8",
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        description: "Read-only access to employees"
    },
    CASHIER: {
        label: "🧾 Cashier",
        color: "#dc3545",
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        description: "No access to employees page"
    }
};

// Position display names for table
const POSITION_LABELS = {
    OWNER: '<span class="badge" style="background:#6f42c1;color:white;padding:5px 10px;border-radius:12px;">👑 Owner</span>',
    MANAGER: '<span class="badge" style="background:#2E75B6;color:white;padding:5px 10px;border-radius:12px;">💼 Manager</span>',
    ASSISTANT_MANAGER: '<span class="badge" style="background:#17a2b8;color:white;padding:5px 10px;border-radius:12px;">📋 Ass. Manager</span>',
    CASHIER: '<span class="badge" style="background:#6c757d;color:white;padding:5px 10px;border-radius:12px;">🧾 Cashier</span>'
};

// ============================================================================
// INITIALIZATION
// ============================================================================

$(document).ready(function() {
    console.log("Employees Controller Loaded");

    // Check access FIRST before showing anything
    if (!checkPageAccess()) return;

    loadAllEmployees();
    generateEmployeeId();
    setupEventListeners();
    applyAccessRestrictions();
});

// ============================================================================
// ACCESS CONTROL
// ============================================================================

function checkPageAccess() {
    // Get current user's position from localStorage (set during login)
    currentUserPosition = localStorage.getItem('userPosition') || 'CASHIER';
    const currentUserName = localStorage.getItem('userName') || 'User';

    const access = ACCESS_CONFIG[currentUserPosition];

    // If no access, show denied screen
    if (!access || !access.canView) {
        $('#accessDeniedOverlay').show();
        $('#mainContent').hide();
        return false;
    }

    // Show main content
    $('#accessDeniedOverlay').hide();
    $('#mainContent').show();

    // Update header badges
    $('#currentUserBadge').text(`👤 ${currentUserName}`);
    $('#accessLevelBadge')
        .text(`🔓 ${access.label}`)
        .css('background-color', access.color);

    console.log(`Access granted for: ${currentUserPosition}`);
    return true;
}

function applyAccessRestrictions() {
    const access = ACCESS_CONFIG[currentUserPosition];
    if (!access) return;

    // Assistant Manager - read only
    if (!access.canAdd && !access.canEdit) {
        $('#btnSave').hide();
        $('#employeeForm input, #employeeForm select, #employeeForm textarea')
            .prop('disabled', true);

        // Show read-only notice
        $('#employeeForm').prepend(`
            <div class="alert alert-info">
                <strong>👁️ Read-Only Mode</strong> — 
                You can view employee records but cannot make changes.
            </div>
        `);
    }

    // Hide delete button for non-owners
    if (!access.canDelete) {
        $('#btnDelete').hide();
        $('#ownerOnlyNote').show();
    }
}

// ============================================================================
// LOAD EMPLOYEES
// ============================================================================

function loadAllEmployees() {
    $.ajax({
        url: EMPLOYEES_URL,
        method: "GET",
        success: function(employees) {
            allEmployees = employees || [];
            displayEmployees(allEmployees);
            updateStatistics();
        },
        error: function(error) {
            console.error("Error loading employees:", error);
            showNotification("Error loading employees", "error");
        }
    });
}

function displayEmployees(employees) {
    const tbody = $('#tblEmployeesBody');
    tbody.empty();

    if (!employees || employees.length === 0) {
        tbody.html('<tr><td colspan="9" class="text-center py-4">No employees found</td></tr>');
        return;
    }

    employees.forEach(emp => {
        const access = ACCESS_CONFIG[currentUserPosition];
        const positionLabel = POSITION_LABELS[emp.position] ||
            `<span class="badge badge-secondary">${emp.position || 'N/A'}</span>`;

        const statusBadge = emp.active ?
            '<span class="badge badge-success" style="padding:5px 10px;border-radius:12px;">Active</span>' :
            '<span class="badge badge-secondary" style="padding:5px 10px;border-radius:12px;">Inactive</span>';

        // Mask password in username column
        const usernameDisplay = emp.username ?
            `<code>${emp.username}</code>` :
            '<span class="text-muted">Not set</span>';

        const editBtn = access && access.canEdit ?
            `<button class="btn btn-sm btn-primary" onclick="selectEmployee('${emp.id}')">✏️ Edit</button>` :
            `<button class="btn btn-sm btn-secondary" onclick="selectEmployee('${emp.id}')">👁️ View</button>`;

        const deleteBtn = access && access.canDelete ?
            `<button class="btn btn-sm btn-danger ml-1" onclick="quickDelete('${emp.id}')">🗑️</button>` : '';

        const row = `
            <tr style="cursor:pointer; transition:all .2s;" onmouseover="this.style.background='#f8f9fa'"
                onmouseout="this.style.background=''" onclick="selectEmployee('${emp.id}')">
                <td><strong>${emp.id}</strong></td>
                <td>${emp.name}</td>
                <td>${positionLabel}</td>
                <td>${usernameDisplay}</td>
                <td>${emp.email || '<span class="text-muted">-</span>'}</td>
                <td>${emp.phone || '<span class="text-muted">-</span>'}</td>
                <td>Rs. ${formatCurrency(emp.salary || 0)}</td>
                <td>${statusBadge}</td>
                <td onclick="event.stopPropagation()">
                    ${editBtn}${deleteBtn}
                </td>
            </tr>
        `;
        tbody.append(row);
    });
}

// ============================================================================
// STATISTICS
// ============================================================================

function updateStatistics() {
    const total = allEmployees.length;
    const active = allEmployees.filter(e => e.active).length;
    const managers = allEmployees.filter(e =>
        ['OWNER', 'MANAGER', 'ASSISTANT_MANAGER'].includes(e.position)
    ).length;
    const payroll = allEmployees
        .filter(e => e.active)
        .reduce((sum, e) => sum + (e.salary || 0), 0);

    $('#totalEmployees').text(total);
    $('#activeEmployees').text(active);
    $('#totalManagers').text(managers);
    $('#totalPayroll').text(`Rs. ${formatCurrency(payroll)}`);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    $('#btnGenerateId').click(generateEmployeeId);
    $('#btnSave').click(saveEmployee);
    $('#btnUpdate').click(updateEmployee);
    $('#btnDelete').click(deleteEmployee);
    $('#btnClear').click(clearForm);
    $('#btnSearch').click(searchEmployees);

    // Toggle password visibility
    $('#btnTogglePassword').click(function() {
        const input = $('#txtPassword');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).text(type === 'password' ? '👁️' : '🙈');
    });

    // Position change - show access level preview
    $('#txtPosition').change(function() {
        updateAccessPreview($(this).val());
    });

    // Search on Enter
    $('#txtSearchName').on('keypress', function(e) {
        if (e.which === 13) searchEmployees();
    });
}

function updateAccessPreview(position) {
    const preview = $('#accessLevelPreview');
    const access = ACCESS_CONFIG[position];

    if (!access) {
        preview.html('<small class="text-muted">Select a position</small>');
        preview.css({ background: '#f8f9fa', border: '2px dashed #dee2e6', color: '#333' });
        return;
    }

    preview.html(`
        <strong style="color:${access.color}">${access.label}</strong><br>
        <small>${access.description}</small>
    `);
    preview.css({
        background: `${access.color}15`,
        border: `2px solid ${access.color}`,
        color: '#333'
    });
}

// ============================================================================
// FORM OPERATIONS
// ============================================================================

function getFormData() {
    return {
        id: $('#txtEmployeeId').val(),
        name: $('#txtName').val().trim(),
        position: $('#txtPosition').val(),
        email: $('#txtEmail').val().trim() || null,
        phone: $('#txtPhone').val().trim() || null,
        salary: parseFloat($('#txtSalary').val()) || 0,
        hireDate: $('#txtHireDate').val() || null,
        username: $('#txtUsername').val().trim(),
        password: $('#txtPassword').val() || null,
        active: $('#txtStatus').val() === 'true'
    };
}

function validateForm(isUpdate = false) {
    const name = $('#txtName').val().trim();
    const position = $('#txtPosition').val();
    const username = $('#txtUsername').val().trim();
    const password = $('#txtPassword').val();
    const confirmPassword = $('#txtConfirmPassword').val();

    if (!name) {
        showNotification("Employee name is required", "warning");
        $('#txtName').focus();
        return false;
    }

    if (!position) {
        showNotification("Please select a position", "warning");
        $('#txtPosition').focus();
        return false;
    }

    if (!username) {
        showNotification("Username is required", "warning");
        $('#txtUsername').focus();
        return false;
    }

    // Username must be alphanumeric/underscore
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showNotification("Username can only contain letters, numbers, and underscores", "warning");
        $('#txtUsername').focus();
        return false;
    }

    // Password required for new employees
    if (!isUpdate && !password) {
        showNotification("Password is required for new employees", "warning");
        $('#txtPassword').focus();
        return false;
    }

    // If password entered, validate it
    if (password) {
        if (password.length < 6) {
            showNotification("Password must be at least 6 characters", "warning");
            $('#txtPassword').focus();
            return false;
        }

        if (password !== confirmPassword) {
            showNotification("Passwords do not match!", "warning");
            $('#txtConfirmPassword').focus();
            return false;
        }
    }

    return true;
}

function saveEmployee() {
    if (!validateForm(false)) return;

    const data = getFormData();

    $.ajax({
        url: EMPLOYEES_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function() {
            showNotification("Employee saved successfully!", "success");
            clearForm();
            loadAllEmployees();
        },
        error: function(error) {
            console.error("Error saving employee:", error);
            const msg = error.responseJSON?.message || "Error saving employee";
            showNotification(msg, "error");
        }
    });
}

function updateEmployee() {
    if (!currentEmployeeId) {
        showNotification("No employee selected", "warning");
        return;
    }

    if (!validateForm(true)) return;

    const data = getFormData();

    // If no password entered during update, remove it from data
    if (!data.password) {
        delete data.password;
    }

    $.ajax({
        url: `${EMPLOYEES_URL}/${currentEmployeeId}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: function() {
            showNotification("Employee updated successfully!", "success");
            clearForm();
            loadAllEmployees();
        },
        error: function(error) {
            console.error("Error updating employee:", error);
            showNotification("Error updating employee", "error");
        }
    });
}

function deleteEmployee() {
    if (!currentEmployeeId) {
        showNotification("No employee selected", "warning");
        return;
    }

    const access = ACCESS_CONFIG[currentUserPosition];
    if (!access || !access.canDelete) {
        showNotification("Only Owners can delete employees", "warning");
        return;
    }

    const empName = $('#txtName').val();
    if (!confirm(`Are you sure you want to delete "${empName}"?\n\nThis cannot be undone!`)) return;

    $.ajax({
        url: `${EMPLOYEES_URL}/${currentEmployeeId}`,
        method: "DELETE",
        success: function() {
            showNotification("Employee deleted", "success");
            clearForm();
            loadAllEmployees();
        },
        error: function(error) {
            console.error("Error deleting employee:", error);
            showNotification("Error deleting employee", "error");
        }
    });
}

function quickDelete(id) {
    const access = ACCESS_CONFIG[currentUserPosition];
    if (!access || !access.canDelete) {
        showNotification("Only Owners can delete employees", "warning");
        return;
    }

    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;

    if (!confirm(`Delete employee "${emp.name}"?`)) return;

    $.ajax({
        url: `${EMPLOYEES_URL}/${id}`,
        method: "DELETE",
        success: function() {
            showNotification("Employee deleted", "success");
            loadAllEmployees();
        },
        error: function() {
            showNotification("Error deleting employee", "error");
        }
    });
}

function selectEmployee(id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;

    currentEmployeeId = emp.id;

    $('#txtEmployeeId').val(emp.id);
    $('#txtName').val(emp.name);
    $('#txtPosition').val(emp.position);
    $('#txtEmail').val(emp.email || '');
    $('#txtPhone').val(emp.phone || '');
    $('#txtSalary').val(emp.salary || '');
    $('#txtHireDate').val(emp.hireDate ? emp.hireDate.split('T')[0] : '');
    $('#txtUsername').val(emp.username || '');
    $('#txtPassword').val('');
    $('#txtConfirmPassword').val('');
    $('#txtStatus').val(emp.active ? 'true' : 'false');

    // Update password hints for edit mode
    $('#passwordRequired, #confirmRequired').text('');
    $('#passwordHint').text('Leave blank to keep existing password');
    $('#confirmHint').text('Only required if changing password');

    updateAccessPreview(emp.position);

    const access = ACCESS_CONFIG[currentUserPosition];
    if (access && access.canEdit) {
        $('#btnSave').hide();
        $('#btnUpdate').show();

        if (access.canDelete) {
            $('#btnDelete').show();
        } else {
            $('#btnDelete').hide();
        }
    }

    $('html, body').animate({
        scrollTop: $('#employeeForm').offset().top - 100
    }, 400);
}

function clearForm() {
    $('#employeeForm')[0].reset();
    currentEmployeeId = null;

    $('#btnSave').show();
    $('#btnUpdate, #btnDelete').hide();
    $('#txtStatus').val('true');

    // Reset password hints
    $('#passwordRequired, #confirmRequired').text('*');
    $('#passwordHint').text('Required for new employees');
    $('#confirmHint').text('Leave blank to keep existing');

    $('#accessLevelPreview').html('<small class="text-muted">Select a position</small>');
    $('#accessLevelPreview').css({ background: '#f8f9fa', border: '2px dashed #dee2e6' });

    generateEmployeeId();
}

function generateEmployeeId() {
    if (!allEmployees || allEmployees.length === 0) {
        $('#txtEmployeeId').val('E001');
        return;
    }

    const nums = allEmployees.map(e => {
        const n = parseInt(e.id.substring(1));
        return isNaN(n) ? 0 : n;
    });

    const next = Math.max(...nums) + 1;
    $('#txtEmployeeId').val('E' + String(next).padStart(3, '0'));
}

// ============================================================================
// SEARCH
// ============================================================================

function searchEmployees() {
    const name = $('#txtSearchName').val().toLowerCase();
    const position = $('#txtSearchPosition').val();
    const status = $('#txtSearchStatus').val();

    let filtered = allEmployees;

    if (name) {
        filtered = filtered.filter(e => e.name.toLowerCase().includes(name));
    }

    if (position) {
        filtered = filtered.filter(e => e.position === position);
    }

    if (status !== '') {
        filtered = filtered.filter(e => e.active === (status === 'true'));
    }

    displayEmployees(filtered);
}

// ============================================================================
// UTILITIES
// ============================================================================

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'alert-success',
        error: 'alert-danger',
        warning: 'alert-warning',
        info: 'alert-info'
    };

    const alert = $(`
        <div class="alert ${colors[type] || 'alert-info'} alert-dismissible fade show"
             style="position:fixed;top:70px;right:20px;z-index:9999;min-width:300px;box-shadow:0 4px 12px rgba(0,0,0,.2);">
            ${message}
            <button type="button" class="close" data-dismiss="alert"><span>&times;</span></button>
        </div>
    `);

    $('body').append(alert);
    setTimeout(() => alert.alert('close'), 3500);
}

console.log("Employees Controller Ready!");