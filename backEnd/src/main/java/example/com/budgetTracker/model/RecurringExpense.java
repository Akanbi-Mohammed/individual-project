package example.com.budgetTracker.model;

import java.util.Date;

public class RecurringExpense {
    private String id;
    private String userId;
    private String description;
    private String category;
    private double amount;
    private String frequency;
    private int billingDay;
    private Date startDate;
    private Date endDate;
    private boolean active;    // true if still active

    // No-args constructor for Jackson
    public RecurringExpense() {
    }

    // Full constructor
    public RecurringExpense(
            String userId,
            String description,
            String category,
            double amount,
            String frequency,
            int billingDay,
            Date startDate,
            Date endDate,
            boolean active
    ) {
        this.userId = userId;
        this.description = description;
        this.category = category;
        this.amount = amount;
        this.frequency = frequency;
        this.billingDay = billingDay;
        this.startDate = startDate;
        this.endDate = endDate;
        this.active = active;
    }

    // Getters and setters for all fields

    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }
    public void setCategory(String category) {
        this.category = category;
    }

    public double getAmount() {
        return amount;
    }
    public void setAmount(double amount) {
        this.amount = amount;
    }

    public String getFrequency() {
        return frequency;
    }
    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public int getBillingDay() {
        return billingDay;
    }
    public void setBillingDay(int billingDay) {
        this.billingDay = billingDay;
    }

    public Date getStartDate() {
        return startDate;
    }
    public void setStartDate(Date startDate) {
        this.startDate = startDate;
    }

    public Date getEndDate() {
        return endDate;
    }
    public void setEndDate(Date endDate) {
        this.endDate = endDate;
    }

    public boolean isActive() {
        return active;
    }
    public void setActive(boolean active) {
        this.active = active;
    }
}
