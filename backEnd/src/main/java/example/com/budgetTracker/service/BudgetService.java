package example.com.budgetTracker.service;



import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Budget;
import com.google.api.core.ApiFuture;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class BudgetService {



    @Autowired
    private final Firestore firestore;
    public BudgetService(Firestore firestore) {
        this.firestore = firestore;
    }



    public String addBudget(Budget budget) throws ExecutionException, InterruptedException {
        CollectionReference budgetsCollection = firestore.collection("budgets");
        DocumentReference documentReference = budgetsCollection.document();
        budget.setId(documentReference.getId()); // Assign a unique ID
        WriteResult result = documentReference.set(budget).get();
        return result.getUpdateTime().toString();
    }

    // Fetch all budgets for a specific month
    public List<Budget> getAllBudgets() throws ExecutionException, InterruptedException {
        ApiFuture<QuerySnapshot> future = firestore.collection("budgets").get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Budget> budgets = new ArrayList<>();
        for (QueryDocumentSnapshot document : documents) {
            Budget budget = document.toObject(Budget.class);
            budget.setId(document.getId()); // Include Firestore document ID if needed
            budgets.add(budget);
        }
        return budgets;
    }


    // Save or update a budget
    public Budget saveBudget(Budget budget) throws ExecutionException, InterruptedException {
        CollectionReference budgetsCollection = firestore.collection("budgets");

        if (budget.getId() != null && !budget.getId().isEmpty()) {
            // Update existing budget
            DocumentReference documentReference = budgetsCollection.document(budget.getId());
            documentReference.set(budget).get();
        } else {
            // Create new budget
            ApiFuture<DocumentReference> addedDocRef = budgetsCollection.add(budget);
            budget.setId(addedDocRef.get().getId());
        }

        return budget;
    }

    // Delete a budget
    public void deleteBudget(String id) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection("budgets").document(id);
        ApiFuture<WriteResult> deleteFuture = documentReference.delete();
        deleteFuture.get();
    }
    // Get a budget by ID
    public Budget getBudgetById(String id) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection("budgets").document(id);
        ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = documentReference.get();

        com.google.cloud.firestore.DocumentSnapshot document = future.get();
        if (document.exists()) {
            Budget budget = document.toObject(Budget.class);
            budget.setId(document.getId());
            return budget;
        } else {
            throw new RuntimeException("Budget with ID " + id + " not found.");
        }
    }
}
