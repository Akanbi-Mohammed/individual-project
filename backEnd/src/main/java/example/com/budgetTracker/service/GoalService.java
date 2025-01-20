package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import example.com.budgetTracker.model.Goal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class GoalService {

    @Autowired
    private Firestore firestore;

    // Add a new goal
    public String addGoal(Goal goal) throws InterruptedException, ExecutionException {
        DocumentReference documentReference = firestore.collection("goals").document();
        goal.setId(documentReference.getId()); // Set the document ID in the goal object
        ApiFuture<WriteResult> future = documentReference.set(goal);
        return "Goal added successfully at: " + future.get().getUpdateTime();
    }

    // Get all goals
    public List<Goal> getAllGoals() throws InterruptedException, ExecutionException {
        List<Goal> goals = new ArrayList<>();
        ApiFuture<QuerySnapshot> future = firestore.collection("goals").get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        for (DocumentSnapshot document : documents) {
            Goal goal = document.toObject(Goal.class);
            goal.setId(document.getId()); // Set the document ID in the goal object
            goals.add(goal);
        }
        return goals;
    }

    // Get a goal by ID
    public Goal getGoalById(String id) throws InterruptedException, ExecutionException {
        DocumentReference documentReference = firestore.collection("goals").document(id);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();
        if (document.exists()) {
            Goal goal = document.toObject(Goal.class);
            goal.setId(document.getId());
            return goal;
        } else {
            return null;
        }
    }

    // Update a goal by ID
    public String updateGoal(String id, Goal goal) throws InterruptedException, ExecutionException {
        DocumentReference documentReference = firestore.collection("goals").document(id);
        goal.setId(id); // Ensure the goal ID is set
        ApiFuture<WriteResult> future = documentReference.set(goal);
        return "Goal updated successfully at: " + future.get().getUpdateTime();
    }

    // Delete a goal by ID
    public String deleteGoal(String id) throws InterruptedException, ExecutionException {
        DocumentReference documentReference = firestore.collection("goals").document(id);
        ApiFuture<WriteResult> future = documentReference.delete();
        return "Goal deleted successfully at: " + future.get().getUpdateTime();
    }
}
