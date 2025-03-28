package example.com.budgetTracker.model;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;

@Entity
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String description;
    private double amount;
    private String date;
    private String category;

    // New field to store the user ID
    private String userId;
    private String periodIdentifier;
    private String recurringExpenseId;

    // Getters and Setters

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public double getAmount() {
        return amount;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    // Getter and setter for userId
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
    public String getRecurringExpenseId() {
        return recurringExpenseId;
    }

    public void setRecurringExpenseId(String recurringExpenseId) {
        this.recurringExpenseId = recurringExpenseId;
    }

    public String getPeriodIdentifier() {
        return periodIdentifier;
    }

    public void setPeriodIdentifier(String periodIdentifier) {
        this.periodIdentifier = periodIdentifier;
    }
}
