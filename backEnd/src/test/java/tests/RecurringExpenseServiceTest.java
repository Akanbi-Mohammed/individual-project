package tests;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.RecurringExpense;
import example.com.budgetTracker.service.ExpenseService;
import example.com.budgetTracker.service.RecurringExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import java.util.*;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RecurringExpenseServiceTest {

    @Mock
    private Firestore firestore;

    @Mock
    private ExpenseService expenseService;

    @InjectMocks
    private RecurringExpenseService recurringExpenseService;

    @Mock
    private CollectionReference collectionRef;

    @Mock
    private DocumentReference docRef;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(firestore.collection("recurringExpenses")).thenReturn(collectionRef);
    }

    @Test
    void testAddRecurringExpense() throws Exception {
        RecurringExpense recurring = new RecurringExpense();
        when(collectionRef.document()).thenReturn(docRef);
        when(docRef.getId()).thenReturn("recur123");

        ApiFuture<WriteResult> future = mock(ApiFuture.class);
        when(docRef.set(recurring)).thenReturn(future);
        when(future.get()).thenReturn(null);

        String result = recurringExpenseService.addRecurringExpense(recurring);

        assertEquals("recur123", result);
        verify(docRef).set(recurring);
    }

    @Test
    void testGetRecurringExpenses() throws Exception {
        String uid = "user123";
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc = mock(QueryDocumentSnapshot.class);
        RecurringExpense recurring = new RecurringExpense();
        recurring.setUserId(uid);

        when(collectionRef.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(doc));
        when(doc.toObject(RecurringExpense.class)).thenReturn(recurring);
        when(doc.getId()).thenReturn("recur123");

        List<RecurringExpense> list = recurringExpenseService.getRecurringExpenses(uid);
        assertEquals(1, list.size());
        assertEquals("user123", list.get(0).getUserId());
        assertEquals("recur123", list.get(0).getId());
    }

    @Test
    void testUpdateRecurringExpense() throws Exception {
        String id = "rec123";
        RecurringExpense updated = new RecurringExpense();
        DocumentReference docRef = mock(DocumentReference.class);
        ApiFuture<WriteResult> future = mock(ApiFuture.class);

        when(firestore.collection("recurringExpenses")).thenReturn(collectionRef);
        when(collectionRef.document(id)).thenReturn(docRef);
        when(docRef.set(updated, SetOptions.merge())).thenReturn(future);
        when(future.get()).thenReturn(null);

        recurringExpenseService.updateRecurringExpense(id, updated);
        verify(docRef).set(updated, SetOptions.merge());
    }

    @Test
    void testDeleteRecurringExpense() throws Exception {
        String id = "rec123";
        DocumentReference docRef = mock(DocumentReference.class);
        ApiFuture<WriteResult> future = mock(ApiFuture.class);

        when(firestore.collection("recurringExpenses")).thenReturn(collectionRef);
        when(collectionRef.document(id)).thenReturn(docRef);
        when(docRef.delete()).thenReturn(future);
        when(future.get()).thenReturn(null);

        recurringExpenseService.deleteRecurringExpense(id);
        verify(docRef).delete();
    }

    @Test
    void testDeleteAllRecurringExpenses() throws Exception {
        String uid = "user123";
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);
        QueryDocumentSnapshot doc1 = mock(QueryDocumentSnapshot.class);

        when(collectionRef.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(List.of(doc1));
        when(doc1.getReference()).thenReturn(docRef);
        when(docRef.delete()).thenReturn(mock(ApiFuture.class));

        String result = recurringExpenseService.deleteAllRecurringExpenses(uid);

        assertEquals("All recurring expenses deleted successfully.", result);
        verify(docRef, times(1)).delete();
    }

    @Test
    void testDeleteAllRecurringExpenses_Empty() throws Exception {
        String uid = "user123";
        Query query = mock(Query.class);
        ApiFuture<QuerySnapshot> future = mock(ApiFuture.class);
        QuerySnapshot snapshot = mock(QuerySnapshot.class);

        when(collectionRef.whereEqualTo("userId", uid)).thenReturn(query);
        when(query.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.getDocuments()).thenReturn(Collections.emptyList());

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> recurringExpenseService.deleteAllRecurringExpenses(uid));

        assertEquals("No recurring expenses found for user: " + uid, ex.getMessage());
    }
}
