package example.com.budgetTracker.model;

public class Income {
    private String userId;
    private String month; // e.g., "2025-02"
    private double amount;

    // Constructors, getters, setters
    public Income() {}

    public Income(String userId, String month, double amount) {
        this.userId = userId;
        this.month = month;
        this.amount = amount;
    }

    // Getters and Setters
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public double getAmount() { return amount; }
    public void setAmount(double amount) { this.amount = amount; }
}
