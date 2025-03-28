package tests;

import example.com.budgetTracker.model.Expense;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExpenseTest {

    @Test
    void testSettersAndGetters() {
        Expense expense = new Expense();

        expense.setId(1L);
        expense.setDescription("Lunch");
        expense.setAmount(12.99);
        expense.setDate("2025-03-27");
        expense.setCategory("Food");
        expense.setUserId("user123");
        expense.setRecurringExpenseId("rec123");
        expense.setPeriodIdentifier("2025-03");

        assertEquals(1L, expense.getId());
        assertEquals("Lunch", expense.getDescription());
        assertEquals(12.99, expense.getAmount());
        assertEquals("2025-03-27", expense.getDate());
        assertEquals("Food", expense.getCategory());
        assertEquals("user123", expense.getUserId());
        assertEquals("rec123", expense.getRecurringExpenseId());
        assertEquals("2025-03", expense.getPeriodIdentifier());
    }

    @Test
    void testNegativeAmountAllowed() {
        Expense expense = new Expense();
        expense.setAmount(-100.0);

        assertEquals(-100.0, expense.getAmount());
    }
}
