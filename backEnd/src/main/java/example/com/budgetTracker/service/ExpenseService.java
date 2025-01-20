package example.com.budgetTracker.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Expense;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    // Method to add a new expense
    public String addExpense(Expense expense) throws InterruptedException, ExecutionException {
        // Generate a smaller unique ID based on the current time and a random increment
        long id = (System.currentTimeMillis() / 1000) + ThreadLocalRandom.current().nextInt(1, 1000);
        expense.setId(id);

        // Create a new document reference using this smaller ID as the document ID
        DocumentReference documentReference = firestore.collection("expenses").document(String.valueOf(id));

        // Save the expense object
        ApiFuture<WriteResult> writeResult = documentReference.set(expense);

        // Return success message with update time
        return "Expense added successfully at: " + writeResult.get().getUpdateTime();
    }


    // Method to get an expense by its ID
    public Expense getExpense(String expenseId) throws InterruptedException, ExecutionException {
        DocumentReference documentReference = firestore.collection("expenses").document(expenseId);
        ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = documentReference.get();
        com.google.cloud.firestore.DocumentSnapshot document = future.get();
        if (document.exists()) {
            return document.toObject(Expense.class);
        } else {
            throw new RuntimeException("Expense not found");
        }
    }

    // Method to update an expense by its ID
    public String updateExpense(Long expenseId, Expense expense) throws InterruptedException, ExecutionException {
        // Reference the document by ID
        DocumentReference documentReference = firestore.collection("expenses").document(String.valueOf(expenseId));

        // Set the existing ID in the expense object to avoid overwriting it
        expense.setId(expenseId);

        // Perform the update operation

        ApiFuture<WriteResult> writeResult = documentReference.set(expense);



        // Return a success message with the update time
        return "Expense updated successfully at: " + writeResult.get().getUpdateTime();
    }

    public void deleteExpense(Long expenseId) throws InterruptedException, ExecutionException {
        // Reference the Firestore collection and document based on the ID
        DocumentReference documentReference = firestore.collection("expenses").document(String.valueOf(expenseId));

        // Execute the delete operation on the document
        ApiFuture<WriteResult> writeResult = documentReference.delete();

        // Ensure the operation is complete before proceeding
        writeResult.get();
    }

    public List<Expense> getAllExpenses() {
        List<Expense> expenses = new ArrayList<>();
        CollectionReference expensesRef = firestore.collection("expenses");

        try {
            QuerySnapshot querySnapshot = expensesRef.get().get();
            for (QueryDocumentSnapshot document : querySnapshot.getDocuments()) {
                Expense expense = document.toObject(Expense.class);
                expenses.add(expense);
            }
        } catch (InterruptedException | ExecutionException e) {
            e.printStackTrace();
        }

        return expenses;
    }


}
