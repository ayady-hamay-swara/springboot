package lk.ijse.dep.webmvc.repository;

import lk.ijse.dep.webmvc.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Employee Repository
 * Purpose: Database operations for Employee entity
 * 
 * Spring Data JPA automatically implements these methods
 * You just need to declare the method signatures
 */
public interface EmployeeRepository extends JpaRepository<Employee, String> {

    /**
     * Find all active employees
     * Spring Data JPA will automatically generate the query from the method name
     */
    List<Employee> findByActiveTrue();

    /**
     * Find employees by position
     */
    List<Employee> findByPosition(String position);

    /**
     * Find employee by email
     */
    Employee findByEmail(String email);

    /**
     * Search employees by name (case-insensitive, partial match)
     * Spring Data JPA: Containing = SQL LIKE %name%
     */
    List<Employee> findByNameContainingIgnoreCase(String name);

    /**
     * Custom query to find employees hired in a specific year
     * @Query annotation allows you to write custom JPQL queries
     */
    @Query("SELECT e FROM Employee e WHERE YEAR(e.hireDate) = :year")
    List<Employee> findEmployeesHiredInYear(@Param("year") int year);

    /**
     * Custom query to count employees by position
     */
    @Query("SELECT COUNT(e) FROM Employee e WHERE e.position = :position AND e.active = true")
    long countActiveEmployeesByPosition(@Param("position") String position);

    /**
     * Find employees with salary greater than specified amount
     */
    List<Employee> findBySalaryGreaterThanEqualAndActiveTrue(Double salary);
}
