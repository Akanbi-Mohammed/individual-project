package tests;

import example.com.budgetTracker.model.Budget;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BudgetTest {

    @Test
    void testDefaultConstructorAndSetters() {
        Budget budget = new Budget();

        budget.setId("budget123");
        budget.setUserId("user456");
        budget.setCategory("Food");
        budget.setAmount(250.50);
        budget.setMonth("2025-03");

        assertEquals("budget123", budget.getId());
        assertEquals("user456", budget.getUserId());
        assertEquals("Food", budget.getCategory());
        assertEquals(250.50, budget.getAmount());
        assertEquals("2025-03", budget.getMonth());
    }

    @Test
    void testConvenienceConstructor() {
        Budget budget = new Budget("user789", "Rent", 1000.0, "2025-04");

        assertNull(budget.getId()); // Not set in constructor
        assertEquals("user789", budget.getUserId());
        assertEquals("Rent", budget.getCategory());
        assertEquals(1000.0, budget.getAmount());
        assertEquals("2025-04", budget.getMonth());
    }

    @Test
    void testNegativeAmountAllowed() {
        Budget budget = new Budget("user123", "Refund", -20.0, "2025-03");
        assertEquals(-20.0, budget.getAmount()); // Model allows it, controller should validate
    }
}
