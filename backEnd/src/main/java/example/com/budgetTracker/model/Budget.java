package example.com.budgetTracker.model;
import com.google.cloud.firestore.annotation.DocumentId;



public class Budget {
    @DocumentId
    private String id;
    private String category;
    private double amount;
    private String month; // E.g., "2024-11"



    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

