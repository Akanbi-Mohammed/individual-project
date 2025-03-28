package example.com.budgetTracker.model;

import com.google.cloud.firestore.annotation.DocumentId;

public class Goal {

    @DocumentId
    private String id;

    // New field to store the authenticated user's UID.
    private String userId;

    private String goal;
    private double targetAmount;
    private double allocatedFunds;
    private String deadline;

    // Default constructor (required for Firestore deserialization)
    public Goal() {
    }

    // Convenience constructor
    public Goal(String userId, String goal, double targetAmount, double allocatedFunds, String deadline) {
        this.userId = userId;
        this.goal = goal;
        this.targetAmount = targetAmount;
        this.allocatedFunds = allocatedFunds;
        this.deadline = deadline;
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
    public String getGoal() {
        return goal;
    }
    public void setGoal(String goal) {
        this.goal = goal;
    }
    public double getTargetAmount() {
        return targetAmount;
    }
    public void setTargetAmount(double targetAmount) {
        this.targetAmount = targetAmount;
    }
    public double getAllocatedFunds() {
        return allocatedFunds;
    }
    public void setAllocatedFunds(double allocatedFunds) {
        this.allocatedFunds = allocatedFunds;
    }
    public String getDeadline() {
        return deadline;
    }
    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }
}
