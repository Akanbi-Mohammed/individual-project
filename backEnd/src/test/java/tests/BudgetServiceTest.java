package tests;

import static org.mockito.Mockito.*;

import com.google.api.core.ApiFuture;
import com.google.cloud.Timestamp;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Budget;
import example.com.budgetTracker.model.Expense;
import example.com.budgetTracker.service.BudgetService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutionException;
import static org.junit.jupiter.api.Assertions.*;

class BudgetServiceTest {

    private Firestore firestore;
    private BudgetService budgetService;
    private CollectionReference budgetsCollection;
    private DocumentReference documentReference;

    @BeforeEach
    void setUp() {
        firestore = mock(Firestore.class);
        budgetsCollection = mock(CollectionReference.class);
        documentReference = mock(DocumentReference.class);
        budgetService = new BudgetService(firestore);
    }

    @Test
    void testAddBudget() throws ExecutionException, InterruptedException {
        Budget budget = new Budget();
        budget.setUserId("testUser");

        // Mock Firestore interactions
        ApiFuture<WriteResult> future = mock(ApiFuture.class);
        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.document()).thenReturn(documentReference);
        when(documentReference.getId()).thenReturn("generatedId");
        when(documentReference.set(any(Budget.class))).thenReturn(future);


        when(future.get()).thenReturn(null);

        budgetService.addBudget(budget);


        // Basic assertions
        assertEquals("generatedId", budget.getId());
        verify(documentReference).set(budget);
    }



    @Test
    void testGetAllBudgets() throws ExecutionException, InterruptedException {
        String uid = "testUser";
        Budget budget = new Budget();
        budget.setUserId(uid);

        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot docSnapshot = mock(QueryDocumentSnapshot.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(Collections.singletonList(docSnapshot));
        when(docSnapshot.toObject(Budget.class)).thenReturn(budget);
        when(docSnapshot.getId()).thenReturn("budget123");

        List<Budget> budgets = budgetService.getAllBudgets(uid);
        assertEquals(1, budgets.size());
        assertEquals(uid, budgets.get(0).getUserId());
        assertEquals("budget123", budgets.get(0).getId());
    }

    @Test
    void testSaveBudget_CreateNew() throws ExecutionException, InterruptedException {
        Budget budget = new Budget();
        budget.setUserId("testUser");

        ApiFuture<DocumentReference> future = mock(ApiFuture.class);
        DocumentReference newDocRef = mock(DocumentReference.class);
        when(newDocRef.getId()).thenReturn("newBudgetId");

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.add(budget)).thenReturn(future);
        when(future.get()).thenReturn(newDocRef);

        Budget saved = budgetService.saveBudget(budget);
        assertEquals("newBudgetId", saved.getId());
    }

    @Test
    void testDeleteBudget_NotFound() {
        String uid = "testUser";
        String id = "nonexistent";

        DocumentReference docRef = mock(DocumentReference.class);
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        try {
            when(firestore.collection("budgets")).thenReturn(budgetsCollection);
            when(budgetsCollection.document(id)).thenReturn(docRef);
            when(docRef.get()).thenReturn(future);
            when(future.get()).thenReturn(snapshot);
            when(snapshot.exists()).thenReturn(false);

            budgetService.deleteBudget(id, uid);
            fail("Expected RuntimeException");
        } catch (Exception e) {
            assertTrue(e instanceof RuntimeException);
            assertEquals("Budget with ID " + id + " not found.", e.getMessage());
        }
    }

    @Test
    void testGetBudgetById_Success() throws ExecutionException, InterruptedException {
        String uid = "testUser";
        String id = "budget123";
        Budget budget = new Budget();
        budget.setUserId(uid);

        DocumentReference docRef = mock(DocumentReference.class);
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.document(id)).thenReturn(docRef);
        when(docRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Budget.class)).thenReturn(budget);
        when(snapshot.getId()).thenReturn(id);

        Budget result = budgetService.getBudgetById(id, uid);
        assertEquals(id, result.getId());
        assertEquals(uid, result.getUserId());
    }

    @Test
    void testSaveBudget_UpdateExisting() throws ExecutionException, InterruptedException {
        Budget budget = new Budget();
        budget.setUserId("testUser");
        budget.setId("existingId");

        DocumentReference docRef = mock(DocumentReference.class);
        ApiFuture<DocumentSnapshot> getFuture = mock(ApiFuture.class);
        DocumentSnapshot docSnapshot = mock(DocumentSnapshot.class);
        ApiFuture<WriteResult> setFuture = mock(ApiFuture.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.document("existingId")).thenReturn(docRef);
        when(docRef.get()).thenReturn(getFuture);
        when(getFuture.get()).thenReturn(docSnapshot);
        when(docSnapshot.toObject(Budget.class)).thenReturn(budget);
        when(docRef.set(budget)).thenReturn(setFuture);
        when(setFuture.get()).thenReturn(null);  // ✅ no need to mock WriteResult

        Budget saved = budgetService.saveBudget(budget);
        assertEquals("existingId", saved.getId());
    }

    @Test
    void testDeleteBudget_Unauthorised() throws ExecutionException, InterruptedException {
        String id = "budgetId";
        String uid = "user123";

        Budget budget = new Budget();
        budget.setUserId("otherUser"); // Not the same as uid

        DocumentReference docRef = mock(DocumentReference.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.document(id)).thenReturn(docRef);
        when(docRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.toObject(Budget.class)).thenReturn(budget);

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            budgetService.deleteBudget(id, uid);
        });
        assertEquals("Unauthorized: Budget does not belong to the user", thrown.getMessage());
    }

    @Test
    void testDeleteAllBudgets_Success() throws ExecutionException, InterruptedException {
        String uid = "testUser";
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc1 = mock(QueryDocumentSnapshot.class);
        DocumentReference docRef1 = mock(DocumentReference.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(doc1));
        when(doc1.getReference()).thenReturn(docRef1);

        String result = budgetService.deleteAllBudgets(uid);
        assertEquals("All budgets deleted successfully.", result);
        verify(docRef1).delete();
    }

    @Test
    void testDeleteAllBudgets_Empty() throws ExecutionException, InterruptedException {
        String uid = "testUser";
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of());

        RuntimeException thrown = assertThrows(RuntimeException.class, () -> {
            budgetService.deleteAllBudgets(uid);
        });
        assertEquals("No budgets found for user: " + uid, thrown.getMessage());
    }

    @Test
    void testDeleteBudgetsByCategory() throws ExecutionException, InterruptedException {
        String uid = "testUser";
        String category = "Food";
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc = mock(QueryDocumentSnapshot.class);
        DocumentReference ref = mock(DocumentReference.class);
        WriteBatch batch = mock(WriteBatch.class);
        ApiFuture<List<WriteResult>> batchFuture = mock(ApiFuture.class);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.whereEqualTo("category", category)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(doc));
        when(doc.getReference()).thenReturn(ref);
        when(firestore.batch()).thenReturn(batch);
        when(batch.commit()).thenReturn(batchFuture);


        budgetService.deleteBudgetsByCategory(uid, category);
        verify(batch).delete(ref);
    }

    @Test
    void testBatchUpdateCategory() throws ExecutionException, InterruptedException {
        String uid = "testUser";
        String oldCategory = "Food";
        String newCategory = "Groceries";

        Query budgetQuery = mock(Query.class);
        Query expenseQuery = mock(Query.class);
        ApiFuture<QuerySnapshot> budgetFuture = mock(ApiFuture.class);
        ApiFuture<QuerySnapshot> expenseFuture = mock(ApiFuture.class);
        QuerySnapshot budgetSnapshot = mock(QuerySnapshot.class);
        QuerySnapshot expenseSnapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot budgetDoc = mock(QueryDocumentSnapshot.class);
        QueryDocumentSnapshot expenseDoc = mock(QueryDocumentSnapshot.class);
        Budget budget = mock(Budget.class);
        Expense expense = mock(Expense.class);
        DocumentReference budgetRef = mock(DocumentReference.class);
        DocumentReference expenseRef = mock(DocumentReference.class);
        WriteBatch batch = mock(WriteBatch.class);
        ApiFuture<List<WriteResult>> batchCommit = mock(ApiFuture.class);

        when(budget.getCategory()).thenReturn("  fOoD ");
        when(expense.getCategory()).thenReturn("FOOD");
        when(budgetDoc.toObject(Budget.class)).thenReturn(budget);
        when(expenseDoc.toObject(Expense.class)).thenReturn(expense);
        when(budgetDoc.getReference()).thenReturn(budgetRef);
        when(expenseDoc.getReference()).thenReturn(expenseRef);

        when(firestore.collection("budgets")).thenReturn(budgetsCollection);
        when(budgetsCollection.whereEqualTo("userId", uid)).thenReturn(budgetQuery);
        when(budgetQuery.get()).thenReturn(budgetFuture);
        when(budgetFuture.get()).thenReturn(budgetSnapshot);
        when(budgetSnapshot.getDocuments()).thenReturn(List.of(budgetDoc));

        // For expenses
        CollectionReference expensesCollection = mock(CollectionReference.class);
        when(firestore.collection("expenses")).thenReturn(expensesCollection);
        when(expensesCollection.whereEqualTo("userId", uid)).thenReturn(expenseQuery);
        when(expenseQuery.get()).thenReturn(expenseFuture);
        when(expenseFuture.get()).thenReturn(expenseSnapshot);
        when(expenseSnapshot.getDocuments()).thenReturn(List.of(expenseDoc));

        when(firestore.batch()).thenReturn(batch);
        when(batch.commit()).thenReturn(batchCommit);


        budgetService.batchUpdateCategory(uid, oldCategory, newCategory);

        verify(batch).update(budgetRef, "category", newCategory);
        verify(batch).update(expenseRef, "category", newCategory);
    }
}
