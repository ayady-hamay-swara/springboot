/**
 * Manage Employees Controller
 * Handles all employee-related operations for the POS system
 */

// Base API URL - Change this to match your backend URL
const BASE_URL = "http://localhost:8080/api/employees";

// Document ready
$(document).ready(function() {
    // Set today's date as default for hire date
    const today = new Date().toISOString().split('T')[0];
    $('#txtHireDate').val(today);

    // Load all employees on page load
    loadAllEmployees();
    
    // Load statistics
    loadStatistics();

    // Event Listeners
    $('#btnGenerateId').click(generateEmployeeId);
    $('#btnSave').click(saveEmployee);
    $('#btnUpdate').click(updateEmployee);
    $('#btnDelete').click(deleteEmployee);
    $('#btnClear').click(clearForm);
    $('#btnSearch').click(searchEmployees);

    // Search on enter key
    $('#txtSearchName').keypress(function(e) {
        if (e.which === 13) { // Enter key
            searchEmployees();
        }
    });

    // Filter changes
    $('#txtSearchPosition, #txtSearchStatus').change(function() {
        searchEmployees();
    });

    // Auto-generate ID on page load
    generateEmployeeId();
});

/**
 * Generate next employee ID
 */
function generateEmployeeId() {
    $.ajax({
        url: BASE_URL + "/next-id",
        method: "GET",
        success: function(response) {
            $('#txtEmployeeId').val(response);
        },
        error: function(error) {
            console.error("Error generating ID:", error);
            showAlert("Error generating employee ID", "danger");
        }
    });
}

/**
 * Load all employees
 */
function loadAllEmployees() {
    $.ajax({
        url: BASE_URL,
        method: "GET",
        success: function(employees) {
            displayEmployees(employees);
        },
        error: function(error) {
            console.error("Error loading employees:", error);
            showAlert("Error loading employees", "danger");
        }
    });
}

/**
 * Display employees in table
 */
function displayEmployees(employees) {
    const tbody = $('#tblEmployeeBody');
    tbody.empty();

    if (employees.length === 0) {
        tbody.append(`
            <tr>
                <td colspan="9" class="text-center">No employees found</td>
            </tr>
        `);
        return;
    }

    employees.forEach(employee => {
        const statusBadge = employee.active 
            ? '<span class="badge-active">Active</span>' 
            : '<span class="badge-inactive">Inactive</span>';
        
        const hireDate = new Date(employee.hireDate).toLocaleDateString('en-GB');
        const salary = parseFloat(employee.salary).toFixed(2);

        const row = `
            <tr onclick='selectEmployee(${JSON.stringify(employee)})'>
                <td>${employee.id}</td>
                <td>${employee.name}</td>
                <td>${employee.position}</td>
                <td>${employee.email}</td>
                <td>${employee.phone}</td>
                <td>Rs. ${salary}</td>
                <td>${hireDate}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action" 
                            onclick='event.stopPropagation(); selectEmployee(${JSON.stringify(employee)})'>
                        Edit
                    </button>
                    <button class="btn btn-sm btn-danger btn-action" 
                            onclick='event.stopPropagation(); quickDelete("${employee.id}")'>
                        Delete
                    </button>
                </td>
            </tr>
        `;
        tbody.append(row);
    });

    // Update total count
    $('#totalEmployees').text(employees.length);
}

/**
 * Select employee for editing
 */
function selectEmployee(employee) {
    $('#txtEmployeeId').val(employee.id);
    $('#txtEmployeeName').val(employee.name);
    $('#txtPosition').val(employee.position);
    $('#txtEmail').val(employee.email);
    $('#txtPhone').val(employee.phone);
    $('#txtSalary').val(employee.salary);
    $('#txtStatus').val(employee.active.toString());
    
    // Format date to YYYY-MM-DD for input field
    const date = new Date(employee.hireDate);
    const formattedDate = date.toISOString().split('T')[0];
    $('#txtHireDate').val(formattedDate);

    // Show Update and Delete buttons, hide Save button
    $('#btnSave').hide();
    $('#btnUpdate').show();
    $('#btnDelete').show();

    // Scroll to form
    $('html, body').animate({
        scrollTop: $("#employeeForm").offset().top - 100
    }, 500);
}

/**
 * Save new employee
 */
function saveEmployee() {
    // Validate form
    if (!validateForm()) {
        return;
    }

    const employee = getFormData();

    $.ajax({
        url: BASE_URL,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(employee),
        success: function(response) {
            showAlert("Employee saved successfully!", "success");
            clearForm();
            loadAllEmployees();
            loadStatistics();
            generateEmployeeId();
        },
        error: function(error) {
            console.error("Error saving employee:", error);
            if (error.status === 400) {
                showAlert("Employee ID or Email already exists!", "danger");
            } else {
                showAlert("Error saving employee", "danger");
            }
        }
    });
}

/**
 * Update existing employee
 */
function updateEmployee() {
    if (!validateForm()) {
        return;
    }

    const employeeId = $('#txtEmployeeId').val();
    const employee = getFormData();

    $.ajax({
        url: BASE_URL + "/" + employeeId,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify(employee),
        success: function(response) {
            showAlert("Employee updated successfully!", "success");
            clearForm();
            loadAllEmployees();
            loadStatistics();
        },
        error: function(error) {
            console.error("Error updating employee:", error);
            showAlert("Error updating employee", "danger");
        }
    });
}

/**
 * Delete employee
 */
function deleteEmployee() {
    const employeeId = $('#txtEmployeeId').val();
    const employeeName = $('#txtEmployeeName').val();

    if (!confirm(`Are you sure you want to delete employee ${employeeName} (${employeeId})?`)) {
        return;
    }

    $.ajax({
        url: BASE_URL + "/" + employeeId,
        method: "DELETE",
        success: function() {
            showAlert("Employee deleted successfully!", "success");
            clearForm();
            loadAllEmployees();
            loadStatistics();
        },
        error: function(error) {
            console.error("Error deleting employee:", error);
            showAlert("Error deleting employee", "danger");
        }
    });
}

/**
 * Quick delete from table
 */
function quickDelete(employeeId) {
    if (!confirm(`Are you sure you want to delete employee ${employeeId}?`)) {
        return;
    }

    $.ajax({
        url: BASE_URL + "/" + employeeId,
        method: "DELETE",
        success: function() {
            showAlert("Employee deleted successfully!", "success");
            loadAllEmployees();
            loadStatistics();
        },
        error: function(error) {
            console.error("Error deleting employee:", error);
            showAlert("Error deleting employee", "danger");
        }
    });
}

/**
 * Search employees
 */
function searchEmployees() {
    const searchName = $('#txtSearchName').val().trim();
    const searchPosition = $('#txtSearchPosition').val();
    const searchStatus = $('#txtSearchStatus').val();

    // If all filters are empty, load all employees
    if (!searchName && !searchPosition && !searchStatus) {
        loadAllEmployees();
        return;
    }

    // Build search URL based on filters
    let searchUrl = BASE_URL;

    if (searchName) {
        // Search by name
        searchUrl += "/search?name=" + encodeURIComponent(searchName);
    } else if (searchPosition) {
        // Filter by position
        searchUrl += "/position/" + encodeURIComponent(searchPosition);
    } else if (searchStatus === "true") {
        // Filter active employees
        searchUrl += "/active";
    } else {
        // Load all and filter on frontend
        loadAllEmployees();
        return;
    }

    $.ajax({
        url: searchUrl,
        method: "GET",
        success: function(employees) {
            // Additional frontend filtering if needed
            let filteredEmployees = employees;

            if (searchStatus && searchStatus !== "") {
                const isActive = searchStatus === "true";
                filteredEmployees = employees.filter(emp => emp.active === isActive);
            }

            displayEmployees(filteredEmployees);
            showAlert(`Found ${filteredEmployees.length} employee(s)`, "info");
        },
        error: function(error) {
            console.error("Error searching employees:", error);
            showAlert("Error searching employees", "danger");
        }
    });
}

/**
 * Load statistics
 */
function loadStatistics() {
    // Total employees
    $.ajax({
        url: BASE_URL,
        method: "GET",
        success: function(employees) {
            $('#totalEmployees').text(employees.length);

            // Count active employees
            const activeCount = employees.filter(emp => emp.active === true).length;
            $('#activeEmployees').text(activeCount);

            // Count managers
            const managerCount = employees.filter(emp => 
                emp.position === "Manager" || emp.position === "Assistant Manager"
            ).length;
            $('#totalManagers').text(managerCount);
        }
    });

    // Total payroll
    $.ajax({
        url: BASE_URL + "/payroll/total",
        method: "GET",
        success: function(total) {
            $('#totalPayroll').text('Rs. ' + parseFloat(total).toFixed(2));
        },
        error: function(error) {
            console.error("Error loading payroll:", error);
        }
    });
}

/**
 * Get form data
 */
function getFormData() {
    return {
        id: $('#txtEmployeeId').val(),
        name: $('#txtEmployeeName').val(),
        position: $('#txtPosition').val(),
        email: $('#txtEmail').val(),
        phone: $('#txtPhone').val(),
        salary: parseFloat($('#txtSalary').val()),
        hireDate: $('#txtHireDate').val(),
        active: $('#txtStatus').val() === "true"
    };
}

/**
 * Validate form
 */
function validateForm() {
    let isValid = true;

    // Clear previous validation
    $('.form-control').removeClass('is-invalid');

    // Validate Employee ID
    if (!$('#txtEmployeeId').val()) {
        $('#txtEmployeeId').addClass('is-invalid');
        isValid = false;
    }

    // Validate Name
    if (!$('#txtEmployeeName').val()) {
        $('#txtEmployeeName').addClass('is-invalid');
        isValid = false;
    }

    // Validate Position
    if (!$('#txtPosition').val()) {
        $('#txtPosition').addClass('is-invalid');
        isValid = false;
    }

    // Validate Email
    const email = $('#txtEmail').val();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        $('#txtEmail').addClass('is-invalid');
        isValid = false;
    }

    // Validate Phone
    const phone = $('#txtPhone').val();
    if (!phone || phone.length < 10) {
        $('#txtPhone').addClass('is-invalid');
        isValid = false;
    }

    // Validate Salary
    const salary = $('#txtSalary').val();
    if (!salary || parseFloat(salary) <= 0) {
        $('#txtSalary').addClass('is-invalid');
        isValid = false;
    }

    // Validate Hire Date
    if (!$('#txtHireDate').val()) {
        $('#txtHireDate').addClass('is-invalid');
        isValid = false;
    }

    if (!isValid) {
        showAlert("Please fill all required fields correctly", "danger");
    }

    return isValid;
}

/**
 * Clear form
 */
function clearForm() {
    $('#employeeForm')[0].reset();
    $('.form-control').removeClass('is-invalid');
    
    // Reset to today's date
    const today = new Date().toISOString().split('T')[0];
    $('#txtHireDate').val(today);
    
    // Reset status to Active
    $('#txtStatus').val("true");

    // Show Save button, hide Update and Delete
    $('#btnSave').show();
    $('#btnUpdate').hide();
    $('#btnDelete').hide();

    // Clear search fields
    $('#txtSearchName').val('');
    $('#txtSearchPosition').val('');
    $('#txtSearchStatus').val('');

    // Generate new ID
    generateEmployeeId();
}

/**
 * Show alert message
 */
function showAlert(message, type) {
    // Remove existing alerts
    $('.alert').remove();

    // Create new alert
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;

    // Insert alert at the top of the page
    $('.container').prepend(alertHtml);

    // Auto-dismiss after 5 seconds
    setTimeout(function() {
        $('.alert').fadeOut('slow', function() {
            $(this).remove();
        });
    }, 5000);

    // Scroll to top to show alert
    $('html, body').animate({
        scrollTop: 0
    }, 300);
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return 'Rs. ' + parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}
