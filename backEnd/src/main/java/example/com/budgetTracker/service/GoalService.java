package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Goal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class GoalService {

    private final Firestore firestore;

    @Autowired
    public GoalService(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Adds a new goal document to Firestore.
     * The Goal object must have the userId set.
     */
    public String addGoal(Goal goal) throws ExecutionException, InterruptedException {
        if (goal.getUserId() == null || goal.getUserId().isEmpty()) {
            throw new IllegalArgumentException("Goal must have a userId.");
        }
        CollectionReference goalsCollection = firestore.collection("goals");
        DocumentReference documentReference = goalsCollection.document();
        goal.setId(documentReference.getId());
        WriteResult result = documentReference.set(goal).get();
        String updateTime = (result != null && result.getUpdateTime() != null)
                ? result.getUpdateTime().toString()
                : "unknown";
        System.out.println("Goal added with ID: " + goal.getId() + " at time: " + updateTime);
        return updateTime;
    }

    /**
     * Retrieves all goal documents from Firestore for the specified user.
     */
    public List<Goal> getAllGoals(String uid) throws ExecutionException, InterruptedException {
        CollectionReference goalsCollection = firestore.collection("goals");
        Query query = goalsCollection.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Goal> goals = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Goal goal = doc.toObject(Goal.class);
            goal.setId(doc.getId());
            goals.add(goal);
        }
        System.out.println("Retrieved " + goals.size() + " goals for user: " + uid);
        return goals;
    }

    /**
     * Retrieves a goal document by its ID for the specified user.
     */
    public Goal getGoalById(String id, String uid) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection("goals").document(id);
        DocumentSnapshot document = documentReference.get().get();
        if (document.exists()) {
            Goal goal = document.toObject(Goal.class);
            if (goal == null || !goal.getUserId().equals(uid)) {
                throw new RuntimeException("Unauthorized: Goal does not belong to the user");
            }
            goal.setId(document.getId());
            System.out.println("Found goal with ID: " + goal.getId() + " for user: " + uid);
            return goal;
        } else {
            throw new RuntimeException("Goal with ID " + id + " not found.");
        }
    }

    /**
     * Updates a goal document in Firestore.
     * The Goal object must have the userId set.
     */
    public String updateGoal(String id, Goal updatedGoal, String uid) throws ExecutionException, InterruptedException {
        // First, retrieve the existing goal to ensure it belongs to the user.
        Goal existingGoal = getGoalById(id, uid);
        if (existingGoal == null) {
            throw new RuntimeException("Goal not found");
        }
        // Update fields
        existingGoal.setGoal(updatedGoal.getGoal());
        existingGoal.setTargetAmount(updatedGoal.getTargetAmount());
        existingGoal.setAllocatedFunds(updatedGoal.getAllocatedFunds());
        existingGoal.setDeadline(updatedGoal.getDeadline());
        // Save the updated goal
        CollectionReference goalsCollection = firestore.collection("goals");
        DocumentReference documentReference = goalsCollection.document(id);
        WriteResult result = documentReference.set(existingGoal).get();
        String updateTime = (result != null && result.getUpdateTime() != null)
                ? result.getUpdateTime().toString()
                : "unknown";

        System.out.println("Found goal with ID: " + id + " at time: " + updateTime);
        return updateTime;
    }

    /**
     * Deletes a goal document from Firestore by its ID, ensuring it belongs to the specified user.
     */
    public String deleteGoal(String id, String uid) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection("goals").document(id);
        DocumentSnapshot document = documentReference.get().get();
        if (document.exists()) {
            Goal goal = document.toObject(Goal.class);
            if (goal == null || !goal.getUserId().equals(uid)) {
                throw new RuntimeException("Unauthorized: Goal does not belong to the user");
            }
        } else {
            throw new RuntimeException("Goal with ID " + id + " not found.");
        }
        ApiFuture<WriteResult> deleteFuture = documentReference.delete();
        WriteResult result = deleteFuture.get();
        String updateTime = (result != null && result.getUpdateTime() != null)
                ? result.getUpdateTime().toString()
                : "unknown";

        System.out.println("Goal deleted successfully with" + id + " at time: " + updateTime);
        return updateTime;
    }
    public String deleteAllGoals(String uid) throws ExecutionException, InterruptedException {
        CollectionReference goalsCollection = firestore.collection("goals");
        Query query = goalsCollection.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        if (documents.isEmpty()) {
            throw new RuntimeException("No goals found for user: " + uid);
        }

        List<ApiFuture<WriteResult>> deleteFutures = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            deleteFutures.add(document.getReference().delete());
        }

        // Wait for all delete operations to complete
        for (ApiFuture<WriteResult> deleteFuture : deleteFutures) {
            deleteFuture.get();  // Ensures each document is deleted
        }

        System.out.println("Deleted all goals for user: " + uid);
        return "All goals deleted successfully.";
    }
}
