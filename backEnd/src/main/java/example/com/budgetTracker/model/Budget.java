package example.com.budgetTracker.model;

import com.google.cloud.firestore.annotation.DocumentId;

public class Budget {

    @DocumentId
    private String id;

    // This field will store the authenticated user's UID.
    private String userId;

    private String category;
    private double amount;
    private String month; // Format: "YYYY-MM"

    // Default constructor (required for Firestore deserialization)
    public Budget() {
    }

    // Convenience constructor
    public Budget(String userId, String category, double amount, String month) {
        this.userId = userId;
        this.category = category;
        this.amount = amount;
        this.month = month;
    }

    // Getters and Setters
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
    public String getMonth() {
        return month;
    }
    public void setMonth(String month) {
        this.month = month;
    }
}
