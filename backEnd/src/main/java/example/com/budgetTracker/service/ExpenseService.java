package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Expense;
import example.com.budgetTracker.model.RecurringExpense;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class ExpenseService {

    @Autowired
    private Firestore firestore;

    public ExpenseService(Firestore firestore) {
        this.firestore = firestore;
    }

    public String addExpense(Expense expense) throws InterruptedException, ExecutionException {
        long id = (System.currentTimeMillis() / 1000) + ThreadLocalRandom.current().nextInt(1, 1000);
        expense.setId(id);
        System.out.println("Adding expense with generated id: " + id);

        DocumentReference documentReference = firestore.collection("expenses")
                .document(String.valueOf(id));

        ApiFuture<WriteResult> writeResult = documentReference.set(expense);
        WriteResult result = writeResult.get();

        String updateTime = (result != null && result.getUpdateTime() != null)
                ? result.getUpdateTime().toString()
                : "unknown";

        System.out.println("Expense updated at: " + updateTime);
        return "Expense updated successfully at: " + updateTime;
    }

    public Expense getExpense(String expenseId, String uid) throws InterruptedException, ExecutionException {
        System.out.println("Fetching expense with id: " + expenseId + " for uid: " + uid);
        DocumentReference documentReference = firestore.collection("expenses").document(expenseId);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Expense expense = document.toObject(Expense.class);
            if (expense != null && expense.getUserId() != null && expense.getUserId().equals(uid)) {
                System.out.println("Expense found and authorized.");
                return expense;
            } else {
                throw new RuntimeException("Unauthorized: Expense does not belong to the user");
            }
        } else {
            throw new RuntimeException("Expense not found");
        }
    }

    public String updateExpense(String expenseId, Expense expense, String uid) throws InterruptedException, ExecutionException {
        System.out.println("Updating expense with id: " + expenseId + " for uid: " + uid);
        DocumentReference documentReference = firestore.collection("expenses").document(expenseId);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Expense existingExpense = document.toObject(Expense.class);
            if (existingExpense != null && existingExpense.getUserId() != null && existingExpense.getUserId().equals(uid)) {
                expense.setId(existingExpense.getId());
                expense.setUserId(uid);
                ApiFuture<WriteResult> writeResult = documentReference.set(expense);
                WriteResult result = writeResult.get();

                String updateTime = (result != null && result.getUpdateTime() != null)
                        ? result.getUpdateTime().toString()
                        : "unknown";

                System.out.println("Expense updated at: " + updateTime);
                return "Expense updated successfully at: " + updateTime;

            } else {
                throw new RuntimeException("Unauthorized: Expense does not belong to the user");
            }
        } else {
            throw new RuntimeException("Expense not found");
        }
    }

    public void deleteExpense(String expenseId, String uid) throws InterruptedException, ExecutionException {
        System.out.println("Deleting expense with id: " + expenseId + " for uid: " + uid);
        DocumentReference documentReference = firestore.collection("expenses").document(expenseId);
        ApiFuture<DocumentSnapshot> future = documentReference.get();
        DocumentSnapshot document = future.get();

        if (document.exists()) {
            Expense existingExpense = document.toObject(Expense.class);
            if (existingExpense != null && existingExpense.getUserId() != null && existingExpense.getUserId().equals(uid)) {
                ApiFuture<WriteResult> writeResult = documentReference.delete();
                writeResult.get();
                System.out.println("Expense deleted successfully.");
            } else {
                throw new RuntimeException("Unauthorized: Expense does not belong to the user");
            }
        } else {
            throw new RuntimeException("Expense not found");
        }
    }

    public List<Expense> getAllExpenses(String uid) {
        System.out.println("Fetching all expenses for uid: " + uid);
        List<Expense> expenses = new ArrayList<>();
        CollectionReference expensesRef = firestore.collection("expenses");

        try {
            Query query = expensesRef.whereEqualTo("userId", uid);
            QuerySnapshot querySnapshot = query.get().get();
            System.out.println("Number of expenses found: " + querySnapshot.size());
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Expense expense = document.toObject(Expense.class);
                expenses.add(expense);
            }
        } catch (InterruptedException | ExecutionException e) {
            System.err.println("Error fetching expenses: " + e.getMessage());
            e.printStackTrace();
        }
        return expenses;
    }

    public void deleteExpensesByCategory(String uid, String category) throws ExecutionException, InterruptedException {
        CollectionReference expensesRef = firestore.collection("expenses");
        Query query = expensesRef.whereEqualTo("userId", uid).whereEqualTo("category", category);
        List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();
        WriteBatch batch = firestore.batch();
        for (QueryDocumentSnapshot doc : docs) {
            batch.delete(doc.getReference());
        }
        ApiFuture<List<WriteResult>> future = batch.commit();
        future.get();
    }

    public boolean existsRecurringExpense(String uid, String recurringExpenseId, String periodIdentifier) throws ExecutionException, InterruptedException {
        CollectionReference expensesRef = firestore.collection("expenses");
        Query query = expensesRef.whereEqualTo("userId", uid)
                .whereEqualTo("recurringExpenseId", recurringExpenseId)
                .whereEqualTo("periodIdentifier", periodIdentifier);
        QuerySnapshot snapshot = query.get().get();
        return !snapshot.isEmpty();
    }

    public void createExpenseFromRecurring(String uid, RecurringExpense rec, String periodIdentifier)
            throws ExecutionException, InterruptedException {
        Expense expense = new Expense();
        long id = (System.currentTimeMillis() / 1000) + ThreadLocalRandom.current().nextInt(1, 1000);
        expense.setId(id);
        expense.setUserId(uid);
        expense.setCategory(rec.getCategory());
        expense.setAmount(rec.getAmount());

        // Use the recurring expense's billingDay to set the date
        LocalDate now = LocalDate.now(ZoneId.of("UTC"));
        LocalDate dateForExpense = now.withDayOfMonth(rec.getBillingDay());
        expense.setDate(String.valueOf(java.sql.Date.valueOf(dateForExpense)));

        // The big change: set the normal expense's "description" from the recurring expense's "description"
        expense.setDescription(rec.getDescription());

        // Mark it as coming from this recurring expense
        expense.setRecurringExpenseId(rec.getId());
        expense.setPeriodIdentifier(periodIdentifier);

        DocumentReference documentReference = firestore.collection("expenses").document(String.valueOf(id));
        ApiFuture<WriteResult> writeResult = documentReference.set(expense);
        WriteResult result = writeResult.get();
        String updateTime = (result != null && result.getUpdateTime() != null)
                ? result.getUpdateTime().toString()
                : "unknown";

        System.out.println("Recurring expense added as expense at: " + updateTime);
    }
    public String deleteAllExpenses(String uid) throws ExecutionException, InterruptedException {
        CollectionReference expensesCollection = firestore.collection("expenses");
        Query query = expensesCollection.whereEqualTo("userId", uid);
        ApiFuture<QuerySnapshot> future = query.get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();

        if (documents.isEmpty()) {
            throw new RuntimeException("No expenses found for user: " + uid);
        }

        for (QueryDocumentSnapshot document : documents) {
            document.getReference().delete();
        }

        return "All expenses deleted successfully.";
    }
    public void updateCategory(String uid, String oldCategory, String newCategory) throws ExecutionException, InterruptedException {
        CollectionReference expensesRef = firestore.collection("expenses");
        Query query = expensesRef.whereEqualTo("userId", uid);
        List<QueryDocumentSnapshot> docs = query.get().get().getDocuments();

        WriteBatch batch = firestore.batch();
        for (QueryDocumentSnapshot doc : docs) {
            Expense expense = doc.toObject(Expense.class);
            if (expense.getCategory().trim().toLowerCase().equals(oldCategory.trim().toLowerCase())) {
                batch.update(doc.getReference(), "category", newCategory);
            }
        }

        ApiFuture<List<WriteResult>> future = batch.commit();
        future.get();
    }


}
