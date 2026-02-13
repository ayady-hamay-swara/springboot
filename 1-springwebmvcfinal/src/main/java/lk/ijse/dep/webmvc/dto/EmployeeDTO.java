package lk.ijse.dep.webmvc.dto;

import java.util.Date;

/**
 * Employee Data Transfer Object
 * Purpose: Transfer employee data between frontend and backend
 * 
 * DTOs help separate your entity structure from API responses
 * and allow you to control what data is exposed to the frontend
 */
public class EmployeeDTO {

    private String id;
    private String name;
    private String position;
    private String email;
    private String phone;
    private Double salary;
    private Date hireDate;
    private Boolean active;

    // Constructors
    public EmployeeDTO() {
    }

    public EmployeeDTO(String id, String name, String position, String email, String phone, Double salary, Date hireDate, Boolean active) {
        this.id = id;
        this.name = name;
        this.position = position;
        this.email = email;
        this.phone = phone;
        this.salary = salary;
        this.hireDate = hireDate;
        this.active = active;
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
        return "EmployeeDTO{" +
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
