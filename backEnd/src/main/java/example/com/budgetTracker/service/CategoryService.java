package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Category;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final Firestore firestore;

    // Predefined categories for new users
    private static final List<String> DEFAULT_CATEGORIES = List.of(
            "Car Fuel",
            "Entertainment",
            "Groceries",
            "Insurance (Health, Car, Home, Life)",
            "Miscellaneous",
            "Rent/Mortgage",
            "School Fees",
            "Utilities (Electricity, Gas, Internet, Water)"
    );

    @Autowired
    public CategoryService(Firestore firestore) {
        this.firestore = firestore;
    }

    // 🔹 Get Categories (If First Time, Assign Defaults)
    public List<String> getCategories(String uid) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("categories").document(uid);
        DocumentSnapshot document = docRef.get().get();

        if (!document.exists()) {
            // No categories set for the user—initialize with defaults
            docRef.set(Map.of("categories", DEFAULT_CATEGORIES)).get();
            return new ArrayList<>(DEFAULT_CATEGORIES);
        } else {
            // Return exactly what's stored for this user
            List<String> userCategories = (List<String>) document.get("categories");
            return userCategories != null ? new ArrayList<>(userCategories) : new ArrayList<>();
        }
    }




    // 🔹 Update User Categories (Modify or Rename Any)
    public void updateCategories(String uid, List<String> newCategories) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("categories").document(uid);

        // Remove duplicates & ensure valid names
        List<String> filteredCategories = newCategories.stream()
                .filter(cat -> cat != null && !cat.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        docRef.set(Map.of("categories", filteredCategories), SetOptions.merge()).get();
    }

    // 🔹 Rename Category (Also Updates Budgets & Expenses)
    public void renameCategory(String uid, String oldCategory, String newCategory) throws ExecutionException, InterruptedException {
        if (oldCategory.equalsIgnoreCase(newCategory)) {
            throw new RuntimeException("New category name must be different.");
        }

        DocumentReference docRef = firestore.collection("categories").document(uid);
        DocumentSnapshot document = docRef.get().get();

        if (!document.exists()) {
            throw new RuntimeException("No categories found for user: " + uid);
        }

        List<String> categoryList = (List<String>) document.get("categories");
        if (categoryList == null || !categoryList.remove(oldCategory)) {
            throw new RuntimeException("Category '" + oldCategory + "' not found.");
        }

        categoryList.add(newCategory);
        docRef.update("categories", categoryList).get();

        // Also update budgets & expenses to reflect new category name
        updateBudgetsByCategory(uid, oldCategory, newCategory);
        updateExpensesByCategory(uid, oldCategory, newCategory);
    }

    // 🔹 Delete Category (Removes From Budgets & Expenses)
    public String deleteCategoryByName(String uid, String categoryName) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("categories").document(uid);
        DocumentSnapshot document = docRef.get().get();

        if (!document.exists()) {
            throw new RuntimeException("No categories found for user: " + uid);
        }

        List<String> categoryList = (List<String>) document.get("categories");
        if (categoryList == null || !categoryList.remove(categoryName)) {
            throw new RuntimeException("Category '" + categoryName + "' not found.");
        }

        docRef.update("categories", categoryList).get();

        // Delete associated budgets & expenses
        deleteBudgetsByCategory(uid, categoryName);
        deleteExpensesByCategory(uid, categoryName);

        return "Category '" + categoryName + "' and all related budgets/expenses deleted successfully.";
    }

    // 🔹 Delete All Categories (User's List is Cleared)
    public String deleteAllCategories(String uid) throws ExecutionException, InterruptedException {
        DocumentReference docRef = firestore.collection("categories").document(uid);
        docRef.delete().get();
        return "All categories deleted.";
    }

    // 🔹 Update Budgets When Category is Renamed
    private void updateBudgetsByCategory(String uid, String oldCategory, String newCategory) throws ExecutionException, InterruptedException {
        CollectionReference budgetsRef = firestore.collection("budgets");
        Query query = budgetsRef.whereEqualTo("userId", uid).whereEqualTo("category", oldCategory);
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

        WriteBatch batch = firestore.batch();
        for (DocumentSnapshot doc : documents) {
            batch.update(doc.getReference(), "category", newCategory);
        }
        batch.commit().get();
    }

    // 🔹 Update Expenses When Category is Renamed
    private void updateExpensesByCategory(String uid, String oldCategory, String newCategory) throws ExecutionException, InterruptedException {
        CollectionReference expensesRef = firestore.collection("expenses");
        Query query = expensesRef.whereEqualTo("userId", uid).whereEqualTo("category", oldCategory);
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

        WriteBatch batch = firestore.batch();
        for (DocumentSnapshot doc : documents) {
            batch.update(doc.getReference(), "category", newCategory);
        }
        batch.commit().get();
    }

    // 🔹 Delete All Budgets for a Category
    private void deleteBudgetsByCategory(String uid, String categoryName) throws ExecutionException, InterruptedException {
        CollectionReference budgetsRef = firestore.collection("budgets");
        Query query = budgetsRef.whereEqualTo("userId", uid).whereEqualTo("category", categoryName);
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

        WriteBatch batch = firestore.batch();
        for (DocumentSnapshot doc : documents) {
            batch.delete(doc.getReference());
        }
        batch.commit().get();
    }

    // 🔹 Delete All Expenses for a Category
    private void deleteExpensesByCategory(String uid, String categoryName) throws ExecutionException, InterruptedException {
        CollectionReference expensesRef = firestore.collection("expenses");
        Query query = expensesRef.whereEqualTo("userId", uid).whereEqualTo("category", categoryName);
        List<QueryDocumentSnapshot> documents = query.get().get().getDocuments();

        WriteBatch batch = firestore.batch();
        for (DocumentSnapshot doc : documents) {
            batch.delete(doc.getReference());
        }
        batch.commit().get();
    }
}
