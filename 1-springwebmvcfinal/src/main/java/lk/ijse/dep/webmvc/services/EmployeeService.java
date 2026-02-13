package lk.ijse.dep.webmvc.services;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lk.ijse.dep.webmvc.dto.EmployeeDTO;
import lk.ijse.dep.webmvc.entity.Employee;
import lk.ijse.dep.webmvc.repository.EmployeeRepository;

/**
 * Employee Service - UPDATED VERSION
 * Fixed ID generation to handle empty database
 */
@Service
@Transactional
public class EmployeeService {

    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Convert Entity to DTO
     */
    private EmployeeDTO convertToDTO(Employee employee) {
        return new EmployeeDTO(
            employee.getId(),
            employee.getName(),
            employee.getPosition(),
            employee.getEmail(),
            employee.getPhone(),
            employee.getSalary(),
            employee.getHireDate(),
            employee.getActive()
        );
    }

    /**
     * Convert DTO to Entity
     */
    private Employee convertToEntity(EmployeeDTO dto) {
        Employee employee = new Employee();
        employee.setId(dto.getId());
        employee.setName(dto.getName());
        employee.setPosition(dto.getPosition());
        employee.setEmail(dto.getEmail());
        employee.setPhone(dto.getPhone());
        employee.setSalary(dto.getSalary());
        employee.setHireDate(dto.getHireDate());
        employee.setActive(dto.getActive());
        return employee;
    }

    /**
     * Get all employees
     */
    public List<EmployeeDTO> getAllEmployees() {
        return employeeRepository.findAll()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get all active employees only
     */
    public List<EmployeeDTO> getActiveEmployees() {
        return employeeRepository.findByActiveTrue()
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get employee by ID
     */
    public EmployeeDTO getEmployeeById(String id) {
        Optional<Employee> employee = employeeRepository.findById(id);
        return employee.map(this::convertToDTO).orElse(null);
    }

    /**
     * Save new employee
     */
    public EmployeeDTO saveEmployee(EmployeeDTO employeeDTO) {
        // Business rule: Check if ID already exists
        if (employeeRepository.existsById(employeeDTO.getId())) {
            throw new RuntimeException("Employee with ID " + employeeDTO.getId() + " already exists");
        }

        // Business rule: Check if email is already in use
        Employee existingEmployee = employeeRepository.findByEmail(employeeDTO.getEmail());
        if (existingEmployee != null) {
            throw new RuntimeException("Email " + employeeDTO.getEmail() + " is already in use");
        }

        Employee employee = convertToEntity(employeeDTO);
        Employee savedEmployee = employeeRepository.save(employee);
        return convertToDTO(savedEmployee);
    }

    /**
     * Update existing employee
     */
    public EmployeeDTO updateEmployee(String id, EmployeeDTO employeeDTO) {
        Optional<Employee> existingEmployee = employeeRepository.findById(id);
        
        if (!existingEmployee.isPresent()) {
            throw new RuntimeException("Employee with ID " + id + " not found");
        }

        Employee employee = existingEmployee.get();
        employee.setName(employeeDTO.getName());
        employee.setPosition(employeeDTO.getPosition());
        employee.setEmail(employeeDTO.getEmail());
        employee.setPhone(employeeDTO.getPhone());
        employee.setSalary(employeeDTO.getSalary());
        employee.setHireDate(employeeDTO.getHireDate());
        employee.setActive(employeeDTO.getActive());

        Employee updatedEmployee = employeeRepository.save(employee);
        return convertToDTO(updatedEmployee);
    }

    /**
     * Soft delete employee (set active to false)
     */
    public void deactivateEmployee(String id) {
        Optional<Employee> employee = employeeRepository.findById(id);
        
        if (!employee.isPresent()) {
            throw new RuntimeException("Employee with ID " + id + " not found");
        }

        Employee emp = employee.get();
        emp.setActive(false);
        employeeRepository.save(emp);
    }

    /**
     * Hard delete employee (permanently remove from database)
     */
    public void deleteEmployee(String id) {
        if (!employeeRepository.existsById(id)) {
            throw new RuntimeException("Employee with ID " + id + " not found");
        }
        employeeRepository.deleteById(id);
    }

    /**
     * Search employees by name
     */
    public List<EmployeeDTO> searchEmployeesByName(String name) {
        return employeeRepository.findByNameContainingIgnoreCase(name)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get employees by position
     */
    public List<EmployeeDTO> getEmployeesByPosition(String position) {
        return employeeRepository.findByPosition(position)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Generate next employee ID - FIXED VERSION
     * Handles empty database properly
     */
    public String generateNextEmployeeId() {
        try {
            List<Employee> employees = employeeRepository.findAll();
            
            // If no employees exist, start with E001
            if (employees == null || employees.isEmpty()) {
                return "E001";
            }

            // Find the highest ID number
            int maxId = 0;
            
            for (Employee emp : employees) {
                try {
                    String id = emp.getId();
                    // Remove 'E' prefix and parse number
                    if (id != null && id.length() > 1 && id.startsWith("E")) {
                        String numberPart = id.substring(1);
                        int currentId = Integer.parseInt(numberPart);
                        if (currentId > maxId) {
                            maxId = currentId;
                        }
                    }
                } catch (NumberFormatException e) {
                    // Skip IDs that don't follow E### pattern
                    System.err.println("Warning: Invalid employee ID format: " + emp.getId());
                }
            }

            // Generate next ID
            int nextId = maxId + 1;
            return String.format("E%03d", nextId);
            
        } catch (Exception e) {
            // If anything goes wrong, log error and return default
            System.err.println("Error generating employee ID: " + e.getMessage());
            e.printStackTrace();
            return "E001";
        }
    }

    /**
     * Business logic: Calculate total payroll for active employees
     */
    public Double calculateTotalPayroll() {
        try {
            List<Employee> activeEmployees = employeeRepository.findByActiveTrue();
            
            if (activeEmployees == null || activeEmployees.isEmpty()) {
                return 0.0;
            }
            
            return activeEmployees.stream()
                .filter(emp -> emp.getSalary() != null)
                .mapToDouble(Employee::getSalary)
                .sum();
                
        } catch (Exception e) {
            System.err.println("Error calculating payroll: " + e.getMessage());
            return 0.0;
        }
    }

    /**
     * Get count of employees by position
     */
    public long countEmployeesByPosition(String position) {
        try {
            return employeeRepository.countActiveEmployeesByPosition(position);
        } catch (Exception e) {
            System.err.println("Error counting employees: " + e.getMessage());
            return 0;
        }
    }
}