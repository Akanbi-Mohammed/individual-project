package tests;

import example.com.budgetTracker.controller.BudgetController;
import example.com.budgetTracker.model.Budget;
import example.com.budgetTracker.service.BudgetService;
import example.com.budgetTracker.service.ExpenseService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetControllerTest {

    @Spy
    @InjectMocks
    private BudgetController budgetController;

    @Mock
    private BudgetService budgetService;

    @Mock
    private ExpenseService expenseService;

    private final String uid = "user123";

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(budgetController, "budgetService", budgetService);
        ReflectionTestUtils.setField(budgetController, "expenseService", expenseService);
        doReturn(uid).when(budgetController).getUidFromAuthorization(anyString());
    }

    @Test
    void testAddBudget_Success() throws Exception {
        Budget budget = new Budget();
        when(budgetService.addBudget(any())).thenReturn("2025-03-27");

        ResponseEntity<String> response = budgetController.addBudget("Bearer token", budget);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().contains("Budget added successfully"));
    }

    @Test
    void testAddBudget_Failure() throws Exception {
        Budget budget = new Budget();
        when(budgetService.addBudget(any())).thenThrow(new ExecutionException(new RuntimeException("fail")));

        ResponseEntity<String> response = budgetController.addBudget("Bearer token", budget);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testGetAllBudgets_Success() throws Exception {
        when(budgetService.getAllBudgets(uid)).thenReturn(List.of(new Budget()));
        ResponseEntity<List<Budget>> response = budgetController.getAllBudgets("Bearer token");
        assertEquals(1, response.getBody().size());
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testGetAllBudgets_Failure() throws Exception {
        when(budgetService.getAllBudgets(uid)).thenThrow(new ExecutionException(new RuntimeException("fail")));
        ResponseEntity<List<Budget>> response = budgetController.getAllBudgets("Bearer token");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testEditBudget_Success() throws Exception {
        Budget existing = new Budget();
        existing.setUserId(uid);
        Budget update = new Budget();
        update.setCategory("Housing");
        update.setAmount(1000);
        update.setMonth("2025-03");

        when(budgetService.getBudgetById("budget123", uid)).thenReturn(existing);
        when(budgetService.saveBudget(any())).thenReturn(update);

        ResponseEntity<Budget> response = budgetController.editBudget("Bearer token", "budget123", update);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Housing", response.getBody().getCategory());
    }

    @Test
    void testEditBudget_NotFound() throws Exception {
        when(budgetService.getBudgetById("budget123", uid)).thenReturn(null);
        ResponseEntity<Budget> response = budgetController.editBudget("Bearer token", "budget123", new Budget());
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testEditBudget_Failure() throws Exception {
        when(budgetService.getBudgetById(any(), any())).thenThrow(new ExecutionException(new RuntimeException("fail")));
        ResponseEntity<Budget> response = budgetController.editBudget("Bearer token", "budget123", new Budget());
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteBudget_Success() throws Exception {
        doNothing().when(budgetService).deleteBudget("budget123", uid);
        ResponseEntity<String> response = budgetController.deleteBudget("Bearer token", "budget123");
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testDeleteBudget_Failure() throws Exception {
        doThrow(new ExecutionException(new RuntimeException("fail"))).when(budgetService).deleteBudget(any(), any());
        ResponseEntity<String> response = budgetController.deleteBudget("Bearer token", "budget123");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testUpdateCategory_Success() throws Exception {
        Map<String, String> payload = Map.of("oldCategory", "Old", "newCategory", "New");
        doNothing().when(budgetService).batchUpdateCategory(uid, "Old", "New");

        ResponseEntity<String> response = budgetController.updateBudgetCategory("Bearer token", payload);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testUpdateCategory_MissingField() {
        Map<String, String> payload = Map.of("oldCategory", "Old");
        Exception ex = assertThrows(Exception.class, () ->
                budgetController.updateBudgetCategory("Bearer token", payload));
        assertTrue(ex.getMessage().contains("Missing oldCategory or newCategory"));
    }

    @Test
    void testUpdateCategory_Failure() throws Exception {
        Map<String, String> payload = Map.of("oldCategory", "Old", "newCategory", "New");
        doThrow(new ExecutionException(new RuntimeException("fail")))
                .when(budgetService).batchUpdateCategory(uid, "Old", "New");

        ResponseEntity<String> response = budgetController.updateBudgetCategory("Bearer token", payload);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteByCategory_Success() throws Exception {
        doNothing().when(budgetService).deleteBudgetsByCategory(uid, "Food");
        ResponseEntity<String> response = budgetController.deleteBudgetsByCategory("Bearer token", "Food");
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testDeleteByCategory_Failure() throws Exception {
        doThrow(new ExecutionException(new RuntimeException("fail"))).when(budgetService)
                .deleteBudgetsByCategory(uid, "Food");
        ResponseEntity<String> response = budgetController.deleteBudgetsByCategory("Bearer token", "Food");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteBudgetAndExpenses_Success() throws Exception {
        Budget budget = new Budget();
        budget.setCategory("Food");

        when(budgetService.getBudgetById("budgetId", uid)).thenReturn(budget);

        ResponseEntity<String> response = budgetController.deleteBudgetAndExpenses("Bearer token", "budgetId");

        verify(expenseService).deleteExpensesByCategory(uid, "Food");
        verify(budgetService).deleteBudget("budgetId", uid);
        assertEquals(HttpStatus.OK, response.getStatusCode());
    }

    @Test
    void testDeleteBudgetAndExpenses_NoCategory() throws Exception {
        Budget budget = new Budget();
        budget.setCategory(null);

        when(budgetService.getBudgetById("budgetId", uid)).thenReturn(budget);

        ResponseEntity<String> response = budgetController.deleteBudgetAndExpenses("Bearer token", "budgetId");

        verify(budgetService).deleteBudget("budgetId", uid);
        assertEquals("Budget deleted (no category found).", response.getBody());
    }

    @Test
    void testDeleteBudgetAndExpenses_NotFound() throws Exception {
        when(budgetService.getBudgetById("budgetId", uid)).thenReturn(null);
        ResponseEntity<String> response = budgetController.deleteBudgetAndExpenses("Bearer token", "budgetId");
        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    }

    @Test
    void testDeleteBudgetAndExpenses_Failure() throws Exception {
        when(budgetService.getBudgetById("budgetId", uid)).thenThrow(new RuntimeException("fail"));
        ResponseEntity<String> response = budgetController.deleteBudgetAndExpenses("Bearer token", "budgetId");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void testDeleteAllBudgets_Success() throws Exception {
        when(budgetService.deleteAllBudgets(uid)).thenReturn("Deleted all");
        ResponseEntity<String> response = budgetController.deleteAllBudgets("Bearer token");
        assertEquals("Deleted all", response.getBody());
    }

    @Test
    void testDeleteAllBudgets_Failure() throws Exception {
        when(budgetService.deleteAllBudgets(uid)).thenThrow(new RuntimeException("fail"));
        ResponseEntity<String> response = budgetController.deleteAllBudgets("Bearer token");
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
