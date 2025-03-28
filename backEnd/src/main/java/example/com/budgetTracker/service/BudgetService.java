package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Budget;
import example.com.budgetTracker.model.Expense;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

@Service
public class BudgetService {

    private final Firestore firestore;

    @Autowired
    public BudgetService(Firestore firestore) {
        this.firestore = firestore;
    }

    /**
     * Adds a new budget document to Firestore.
     * The Budget object must have the userId set.
     *
     * @param budget The Budget object to add.
     * @return The update time of the write operation as a String.
     */
    public String addBudget(Budget budget) throws ExecutionException, InterruptedException {
        if (budget.getUserId() == null || budget.getUserId().isEmpty()) {
            throw new IllegalArgumentException("Budget must have a userId.");
        }
        CollectionReference budgetsCollection = firestore.collection("budgets");
        DocumentReference documentReference = budgetsCollection.document();
        // Set the generated ID as the budget's ID
        budget.setId(documentReference.getId());
        WriteResult result = documentReference.set(budget).get();
        String updateTime = (result != null && result.getUpdateTime() != null)
                ? result.getUpdateTime().toString()
                : "unknown";

        System.out.println("Budget added with ID: " + budget.getId() + " at time: " + updateTime);
        return updateTime;
    }

    /**
     * Retrieves all budget documents from Firestore for the specified user.
     *
     * @param uid The authenticated user's UID.
     * @return A List of Budget objects that belong to the user.
     */
    public List<Budget> getAllBudgets(String uid) throws ExecutionException, InterruptedException {
        CollectionReference budgetsCollection = firestore.collection("budgets");
        // Query only documents where userId equals the given uid
        Query query = budgetsCollection.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<Budget> budgets = new ArrayList<>();
        for (QueryDocumentSnapshot doc : documents) {
            Budget budget = doc.toObject(Budget.class);
            budget.setId(doc.getId());
            budgets.add(budget);
        }
        System.out.println("Retrieved " + budgets.size() + " budgets for user: " + uid);
        return budgets;
    }

    /**
     * Saves or updates a budget document in Firestore.
     * The Budget object must have the userId set.
     *
     * @param budget The Budget object to save.
     * @return The saved Budget object.
     */
    public Budget saveBudget(Budget budget) throws ExecutionException, InterruptedException {
        if (budget.getUserId() == null || budget.getUserId().isEmpty()) {
            throw new IllegalArgumentException("Budget must have a userId.");
        }
        CollectionReference budgetsCollection = firestore.collection("budgets");
        if (budget.getId() != null && !budget.getId().isEmpty()) {
            // Update existing budget
            DocumentReference documentReference = budgetsCollection.document(budget.getId());
            // Ensure that the document belongs to the same user (optional extra check)
            Budget existing = documentReference.get().get().toObject(Budget.class);
            if (existing != null && !budget.getUserId().equals(existing.getUserId())) {
                throw new RuntimeException("Unauthorized: Budget does not belong to the user");
            }
            documentReference.set(budget).get();
            System.out.println("Updated budget with ID: " + budget.getId());
        } else {
            // Create new budget
            ApiFuture<DocumentReference> addedDocRef = budgetsCollection.add(budget);
            DocumentReference docRef = addedDocRef.get();
            budget.setId(docRef.getId());
            System.out.println("Created new budget with ID: " + budget.getId());
        }
        return budget;
    }

    /**
     * Deletes a budget document from Firestore by its ID,
     * ensuring it belongs to the specified user.
     *
     * @param id  The ID of the budget to delete.
     * @param uid The authenticated user's UID.
     */
    public void deleteBudget(String id, String uid) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection("budgets").document(id);
        DocumentSnapshot document = documentReference.get().get();
        if (document.exists()) {
            Budget budget = document.toObject(Budget.class);
            if (budget == null || !budget.getUserId().equals(uid)) {
                throw new RuntimeException("Unauthorized: Budget does not belong to the user");
            }
        } else {
            throw new RuntimeException("Budget with ID " + id + " not found.");
        }
        ApiFuture<WriteResult> deleteFuture = documentReference.delete();
        WriteResult result = deleteFuture.get();
        System.out.println("Deleted budget with ID: " + id + " at time: " + result.getUpdateTime());
    }

    /**
     * Retrieves a budget document by its ID for the specified user.
     *
     * @param id  The ID of the budget.
     * @param uid The authenticated user's UID.
     * @return The Budget object if found and if it belongs to the user.
     */
    public Budget getBudgetById(String id, String uid) throws ExecutionException, InterruptedException {
        DocumentReference documentReference = firestore.collection("budgets").document(id);
        DocumentSnapshot document = documentReference.get().get();
        if (document.exists()) {
            Budget budget = document.toObject(Budget.class);
            if (budget == null || !budget.getUserId().equals(uid)) {
                throw new RuntimeException("Unauthorized: Budget does not belong to the user");
            }
            budget.setId(document.getId());
            System.out.println("Found budget with ID: " + budget.getId() + " for user: " + uid);
            return budget;
        } else {
            throw new RuntimeException("Budget with ID " + id + " not found.");
        }
    }
    public void batchUpdateCategory(String uid, String oldCategory, String newCategory)
            throws ExecutionException, InterruptedException {
        // Normalise category names
        String normalizedOld = oldCategory.trim().toLowerCase();
        String normalizedNew = newCategory.trim().toLowerCase();

        WriteBatch batch = firestore.batch();

        // Update budgets collection
        CollectionReference budgetsRef = firestore.collection("budgets");
        Query budgetsQuery = budgetsRef.whereEqualTo("userId", uid);
        List<QueryDocumentSnapshot> budgetDocs = budgetsQuery.get().get().getDocuments();

        for (QueryDocumentSnapshot doc : budgetDocs) {
            Budget budget = doc.toObject(Budget.class);
            if (budget.getCategory().trim().toLowerCase().equals(normalizedOld)) {
                batch.update(doc.getReference(), "category", newCategory);
            }
        }

        // Update expenses collection
        CollectionReference expensesRef = firestore.collection("expenses");
        Query expensesQuery = expensesRef.whereEqualTo("userId", uid);
        List<QueryDocumentSnapshot> expenseDocs = expensesQuery.get().get().getDocuments();

        for (QueryDocumentSnapshot doc : expenseDocs) {
            Expense expense = doc.toObject(Expense.class);
            if (expense.getCategory().trim().toLowerCase().equals(normalizedOld)) {
                batch.update(doc.getReference(), "category", newCategory);
            }
        }

        // Commit batch update
        ApiFuture<List<WriteResult>> future = batch.commit();
        future.get();
    }

    public void deleteBudgetsByCategory(String uid, String category) throws ExecutionException, InterruptedException {
        CollectionReference budgetsRef = firestore.collection("budgets");
        Query query = budgetsRef.whereEqualTo("userId", uid).whereEqualTo("category", category);
        List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();
        WriteBatch batch = firestore.batch();
        for (QueryDocumentSnapshot doc : docs) {
            batch.delete(doc.getReference());
        }
        ApiFuture<List<WriteResult>> future = batch.commit();
        future.get();
    }
    public String deleteAllBudgets(String uid) throws ExecutionException, InterruptedException {
        CollectionReference budgetsCollection = firestore.collection("budgets");
        Query query = budgetsCollection.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        if (documents.isEmpty()) {
            throw new RuntimeException("No budgets found for user: " + uid);
        }

        for (QueryDocumentSnapshot document : documents) {
            document.getReference().delete();
        }

        return "All budgets deleted successfully.";
    }


}
