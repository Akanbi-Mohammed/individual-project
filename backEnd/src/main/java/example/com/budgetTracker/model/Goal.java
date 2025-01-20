package example.com.budgetTracker.model;

import com.google.cloud.firestore.annotation.DocumentId;

public class Goal {

    @DocumentId // Automatically maps Firestore document ID to this field
    private String id;
    private String goal;
    private double targetAmount;
    private double allocatedFunds;
    private String deadline;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) {
        this.goal = goal;
    }

    public double getTargetAmount() { return targetAmount; }
    public void setTargetAmount(double targetAmount) { this.targetAmount = targetAmount; }

    public double getAllocatedFunds() { return allocatedFunds; }
    public void setAllocatedFunds(double allocatedFunds) { this.allocatedFunds = allocatedFunds; }

    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
}
