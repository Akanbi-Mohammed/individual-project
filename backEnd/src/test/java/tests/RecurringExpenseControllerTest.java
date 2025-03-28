package tests;

import example.com.budgetTracker.controller.RecurringExpenseController;
import example.com.budgetTracker.model.RecurringExpense;
import example.com.budgetTracker.service.RecurringExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.ResponseEntity;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RecurringExpenseControllerTest {

    @InjectMocks
    private RecurringExpenseController controller;

    @Mock
    private RecurringExpenseService recurringExpenseService;

    private final String uid = "mockUid";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        controller = Mockito.spy(new RecurringExpenseController());
        controller.recurringExpenseService = recurringExpenseService;
        doReturn(uid).when(controller).getUidFromAuthorization(anyString());
    }

    @Test
    void testAddRecurringExpense_Success() throws ExecutionException, InterruptedException {
        RecurringExpense rec = new RecurringExpense();
        when(recurringExpenseService.addRecurringExpense(any())).thenReturn("mockId");
        doNothing().when(recurringExpenseService).syncRecurringExpenses(uid);

        ResponseEntity<String> response = controller.addRecurringExpense("Bearer mockToken", rec);
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("mockId"));
    }

    @Test
    void testAddRecurringExpense_Failure() throws ExecutionException, InterruptedException {
        RecurringExpense rec = new RecurringExpense();
        when(recurringExpenseService.addRecurringExpense(any())).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = controller.addRecurringExpense("Bearer mockToken", rec);
        assertEquals(500, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Error adding recurring expense"));
    }

    @Test
    void testGetRecurringExpenses_Success() throws ExecutionException, InterruptedException {
        List<RecurringExpense> mockList = new ArrayList<>();
        mockList.add(new RecurringExpense());
        when(recurringExpenseService.getRecurringExpenses(uid)).thenReturn(mockList);

        ResponseEntity<List<RecurringExpense>> response = controller.getRecurringExpenses("Bearer mockToken");
        assertEquals(200, response.getStatusCodeValue());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testGetRecurringExpenses_Failure() throws ExecutionException, InterruptedException {
        when(recurringExpenseService.getRecurringExpenses(uid)).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<List<RecurringExpense>> response = controller.getRecurringExpenses("Bearer mockToken");
        assertEquals(500, response.getStatusCodeValue());
    }

    @Test
    void testUpdateRecurringExpense_Success() throws ExecutionException, InterruptedException {
        RecurringExpense rec = new RecurringExpense();
        doNothing().when(recurringExpenseService).updateRecurringExpense(anyString(), any());

        ResponseEntity<String> response = controller.updateRecurringExpense("Bearer mockToken", "123", rec);
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("updated successfully"));
    }

    @Test
    void testUpdateRecurringExpense_Failure() throws ExecutionException, InterruptedException {
        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(recurringExpenseService).updateRecurringExpense(anyString(), any());

        ResponseEntity<String> response = controller.updateRecurringExpense("Bearer mockToken", "123", new RecurringExpense());
        assertEquals(500, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Error updating"));
    }

    @Test
    void testDeleteRecurringExpense_Success() throws ExecutionException, InterruptedException {
        doNothing().when(recurringExpenseService).deleteRecurringExpense("123");

        ResponseEntity<String> response = controller.deleteRecurringExpense("Bearer mockToken", "123");
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("deleted successfully"));
    }

    @Test
    void testDeleteRecurringExpense_Failure() throws ExecutionException, InterruptedException {
        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(recurringExpenseService).deleteRecurringExpense("123");

        ResponseEntity<String> response = controller.deleteRecurringExpense("Bearer mockToken", "123");
        assertEquals(500, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Error deleting"));
    }

    @Test
    void testSyncRecurringExpenses_Success() throws ExecutionException, InterruptedException {
        doNothing().when(recurringExpenseService).syncRecurringExpenses(uid);

        ResponseEntity<String> response = controller.syncRecurringExpenses("Bearer mockToken");
        assertEquals(200, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("synced successfully"));
    }

    @Test
    void testSyncRecurringExpenses_Failure() throws ExecutionException, InterruptedException {
        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(recurringExpenseService).syncRecurringExpenses(uid);

        ResponseEntity<String> response = controller.syncRecurringExpenses("Bearer mockToken");
        assertEquals(500, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Error syncing"));
    }

    @Test
    void testDeleteAllRecurringExpenses_Success() throws ExecutionException, InterruptedException {
        when(recurringExpenseService.deleteAllRecurringExpenses(uid)).thenReturn("All deleted");

        ResponseEntity<String> response = controller.deleteAllRecurringExpenses("Bearer mockToken");
        assertEquals(200, response.getStatusCodeValue());
        assertEquals("All deleted", response.getBody());
    }

    @Test
    void testDeleteAllRecurringExpenses_Failure() throws ExecutionException, InterruptedException {
        when(recurringExpenseService.deleteAllRecurringExpenses(uid))
                .thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = controller.deleteAllRecurringExpenses("Bearer mockToken");
        assertEquals(500, response.getStatusCodeValue());
        assertTrue(response.getBody().contains("Error deleting recurring expenses"));
    }
}
