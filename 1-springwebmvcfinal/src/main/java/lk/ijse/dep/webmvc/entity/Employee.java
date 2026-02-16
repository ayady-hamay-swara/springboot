package lk.ijse.dep.webmvc.entity;

import javax.persistence.*;
import java.util.Date;

/**
 * Employee Entity
 * Purpose: Track employees who process orders in the POS system
 * 
 * This is an example of how to add a new feature to your POS system
 */
@Entity
public class Employee extends SuperEntity {

    @Id
    private String id;  // e.g., E001, E002, E003
    
    private String name;
    
    private String position;  // e.g., Cashier, Manager, Stock Clerk
    
    private String email;
    
    private String phone;
    
    private Double salary;
    
    @Temporal(TemporalType.DATE)
    private Date hireDate;
    
    private Boolean active;  // true = currently employed, false = terminated
    
    // If you want to track which employee processed which orders,
    // add this relationship to the Order entity:
    // @OneToMany(mappedBy = "processedBy", fetch = FetchType.LAZY)
    // private List<Order> processedOrders = new ArrayList<>();

    // Constructors
    public Employee() {
        this.active = true;  // Default to active
    }

    public Employee(String id, String name, String position, String email, String phone, Double salary, Date hireDate) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.email = email;
        this.phone = phone;
        this.salary = salary;
        this.hireDate = hireDate;
        this.active = true;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Double getSalary() {
        return salary;
    }

    public void setSalary(Double salary) {
        this.salary = salary;
    }

    public Date getHireDate() {
        return hireDate;
    }

    public void setHireDate(Date hireDate) {
        this.hireDate = hireDate;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    @Override
    public String toString() {
        return "Employee{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", position='" + position + '\'' +
                ", email='" + email + '\'' +
                ", phone='" + phone + '\'' +
                ", salary=" + salary +
                ", hireDate=" + hireDate +
                ", active=" + active +
                '}';
    }
}
