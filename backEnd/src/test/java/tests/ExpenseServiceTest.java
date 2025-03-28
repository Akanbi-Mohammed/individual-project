package tests;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Expense;
import example.com.budgetTracker.model.RecurringExpense;
import example.com.budgetTracker.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ExpenseServiceTest {

    private Firestore firestore;
    private ExpenseService expenseService;
    private CollectionReference collectionRef;
    private DocumentReference docRef;

    @BeforeEach
    void setup() {
        firestore = mock(Firestore.class);
        expenseService = new ExpenseService(firestore);
        collectionRef = mock(CollectionReference.class);
        docRef = mock(DocumentReference.class);
        when(firestore.collection("expenses")).thenReturn(collectionRef);
    }

    @Test
    void testAddExpense() throws Exception {
        Expense expense = new Expense();
        expense.setUserId("user123");

        ApiFuture<WriteResult> writeFuture = mock(ApiFuture.class);

        when(collectionRef.document(anyString())).thenReturn(docRef);
        when(docRef.set(any(Expense.class))).thenReturn(writeFuture);
        when(writeFuture.get()).thenReturn(null); // ✅ Avoid mocking WriteResult

        String result = expenseService.addExpense(expense);

        assertTrue(result.contains("updated successfully at"));

        verify(docRef).set(expense);
    }

    @Test
    void testGetExpense_Valid() throws Exception {
        Expense mockExpense = new Expense();
        mockExpense.setUserId("user123");

        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        when(collectionRef.document("exp1")).thenReturn(docRef);
        when(docRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Expense.class)).thenReturn(mockExpense);

        Expense found = expenseService.getExpense("exp1", "user123");

        assertEquals("user123", found.getUserId());
    }

    @Test
    void testUpdateExpense_Success() throws Exception {
        Expense existing = new Expense();
        existing.setId(1L);
        existing.setUserId("user123");

        Expense update = new Expense();
        update.setAmount(100.0);

        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        ApiFuture<WriteResult> writeFuture = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        when(collectionRef.document("exp1")).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Expense.class)).thenReturn(existing);
        when(docRef.set(any(Expense.class))).thenReturn(writeFuture);
        when(writeFuture.get()).thenReturn(null); // ✅ No mocking final class

        String result = expenseService.updateExpense("exp1", update, "user123");

        assertTrue(result.startsWith("Expense updated successfully"));
        verify(docRef).set(any(Expense.class));
    }


    @Test
    void testDeleteExpense() throws Exception {
        Expense mockExpense = new Expense();
        mockExpense.setUserId("user123");

        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        ApiFuture<WriteResult> deleteFuture = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        when(collectionRef.document("exp1")).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Expense.class)).thenReturn(mockExpense);
        when(docRef.delete()).thenReturn(deleteFuture);
        when(deleteFuture.get()).thenReturn(null); // ✅ Replace mocked WriteResult with null

        expenseService.deleteExpense("exp1", "user123");

        verify(docRef).delete(); // ✅ This is your actual assertion
    }

    @Test
    void testDeleteExpensesByCategory() throws Exception {
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot docSnap = mock(QueryDocumentSnapshot.class);

        WriteBatch batch = mock(WriteBatch.class);
        ApiFuture<List<WriteResult>> batchFuture = mock(ApiFuture.class);

        when(collectionRef.whereEqualTo("userId", "user123")).thenReturn(query);
        when(query.whereEqualTo("category", "Food")).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(docSnap));
        when(docSnap.getReference()).thenReturn(docRef);
        when(firestore.batch()).thenReturn(batch);
        when(batch.delete(docRef)).thenReturn(batch);
        when(batch.commit()).thenReturn(batchFuture);
        when(batchFuture.get()).thenReturn(List.of());

        expenseService.deleteExpensesByCategory("user123", "Food");

        verify(batch).commit();
    }

    @Test
    void testExistsRecurringExpense_ReturnsTrue() throws Exception {
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);

        when(collectionRef.whereEqualTo("userId", "user123")).thenReturn(query);
        when(query.whereEqualTo("recurringExpenseId", "rec1")).thenReturn(query);
        when(query.whereEqualTo("periodIdentifier", "2025-03")).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.isEmpty()).thenReturn(false);

        boolean exists = expenseService.existsRecurringExpense("user123", "rec1", "2025-03");

        assertTrue(exists);
    }

    @Test
    void testDeleteAllExpenses_Success() throws Exception {
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc = mock(QueryDocumentSnapshot.class);

        when(collectionRef.whereEqualTo("userId", "user123")).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(doc));
        when(doc.getReference()).thenReturn(docRef);
        when(docRef.delete()).thenReturn(mock(ApiFuture.class));

        String result = expenseService.deleteAllExpenses("user123");

        assertEquals("All expenses deleted successfully.", result);
    }

    @Test
    void testUpdateCategory_MatchingCategory() throws Exception {
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc = mock(QueryDocumentSnapshot.class);
        Expense expense = new Expense();
        expense.setCategory("Food");

        WriteBatch batch = mock(WriteBatch.class);
        ApiFuture<List<WriteResult>> batchFuture = mock(ApiFuture.class);

        when(collectionRef.whereEqualTo("userId", "user123")).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(doc));
        when(doc.toObject(Expense.class)).thenReturn(expense);
        when(doc.getReference()).thenReturn(docRef);
        when(firestore.batch()).thenReturn(batch);
        when(batch.update(docRef, "category", "Groceries")).thenReturn(batch);
        when(batch.commit()).thenReturn(batchFuture);
        when(batchFuture.get()).thenReturn(List.of());

        expenseService.updateCategory("user123", "Food", "Groceries");

        verify(batch).update(docRef, "category", "Groceries");
    }

    @Test
    void testCreateExpenseFromRecurring() throws Exception {
        RecurringExpense rec = new RecurringExpense();
        rec.setId("rec1");
        rec.setCategory("Bills");
        rec.setAmount(50.0);
        rec.setBillingDay(5);
        rec.setDescription("Electric");

        when(collectionRef.document(anyString())).thenReturn(docRef);
        when(docRef.set(any(Expense.class))).thenReturn(mock(ApiFuture.class));

        expenseService.createExpenseFromRecurring("user123", rec, "2025-03");

        verify(docRef).set(any(Expense.class));
    }
}
