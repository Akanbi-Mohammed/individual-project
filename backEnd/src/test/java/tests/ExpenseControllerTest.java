package tests;

import example.com.budgetTracker.controller.ExpenseController;
import example.com.budgetTracker.model.Expense;
import example.com.budgetTracker.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ExpenseControllerTest {

    @InjectMocks
    private ExpenseController expenseController;

    @Mock
    private ExpenseService expenseService;

    private final String uid = "user123";

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        expenseController = Mockito.spy(new ExpenseController());
        ReflectionTestUtils.setField(expenseController, "expenseService", expenseService);
        doReturn(uid).when(expenseController).getUidFromAuthorization(anyString());
    }

    @Test
    void testAddExpense_Success() throws Exception {
        Expense expense = new Expense();
        when(expenseService.addExpense(any())).thenReturn("added successfully");

        ResponseEntity<String> response = expenseController.addExpense("Bearer test", expense);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("added successfully"));
    }

    @Test
    void testAddExpense_Failure() throws Exception {
        when(expenseService.addExpense(any())).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = expenseController.addExpense("Bearer test", new Expense());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Error adding"));
    }

    @Test
    void testGetAllExpenses_Success() throws Exception {
        when(expenseService.getAllExpenses(uid)).thenReturn(List.of(new Expense()));

        ResponseEntity<List<Expense>> response = expenseController.getAllExpenses("Bearer test");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, response.getBody().size());
    }

    @Test
    void testGetAllExpenses_Failure() throws Exception {
        when(expenseService.getAllExpenses(uid)).thenThrow(new RuntimeException("fail"));

        ResponseEntity<List<Expense>> response = expenseController.getAllExpenses("Bearer test");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testGetExpenseById_Success() throws Exception {
        Expense expense = new Expense();
        when(expenseService.getExpense("id123", uid)).thenReturn(expense);

        ResponseEntity<Expense> response = expenseController.getExpense("Bearer test", "id123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(expense, response.getBody());
    }

    @Test
    void testGetExpenseById_NotFound() throws Exception {
        when(expenseService.getExpense(any(), any())).thenThrow(new RuntimeException("Expense not found"));

        ResponseEntity<Expense> response = expenseController.getExpense("Bearer test", "id123");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNull(response.getBody());
    }

    @Test
    void testUpdateExpense_Success() throws Exception {
        when(expenseService.updateExpense(eq("id123"), any(), eq(uid))).thenReturn("updated");

        ResponseEntity<String> response = expenseController.updateExpense("Bearer test", "id123", new Expense());

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("updated", response.getBody());
    }

    @Test
    void testUpdateExpense_Failure() throws Exception {
        when(expenseService.updateExpense(any(), any(), any())).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = expenseController.updateExpense("Bearer test", "id123", new Expense());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteExpense_Success() throws Exception {
        doNothing().when(expenseService).deleteExpense("id123", uid);

        ResponseEntity<String> response = expenseController.deleteExpense("Bearer test", "id123");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("deleted"));
    }

    @Test
    void testDeleteExpense_Failure() throws Exception {
        doThrow(new RuntimeException("fail")).when(expenseService).deleteExpense(any(), any());

        ResponseEntity<String> response = expenseController.deleteExpense("Bearer test", "id123");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertTrue(response.getBody().contains("Error deleting"));
    }

    @Test
    void testDeleteAllExpenses_Success() throws Exception {
        when(expenseService.deleteAllExpenses(uid)).thenReturn("Deleted all");

        ResponseEntity<String> response = expenseController.deleteAllExpenses("Bearer test");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("Deleted all"));
    }

    @Test
    void testDeleteAllExpenses_Failure() throws Exception {
        when(expenseService.deleteAllExpenses(uid)).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = expenseController.deleteAllExpenses("Bearer test");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteExpensesByCategory_Success() throws Exception {
        doNothing().when(expenseService).deleteExpensesByCategory(uid, "Food");

        ResponseEntity<String> response = expenseController.deleteExpensesByCategory("Bearer test", "Food");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("deleted"));
    }

    @Test
    void testDeleteExpensesByCategory_Failure() throws Exception {
        doThrow(new RuntimeException("fail")).when(expenseService).deleteExpensesByCategory(uid, "Food");

        ResponseEntity<String> response = expenseController.deleteExpensesByCategory("Bearer test", "Food");

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testUpdateCategory_Success() throws Exception {
        doNothing().when(expenseService).updateCategory(uid, "old", "new");

        ResponseEntity<String> response = expenseController.updateExpenseCategory("Bearer test",
                Map.of("oldCategory", "old", "newCategory", "new"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("updated"));
    }

    @Test
    void testUpdateCategory_Failure() throws Exception {
        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(expenseService).updateCategory(uid, "old", "new");

        ResponseEntity<String> response = expenseController.updateExpenseCategory("Bearer test",
                Map.of("oldCategory", "old", "newCategory", "new"));

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testUpdateCategory_MissingField() {
        Map<String, String> badPayload = Map.of("onlyOneField", "oops");

        Exception ex = assertThrows(Exception.class, () ->
                expenseController.updateExpenseCategory("Bearer test", badPayload));

        assertTrue(ex.getMessage().contains("Missing oldCategory or newCategory"));
    }
}
