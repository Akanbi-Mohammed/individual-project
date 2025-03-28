package tests;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import example.com.budgetTracker.model.Income;
import example.com.budgetTracker.service.IncomeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class IncomeServiceTest {

    private Firestore firestore;
    private IncomeService incomeService;
    private DocumentReference docRef;

    @BeforeEach
    void setUp() {
        firestore = mock(Firestore.class);
        docRef = mock(DocumentReference.class);
        incomeService = new IncomeService(firestore);
    }

    @Test
    void testUpdateIncome() throws ExecutionException, InterruptedException {
        Income income = new Income("user123", "2025-03", 3000.0);
        CollectionReference incomesCollection = mock(CollectionReference.class);
        ApiFuture<WriteResult> future = mock(ApiFuture.class);

        when(firestore.collection("incomes")).thenReturn(incomesCollection);
        when(incomesCollection.document("user123")).thenReturn(docRef);
        when(docRef.set(anyMap(), eq(SetOptions.merge()))).thenReturn(future);
        when(future.get()).thenReturn(null); // ✅ No mocking WriteResult

        incomeService.updateIncome(income);

        verify(docRef).set(argThat(map ->
                "user123".equals(map.get("userId")) &&
                        map.containsKey("2025-03") &&
                        ((Double) map.get("2025-03")) == 3000.0
        ), eq(SetOptions.merge()));
    }


    @Test
    void testGetIncome_WhenExists() throws ExecutionException, InterruptedException {
        // Arrange
        String userId = "user123";
        String month = "2025-03";
        double expectedAmount = 4500.0;

        CollectionReference incomesCollection = mock(CollectionReference.class);
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        when(firestore.collection("incomes")).thenReturn(incomesCollection);
        when(incomesCollection.document(userId)).thenReturn(docRef);
        when(docRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(true);
        when(snapshot.getDouble(month)).thenReturn(expectedAmount);

        // Act
        Income result = incomeService.getIncome(userId, month);

        // Assert
        assertNotNull(result);
        assertEquals(userId, result.getUserId());
        assertEquals(month, result.getMonth());
        assertEquals(expectedAmount, result.getAmount());
    }


    @Test
    void testGetIncome_WhenMissingOrNotExists() throws ExecutionException, InterruptedException {
        CollectionReference incomesCollection = mock(CollectionReference.class);
        ApiFuture<DocumentSnapshot> future = mock(ApiFuture.class);
        DocumentSnapshot snapshot = mock(DocumentSnapshot.class);

        when(firestore.collection("incomes")).thenReturn(incomesCollection);
        when(incomesCollection.document("user123")).thenReturn(docRef);
        when(docRef.get()).thenReturn(future);
        when(future.get()).thenReturn(snapshot);
        when(snapshot.exists()).thenReturn(false);

        Income result = incomeService.getIncome("user123", "2025-03");

        assertEquals("user123", result.getUserId());
        assertEquals("2025-03", result.getMonth());
        assertEquals(0.0, result.getAmount());
    }
}

